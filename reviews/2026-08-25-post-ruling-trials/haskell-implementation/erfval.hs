#!/usr/bin/env stack
{- stack script --resolver lts-22.43 --package yaml --package aeson --package text --package bytestring --package containers --package unordered-containers --package vector --package scientific --package directory --package filepath --package time --package unicode-transforms -}

{-# LANGUAGE OverloadedStrings   #-}
{-# LANGUAGE LambdaCase          #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE TupleSections       #-}

-- |
-- erfval - a conformance validator for the Epistemic Record Format v0.9 (draft),
-- written cold from SPEC-as-tried.md with no reference implementation consulted.
--
-- The point of this file is the TYPES. Read the "MODEL" section first: every
-- non-obvious modelling decision is annotated with the requirement that forced
-- it, and every place the specification left the decision open is marked
--
--     -- SPEC-GAP: ...
--
-- Every catch-all branch for a case the spec never says can happen is marked
--
--     -- TOTALITY-HOLE: ...
--
-- Both marker sets are grepped into type-decisions.md / ambiguities.md.

module Main (main) where

import           Control.Exception    (SomeException, evaluate, try)
import           Control.Monad        (forM, forM_, unless, when)
import qualified Data.Aeson.Key       as K
import qualified Data.Aeson.KeyMap    as KM
import           Data.Aeson           (Value (..))
import qualified Data.ByteString      as BS
import qualified Data.ByteString.Char8 as BC
import           Data.Char            (isDigit, isSpace)
import           Data.Either          (partitionEithers)
import           Data.List            (foldl', isPrefixOf, nub, sort, sortOn)
import qualified Data.Map.Strict      as M
import           Data.Maybe           (catMaybes, fromMaybe, isJust, isNothing, mapMaybe)
import qualified Data.Set             as S
import           Data.Scientific      (Scientific, floatingOrInteger)
import           Data.Text            (Text)
import qualified Data.Text            as T
import qualified Data.Text.Encoding   as TE
import qualified Data.Text.IO         as TIO
import           Data.Text.Normalize  (NormalizationMode (..), normalize)
import           Data.Time            (Day, UTCTime (..), defaultTimeLocale,
                                       fromGregorianValid, parseTimeM)
import qualified Data.Vector          as V
import qualified Data.Yaml            as Y
import           System.Directory     (doesDirectoryExist, doesFileExist,
                                       listDirectory)
import           System.Environment   (getArgs)
import           System.Exit          (ExitCode (..), exitWith)
import           System.FilePath      ((</>), takeExtension, takeDirectory,
                                       takeFileName, normalise)
import           System.IO            (hPutStrLn, stderr)

--------------------------------------------------------------------------------
-- FINDINGS
--------------------------------------------------------------------------------

-- | Section 2, "A flag is not a violation": a validator reports two kinds of
-- thing and they answer different questions. The spec is unusually clear here,
-- so this is a plain sum with no ambiguity. 'Note' is ours: ERF-54 and ERF-57
-- require a validator to REPORT things (ignored files, unknown fields) that are
-- neither violations nor flags, and the spec supplies no third word for them.
--
-- SPEC-GAP: ERF-57 says a consumer "MUST report" unknown fields; section 2 only
-- defines two report kinds. A pure two-valued reporter would have to call an
-- unknown field either a violation (wrong: ERF-57 forbids rejecting) or a flag
-- (wrong: a flag means "someone look at the epistemics"). We invented a third.
data Severity = Violation | Flag | Note
  deriving (Eq, Ord, Show)

data Finding = Finding
  { fSev  :: Severity
  , fReq  :: Maybe Text     -- ^ 'Nothing' for findings no requirement id owns
  , fWhere:: Text           -- ^ file, plus a field path when we have one
  , fMsg  :: Text
  } deriving (Eq, Show)

vio, flg, nte :: Text -> Text -> Text -> Finding
vio r w m = Finding Violation (Just r) w m
flg r w m = Finding Flag      (Just r) w m
nte r w m = Finding Note      (Just r) w m

-- | A finding with no requirement id behind it. Every use of this is a place
-- the spec states a rule in prose without numbering it (see §2 'actor').
orphan :: Severity -> Text -> Text -> Finding
orphan s w m = Finding s Nothing w m

--------------------------------------------------------------------------------
-- A VALIDATION APPLICATIVE
--------------------------------------------------------------------------------

-- | Accumulating validation. '<*>' collects findings from both sides; '>>='
-- short-circuits. (These two therefore differ in how much they collect on
-- failure, which is deliberate: field extraction is applicative and wants every
-- error, control flow after a missing id is monadic and wants to stop.)
newtype V a = V { runV :: ([Finding], Maybe a) }

instance Functor V where
  fmap f (V (w, m)) = V (w, fmap f m)

instance Applicative V where
  pure x = V ([], Just x)
  V (w1, f) <*> V (w2, x) = V (w1 <> w2, f <*> x)

instance Monad V where
  V (w, Nothing) >>= _ = V (w, Nothing)
  V (w, Just a)  >>= f = let V (w', b) = f a in V (w <> w', b)

tell :: [Finding] -> V ()
tell w = V (w, Just ())

bad :: Finding -> V a
bad f = V ([f], Nothing)

-- | Run a validation, keeping the findings and discarding a failed value.
harvest :: V a -> ([Finding], Maybe a)
harvest = runV

--------------------------------------------------------------------------------
-- MODEL: PRESENCE  (the Maybe-versus-empty axis)
--------------------------------------------------------------------------------

-- | The three states a key can be in inside a YAML mapping.
--
-- This type exists because ERF-55 makes the distinction between the first two
-- load-bearing for exactly one field and then never mentions the third:
--
--   "Absent, it says the ruler stamped nothing; present and empty, it says the
--    ruler stamped, and faced no evidence. Those are different facts [...] so a
--    producer tidying `{}` away destroys it and makes never-stamped and
--    stamped-facing-nothing the same bytes."  (ERF-55, on ERF-20)
--
-- The stock aeson idiom @o .:? "k"@ maps BOTH 'Missing' and 'ExplicitNull' to
-- 'Nothing'. Using it would collapse precisely the states ERF-55 says must stay
-- distinct. We therefore never use @.:?@ anywhere in this program.
--
-- SPEC-GAP: 'ExplicitNull'. YAML's @evidence_at_stance:@ with nothing after the
-- colon is a null scalar, not an empty mapping, and it is neither "absent" nor
-- "present and empty". The spec's vocabulary has no room for it. We treat it as
-- a violation and say so.
data Presence a
  = Missing
  | ExplicitNull
  | Given a
  deriving (Eq, Show)

instance Functor Presence where
  fmap _ Missing      = Missing
  fmap _ ExplicitNull = ExplicitNull
  fmap f (Given a)    = Given (f a)

look :: KM.KeyMap Value -> Text -> Presence Value
look o k = case KM.lookup (K.fromText k) o of
  Nothing   -> Missing
  Just Null -> ExplicitNull
  Just v    -> Given v

-- | How a list-typed field arrived on the wire.
--
-- ERF-56: "A reader MUST materialize an omitted list-typed field as an empty
-- list." So the VALUE of a list field is total: @[a]@, never @Maybe [a]@.
-- ERF-55: "Empty lists MUST be omitted." So writing @[]@ is a producer
-- violation, which means the reader must still remember HOW it arrived in order
-- to report it. That is the whole content of this type: a serialization fact
-- that must survive parsing without contaminating the value.
--
-- This is the round-trip that the spec's own type mirror cannot express:
-- @surveys?: SurveyId[]@ in section 3 says @Maybe [SurveyId]@, but ERF-56 says
-- the loaded record has a total @[SurveyId]@ and ERF-55 says @Just []@ is
-- illegal on the wire. Three encodings, one field.
data Arrival = Omitted | Written
  deriving (Eq, Show)

data TList a = TList { tlItems :: [a], tlArrival :: Arrival }
  deriving (Eq, Show)

emptyTList :: TList a
emptyTList = TList [] Omitted

--------------------------------------------------------------------------------
-- MODEL: STAMPS
--------------------------------------------------------------------------------

-- | A point in time as the format admits one.
--
-- The format has FOUR different precision contracts for one field name
-- (@timestamp@, mandated everywhere by ERF-58):
--
--   * ERF-19 standings: MUST be a full RFC 3339 instant with a time AND an
--     offset; MUST NOT be a bare date.
--   * ERF-14 @as_of_date@: MAY be a year, a year and month, or a full date,
--     and MUST NOT state precision the source did not give.
--   * ERF-31 @bound-at@: exactly @YYYY-MM-DD@, by grammar.
--   * everything else (@created@, @conducted@, @last_modified@,
--     @received.timestamp@, @excerpt.timestamp@): unconstrained; ERF-19 says
--     "a bare date remains correct where nothing is ordered".
--
-- One name, four grammars. The type has to be the union, and every consumer has
-- to re-narrow it. That is a spec finding, not a Haskell inconvenience.
data Stamp
  = SYear      Integer            -- ^ @2018@ (ERF-14 only)
  | SYearMonth Integer Int        -- ^ @2018-03@ (ERF-14 only)
  | SDate      Day                -- ^ @2026-08-23@
  | SInstant   UTCTime Bool       -- ^ full instant; 'Bool' = carried an offset
  | SUnparsed  Text
  -- ^ TOTALITY-HOLE: the spec never says what a validator does with a
  -- @timestamp@ that is neither of its shapes. It cannot be dropped (ERF-57
  -- forbids losing data), it is not orderable, and no requirement id owns
  -- "malformed timestamp". Every comparison below has to have a branch for it.
  deriving (Eq, Show)

stampText :: Stamp -> Text
stampText = \case
  SYear y        -> T.pack (show y)
  SYearMonth y m -> T.pack (show y) <> "-" <> pad2 m
  SDate d        -> T.pack (show d)
  SInstant t o   -> T.pack (show t) <> (if o then "" else " (no offset)")
  SUnparsed t    -> t
  where pad2 n = T.justifyRight 2 '0' (T.pack (show n))

-- | Result of ordering two stamps.
--
-- ERF-47 needs five outcomes, not three: "Where the two stamps differ in
-- precision and the coarser one cannot order them (a bare date against a full
-- instant on the same day), the comparison MUST resolve to stale [...] Two bare
-- dates that are equal read as current."
data Ord3
  = Earlier
  | Later
  | SameInstant
  | SameDayEqualPrecision      -- ^ two bare dates, same day: ERF-47 says current
  | SameDayMixedPrecision      -- ^ ERF-47 says: cannot tell -> stale
  | Unorderable                -- ^ TOTALITY-HOLE: at least one side unparsed
  deriving (Eq, Show)

stampDay :: Stamp -> Maybe Day
stampDay = \case
  SDate d          -> Just d
  SInstant t _     -> Just (utctDay t)
  SYear y          -> fromGregorianValid y 12 31   -- coarsened; see note below
  SYearMonth y m   -> fromGregorianValid y m 28
  SUnparsed _      -> Nothing

-- | Compare two stamps under ERF-47's precision rule.
cmpStamp :: Stamp -> Stamp -> Ord3
cmpStamp a b = case (a, b) of
  (SUnparsed _, _) -> Unorderable
  (_, SUnparsed _) -> Unorderable
  (SInstant x _, SInstant y _)
    | x < y     -> Earlier
    | x > y     -> Later
    | otherwise -> SameInstant
  _ -> case (stampDay a, stampDay b) of
    (Just x, Just y)
      | x < y     -> Earlier
      | x > y     -> Later
      | otherwise -> if precision a == precision b
                       then SameDayEqualPrecision
                       else SameDayMixedPrecision
    _ -> Unorderable
  where
    precision :: Stamp -> Int
    precision = \case
      SYear _        -> 0
      SYearMonth _ _ -> 1
      SDate _        -> 2
      SInstant _ _   -> 3
      SUnparsed _    -> (-1)

parseStamp :: Text -> Stamp
parseStamp raw
  | T.length s == 4, T.all isDigit s
      = maybe (SUnparsed raw) SYear (readMaybeI s)
  | T.length s == 7, [y, m] <- T.splitOn "-" s, T.all isDigit y, T.all isDigit m
      = case (readMaybeI y, readMaybeI m) of
          (Just y', Just m') | m' >= 1 && m' <= 12 -> SYearMonth y' (fromIntegral m')
          _ -> SUnparsed raw
  | T.length s == 10
  , Just d <- parseTimeM True defaultTimeLocale "%Y-%m-%d" (T.unpack s)
      = SDate d
  | Just t <- tryInstant s = t
  | otherwise = SUnparsed raw
  where
    s = T.strip raw
    readMaybeI t = case reads (T.unpack t) of [(n, "")] -> Just n; _ -> Nothing
    -- RFC 3339 requires a "T" (or lowercase "t") separator and an offset.
    -- SPEC-GAP: ERF-19 says "a full RFC 3339 instant carrying both a time and an
    -- offset". RFC 3339 s5.6 NOTE permits a space in place of "T" by agreement.
    -- The spec does not say whether the format takes that permission. We accept
    -- it and record the divergence, because rejecting it would fail a timestamp
    -- RFC 3339 itself allows.
    tryInstant x =
      let fmts = [ ("%Y-%m-%dT%H:%M:%S%Ez", True)
                 , ("%Y-%m-%dT%H:%M:%S%Q%Ez", True)
                 , ("%Y-%m-%dT%H:%M:%SZ", True)
                 , ("%Y-%m-%dT%H:%M:%S%QZ", True)
                 , ("%Y-%m-%d %H:%M:%S%Ez", True)
                 , ("%Y-%m-%d %H:%M:%SZ", True)
                 , ("%Y-%m-%dT%H:%M:%S", False)      -- no offset: ERF-19 violation
                 , ("%Y-%m-%dT%H:%M:%S%Q", False)
                 ]
          norm = T.unpack (T.replace "t" "T" (T.take 11 x)) ++ T.unpack (T.drop 11 x)
      in case [ SInstant t off
              | (f, off) <- fmts
              , Just t <- [parseTimeM True defaultTimeLocale f norm] ] of
           (r:_) -> Just r
           []    -> Nothing

--------------------------------------------------------------------------------
-- MODEL: ACTORS
--------------------------------------------------------------------------------

-- | Section 2: "@human:<id>@ for a person, @<producer>/<version>@ for a model or
-- agent, @process:<id>@ for automation. Every actor id MUST follow this
-- convention."
--
-- SPEC-GAP: that MUST carries NO requirement id. It is normative prose in the
-- definitions section, so a validator that rejects @alice@ cannot cite anything.
--
-- SPEC-GAP: the three alternatives OVERLAP. The TypeScript is
-- @`human:${string}` | `${string}/${string}` | `process:${string}`@ and
-- @${string}@ matches the empty string, so @human:@ alone is a legal Actor, @/@
-- alone is a legal Actor, and @human:claude/fable-5@ inhabits two arms at once.
-- Nothing says which arm wins. We resolve prefix-first and report the overlap.
data Actor
  = AHuman   Text
  | AProcess Text
  | AAgent   Text Text          -- ^ producer, version
  | AActorMalformed Text
  -- ^ TOTALITY-HOLE: forced by the unnumbered MUST above.
  deriving (Eq, Show)

parseActor :: Text -> Actor
parseActor t
  | Just r <- T.stripPrefix "human:"   t = AHuman r
  | Just r <- T.stripPrefix "process:" t = AProcess r
  | (p, r) <- T.breakOn "/" t, not (T.null r) = AAgent p (T.drop 1 r)
  | otherwise = AActorMalformed t

isHumanActor :: Actor -> Bool
isHumanActor (AHuman _) = True
isHumanActor _          = False

actorText :: Actor -> Text
actorText = \case
  AHuman r          -> "human:" <> r
  AProcess r        -> "process:" <> r
  AAgent p v        -> p <> "/" <> v
  AActorMalformed t -> t

--------------------------------------------------------------------------------
-- MODEL: VOCABULARIES  (section 5: "Closed sets.")
--------------------------------------------------------------------------------

data EpistemicKind = Observation | Argument | Bet | Commitment deriving (Eq, Ord, Show)
data Stance        = For | Against | Withdrawn                 deriving (Eq, Ord, Show)
data Relation      = Supports | Assumes | DecomposesInto | ConflictsWith deriving (Eq, Ord, Show)
data SourceQuality = QHigh | QMedium | QLow                    deriving (Eq, Ord, Show)
data Verdict       = Supported | Partial | Unsupported         deriving (Eq, Ord, Show)

-- | ERF-41: "Disposition MUST be computed, never stored". Five inhabitants and
-- the spec gives a total function from standings to one of them -- almost.
data Disposition = DProposal | DActive | DContested | DRejected | DRetired
  deriving (Eq, Ord, Show)

dispText :: Disposition -> Text
dispText = \case
  DProposal -> "proposal"; DActive -> "active"; DContested -> "contested"
  DRejected -> "rejected"; DRetired -> "retired"

-- | ERF-5's closed absence set, kept apart from the two shipping statuses,
-- because ERF-4 and ERF-5 hinge on which group a source is in.
data SourceStatus
  = StShipped
  | StShippedAsQuotation
  | StNotRedistributable
  | StAccessRestricted
  | StLicenceUnverified
  deriving (Eq, Ord, Show)

statusIsAbsence :: SourceStatus -> Bool
statusIsAbsence s = s `elem` [StNotRedistributable, StAccessRestricted, StLicenceUnverified]

--------------------------------------------------------------------------------
-- MODEL: RECORDS
--------------------------------------------------------------------------------

type Id = Text

data ActorStamp = ActorStamp { asTime :: Stamp, asBy :: Actor } deriving (Eq, Show)

data AuditEntry = AuditEntry
  { aeAuditor  :: Text     -- ERF-11: a bare model/tool id, deliberately NOT an Actor
  , aeVerdict  :: Verdict
  , aeTime     :: Stamp
  , aeProtocol :: Text
  } deriving (Eq, Show)

data EvidenceAtStance = EvidenceAtStance
  { easFor     :: TList Id
  , easAgainst :: TList Id
  } deriving (Eq, Show)

data StandingEntry = StandingEntry
  { seTime     :: Stamp
  , seStance   :: Stance
  , seBy       :: Actor
  , seWhy      :: Text
  , seEvidence :: Presence EvidenceAtStance
    -- ^ THE field. See 'Presence'. 'Missing' /= @Given (EvidenceAtStance [] [])@.
  } deriving (Eq, Show)

data Atom = Atom
  { atId       :: Id
  , atCorpus   :: Text
  , atFinding  :: Text
  , atQuote    :: Text
  , atSource   :: Id
  , atQuality  :: SourceQuality
  , atAsOf     :: Presence Stamp
  , atLimits   :: Presence Text
  , atCreated  :: ActorStamp
  , atModified :: Presence ActorStamp
  , atAudit    :: TList AuditEntry
  } deriving (Eq, Show)

data Edge = Edge { edTo :: Id, edRel :: Relation } deriving (Eq, Show)

data Claim = Claim
  { clId       :: Id
  , clCorpus   :: Text
  , clTitle    :: Text
  , clKind     :: EpistemicKind
  , clCreated  :: ActorStamp
  , clModified :: Presence ActorStamp
  , clShort    :: Presence Text
  , clFamilies :: TList Text
  , clFor      :: TList Id
  , clAgainst  :: TList Id
  , clSurveys  :: TList Id
  , clEdges    :: TList Edge
  , clStandings:: TList StandingEntry
  , clAudit    :: TList AuditEntry
  , clQuery    :: Presence Text
  , clBody     :: Text
  } deriving (Eq, Show)

data SearchAct = SearchAct
  { saTool  :: Text
  , saQuery :: Text
  , saScope :: Presence Text
  , saHits  :: Text
  , saTime  :: Presence Stamp
  } deriving (Eq, Show)

data NotableResult = NotableResult
  { nrWhat  :: Text
  , nrNote  :: Text
  , nrAtoms :: TList Id
  } deriving (Eq, Show)

data Survey = Survey
  { svId       :: Id
  , svCorpus   :: Text
  , svTitle    :: Text
  , svConducted:: ActorStamp
  , svSearches :: TList SearchAct
  , svNotable  :: TList NotableResult
  , svPrior    :: Presence Id
  , svModified :: Presence ActorStamp
  , svBody     :: Text
  } deriving (Eq, Show)

-- | ERF-53 says one record per file "for every record type", and section 3 says
-- "Object-shape unions are deliberately absent". So this is the ONLY object-shape
-- sum in the format, and it is not in the data model at all: it exists because
-- ERF-54 makes a consumer "read each file's @type@, and dispatch on it".
data Record = RAtom Atom | RClaim Claim | RSurvey Survey deriving (Eq, Show)

recId :: Record -> Id
recId = \case RAtom a -> atId a; RClaim c -> clId c; RSurvey s -> svId s

recCorpus :: Record -> Text
recCorpus = \case RAtom a -> atCorpus a; RClaim c -> clCorpus c; RSurvey s -> svCorpus s

recModified :: Record -> Presence ActorStamp
recModified = \case
  RAtom a -> atModified a; RClaim c -> clModified c; RSurvey s -> svModified s

recCreated :: Record -> ActorStamp
recCreated = \case
  RAtom a -> atCreated a; RClaim c -> clCreated c; RSurvey s -> svConducted s

recKindName :: Record -> Text
recKindName = \case RAtom _ -> "atom"; RClaim _ -> "claim"; RSurvey _ -> "survey"

--------------------------------------------------------------------------------
-- MODEL: NON-RECORDS
--------------------------------------------------------------------------------

data Received = Received
  { rcUrl    :: Presence Text
  , rcPath   :: Presence Text
  , rcDigest :: Presence Text
  , rcTime   :: Presence Stamp
  } deriving (Eq, Show)

data Source = Source
  { srCitationText :: Text
  , srCitation     :: Presence Value        -- CSL: opaque to this format
  , srReceived     :: Presence Received
  , srStatus       :: SourceStatus
  , srNormalized   :: Presence Text
  , srNormDigest   :: Presence Text
  , srReason       :: Presence Text
  , srLicence      :: Presence Text
  , srLicenceName  :: Presence Text
  , srExcerpt      :: Presence ActorStamp
  , srExtraction   :: Presence Text
  , srNormalization:: Presence Text
  } deriving (Eq, Show)

data SourceList = SourceList
  { slSources    :: M.Map Id Source
  , slExtraKeys  :: [Text]   -- ERF-3: "exactly two keys"
  } deriving (Eq, Show)

data Declaration = Declaration
  { dcId       :: Text
  , dcTitle    :: Text
  , dcVersion  :: Text
  , dcClass    :: Presence Text
  , dcOwner    :: Presence Actor
  } deriving (Eq, Show)

-- | ERF-34: "A narrative MUST NOT be modelled as a record: it is a document."
-- Kept out of 'Record' on purpose. It "has no interface in the data model of
-- section 3", so this shape is assembled from ERF-34's prose alone.
data Narrative = Narrative
  { nvTitle    :: Text
  , nvCorpus   :: Text
  , nvCreated  :: ActorStamp
  , nvBody     :: Text
  } deriving (Eq, Show)

-- | What a file in a corpus turned out to be, after ERF-54 dispatch.
data Loaded
  = LRecord      FilePath Record
  | LDeclaration FilePath Declaration
  | LSourceList  FilePath SourceList
  | LNarrative   FilePath Narrative
  | LUnknownType FilePath Text Value
  -- ^ ERF-57: preserved as opaque data and reported. The 'Value' is kept, not
  -- discarded, because "MUST preserve" is a data-retention rule, not a
  -- reporting rule.
  | LNoType      FilePath
  -- ^ ERF-54: "A file carrying no @type@ is not part of the corpus; a consumer
  -- MUST ignore it and MUST report that it did."
  | LUnreadable  FilePath Text
  -- ^ TOTALITY-HOLE: a file that is not YAML at all. ERF-54's dispatch assumes
  -- every file parses far enough to look for a @type@ key. Normalized texts sit
  -- in the same tree and do not.
  deriving (Show)

loadedPath :: Loaded -> FilePath
loadedPath = \case
  LRecord p _ -> p; LDeclaration p _ -> p; LSourceList p _ -> p
  LNarrative p _ -> p; LUnknownType p _ _ -> p; LNoType p -> p; LUnreadable p _ -> p

--------------------------------------------------------------------------------
-- ERF-51 NORMALIZATION  /  ERF-52 ELISION  /  ERF-50 QUOTE CHECK
--------------------------------------------------------------------------------

-- | ERF-51, exactly as ordered:
--
--   1. Unicode NFKC.
--   2. Remove the markdown emphasis and code markers @*@, @_@, and @`@.
--   3. Collapse whitespace runs to a single space, then trim.
--
--   "Case MUST NOT be folded."
--
-- SPEC-GAP: step 3 does not say what counts as whitespace. We use Unicode
-- 'isSpace'. An ASCII-only reading differs on U+00A0 and friends -- though NFKC
-- (step 1) already maps most of those to U+0020, so the two readings coincide
-- except for characters NFKC leaves alone, notably U+200B ZERO WIDTH SPACE,
-- which 'isSpace' also rejects. See ambiguities.md.
--
-- SPEC-GAP: step 2 says "remove", unconditionally, so @snake_case@ becomes
-- @snakecase@ and @2*3@ becomes @23@. Applied to both sides it is consistent,
-- but it means the check cannot distinguish @a_b@ from @ab@.
normalizeERF51 :: Text -> Text
normalizeERF51 =
    T.strip
  . collapseWs
  . T.filter (`notElem` ("*_`" :: String))
  . normalize NFKC
  where
    collapseWs = T.intercalate " " . filter (not . T.null) . T.split isSpace

-- | ERF-52: "The quote MUST be split on @[...]@ BEFORE normalization".
elisionMarker :: Text
elisionMarker = "[...]"

splitElisions :: Text -> [Text]
splitElisions = T.splitOn elisionMarker

-- | Three-valued, because ERF-51 requires it: "Facing a normalized text that is
-- not text or markdown it MUST report the check as unavailable rather than pass
-- or fail it, exactly as it does for a text it does not hold."
data QuoteCheck
  = QPass
  | QFail Text Text        -- ^ requirement id, message
  | QUnavailable Text
  deriving (Eq, Show)

-- | ERF-52 in full. Spans are split first, normalized independently, then each
-- non-empty span must occur "in order and without overlap".
--
-- Leftmost-earliest matching is optimal for this problem (an earlier match end
-- never forecloses a later span that a later match end would allow), so no
-- backtracking is needed. The spec does not state an algorithm; it does not have
-- to, because every correct one agrees here.
--
-- SPEC-GAP, and it is a real divergence: "Every NON-EMPTY span MUST occur [...]
-- A quote whose spans are ALL EMPTY MUST fail rather than trivially pass." Is
-- "non-empty" and "empty" judged BEFORE normalization or AFTER? The sentence
-- order puts normalization first, but a span like @*@ is non-empty before and
-- empty after. Under the after-reading @"*[...]*"@ FAILS (all spans empty);
-- under the before-reading it PASSES (two non-empty spans, each normalizing to
-- "" which occurs trivially). We take the after-reading -- see ambiguities.md.
checkQuote :: Text -> Text -> QuoteCheck
checkQuote quote normText =
  let spans   = map normalizeERF51 (splitElisions quote)
      hay     = normalizeERF51 normText
      nonEmpty= filter (not . T.null) spans
  in if null nonEmpty
       then QFail "ERF-52" ("every span of the quote is empty after ERF-51 normalization; ERF-52: " <>
                            "\"A quote whose spans are all empty MUST fail rather than trivially pass.\" " <>
                            "(This validator judges emptiness AFTER normalization -- see ambiguities.md A2.)")
       else go hay 0 nonEmpty (length nonEmpty)
  where
    go _ _ [] _ = QPass
    go hay off (s:ss) n =
      let rest = T.drop off hay
          (pre, post) = T.breakOn s rest
          req = if n > 1 then "ERF-52" else "ERF-6"
          extra = if n > 1
                    then " (elided quote: every non-empty span MUST occur \"in order and without overlap\")"
                    else " (the quote MUST be verbatim from the source's normalized text)"
      in if T.null post
           then QFail req ("span not found in the normalized text" <> extra <> ": " <> tshow s)
           else go hay (off + T.length pre + T.length s) ss n

--------------------------------------------------------------------------------
-- ERF-31 NARRATIVE BINDINGS
--------------------------------------------------------------------------------

-- | ERF-31: "A comment opening @\<!--@ followed by @claims:@ IS a narrative
-- binding: recognizing one and validating one are separate acts, and a consumer
-- performs them in that order." So recognition is total over comments and
-- validation is partial, and the two must not be fused.
data Recognized = Recognized
  { rzRaw    :: Text          -- ^ the whole comment, verbatim
  , rzOffset :: Int           -- ^ where it started, in the body
  , rzInner  :: Text          -- ^ between "<!--" and "-->"
  } deriving (Eq, Show)

data Binding = Binding
  { bdIds     :: [Id]         -- ^ grammar guarantees at least one
  , bdAnchor  :: Text         -- ^ AFTER unescaping \" and \\
  , bdAnchorR :: Text         -- ^ as written, escapes intact
  , bdBoundAt :: Day
  , bdRec     :: Recognized
  } deriving (Eq, Show)

-- | Grammar failures, enumerated rather than collapsed to a string, so the
-- report can say which required part was missing. ERF-31: "Every part is
-- required."
data BindingError
  = BEMissingClaimsKeyword
  | BENoIds
  | BENoAnchor Text
  | BEUnterminatedAnchor
  | BEIllegalEscape Text
  | BEMultipleAnchors
  | BENoBoundAt
  | BEBadDate Text
  | BETrailingJunk Text
  deriving (Eq, Show)

beText :: BindingError -> Text
beText = \case
  BEMissingClaimsKeyword -> "comment does not begin with 'claims:'"
  BENoIds                -> "no ids before the anchor (grammar: ids ::= id (ws+ id)*)"
  BENoAnchor t           -> "no quoted anchor found; saw: " <> tshow t
  BEUnterminatedAnchor   -> "anchor opens with '\"' but never closes"
  BEIllegalEscape t      -> "illegal escape in anchor: " <> tshow t <> " (only \\\" and \\\\ are legal)"
  BEMultipleAnchors      -> "more than one quoted anchor"
  BENoBoundAt            -> "missing bound-at=YYYY-MM-DD"
  BEBadDate t            -> "bound-at is not a YYYY-MM-DD date: " <> tshow t
  BETrailingJunk t       -> "unconsumed text after bound-at: " <> tshow t

-- | Recognition (ERF-31, first half). Total over the body text.
--
-- SPEC-GAP -- and this one bites: the grammar says
-- @id ::= one or more characters, none of them whitespace or '"'@ and
-- @char ::= any character other than '"' and '\'@. NEITHER excludes @--\>@.
-- But @--\>@ terminates an HTML comment, so an id or an anchor containing it
-- cannot be written at all: the lexer ends the comment first. The grammar is not
-- closed under the lexical layer it is embedded in. We recognize comments by
-- scanning to the first @--\>@, which is what every HTML/markdown pipeline does,
-- and therefore a binding whose anchor contains @--\>@ is reported as a grammar
-- failure rather than parsed. See ambiguities.md.
recognizeBindings :: Text -> [Recognized]
recognizeBindings body = go 0 body
  where
    go !off t =
      let (pre, rest) = T.breakOn "<!--" t
      in if T.null rest then [] else
         let start   = off + T.length pre
             afterOp = T.drop 4 rest
             (inner, rest') = T.breakOn "-->" afterOp
         in if T.null rest'
              -- unterminated comment: not recognizable as anything; skip
              then []
              else let whole = T.take (T.length inner + 7) rest
                       here | isBindingComment inner = [Recognized whole start inner]
                            | otherwise = []
                   in here ++ go (start + T.length inner + 7) (T.drop 3 rest')
    isBindingComment inner = "claims:" `T.isPrefixOf` T.stripStart inner

-- | Validation (ERF-31, second half).
parseBinding :: Recognized -> Either BindingError Binding
parseBinding rz = do
  rest0 <- case T.stripPrefix "claims:" (T.stripStart (rzInner rz)) of
             Nothing -> Left BEMissingClaimsKeyword
             Just r  -> Right r
  -- ids ::= id (ws+ id)*  and  id ::= one or more characters, none of them
  -- whitespace or '"'. So ids run until the first token that opens with '"'.
  let (ids, afterIds) = takeIds (T.stripStart rest0) []
  when (null ids) (Left BENoIds)
  (anchorRaw, afterAnchor) <- scanAnchor afterIds
  anchor <- unescapeAnchor anchorRaw
  let afterA = T.stripStart afterAnchor
  when ("\"" `T.isPrefixOf` afterA) (Left BEMultipleAnchors)
  boundRaw <- case T.stripPrefix "bound-at=" afterA of
                Nothing -> Left BENoBoundAt
                Just r  -> Right r
  let (dtxt, trailing) = T.break isSpace boundRaw
  d <- case parseTimeM True defaultTimeLocale "%Y-%m-%d" (T.unpack dtxt) of
         Nothing -> Left (BEBadDate dtxt)
         Just d' -> Right d'
  unless (T.null (T.strip trailing)) (Left (BETrailingJunk (T.strip trailing)))
  pure (Binding ids anchor anchorRaw d rz)
  where
    -- Returns (ids, remainder-starting-at-the-anchor-or-whatever-follows).
    takeIds t acc
      | T.null t                = (reverse acc, t)
      | "\"" `T.isPrefixOf` t   = (reverse acc, t)
      | otherwise =
          let tok  = T.takeWhile (\c -> not (isSpace c) && c /= '"') t
              rest = T.stripStart (T.drop (T.length tok) t)
          in if T.null tok then (reverse acc, t) else takeIds rest (tok : acc)

scanAnchor :: Text -> Either BindingError (Text, Text)
scanAnchor t = case T.uncons t of
  Just ('"', r) -> go r []
  _             -> Left (BENoAnchor (T.take 40 t))
  where
    go s acc = case T.uncons s of
      Nothing -> Left BEUnterminatedAnchor
      Just ('"', r)  -> Right (T.pack (reverse acc), r)
      Just ('\\', r) -> case T.uncons r of
        Just (c, r') | c == '"' || c == '\\' -> go r' (c : '\\' : acc)
        _ -> Left (BEIllegalEscape (T.take 4 s))
      Just (c, r) -> go r (c : acc)

-- | SPEC-GAP: the grammar defines @\\"@ and @\\\\@ as "two-character escapes"
-- but never says the anchor is UNESCAPED before the occurrence test of ERF-31.
-- If it were not, an anchor for a passage containing a quotation mark could
-- never match, which is the exact case the escapes were added for -- so
-- unescaping must be intended. Nothing says it.
unescapeAnchor :: Text -> Either BindingError Text
unescapeAnchor = go []
  where
    go acc t = case T.uncons t of
      Nothing -> Right (T.pack (reverse acc))
      Just ('\\', r) -> case T.uncons r of
        Just (c, r') | c == '"' || c == '\\' -> go (c : acc) r'
        _ -> Left (BEIllegalEscape (T.take 4 t))
      Just (c, r) -> go (c : acc) r

-- | ERF-32's three-valued staleness. "Where the comparison cannot be run, a
-- consumer MUST show the binding as staleness @indeterminate@ and MUST NOT show
-- it as current."
data Staleness = StCurrent | StStale | StIndeterminate deriving (Eq, Show)

stalenessText :: Staleness -> Text
stalenessText = \case
  StCurrent -> "current"; StStale -> "stale"; StIndeterminate -> "indeterminate"

-- | ERF-32 + ERF-47 for one (binding, claim) pair.
bindingStaleness :: Day -> Presence ActorStamp -> Staleness
bindingStaleness boundAt = \case
  Missing      -> StCurrent
    -- ERF-48: "A record never edited since minting correctly carries no
    -- last_modified at all", so there is nothing later than bound-at.
  ExplicitNull -> StIndeterminate
  Given as     -> case cmpStamp (asTime as) (SDate boundAt) of
    Later                 -> StStale
    SameDayMixedPrecision -> StStale             -- ERF-47, explicitly
    SameDayEqualPrecision -> StCurrent           -- ERF-47, explicitly
    SameInstant           -> StCurrent
    Earlier               -> StCurrent
    Unorderable           -> StIndeterminate

-- | SPEC-GAP: a binding names a LIST of ids ("ids ::= id (ws+ id)*"), but
-- ERF-32 speaks of "the claim it names", singular. We take the worst reading
-- across the named claims, on ERF-32's own principle ("a check that cannot tell
-- says look, never rest"). Nothing in the spec licenses the choice.
combineStaleness :: [Staleness] -> Staleness
combineStaleness ss
  | StStale `elem` ss         = StStale
  | StIndeterminate `elem` ss = StIndeterminate
  | otherwise                 = StCurrent

--------------------------------------------------------------------------------
-- ERF-41 DISPOSITION
--------------------------------------------------------------------------------

-- | ERF-41: "computed [...] from the current stances alone, meaning each
-- person's newest entry. With no standings at all the disposition is
-- @proposal@. Otherwise discard every current stance of @withdrawn@ [...]
-- nothing remaining means @retired@; all @for@ means @active@; all @against@
-- means @rejected@; both [...] means @contested@. Every input has exactly one
-- reading."
--
-- TOTALITY-HOLE: "each person's newest entry" is not a total function. ERF-19
-- makes standings timestamps full instants but does not make them unique, so one
-- person can hold two entries at the same instant with opposite stances. There
-- is then no newest entry, and ERF-41's claim that "every input has exactly one
-- reading" is false. We break the tie by file order and FLAG it, because no
-- requirement covers it.
computeDisposition :: [StandingEntry] -> (Disposition, [Text])
computeDisposition [] = (DProposal, [])
computeDisposition es =
  let byPerson = M.fromListWith (++) [ (actorText (seBy e), [e]) | e <- es ]
      pick (person, entries) =
        let best = newest entries
        in (best, ties person entries best)
      newest = last . sortOn (stampSortKey . seTime)
      ties person entries best =
        let same = [ e | e <- entries
                       , cmpStamp (seTime e) (seTime best) `elem`
                           [SameInstant, SameDayEqualPrecision]
                       , seStance e /= seStance best ]
        in [ "standings ledger for " <> person <>
             " holds two entries at the same instant with different stances; ERF-41 says \"every input has exactly one reading\" but supplies no tie-break"
           | not (null same) ]
      results = map pick (M.toList byPerson)
      current = [ seStance b | (b, _) <- results ]
      notes   = concatMap snd results
      live    = filter (/= Withdrawn) current
      disp | null live                             = DRetired
           | all (== For) live                     = DActive
           | all (== Against) live                 = DRejected
           | otherwise                             = DContested
  in (disp, notes)

stampSortKey :: Stamp -> (Int, Integer, Integer)
stampSortKey s = case s of
  SInstant t _ -> (1, toModifiedJulianDayI (utctDay t), round (toRational (utctDayTime t)))
  SDate d      -> (1, toModifiedJulianDayI d, 0)
  SYear y      -> (1, y * 10000, 0)
  SYearMonth y m -> (1, y * 10000 + fromIntegral m * 100, 0)
  SUnparsed _  -> (0, 0, 0)   -- unorderable sorts first, deterministically
  where toModifiedJulianDayI = toInteger . fromEnum

--------------------------------------------------------------------------------
-- YAML FIELD EXTRACTION
--------------------------------------------------------------------------------

type Where = Text

-- | ERF-65: "Frontmatter MUST parse under YAML 1.2 using the JSON schema [...]
-- only @null@, the literals @true@ and @false@, and JSON's own number grammar
-- resolve to non-string scalars; everything else stays a string."
--
-- A validator cannot re-run the resolver, so it checks the consequence: a field
-- the data model types as a string arriving as anything other than a String
-- means either the producer wrote a bare scalar the JSON schema would have kept
-- as a string (and the parser used a laxer schema), or the producer wrote a
-- genuine number where a string was required. Both are reportable, and this is
-- the only place a Haskell/libyaml reader can see the difference at all.
str :: Where -> Text -> Value -> V Text
str w k = \case
  String t -> pure t
  Number n -> bad (vio "ERF-65" (w <> "." <> k)
                    ("resolved to the number " <> tshow (sciText n) <>
                     ", but the data model types this field as a string; quote it"))
  Bool b   -> bad (vio "ERF-65" (w <> "." <> k)
                    ("resolved to the boolean " <> tshow (T.pack (show b)) <>
                     ", but the data model types this field as a string; quote it"))
  v        -> bad (vio "ERF-53" (w <> "." <> k) ("expected a string, got " <> valKind v))

sciText :: Scientific -> Text
sciText n = case floatingOrInteger n :: Either Double Integer of
  Right i -> T.pack (show i)
  Left  d -> T.pack (show d)

valKind :: Value -> Text
valKind = \case
  Object _ -> "a mapping"; Array _ -> "a list"; String _ -> "a string"
  Number _ -> "a number";  Bool _ -> "a boolean"; Null -> "null"

obj :: Where -> Text -> Value -> V (KM.KeyMap Value)
obj w k = \case
  Object o -> pure o
  v        -> bad (vio "ERF-53" (w <> "." <> k) ("expected a mapping, got " <> valKind v))

-- required string
reqStr :: Where -> KM.KeyMap Value -> Text -> Text -> V Text
reqStr w o k req = case look o k of
  Missing      -> bad (vio req w ("required field " <> tick k <> " is missing"))
  ExplicitNull -> bad (vio req w ("required field " <> tick k <> " is written null"))
  Given v      -> str w k v

optStr :: Where -> KM.KeyMap Value -> Text -> V (Presence Text)
optStr w o k = case look o k of
  Missing      -> pure Missing
  ExplicitNull -> bad (vio "ERF-55" w
                    (tick k <> " is written with a null value. The format has no null: " <>
                     "a field is absent (nothing is asserted) or present with a value. " <>
                     "The specification never names this state."))
  Given v      -> Given <$> str w k v

-- | ERF-55 + ERF-56 together. Absence materializes to the empty list; a written
-- empty list is a producer violation but still parses.
listOf :: Where -> KM.KeyMap Value -> Text -> (Where -> Value -> V a) -> V (TList a)
listOf w o k p = case look o k of
  Missing      -> pure emptyTList                       -- ERF-56
  ExplicitNull -> bad (vio "ERF-55" (w <> "." <> k)
                    "a list field is written null; ERF-55 says an empty list is omitted, and the format has no null")
  Given (Array vs)
    | V.null vs -> V ([vio "ERF-55" (w <> "." <> k)
                        "an empty list is written out; ERF-55: \"Empty lists MUST be omitted: a field's absence means none.\""]
                     , Just (TList [] Written))
    | otherwise -> (\xs -> TList xs Written)
                     <$> traverse (\(i, v) -> p (w <> "." <> k <> "[" <> tshow' i <> "]") v)
                                  (zip [0 :: Int ..] (V.toList vs))
  Given v      -> bad (vio "ERF-53" (w <> "." <> k) ("expected a list, got " <> valKind v))

strItem :: Where -> Value -> V Text
strItem w = \case
  String t -> pure t
  Number n -> bad (vio "ERF-65" w ("list item resolved to the number " <> sciText n <> "; ids are strings"))
  Bool b   -> bad (vio "ERF-65" w ("list item resolved to the boolean " <> T.pack (show b) <> "; ids are strings"))
  v        -> bad (vio "ERF-53" w ("expected a string, got " <> valKind v))

enumOf :: Where -> Text -> Text -> [(Text, a)] -> Value -> V a
enumOf w k req tbl v = do
  t <- str w k v
  case lookup t tbl of
    Just a  -> pure a
    Nothing -> bad (vio req (w <> "." <> k)
                 (tick t <> " is not in the closed set {" <>
                  T.intercalate ", " (map fst tbl) <> "}. Section 5: \"A value outside them is a validation failure, not a dialect.\""))

stampOf :: Where -> Text -> Value -> V Stamp
stampOf w k v = parseStamp <$> str w k v

-- | ERF-58: "The event-time key MUST be @timestamp@, everywhere."
actorStamp :: Where -> Text -> Value -> V ActorStamp
actorStamp w k v = do
  o <- obj w k v
  let w' = w <> "." <> k
  t <- case look o "timestamp" of
         Missing      -> checkAltKeys o w' >> bad (vio "ERF-58" w' "stamp has no `timestamp` key")
         ExplicitNull -> bad (vio "ERF-58" w' "`timestamp` is null")
         Given tv     -> stampOf w' "timestamp" tv
  b <- reqStr w' o "by" "ERF-58"
  tell (actorFindings w' b)
  extraKeyCheck w' o ["timestamp", "by"]
  pure (ActorStamp t (parseActor b))
  where
    checkAltKeys o w' =
      let alts = ["date", "at", "when", "time", "on"]
          hits = [ a | a <- alts, isJust (KM.lookup (K.fromText a) o) ]
      in unless (null hits) (tell [vio "ERF-58" w'
           ("stamp uses " <> T.intercalate "/" hits <> " instead of `timestamp`")])

actorFindings :: Where -> Text -> [Finding]
actorFindings w t = case parseActor t of
  AActorMalformed _ ->
    [ orphan Violation w
        ("actor id " <> tick t <> " follows none of the three conventions of section 2 " <>
         "(human:<id>, <producer>/<version>, process:<id>). NOTE: section 2 states this as " <>
         "a MUST but gives it no requirement id, so this violation cites nothing.") ]
  AHuman r | T.null r -> [ orphan Flag w "actor is bare `human:` with an empty id; the TypeScript template literal admits it" ]
  AProcess r | T.null r -> [ orphan Flag w "actor is bare `process:` with an empty id" ]
  AHuman r | "/" `T.isInfixOf` r ->
    [ orphan Flag w
        ("actor " <> tick t <> " inhabits two arms of the Actor union at once " <>
         "(`human:${string}` and `${string}/${string}`); section 2 does not say which governs") ]
  _ -> []

-- | ERF-55 ("A producer MUST NOT originate a field the declared spec_version
-- does not define") and ERF-72 (@x_@ escape hatch) and ERF-57 (report it).
extraKeyCheck :: Where -> KM.KeyMap Value -> [Text] -> V ()
extraKeyCheck w o known =
  let ks     = map K.toText (KM.keys o)
      extras = [ k | k <- ks, k `notElem` known ]
      exts   = [ k | k <- extras, "x_" `T.isPrefixOf` k ]
      unks   = [ k | k <- extras, not ("x_" `T.isPrefixOf` k) ]
  in do
    unless (null unks) (tell
      [ vio "ERF-55" w ("unknown field " <> tick k <>
          ": the declared spec_version does not define it and it is not under the `x_` extension prefix (ERF-72)")
      | k <- unks ])
    unless (null unks) (tell
      [ nte "ERF-57" w ("preserved as opaque data and reported, not rejected: " <> tick k) | k <- unks ])
    unless (null exts) (tell
      [ nte "ERF-72" w ("extension field " <> tick k <> " accepted; this version assigns it no meaning") | k <- exts ])

--------------------------------------------------------------------------------
-- RECORD PARSERS
--------------------------------------------------------------------------------

atomKeys :: [Text]
atomKeys = ["id","type","corpus","finding","quote","source","source_quality"
           ,"as_of_date","limitations","created","last_modified","finding_audit"]

parseAtom :: Where -> KM.KeyMap Value -> Text -> V Atom
parseAtom w o body = do
  extraKeyCheck w o atomKeys
  i  <- reqStr w o "id" "ERF-13"
  c  <- reqStr w o "corpus" "ERF-54"
  f  <- reqStr w o "finding" "ERF-11"
  q  <- reqStr w o "quote" "ERF-6"
  s  <- reqStr w o "source" "ERF-4"
  sq <- case look o "source_quality" of
          Missing      -> bad (vio "ERF-9" w "required field `source_quality` is missing")
          ExplicitNull -> bad (vio "ERF-9" w "`source_quality` is null")
          Given v      -> enumOf w "source_quality" "ERF-9"
                            [("high",QHigh),("medium",QMedium),("low",QLow)] v
  ao <- case look o "as_of_date" of
          Missing      -> pure Missing
          ExplicitNull -> bad (vio "ERF-14" w "`as_of_date` is null")
          Given v      -> Given <$> asOfDate w v
  lim <- optStr w o "limitations"
  cr  <- case look o "created" of
           Given v -> actorStamp w "created" v
           _       -> bad (vio "ERF-47" w "required field `created` is missing")
  lm  <- presenceStamp w o "last_modified"
  au  <- listOf w o "finding_audit" auditEntry
  -- ERF-53: "An atom's body is empty, so its file is frontmatter and nothing else."
  unless (T.null (T.strip body)) $
    tell [vio "ERF-53" w "an atom's file is frontmatter and nothing else, but this file has a body"]
  -- ERF-11: the mechanical result MUST NOT be stored.
  let storedCheck = [ k | k <- map K.toText (KM.keys o)
                        , k `elem` ["quote_verified","quote_check","verified","checked","quote_ok"] ]
  unless (null storedCheck) $
    tell [vio "ERF-11" w ("the mechanical quote check's result is stored in " <> tick k <>
                          "; ERF-11: \"its result MUST NOT be stored\"") | k <- storedCheck]
  pure (Atom i c f q s sq ao lim cr lm au)

-- | ERF-14: "It MAY be a year, a year and month, or a full date".
asOfDate :: Where -> Value -> V Stamp
asOfDate w v = case v of
  Number n ->
    -- The interesting collision. ERF-65 makes the frontmatter parse under the
    -- YAML 1.2 JSON schema, under which a bare `2018` IS a number. ERF-14 says
    -- as_of_date MAY be a year. So the spec's own required schema turns a legal
    -- year-precision as_of_date into a non-string.
    V ( [ vio "ERF-65" (w <> ".as_of_date")
            ("a bare year resolved to the number " <> sciText n <> ". ERF-14 permits a year, " <>
             "but ERF-65 mandates the YAML 1.2 JSON schema under which `2018` is a NUMBER, " <>
             "not a string. Nothing in the spec resolves the collision; quote it.") ]
        , Just (parseStamp (sciText n)) )
  _ -> do
    t <- str w "as_of_date" v
    case parseStamp t of
      SUnparsed _ -> bad (vio "ERF-14" (w <> ".as_of_date")
                       (tick t <> " is not a year, a year and month, or a full date"))
      s | SInstant _ _ <- s ->
            V ([flg "ERF-14" (w <> ".as_of_date")
                  "a full instant states precision ERF-14 does not list among the three permitted forms"], Just s)
        | otherwise -> pure s

auditEntry :: Where -> Value -> V AuditEntry
auditEntry w v = do
  o <- obj w "" v
  extraKeyCheck w o ["auditor","verdict","timestamp","protocol"]
  a <- reqStr w o "auditor" "ERF-11"
  vd <- case look o "verdict" of
          Given x -> enumOf w "verdict" "ERF-12"
                       [("SUPPORTED",Supported),("PARTIAL",Partial),("UNSUPPORTED",Unsupported)] x
          _ -> bad (vio "ERF-12" w "audit entry has no `verdict`")
  t <- case look o "timestamp" of
         Given x -> stampOf w "timestamp" x
         _ -> bad (vio "ERF-58" w "audit entry has no `timestamp`")
  p <- reqStr w o "protocol" "ERF-11"
  -- SPEC-GAP: ERF-19 requires a non-empty `why`; nothing requires a non-empty
  -- `auditor` or `protocol`, though ERF-11 says the protocol "travels with the
  -- verdict" and an empty one travels nothing.
  when (T.null (T.strip a)) $
    tell [flg "ERF-11" w "`auditor` is empty; ERF-11 requires an auditor identity but never says non-empty"]
  when (T.null (T.strip p)) $
    tell [flg "ERF-11" w "`protocol` is empty; ERF-11 requires the protocol version but never says non-empty"]
  pure (AuditEntry a vd t p)

claimKeys :: [Text]
claimKeys = ["id","type","corpus","title","epistemic_kind","created","last_modified"
            ,"short_name","families","atoms_for","atoms_against","surveys","edges"
            ,"standings","evidence_audit","semantic_query"]

parseClaim :: Where -> KM.KeyMap Value -> Text -> V Claim
parseClaim w o body = do
  extraKeyCheck w o claimKeys
  i <- reqStr w o "id" "ERF-36"
  c <- reqStr w o "corpus" "ERF-17"
  t <- reqStr w o "title" "ERF-18"
  k <- case look o "epistemic_kind" of
         Given v -> enumOf w "epistemic_kind" "ERF-24"
                      [("observation",Observation),("argument",Argument)
                      ,("bet",Bet),("commitment",Commitment)] v
         _ -> bad (vio "ERF-24" w "required field `epistemic_kind` is missing")
  cr <- case look o "created" of
          Given v -> actorStamp w "created" v
          _       -> bad (vio "ERF-47" w "required field `created` is missing")
  lm  <- presenceStamp w o "last_modified"
  sn  <- optStr w o "short_name"
  fam <- listOf w o "families" strItem
  af  <- listOf w o "atoms_for" strItem
  ag  <- listOf w o "atoms_against" strItem
  sv  <- listOf w o "surveys" strItem
  eg  <- listOf w o "edges" edge
  st  <- listOf w o "standings" standing
  ea  <- listOf w o "evidence_audit" auditEntry
  sq  <- optStr w o "semantic_query"
  -- ERF-22: "A claim MUST NOT store a state field".
  let stateKeys = [ x | x <- map K.toText (KM.keys o)
                      , x `elem` ["disposition","state","status","granted"] ]
  unless (null stateKeys) $
    tell [vio "ERF-22" w ("stores a state field " <> tick x <>
            "; ERF-22: the disposition is computed (ERF-41), never stored") | x <- stateKeys]
  pure (Claim i c t k cr lm sn fam af ag sv eg st ea sq body)

edge :: Where -> Value -> V Edge
edge w v = do
  o <- obj w "" v
  extraKeyCheck w o ["to","relation"]
  to <- reqStr w o "to" "ERF-35"
  r  <- case look o "relation" of
          Given x -> enumOf w "relation" "ERF-35"
                       [("supports",Supports),("assumes",Assumes)
                       ,("decomposes-into",DecomposesInto),("conflicts-with",ConflictsWith)] x
          _ -> bad (vio "ERF-35" w "edge has no `relation`")
  pure (Edge to r)

standing :: Where -> Value -> V StandingEntry
standing w v = do
  o <- obj w "" v
  extraKeyCheck w o ["timestamp","stance","by","why","evidence_at_stance"]
  t <- case look o "timestamp" of
         Given x -> stampOf w "timestamp" x
         _ -> bad (vio "ERF-19" w "standing entry has no `timestamp`")
  -- ERF-19: MUST be a full RFC 3339 instant carrying both a time and an offset.
  case t of
    SInstant _ True  -> pure ()
    SInstant _ False -> tell [vio "ERF-19" w "standing timestamp carries a time but no offset; ERF-19 requires both"]
    SDate _          -> tell [vio "ERF-19" w "standing timestamp is a bare date; ERF-19: \"MUST NOT be a bare date\""]
    SYear _          -> tell [vio "ERF-19" w "standing timestamp is a bare year"]
    SYearMonth _ _   -> tell [vio "ERF-19" w "standing timestamp is a bare year-month"]
    SUnparsed x      -> tell [vio "ERF-19" w ("standing timestamp " <> tick x <> " is not an RFC 3339 instant")]
  s <- case look o "stance" of
         Given x -> enumOf w "stance" "ERF-41"
                      [("for",For),("against",Against),("withdrawn",Withdrawn)] x
         _ -> bad (vio "ERF-41" w "standing entry has no `stance`")
  b <- reqStr w o "by" "ERF-21"
  let ac = parseActor b
  tell (actorFindings w b)
  unless (isHumanActor ac) $
    tell [vio "ERF-21" w ("standing `by` is " <> tick b <>
            " but ERF-21: \"A standing's `by` MUST be a `human:` actor.\"")]
  why <- reqStr w o "why" "ERF-39"
  when (T.null (T.strip why)) $
    tell [vio "ERF-39" w "`why` is empty; ERF-19: \"an entry without a reason is a toggle, not a judgment\""]
  -- THE Maybe-versus-empty field.
  eas <- case look o "evidence_at_stance" of
           Missing      -> pure Missing
           ExplicitNull -> bad (vio "ERF-55" w
                             ("`evidence_at_stance` is written null. ERF-55 distinguishes ABSENT " <>
                              "(\"the ruler stamped nothing\") from PRESENT AND EMPTY (\"the ruler " <>
                              "stamped, and faced no evidence\"). A null is neither and the " <>
                              "specification never names it."))
           Given x      -> do
             eo <- obj w "evidence_at_stance" x
             extraKeyCheck (w <> ".evidence_at_stance") eo ["atoms_for","atoms_against"]
             ef <- listOf (w <> ".evidence_at_stance") eo "atoms_for" strItem
             eg' <- listOf (w <> ".evidence_at_stance") eo "atoms_against" strItem
             pure (Given (EvidenceAtStance ef eg'))
  pure (StandingEntry t s ac why eas)

surveyKeys :: [Text]
surveyKeys = ["id","type","corpus","title","conducted","searches","notable_results"
             ,"prior_survey","last_modified"]

parseSurvey :: Where -> KM.KeyMap Value -> Text -> V Survey
parseSurvey w o body = do
  extraKeyCheck w o surveyKeys
  i <- reqStr w o "id" "ERF-36"
  c <- reqStr w o "corpus" "ERF-17"
  t <- reqStr w o "title" "ERF-28"
  cd <- case look o "conducted" of
          Given v -> actorStamp w "conducted" v
          _       -> bad (vio "ERF-28" w "required field `conducted` is missing")
  se <- listOf w o "searches" searchAct
  nr <- listOf w o "notable_results" notableResult
  pr <- optStr w o "prior_survey"
  lm <- presenceStamp w o "last_modified"
  pure (Survey i c t cd se nr pr lm body)

searchAct :: Where -> Value -> V SearchAct
searchAct w v = do
  o <- obj w "" v
  extraKeyCheck w o ["tool","query","scope","hits_reported","timestamp"]
  tl <- reqStr w o "tool" "ERF-26"
  q  <- reqStr w o "query" "ERF-26"
  sc <- optStr w o "scope"
  -- ERF-27: hits_reported is TEXT ("0", "3", "~120 reported, two pages inspected").
  -- Under ERF-65's JSON schema an unquoted 0 is a NUMBER, so this is the second
  -- place the mandated schema collides with a field the spec says is text.
  h <- case look o "hits_reported" of
         Missing      -> bad (vio "ERF-27" w "required field `hits_reported` is missing")
         ExplicitNull -> bad (vio "ERF-27" w "`hits_reported` is null")
         Given (Number n) -> V ([ vio "ERF-65" (w <> ".hits_reported")
                                   ("`hits_reported` resolved to the number " <> sciText n <>
                                    ". ERF-27 says the yield is recorded \"as text\"; ERF-65's JSON " <>
                                    "schema makes an unquoted 0 a number. Quote it.") ]
                               , Just (sciText n))
         Given x      -> str w "hits_reported" x
  when (T.null (T.strip tl)) $ tell [vio "ERF-26" w "`tool` is empty; ERF-26 requires the concrete instrument named"]
  when (T.null (T.strip q))  $ tell [vio "ERF-26" w "`query` is empty; ERF-26 requires the query in the instrument's own terms"]
  ts <- case look o "timestamp" of
          Missing      -> pure Missing
          ExplicitNull -> bad (vio "ERF-58" w "`timestamp` is null")
          Given x      -> Given <$> stampOf w "timestamp" x
  pure (SearchAct tl q sc h ts)

notableResult :: Where -> Value -> V NotableResult
notableResult w v = do
  o <- obj w "" v
  extraKeyCheck w o ["what","note","atoms"]
  wt <- reqStr w o "what" "ERF-27"
  n  <- reqStr w o "note" "ERF-27"
  as <- listOf w o "atoms" strItem
  pure (NotableResult wt n as)

presenceStamp :: Where -> KM.KeyMap Value -> Text -> V (Presence ActorStamp)
presenceStamp w o k = case look o k of
  Missing      -> pure Missing
  ExplicitNull -> bad (vio "ERF-48" w (tick k <> " is written null; ERF-48: a record never edited carries no `last_modified` at all"))
  Given v      -> Given <$> actorStamp w k v

--------------------------------------------------------------------------------
-- SOURCE LIST / DECLARATION / NARRATIVE
--------------------------------------------------------------------------------

sourceKeys :: [Text]
sourceKeys = ["citation_text","citation","received","status","normalized"
             ,"normalized_digest","reason","licence","licence_name","excerpt"
             ,"extraction","normalization"]

parseSourceList :: Where -> KM.KeyMap Value -> V SourceList
parseSourceList w o = do
  -- ERF-3: "a document whose top level is a mapping of exactly two keys".
  let ks = map K.toText (KM.keys o)
      extras = [ k | k <- ks, k `notElem` ["type","sources"] ]
  unless (null extras) $
    tell [vio "ERF-3" w ("the source list's top level carries " <> tick k <>
            "; ERF-3: \"a mapping of exactly two keys, `type` [...] and `sources`\"" <>
            (if "x_" `T.isPrefixOf` k
               then ". NOTE: ERF-72 permits `x_` fields on \"any record, declaration, or source\" \
                    \and the source LIST document is none of those, so the two rules disagree here."
               else ""))
         | k <- extras]
  so <- case look o "sources" of
          Missing      -> bad (vio "ERF-3" w "the source list has no `sources` key")
          ExplicitNull -> bad (vio "ERF-3" w "`sources` is null; an empty source list is written `sources: {}`")
          Given v      -> obj w "sources" v
  entries <- traverse (\(kk, vv) -> (K.toText kk,) <$> parseSource (w <> ".sources." <> K.toText kk) (K.toText kk) vv)
                      (KM.toList so)
  pure (SourceList (M.fromList entries) extras)

parseSource :: Where -> Id -> Value -> V Source
parseSource w sid v = do
  o <- obj w "" v
  extraKeyCheck w o sourceKeys
  ct <- reqStr w o "citation_text" "ERF-7"
  -- ERF-7: "A source's `citation_text` MUST NOT contain a URL."
  when (looksLikeUrl ct) $
    tell [vio "ERF-7" w "`citation_text` contains a URL; \"A citation identifies a work; a locator retrieves one copy.\""]
  cit <- case look o "citation" of
           Missing      -> pure Missing
           ExplicitNull -> bad (vio "ERF-8" w "`citation` is null")
           Given x      -> pure (Given x)
  rc <- case look o "received" of
          Missing      -> pure Missing
          ExplicitNull -> bad (vio "ERF-2" w "`received` is null")
          Given x      -> Given <$> parseReceived (w <> ".received") x
  stt <- case look o "status" of
           Given x -> enumOf w "status" "ERF-5"
                        [("shipped",StShipped),("shipped-as-quotation",StShippedAsQuotation)
                        ,("not-redistributable",StNotRedistributable)
                        ,("access-restricted",StAccessRestricted)
                        ,("licence-unverified",StLicenceUnverified)] x
           _ -> bad (vio "ERF-5" w "required field `status` is missing")
  nm  <- optStr w o "normalized"
  nd  <- optStr w o "normalized_digest"
  rsn <- optStr w o "reason"
  lic <- optStr w o "licence"
  lnm <- optStr w o "licence_name"
  ex  <- case look o "excerpt" of
           Missing      -> pure Missing
           ExplicitNull -> bad (vio "ERF-69" w "`excerpt` is null")
           Given x      -> Given <$> actorStamp w "excerpt" x
  extr <- optStr w o "extraction"
  nrm  <- optStr w o "normalization"
  let src = Source ct cit rc stt nm nd rsn lic lnm ex extr nrm
  tell (sourceChecks w sid src)
  pure src

parseReceived :: Where -> Value -> V Received
parseReceived w v = do
  o <- obj w "" v
  extraKeyCheck w o ["url","path","digest","timestamp"]
  u <- optStr w o "url"
  p <- optStr w o "path"
  d <- optStr w o "digest"
  t <- case look o "timestamp" of
         Missing      -> pure Missing
         ExplicitNull -> bad (vio "ERF-58" w "`timestamp` is null")
         Given x      -> Given <$> stampOf w "timestamp" x
  pure (Received u p d t)

parseDeclaration :: Where -> KM.KeyMap Value -> V Declaration
parseDeclaration w o = do
  extraKeyCheck w o ["type","id","title","spec_version","classification","owner"]
  i <- reqStr w o "id" "ERF-59"
  t <- reqStr w o "title" "ERF-59"
  sv <- case look o "spec_version" of
          Missing      -> bad (vio "ERF-59" w "required field `spec_version` is missing")
          ExplicitNull -> bad (vio "ERF-59" w "`spec_version` is null")
          Given (Number n) -> V ([ vio "ERF-65" (w <> ".spec_version")
                                     ("`spec_version` resolved to the number " <> sciText n <>
                                      ". ERF-61 requires SemVer 2.0.0, which is a STRING; a bare " <>
                                      "1.0 is a number under ERF-65's own JSON schema. Quote it.") ]
                                , Just (sciText n))
          Given x      -> str w "spec_version" x
  unless (isSemVer sv) $
    tell [vio "ERF-61" w (tick sv <> " is not a Semantic Versioning 2.0.0 version string")]
  cl <- optStr w o "classification"
  ow <- case look o "owner" of
          Missing      -> pure Missing
          ExplicitNull -> bad (vio "ERF-59" w "`owner` is null")
          Given x      -> do s <- str w "owner" x
                             tell (actorFindings (w <> ".owner") s)
                             pure (Given (parseActor s))
  pure (Declaration i t sv cl ow)

parseNarrative :: Where -> KM.KeyMap Value -> Text -> V Narrative
parseNarrative w o body = do
  extraKeyCheck w o ["type","title","corpus","created"]
  t <- reqStr w o "title" "ERF-34"
  c <- reqStr w o "corpus" "ERF-34"
  cr <- case look o "created" of
          Given v -> actorStamp w "created" v
          Missing -> bad (vio "ERF-34" w "required field `created` is missing")
          ExplicitNull -> bad (vio "ERF-34" w "`created` is null")
  pure (Narrative t c cr body)

--------------------------------------------------------------------------------
-- SOURCE-LEVEL REQUIREMENT CHECKS
--------------------------------------------------------------------------------

sourceChecks :: Where -> Id -> Source -> [Finding]
sourceChecks w _sid s = concat
  [ -- ERF-4: "Every source MUST either give the path of its normalized text or
    -- record that none is held and why."
    case (srNormalized s, statusIsAbsence (srStatus s)) of
      (Missing, False) ->
        [ vio "ERF-4" w ("no `normalized` path and status " <> tick (statusText (srStatus s)) <>
                         " is not one of ERF-5's absence statuses, so nothing records that none is held") ]
      (Given _, True) ->
        [ vio "ERF-4" w ("status " <> tick (statusText (srStatus s)) <>
                         " records an absence but a `normalized` path is also given. " <>
                         "SPEC-GAP: no requirement forbids this combination in as many words.") ]
      _ -> []

  , -- ERF-5: absence needs a human-readable reason.
    [ vio "ERF-5" w ("status " <> tick (statusText (srStatus s)) <> " records an absence but no `reason` is given")
    | statusIsAbsence (srStatus s), Missing <- [srReason s] ]
  , [ flg "ERF-5" w "`reason` is present but empty; ERF-5 says \"a human-readable reason\" and never says non-empty"
    | Given r <- [srReason s], T.null (T.strip r) ]

  , -- ERF-68
    [ vio "ERF-68" w ("status is `shipped` but no `licence` is named. ERF-68: text shipping under no " <>
                      "licence \"MUST carry the status `shipped-as-quotation` rather than leaving the " <>
                      "permission unstated\"")
    | srStatus s == StShipped, Missing <- [srLicence s] ]
  , [ flg "ERF-68" w "a licence identifier is given without `licence_name`; ERF-68 SHOULDs the plain name alongside \"because an identifier does not explain itself\""
    | Given _ <- [srLicence s], Missing <- [srLicenceName s] ]

  , -- ERF-70: name the tool AND its exact version.
    [ flg "ERF-70" w ("`extraction` names " <> tick t <> " but carries no version number; ERF-70 requires " <>
                      "\"the extracting tool and its exact version\"")
    | Given t <- [srExtraction s], not (T.any isDigit t) ]
  , [ flg "ERF-70" w ("`normalization` names " <> tick t <> " but carries no version number")
    | Given t <- [srNormalization s], not (T.any isDigit t) ]

  , -- ERF-71: SHOULD carry received.digest where the text is a conversion.
    [ flg "ERF-71" w "normalized text was produced by conversion (`extraction` is named) but `received.digest` is absent; ERF-71 SHOULDs it"
    | Given _ <- [srExtraction s]
    , case srReceived s of Given r -> srDigestMissing r; _ -> True ]

  , -- ERF-2 / ERF-7 interaction.
    case srReceived s of
      Given r
        | Missing <- rcPath r, Missing <- rcUrl r ->
            [ flg "ERF-2" w ("`received` is present but names neither a `path` nor a `url`. ERF-55 says a " <>
                             "present mapping asserts existence -- here, that a fetch happened -- but ERF-2's " <>
                             "path-or-url sentence is declarative, not a MUST, so nothing forbids this.") ]
        | Given _ <- rcUrl r, Missing <- rcTime r ->
            [ flg "ERF-2" w ("`received.url` is given without `received.timestamp`. ERF-2 requires a timestamp " <>
                             "for \"a source whose raw file is mutable at its location, a web page above all\", " <>
                             "but supplies no test for mutability, so a validator cannot tell whether this is a " <>
                             "violation or correct.") ]
      _ -> []

  , -- ERF-69: uncheckable MUST, reported as such once per excerpting source.
    [ nte "ERF-69" w ("an `excerpt` stamp is present, so the normalized text is an excerpt. ERF-69's other MUST " <>
                      "(that the excerpt \"MUST contain the quoted passage together with enough adjacent text\") " <>
                      "is not machine-checkable and is not checked.")
    | Given _ <- [srExcerpt s] ]
  ]
  where srDigestMissing r = case rcDigest r of Given _ -> False; _ -> True

statusText :: SourceStatus -> Text
statusText = \case
  StShipped -> "shipped"; StShippedAsQuotation -> "shipped-as-quotation"
  StNotRedistributable -> "not-redistributable"; StAccessRestricted -> "access-restricted"
  StLicenceUnverified -> "licence-unverified"

looksLikeUrl :: Text -> Bool
looksLikeUrl t = any (`T.isInfixOf` T.toLower t) ["http://", "https://", "www.", "doi.org/"]

isSemVer :: Text -> Bool
isSemVer t = case T.splitOn "." core of
    [a, b, c] -> all numOk [a, b, c]
    _         -> False
  where
    core = T.takeWhile (\ch -> ch /= '-' && ch /= '+') t
    numOk x = not (T.null x) && T.all isDigit x
              && (x == "0" || T.head x /= '0')

--------------------------------------------------------------------------------
-- FILE LOADING
--------------------------------------------------------------------------------

data RawFile = RawFile
  { rfPath  :: FilePath
  , rfBytes :: BS.ByteString
  , rfText  :: Maybe Text
  , rfFm    :: Maybe Text      -- ^ frontmatter block, verbatim
  , rfBody  :: Text
  } deriving (Show)

-- | ERF-53: "YAML frontmatter plus markdown body". SPEC-GAP: the delimiter is
-- never stated normatively -- only shown as @---@ in the examples. We take
-- @---@ as the opening fence and the next line that is exactly @---@ as the
-- close, which is what the examples show and what every markdown toolchain does.
splitFrontmatter :: Text -> (Maybe Text, Text)
splitFrontmatter t =
  case T.lines t of
    (l0 : rest) | T.strip l0 == "---" ->
      let (fm, body) = break (\l -> T.strip l == "---") rest
      in case body of
           (_ : b) -> (Just (T.unlines fm), T.unlines b)
           []      -> (Nothing, t)     -- unterminated fence
    _ -> (Nothing, t)

readRaw :: FilePath -> IO (RawFile, [Finding])
readRaw p = do
  bs <- BS.readFile p
  let w = T.pack p
      hasBom = BS.take 3 bs == BS.pack [0xEF, 0xBB, 0xBF]
      hasCR  = 0x0D `BS.elem` bs
      dec    = TE.decodeUtf8' bs
      fs = concat
        [ [ vio "ERF-67" w "file begins with a UTF-8 byte-order mark; ERF-67: \"no byte-order mark\"" | hasBom ]
        , [ vio "ERF-67" w "file contains CR; ERF-67 requires LF line endings" | hasCR ]
        , [ vio "ERF-67" w "file is not valid UTF-8" | Left _ <- [dec] ]
        ]
  case dec of
    Left _  -> pure (RawFile p bs Nothing Nothing "", fs)
    Right t -> let t' = if hasBom then T.drop 1 t else t
                   (fm, body) = splitFrontmatter t'
               in pure (RawFile p bs (Just t') fm body, fs)

-- | ERF-66: "A record's frontmatter MUST NOT contain a duplicate key, an anchor,
-- an alias, or an explicit tag."
--
-- None of these four survive Data.Yaml: libyaml resolves aliases, applies tags,
-- and hands back a map in which duplicate keys have already been merged
-- last-wins. By the time a Haskell program has a 'Value' the evidence is gone.
-- So this check is LEXICAL, run on the frontmatter text before parsing, and it
-- is necessarily approximate: it will not see a duplicate key nested under a
-- flow mapping on one line, and it can be fooled by a '&' inside a quoted
-- scalar. The spec mandates a check the mainstream binding cannot support.
erf66Scan :: Text -> Text -> [Finding]
erf66Scan w fm = concat [dups, anchors, aliases, tags]
  where
    ls = [ l | l <- T.lines fm, not (T.null (T.strip l)), not ("#" `T.isPrefixOf` T.stripStart l) ]
    topKeys = [ k | l <- ls
                  , not (" " `T.isPrefixOf` l), not ("\t" `T.isPrefixOf` l)
                  , not ("-" `T.isPrefixOf` T.stripStart l)
                  , let (k, r) = T.breakOn ":" l
                  , not (T.null r) ]
    dups = [ vio "ERF-66" w ("duplicate frontmatter key " <> tick k <>
              "; YAML \"leaves a processor's response to duplicates at its own discretion\"")
           | k <- nub [ k | k <- topKeys, length (filter (== k) topKeys) > 1 ] ]
    anchors = [ vio "ERF-66" w ("frontmatter appears to define a YAML anchor: " <> tick (T.strip l))
              | l <- ls, hasTokenStarting '&' l ]
    aliases = [ vio "ERF-66" w ("frontmatter appears to use a YAML alias: " <> tick (T.strip l))
              | l <- ls, hasTokenStarting '*' l ]
    tags    = [ vio "ERF-66" w ("frontmatter appears to carry an explicit YAML tag: " <> tick (T.strip l))
              | l <- ls, hasTokenStarting '!' l ]
    -- a token starting with the sigil, appearing right after ": " or "- "
    hasTokenStarting c l =
      let afterColon = snd (T.breakOn ": " l)
          v = T.stripStart (T.drop 2 afterColon)
      in not (T.null afterColon) && not (T.null v) && T.head v == c
         && not ("\"" `T.isPrefixOf` v) && not ("'" `T.isPrefixOf` v)

-- | ERF-54 dispatch: read the file's @type@, dispatch on it.
loadFile :: FilePath -> IO ([Finding], Loaded)
loadFile p = do
  (rf, fs0) <- readRaw p
  let w = T.pack p
  case rfText rf of
    Nothing -> pure (fs0, LUnreadable p "not valid UTF-8")
    Just txt -> do
      let (yamlText, body, isFm) = case rfFm rf of
            Just fm -> (fm, rfBody rf, True)
            Nothing -> (txt, "", False)
          fs66 = erf66Scan w yamlText
      case Y.decodeEither' (TE.encodeUtf8 yamlText) of
        Left e -> pure ( fs0 ++ [ nte "ERF-54" w ("ignored: not a YAML document (" <>
                                    T.pack (takeWhile (/= '\n') (Y.prettyPrintParseException e)) <> ")") ]
                       , LUnreadable p "not YAML" )
        Right (Object o) -> do
          let ty = case look o "type" of
                     Given (String t) -> Just t
                     _                -> Nothing
          case ty of
            Nothing -> pure ( fs0 ++ [ nte "ERF-54" w "ignored: file carries no `type`, so it is not part of the corpus (ERF-54 requires reporting that it was ignored)" ]
                            , LNoType p )
            Just t -> do
              let mk parser ctor =
                    let (fs, mv) = harvest (parser w o body)
                    in case mv of
                         Just x  -> (fs0 ++ fs66 ++ fs, ctor x)
                         Nothing -> (fs0 ++ fs66 ++ fs, LUnreadable p ("could not load as " <> t))
              pure $ case t of
                "atom"   -> mk (\w' o' b -> parseAtom w' o' b) (LRecord p . RAtom)
                "claim"  -> mk (\w' o' b -> parseClaim w' o' b) (LRecord p . RClaim)
                "survey" -> mk (\w' o' b -> parseSurvey w' o' b) (LRecord p . RSurvey)
                "narrative" -> mk (\w' o' b -> parseNarrative w' o' b) (LNarrative p)
                "corpus" -> let (fs, mv) = harvest (parseDeclaration w o)
                            in case mv of
                                 Just d  -> (fs0 ++ fs66 ++ fs, LDeclaration p d)
                                 Nothing -> (fs0 ++ fs66 ++ fs, LUnreadable p "could not load declaration")
                "sources" -> let (fs, mv) = harvest (parseSourceList w o)
                             in case mv of
                                  Just sl -> (fs0 ++ fs66 ++ fs, LSourceList p sl)
                                  Nothing -> (fs0 ++ fs66 ++ fs, LUnreadable p "could not load source list")
                _ -> ( fs0 ++ fs66 ++
                       [ nte "ERF-57" w ("unknown record type " <> tick t <>
                           "; preserved as opaque data and reported, not rejected") ]
                     , LUnknownType p t (Object o) )
        Right v -> pure ( fs0 ++ [ nte "ERF-54" w ("ignored: top level is " <> valKind v <> ", not a mapping, so it carries no `type`") ]
                        , LNoType p )

walk :: FilePath -> IO [FilePath]
walk root = do
  isD <- doesDirectoryExist root
  if not isD then pure [root] else do
    es <- listDirectory root
    fmap concat $ forM (sort es) $ \e ->
      if "." `isPrefixOf` e then pure [] else do
        let p = root </> e
        d <- doesDirectoryExist p
        if d then walk p else pure [p | takeExtension p `elem` [".md", ".markdown", ".yaml", ".yml"]]

--------------------------------------------------------------------------------
-- CORPUS-WIDE AND DEPLOYMENT-WIDE CHECKS
--------------------------------------------------------------------------------

data Corpus = Corpus
  { cpDecls     :: [(FilePath, Declaration)]
  , cpSourceLists :: [(FilePath, SourceList)]
  , cpRecords   :: [(FilePath, Record)]
  , cpNarratives:: [(FilePath, Narrative)]
  }

analyse :: FilePath -> [Loaded] -> IO [Finding]
analyse root ls = do
  let decls = [ (p, d)  | LDeclaration p d <- ls ]
      slists= [ (p, s)  | LSourceList p s <- ls ]
      recs  = [ (p, r)  | LRecord p r <- ls ]
      nars  = [ (p, n)  | LNarrative p n <- ls ]
      allSources = M.unions (map (slSources . snd) slists)
      byId = M.fromListWith (++) [ (recId r, [(p, r)]) | (p, r) <- recs ]
      claims = [ (p, c) | (p, RClaim c) <- recs ]
      atoms  = [ (p, a) | (p, RAtom a)  <- recs ]
      surveys= [ (p, s) | (p, RSurvey s)<- recs ]
      rootT  = T.pack root

  -- ERF-54 / ERF-62: exactly one declaration.
  let declFindings = case decls of
        []  -> [ vio "ERF-59" rootT "no file carries `type: corpus`; a corpus MUST carry a declaration" ]
        [_] -> []
        _   -> [ vio "ERF-54" rootT
                   ("this tree carries " <> tshow' (length decls) <> " files with `type: corpus` (" <>
                    T.intercalate ", " (map (T.pack . takeFileName . fst) decls) <>
                    "). ERF-54: \"a validator MUST reject a corpus carrying two.\" SPEC-GAP: the spec " <>
                    "never says whether a validator's input is a CORPUS or a DEPLOYMENT. ERF-38 is " <>
                    "deployment-scoped and ERF-36 makes ids deployment-unique, so a tree holding two " <>
                    "corpora is legal under those and rejected under this one. We treat the input as " <>
                    "one corpus.") ]

  -- ERF-3: at least one source list.
  let slFindings =
        [ vio "ERF-3" rootT "no file carries `type: sources`; ERF-3: \"A corpus MUST keep a source list\""
        | null slists ]

  -- ERF-36 / ERF-38: duplicate ids across every record type.
  let dupFindings =
        [ vio "ERF-38" rootT
            ("duplicate record id " <> tick i <> " held by " <>
             T.intercalate " and " [ recKindName r <> " in " <> T.pack (takeFileName p) | (p, r) <- rs ] <>
             ". ERF-36: unique \"regardless of record type\".")
        | (i, rs) <- M.toList byId, length rs > 1 ]

  -- ERF-17: every record's corpus names the declared corpus.
  let declaredIds = S.fromList (map (dcId . snd) decls)
      corpusFindings =
        [ vio "ERF-17" (T.pack p) ("`corpus: " <> recCorpus r <> "` names no declared corpus (declared: " <>
            (if S.null declaredIds then "none" else T.intercalate ", " (S.toList declaredIds)) <> ")")
        | (p, r) <- recs, not (S.member (recCorpus r) declaredIds) ]

  -- ERF-15: bare ids.
  let idish = concat
        [ [ (p, "atoms_for", x)      | (p, c) <- claims, x <- tlItems (clFor c) ]
        , [ (p, "atoms_against", x)  | (p, c) <- claims, x <- tlItems (clAgainst c) ]
        , [ (p, "surveys", x)        | (p, c) <- claims, x <- tlItems (clSurveys c) ]
        , [ (p, "edges.to", edTo e)  | (p, c) <- claims, e <- tlItems (clEdges c) ]
        , [ (p, "prior_survey", x)   | (p, s) <- surveys, Given x <- [svPrior s] ]
        , [ (p, "notable_results.atoms", x) | (p, s) <- surveys, n <- tlItems (svNotable s), x <- tlItems (nrAtoms n) ]
        , [ (p, "source", atSource a) | (p, a) <- atoms ]
        ]
      bareFindings =
        [ vio "ERF-15" (T.pack p) ("reference " <> tick x <> " in " <> f <>
            " encodes location; ERF-15: \"References MUST be bare ids and MUST NOT encode location.\"")
        | (p, f, x) <- idish, encodesLocation x ]

  -- ERF-35: current-relationship references MUST resolve.
  let known = M.keysSet byId
      resolveFindings = concat
        [ [ vio "ERF-35" (T.pack p) ("`" <> f <> "` names " <> tick x <> ", which resolves to no record in this deployment")
          | (p, f, x) <- idish, f /= "source", not (S.member x known) ]
        , [ vio "ERF-4" (T.pack p) ("atom names source " <> tick (atSource a) <>
              ", which is not in the corpus's source list")
          | (p, a) <- atoms, not (M.member (atSource a) allSources) ]
        ]

  -- ERF-35 second half: evidence_at_stance records a PAST state -> flag, never violate.
  let easFindings =
        [ flg "ERF-35" (T.pack p) ("`evidence_at_stance` names " <> tick x <>
            ", which resolves to no record. ERF-35: a reference recording a past state \"MUST NOT be a " <>
            "violation when it fails to resolve, and a validator MUST flag it instead.\"")
        | (p, c) <- claims, st <- tlItems (clStandings c)
        , Given eas <- [seEvidence st]
        , x <- tlItems (easFor eas) ++ tlItems (easAgainst eas)
        , not (S.member x known) ]

  -- ERF-20: producers SHOULD stamp evidence_at_stance.  The Maybe/empty axis.
  let erf20Findings = concat
        [ [ flg "ERF-20" (T.pack p) ("a standing on " <> tick (clId c) <> " carries no `evidence_at_stance`. " <>
              "ERF-20 SHOULDs it, and ERF-55 says ABSENT means \"the ruler stamped nothing\" while " <>
              "`{}` would mean \"the ruler stamped, and faced no evidence\".")
          | Missing <- [seEvidence st] ]
          ++
          [ nte "ERF-55" (T.pack p) ("a standing on " <> tick (clId c) <> " carries `evidence_at_stance` " <>
              "present and empty: the ruler stamped, and faced no evidence. This is NOT the same fact as " <>
              "an absent stamp, and ERF-55 exists to keep the two apart.")
          | Given eas <- [seEvidence st]
          , null (tlItems (easFor eas)), null (tlItems (easAgainst eas)) ]
        | (p, c) <- claims, st <- tlItems (clStandings c) ]

  -- ERF-41: compute the disposition; report tie-break holes.
  let disp = M.fromList [ (clId c, fst (computeDisposition (tlItems (clStandings c)))) | (_, c) <- claims ]
      dispFindings =
        [ nte "ERF-41" (T.pack p) ("computed disposition: " <> dispText d)
        | (p, c) <- claims, let d = fst (computeDisposition (tlItems (clStandings c))) ]
        ++
        [ flg "ERF-41" (T.pack p) m
        | (p, c) <- claims, m <- snd (computeDisposition (tlItems (clStandings c))) ]

  -- ERF-43: self-edges, cycles, closure termination, retired leaves.
  let claimMap = M.fromList [ (clId c, c) | (_, c) <- claims ]
      pathOf   = M.fromList [ (clId c, p) | (p, c) <- claims ]
      selfEdges =
        [ vio "ERF-43" (T.pack p) ("self-edge " <> tick (clId c) <> " --" <> relText (edRel e) <> "--> itself; ERF-43: \"Self-edges MUST NOT exist\"")
        | (p, c) <- claims, e <- tlItems (clEdges c), edTo e == clId c ]
      cycleFindings = detectCycles claims [Assumes, DecomposesInto]
      conflictFindings =
        [ vio "ERF-44" (T.pack p) ("`conflicts-with` between " <> tick (clId c) <> " and " <> tick (edTo e) <>
            " is stored on both; ERF-44: \"MUST be stored once per pair\"")
        | (p, c) <- claims, e <- tlItems (clEdges c), edRel e == ConflictsWith
        , Just other <- [M.lookup (edTo e) claimMap]
        , any (\e2 -> edRel e2 == ConflictsWith && edTo e2 == clId c) (tlItems (clEdges other))
        , clId c < edTo e ]
      closureFindings = concatMap (erf43Closure claimMap disp pathOf) claims'
      claims' = map snd claims

  -- ERF-49: unbacked observations/arguments someone stands on.
  let erf49 = concatMap (erf49Check claimMap) claims'

  -- ERF-48: last_modified ordering.
  let lmFindings = concat
        [ case recModified r of
            Given lm -> case cmpStamp (asTime lm) (asTime (recCreated r)) of
              Earlier -> [ vio "ERF-48" (T.pack p) ("`last_modified` (" <> stampText (asTime lm) <>
                            ") is earlier than `created` (" <> stampText (asTime (recCreated r)) <> ")") ]
              SameDayMixedPrecision ->
                [ flg "ERF-48" (T.pack p) ("`created` and `last_modified` differ in precision on the same day. " <>
                    "ERF-48 says \"at date precision 'later' admits the same day\" but says nothing about a " <>
                    "bare date against a full instant, and ERF-47's tie-break is about staleness, not this.") ]
              Unorderable -> [ flg "ERF-48" (T.pack p) "`created` and `last_modified` cannot be ordered (one is unparseable)" ]
              _ -> []
            _ -> []
        | (p, r) <- recs ]

  -- ERF-13: atom id shape.
  let erf13 =
        [ flg "ERF-13" (T.pack p) ("atom id " <> tick (atId a) <> " is not a mint-time prefix plus a sequence " <>
            "number. ERF-13 gives the shape (`kwg-117`) but no grammar, so this is reported as a flag.")
        | (p, a) <- atoms, not (looksMintId (atId a)) ]

  -- ERF-28: survey id SHOULD end with the conducted date; prior_survey resolves.
  let erf28 =
        [ flg "ERF-28" (T.pack p) ("survey id " <> tick (svId s) <> " does not end with a date; ERF-28 SHOULDs it")
        | (p, s) <- surveys, not (endsWithDate (svId s)) ]

  -- ERF-18: body SHOULD open by restating the title.
  let erf18 =
        [ flg "ERF-18" (T.pack p) ("the body does not open by restating the title verbatim; ERF-18 SHOULDs it, " <>
            "and \"keeping the restatement verbatim is what makes later drift visible\"")
        | (p, c) <- claims
        , let opener = T.strip (T.unwords (take 60 (T.words (clBody c))))
        , not (normalizeERF51 (clTitle c) `T.isPrefixOf` normalizeERF51 opener) ]

  -- ERF-40: not checkable here.
  let erf40 = [ nte "ERF-40" rootT ("standings append-only is NOT checked: ERF-40 says it is \"verified against the " <>
                  "substrate's history\", and the format states no interchange representation of that history. " <>
                  "A validator handed a directory has nothing to compare against.")
              | not (null claims) ]

  -- ERF-50/51/52: the quote check.
  quoteFindings <- fmap concat $ forM atoms $ \(p, a) ->
    runQuoteCheck root (T.pack p) allSources a

  -- ERF-31/32/33: narrative bindings.
  let narrFindings = concatMap (checkNarrative claimMap byId) nars

  -- ERF-60/61
  let verFindings = concatMap (versionCheck) decls

  pure $ concat
    [ declFindings, slFindings, dupFindings, corpusFindings, bareFindings
    , resolveFindings, easFindings, erf20Findings, dispFindings
    , selfEdges, cycleFindings, conflictFindings, closureFindings
    , erf49, lmFindings, erf13, erf28, erf18, erf40, quoteFindings
    , narrFindings, verFindings ]

relText :: Relation -> Text
relText = \case
  Supports -> "supports"; Assumes -> "assumes"
  DecomposesInto -> "decomposes-into"; ConflictsWith -> "conflicts-with"

encodesLocation :: Text -> Bool
encodesLocation x = any (`T.isInfixOf` x) ["/", "#", ".md", "://"]

looksMintId :: Text -> Bool
looksMintId t = case T.breakOnEnd "-" t of
  (pre, num) -> not (T.null pre) && not (T.null num) && T.all isDigit num

endsWithDate :: Text -> Bool
endsWithDate t = T.length t >= 10 &&
  case parseTimeM True defaultTimeLocale "%Y-%m-%d" (T.unpack (T.takeEnd 10 t)) :: Maybe Day of
    Just _ -> True; Nothing -> False

versionCheck :: (FilePath, Declaration) -> [Finding]
versionCheck (p, d) =
  let v = dcVersion d
      major = T.takeWhile isDigit v
  in [ nte "ERF-60" (T.pack p)
         ("declared spec_version " <> tick v <> "; this validator implements 0.9.x. ERF-60: a consumer " <>
          "\"MAY refuse a corpus whose MAJOR spec_version it does not support, and MUST say so when it does\".")
     ] ++
     [ vio "ERF-60" (T.pack p)
         ("declared MAJOR version " <> tick major <> " is not supported by this validator, and per ERF-60 it " <>
          "says so rather than guessing.")
     | major /= "0", not (T.null major) ]
     ++
     [ flg "ERF-61" (T.pack p)
         ("spec_version is 0.x. SemVer 2.0.0 says \"anything MAY change at any time\" under major 0, so " <>
          "ERF-60's MAJOR-compatibility promise carries no content here and the spec never addresses it.")
     | major == "0" ]

--------------------------------------------------------------------------------
-- ERF-43 CLOSURE
--------------------------------------------------------------------------------

-- | ERF-43: "An argument's premise closure, followed transitively (its outgoing
-- `assumes` edges and the incoming `supports` edges of other claims, per
-- ERF-24), MUST terminate in non-argument leaves."
--
-- TOTALITY-HOLE, and it is a real one: ERF-43 forbids cycles in `assumes` and
-- `decomposes-into` and says nothing about `supports`. But `supports` edges
-- enter the premise closure from the other side, so two arguments that support
-- each other produce a closure with no leaf at all -- a non-terminating
-- traversal that ERF-43 requires to terminate and does not forbid. We detect it
-- with a visited set the spec does not authorise, and report it, because the
-- alternative is a validator that hangs.
erf43Closure :: M.Map Id Claim -> M.Map Id Disposition -> M.Map Id FilePath -> Claim -> [Finding]
erf43Closure cm disp paths root
  | clKind root /= Argument = []
  | otherwise =
      let (leaves, revisited) = go (S.singleton (clId root)) [clId root] [] False
          w = T.pack (fromMaybe "?" (M.lookup (clId root) paths))
          argLeaves = [ l | l <- leaves, maybe False ((== Argument) . clKind) (M.lookup l cm) ]
          retiredLeaves = [ l | l <- leaves, M.lookup l disp == Just DRetired ]
      in concat
        [ [ vio "ERF-43" w ("premise closure of argument " <> tick (clId root) <>
              " terminates in " <> tick l <> ", which is itself an argument with no premises; " <>
              "ERF-43 requires termination in non-argument leaves")
          | l <- argLeaves ]
        , [ flg "ERF-43" w ("premise closure of argument " <> tick (clId root) <>
              " terminates in leaf " <> tick l <> " whose computed disposition is `retired`; ERF-43 flags " <>
              "this rather than violating, \"because a withdrawal elsewhere can create the condition " <>
              "without any edit to the argument\"")
          | l <- retiredLeaves ]
        , [ flg "ERF-43" w ("premise closure of argument " <> tick (clId root) <>
              " contains a cycle reached through `supports` edges. ERF-43 forbids cycles in `assumes` and " <>
              "`decomposes-into` ONLY, but `supports` edges enter the closure from the other side, so this " <>
              "closure never terminates. The spec requires termination and does not forbid what breaks it.")
          | revisited ]
        ]
  where
    premisesOf i =
      let outgoing = case M.lookup i cm of
            Just c -> [ edTo e | e <- tlItems (clEdges c), edRel e == Assumes ]
            Nothing -> []
          incoming = [ clId c | c <- M.elems cm
                     , any (\e -> edRel e == Supports && edTo e == i) (tlItems (clEdges c)) ]
      in nub (outgoing ++ incoming)
    go _ [] acc rev = (nub acc, rev)
    go seen (i:rest) acc rev =
      let ps = premisesOf i
          fresh = [ q | q <- ps, not (S.member q seen) ]
          revisit = rev || any (`S.member` seen) ps
      in if null ps
           then go seen rest (if i /= clId root then i : acc else acc) revisit
           else go (foldr S.insert seen fresh) (fresh ++ rest) acc revisit

detectCycles :: [(FilePath, Claim)] -> [Relation] -> [Finding]
detectCycles claims rels =
  let cm = M.fromList [ (clId c, c) | (_, c) <- claims ]
      nexts i = case M.lookup i cm of
        Just c -> [ edTo e | e <- tlItems (clEdges c), edRel e `elem` rels ]
        Nothing -> []
      visit path i
        | i `elem` path = [ T.intercalate " -> " (reverse (i : path)) ]
        | otherwise = concatMap (visit (i : path)) (nexts i)
  in nub [ vio "ERF-43" (T.pack p) ("cycle through " <> T.intercalate "/" (map relText rels) <>
             " edges: " <> cyc <> "; ERF-43: \"`assumes` and `decomposes-into` MUST admit no cycles\"")
         | (p, c) <- claims, cyc <- visit [] (clId c) ]

erf49Check :: M.Map Id Claim -> Claim -> [Finding]
erf49Check cm c
  | null (tlItems (clStandings c)) = []
    -- SPEC-GAP: "an `observation` someone stands on". Does one WITHDRAWN standing
    -- count as standing on it? We read "stands on" as "has any standing entry",
    -- because ERF-41 makes withdrawal a stance and ERF-49 does not exclude it.
  | clKind c == Observation
  , null (tlItems (clFor c)), null (tlItems (clSurveys c))
  = [ flg "ERF-49" (tick (clId c))
        ("an `observation` someone stands on with empty `atoms_for` and empty `surveys`; ERF-49 flags it " <>
         "as unbacked. NOTE: absent and written-empty are the same here, because ERF-56 materializes an " <>
         "omitted list as empty -- the one place the format DOES collapse the distinction ERF-55 protects " <>
         "elsewhere.") ]
  | clKind c == Argument, null (premises) =
      [ flg "ERF-49" (tick (clId c))
          "an `argument` someone stands on with no premises: no outgoing `assumes` edge and no incoming `supports` edge" ]
  | otherwise = []
  where
    premises = [ edTo e | e <- tlItems (clEdges c), edRel e == Assumes ]
            ++ [ clId o | o <- M.elems cm
               , any (\e -> edRel e == Supports && edTo e == clId c) (tlItems (clEdges o)) ]

--------------------------------------------------------------------------------
-- THE QUOTE CHECK, wired to disk
--------------------------------------------------------------------------------

-- | ERF-1 + ERF-50 + ERF-51 + ERF-52.
runQuoteCheck :: FilePath -> Text -> M.Map Id Source -> Atom -> IO [Finding]
runQuoteCheck root w sources a =
  case M.lookup (atSource a) sources of
    Nothing -> pure []   -- already reported by ERF-4
    Just s  -> case srNormalized s of
      Given rel -> do
        cands <- pure (candidatePaths root rel)
        found <- firstExisting cands
        case found of
          Nothing -> pure [ vio "ERF-1" w ("normalized text " <> tick rel <> " for source " <>
                              tick (atSource a) <> " is not present, so the check ERF-1 requires cannot run. " <>
                              "SPEC-GAP: the spec never says what `normalized` is relative to; tried " <>
                              T.intercalate ", " (map T.pack cands)) ]
          Just fp
            | takeExtension fp `notElem` [".md", ".markdown", ".txt", ""] ->
                pure [ nte "ERF-51" w ("quote check UNAVAILABLE: normalized text " <> tick (T.pack fp) <>
                        " is not text or markdown; ERF-51: \"it MUST report the check as unavailable rather " <>
                        "than pass or fail it\"") ]
            | otherwise -> do
                bs <- BS.readFile fp
                case TE.decodeUtf8' bs of
                  Left _ -> pure [ nte "ERF-51" w "quote check UNAVAILABLE: normalized text is not valid UTF-8" ]
                  Right txt -> pure $ case checkQuote (atQuote a) txt of
                    QPass          -> []
                    QUnavailable m -> [ nte "ERF-51" w ("quote check unavailable: " <> m) ]
                    QFail r m      -> [ vio r w ("quote check FAILED against " <> T.pack (takeFileName fp) <> ": " <> m) ]
      _ -> pure [ nte "ERF-51" w ("quote check UNAVAILABLE: source " <> tick (atSource a) <>
                    " holds no normalized text (status " <> tick (statusText (srStatus s)) <>
                    "). ERF-1 says the text \"MUST exist before any check runs against it\"; the atom is " <>
                    "therefore unverifiable by anyone holding only this corpus.") ]

-- | SPEC-GAP: `normalized` is "the text quotes are checked against", given as a
-- path (`normalized/pacioli-...md`). Relative to WHAT? The source list file? The
-- corpus root? The declaration? The spec never says, and the three differ as
-- soon as the source list is not at the root.
candidatePaths :: FilePath -> Text -> [FilePath]
candidatePaths root rel = nub (map normalise [ root </> T.unpack rel, T.unpack rel ])

firstExisting :: [FilePath] -> IO (Maybe FilePath)
firstExisting [] = pure Nothing
firstExisting (p:ps) = do
  e <- doesFileExist p
  if e then pure (Just p) else firstExisting ps

--------------------------------------------------------------------------------
-- NARRATIVE CHECKS
--------------------------------------------------------------------------------

checkNarrative :: M.Map Id Claim -> M.Map Id [(FilePath, Record)] -> (FilePath, Narrative) -> [Finding]
checkNarrative cm byId (p, n) =
  let w = T.pack p
      body = nvBody n
      rzs = recognizeBindings body
      results = map (\rz -> (rz, parseBinding rz)) rzs
  in concatMap (one w body) (zip [0 :: Int ..] results)
     ++ [ nte "ERF-31" w "no narrative bindings found in this narrative; ERF-31 is a SHOULD, so this is a note"
        | null rzs ]
  where
    one w body (i, (rz, res)) = case res of
      Left err ->
        -- ERF-31: "A binding that does not match this grammar MUST be reported,
        -- never skipped."
        [ vio "ERF-31" w ("narrative binding #" <> tshow' (i + 1) <> " does not match the grammar and is " <>
            "REPORTED rather than skipped (ERF-31): " <> beText err <> ". Raw: " <> tick (T.take 120 (rzRaw rz))) ]
      Right b ->
        let passage = passageFor body (rzOffset rz) (precedingEnd body (rzOffset rz))
            anchorN = normalizeERF51 (bdAnchor b)
            passageN = normalizeERF51 passage
            occurs = T.null anchorN || anchorN `T.isInfixOf` passageN
            unresolved = [ x | x <- bdIds b, not (M.member x byId) ]
            stalenesses = [ maybe StIndeterminate (bindingStaleness (bdBoundAt b) . clModified) (M.lookup x cm)
                          | x <- bdIds b ]
            st = combineStaleness stalenesses
        in concat
          [ [ flg "ERF-31" w ("narrative binding #" <> tshow' (i + 1) <> " anchor " <> tick (bdAnchor b) <>
                " does not occur in its passage under ERF-51. ERF-31: \"A validator MUST flag an anchor that " <>
                "does not occur in its passage\" -- a flag, not a violation, because editing prose is permitted. " <>
                "SPEC-GAP: the spec never delimits \"its passage\"; we take the text from the end of the previous " <>
                "narrative binding (or the start of the body) up to this marker.")
            | not occurs ]
          , [ vio "ERF-33" w ("narrative binding #" <> tshow' (i + 1) <> " names " <> tick x <>
                ", which resolves to no record. ERF-33: it \"MUST report it and MUST NOT drop it silently\"")
            | x <- unresolved ]
          , [ nte "ERF-32" w ("narrative binding #" <> tshow' (i + 1) <> " staleness: " <> stalenessText st <>
                (if length (bdIds b) > 1
                   then ". SPEC-GAP: ERF-32 speaks of \"the claim it names\" in the singular but the grammar \
                        \admits many; we take the worst reading across them."
                   else "")) ]
          , [ flg "ERF-32" w ("narrative binding #" <> tshow' (i + 1) <> " is STALE: a claim it names carries a " <>
                "`last_modified` later than bound-at=" <> T.pack (show (bdBoundAt b)))
            | st == StStale ]
          , [ flg "ERF-32" w ("narrative binding #" <> tshow' (i + 1) <> " staleness is INDETERMINATE; ERF-32: " <>
                "\"a consumer MUST show the binding as staleness `indeterminate` and MUST NOT show it as current\"")
            | st == StIndeterminate ]
          ]
    precedingEnd body off =
      let before = T.take off body
          ends = [ e | (s, e) <- commentSpans before ]
      in if null ends then 0 else last ends
    passageFor body off from = T.take (off - from) (T.drop from body)

commentSpans :: Text -> [(Int, Int)]
commentSpans = go 0
  where
    go !off t =
      let (pre, rest) = T.breakOn "<!--" t
      in if T.null rest then [] else
         let s = off + T.length pre
             (inner, rest') = T.breakOn "-->" (T.drop 4 rest)
         in if T.null rest' then [] else
            let e = s + T.length inner + 7
            in (s, e) : go e (T.drop 3 rest')

--------------------------------------------------------------------------------
-- REPORT
--------------------------------------------------------------------------------

tick :: Text -> Text
tick t = "`" <> t <> "`"

tshow :: Text -> Text
tshow t = T.pack (show t)

tshow' :: Int -> Text
tshow' = T.pack . show

sevLabel :: Severity -> Text
sevLabel = \case Violation -> "VIOLATION"; Flag -> "FLAG"; Note -> "note"

report :: [Finding] -> Text
report fs =
  let ordered = sortOn (\f -> (fSev f, fWhere f, fromMaybe "" (fReq f))) fs
      line f = sevLabel (fSev f) <> "  " <>
               maybe "[--------]" (\r -> "[" <> T.justifyLeft 8 ' ' r <> "]") (fReq f) <>
               "  " <> fWhere f <> "\n            " <> fMsg f
      nv = length [ () | f <- fs, fSev f == Violation ]
      nf = length [ () | f <- fs, fSev f == Flag ]
      nn = length [ () | f <- fs, fSev f == Note ]
  in T.unlines (map line ordered)
     <> "\n"
     <> "-- summary ------------------------------------------------------------\n"
     <> "violations: " <> tshow' nv <> "   flags: " <> tshow' nf <> "   notes: " <> tshow' nn <> "\n"
     <> (if nv == 0
           then "CONFORMS. A corpus carrying flags and no violations conforms (section 2).\n"
           else "DOES NOT CONFORM.\n")

--------------------------------------------------------------------------------
-- YAML PROBE MODE
--------------------------------------------------------------------------------

probeInputs :: [(Text, Text)]
probeInputs =
  [ ("bare date (value)",            "k: 2026-08-23")
  , ("full timestamp (value)",       "k: 2026-08-23T14:02:00Z")
  , ("yes",                          "k: yes")
  , ("no",                           "k: no")
  , ("on",                           "k: on")
  , ("off",                          "k: off")
  , ("null",                         "k: null")
  , ("tilde",                        "k: ~")
  , ("empty value",                  "k:")
  , ("true",                         "k: true")
  , ("leading zero 012",             "k: 012")
  , ("bare year 2018",               "k: 2018")
  , ("colon string 12:30:00",        "k: 12:30:00")
  , ("version 1.0",                  "k: 1.0")
  , ("version 0.9.0",                "k: 0.9.0")
  , ("sexagesimal 1:30",             "k: 1:30")
  , ("hex 0x1F",                     "k: 0x1F")
  , ("octal 0o17",                   "k: 0o17")
  , ("inf/nan",                      "k: .inf")
  , ("N",                            "k: N")
  , ("y",                            "k: y")
  , ("quoted year",                  "k: \"2018\"")
  , ("KEY bare date",                "2026-08-23: v")
  , ("KEY yes",                      "yes: v")
  , ("KEY no",                       "no: v")
  , ("KEY on",                       "on: v")
  , ("KEY null",                     "null: v")
  , ("KEY 2018",                     "2018: v")
  , ("KEY 012",                      "012: v")
  , ("KEY 1.0",                      "1.0: v")
  , ("KEY 12:30:00",                 "12:30:00: v")
  , ("KEY true",                     "true: v")
  , ("duplicate keys",               "k: 1\nk: 2")
  , ("anchor + alias",               "a: &x hello\nb: *x")
  , ("explicit tag",                 "k: !!str 2018")
  ]

runProbe :: IO ()
runProbe = do
  TIO.putStrLn "input                     | yaml text            | Data.Yaml result"
  TIO.putStrLn "--------------------------+----------------------+---------------------------------"
  forM_ probeInputs $ \(lbl, src) -> do
    let r = Y.decodeEither' (TE.encodeUtf8 src) :: Either Y.ParseException Value
        shown = case r of
          Left e  -> "PARSE ERROR: " <> T.pack (takeWhile (/= '\n') (Y.prettyPrintParseException e))
          Right v -> describe v
    TIO.putStrLn (T.justifyLeft 25 ' ' lbl <> " | " <>
                  T.justifyLeft 20 ' ' (T.replace "\n" "\\n" src) <> " | " <> shown)
  where
    describe (Object o) = T.intercalate ", "
      [ "key " <> tshow (K.toText k) <> " -> " <> describeScalar v | (k, v) <- KM.toList o ]
    describe v = describeScalar v
    describeScalar = \case
      String t -> "String " <> tshow t
      Number n -> "Number " <> sciText n
      Bool b   -> "Bool " <> T.pack (show b)
      Null     -> "Null"
      Array a  -> "Array(" <> tshow' (V.length a) <> ")"
      Object o -> "Object(" <> tshow' (KM.size o) <> ")"

runNormProbe :: IO ()
runNormProbe = do
  let cases =
        [ ("plain",                "Hello  world",                 "Hello world")
        , ("emphasis",             "a *however* b",                "a however b")
        , ("underscore in word",   "snake_case",                   "snakecase")
        , ("backtick code",        "run `grep -n` now",            "run grep -n now")
        , ("ligature U+FB01",      "\xFB01\&nal",                  "final")
        , ("nbsp U+00A0",          "a\xA0\&b",                     "a b")
        , ("fullwidth ast U+FF0A", "a\xFF0A\&b",                   "ab")
        , ("zero width sp U+200B", "a\x200B\&b",                   "a?b")
        , ("hard wrap",            "one\ntwo",                     "one two")
        , ("case preserved",       "The Thing",                    "The Thing")
        , ("thin space U+2009",   "a\x2009\&b",                   "a b")
        , ("em dash U+2014",      "a \x2014\& b",                 "a \x2014\& b")
        , ("curly quotes U+201C", "\x201C\&x\x201D",             "\x201C\&x\x201D")
        , ("ellipsis U+2026",     "a\x2026\&b",                   "a...b")
        , ("combining acute",     "e\x301",                       "\xe9\&")
        , ("elision marker",      "a [...] b",                     "a [...] b")
        , ("trim",                 "   x   ",                      "x")
        ]
  forM_ cases $ \(lbl, inp, expct) -> do
    let got = normalizeERF51 (T.pack inp)
    TIO.putStrLn (T.justifyLeft 22 ' ' (T.pack lbl) <> " " <> tshow (T.pack inp) <>
                  "  ->  " <> tshow got <>
                  (if got == T.pack expct then "" else "   [expected " <> tshow (T.pack expct) <> "]"))

--------------------------------------------------------------------------------
-- MAIN
--------------------------------------------------------------------------------

usage :: String
usage = unlines
  [ "erfval - Epistemic Record Format v0.9 conformance validator"
  , ""
  , "  erfval <corpus-directory>     validate a corpus"
  , "  erfval --probe-yaml           show what Data.Yaml resolves scalars and keys to"
  , "  erfval --probe-normalize      show ERF-51 normalization on sample inputs"
  , ""
  , "Exit codes: 0 = conforms (flags allowed), 1 = violations, 2 = usage error."
  ]

main :: IO ()
main = getArgs >>= \case
  ["--probe-yaml"]      -> runProbe
  ["--probe-normalize"] -> runNormProbe
  [dir] -> do
    ok <- doesDirectoryExist dir
    unless ok $ do hPutStrLn stderr (dir ++ ": not a directory"); exitWith (ExitFailure 2)
    files <- walk dir
    loaded <- mapM loadFile files
    let fs0 = concatMap fst loaded
        ls  = map snd loaded
    fs1 <- analyse dir ls
    let fs = fs0 ++ fs1
    TIO.putStr (report fs)
    exitWith (if any ((== Violation) . fSev) fs then ExitFailure 1 else ExitSuccess)
  _ -> do putStrLn usage; exitWith (ExitFailure 2)
