package main

import (
	"os"
	"regexp"
	"strings"
)

var recordTypes = set("atom", "claim", "survey")
var nonRecordTypes = set("corpus", "sources", "narrative")

// ---------------------------------------------------------------------------
// Declaration (ERF-59, ERF-54, ERF-61, ERF-60)
// ---------------------------------------------------------------------------

var reSemVer = regexp.MustCompile(`^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$`)

// supportedMajor is the MAJOR spec_version this validator understands.
// ERF-60: "A consumer MAY refuse a corpus whose MAJOR spec_version it does not
// support, and MUST say so when it does."
const supportedMajor = "0"

func checkDeclaration(c *Corpus, rep *Report) {
	var decls []*LoadedFile
	for _, f := range c.Files {
		if f.Type == "corpus" {
			decls = append(decls, f)
		}
	}
	if len(decls) == 0 {
		rep.Violation("ERF-59", c.Root, 0, "", "corpus carries no declaration (no file carries `type: corpus`)")
		return
	}
	if len(decls) > 1 {
		// ERF-54: "a validator MUST reject a corpus carrying two".
		var names []string
		for _, dd := range decls {
			names = append(names, dd.Path)
		}
		rep.Violation("ERF-54", c.Root, 0, "",
			"corpus declares itself %d times (%s); exactly one file MUST carry `type: corpus`", len(decls), strings.Join(names, ", "))
	}
	d := decls[0]
	c.Declaration = d

	for _, k := range d.FM.Keys {
		if strings.HasPrefix(k, "x_") {
			rep.Info("ERF-72", d.Path, d.FM.Line, "", "extension field `%s` preserved as opaque data", k)
			continue
		}
		if !knownFields["corpus"][k] {
			rep.Violation("ERF-55", d.Path, d.FM.Line, "", "field `%s` is not defined for a corpus declaration", k)
		}
	}

	id := d.FM.Get("id")
	if id == nil || !id.IsStr() || strings.TrimSpace(id.Str) == "" {
		rep.Violation("ERF-59", d.Path, d.FM.Line, "id", "a declaration MUST declare `id`, the corpus id")
	} else {
		c.DeclID = id.Str
	}
	if t := d.FM.Get("title"); t == nil || !t.IsStr() || strings.TrimSpace(t.Str) == "" {
		rep.Violation("ERF-59", d.Path, d.FM.Line, "title", "a declaration MUST declare `title`")
	}
	sv := d.FM.Get("spec_version")
	if sv == nil || !sv.IsStr() || strings.TrimSpace(sv.Str) == "" {
		rep.Violation("ERF-59", d.Path, d.FM.Line, "spec_version", "a declaration MUST declare `spec_version`")
	} else {
		c.SpecVersion = sv.Str
		if !reSemVer.MatchString(sv.Str) {
			rep.Violation("ERF-61", d.Path, sv.Line, "spec_version", "`spec_version` %q is not Semantic Versioning 2.0.0", sv.Str)
		} else {
			major := strings.SplitN(sv.Str, ".", 2)[0]
			if major != supportedMajor {
				rep.Info("ERF-60", d.Path, sv.Line, "spec_version",
					"this validator supports MAJOR %s and the corpus declares MAJOR %s; saying so openly rather than reading it anyway", supportedMajor, major)
			}
		}
	}
	if ow := d.FM.Get("owner"); ow != nil {
		if !ow.IsStr() || !validActor(ow.Str) {
			rep.Violation("ERF-59", d.Path, ow.Line, "owner",
				"`owner` %q is not an actor of the form human:<id>, <producer>/<version>, or process:<id>", ow.StrOr())
		}
	}
	if cl := d.FM.Get("classification"); cl != nil && !cl.IsStr() {
		rep.Violation("ERF-59", d.Path, cl.Line, "classification", "`classification` is an opaque string label")
	}
}

// ---------------------------------------------------------------------------
// Record intake, id uniqueness (ERF-36, ERF-38), self-description (ERF-54)
// ---------------------------------------------------------------------------

func (d *Deployment) corpusDeclared(id string) bool {
	for _, c := range d.Corpora {
		if c.DeclID == id {
			return true
		}
	}
	return false
}

func intakeRecords(d *Deployment, c *Corpus, rep *Report) {
	for _, lf := range c.Files {
		switch {
		case recordTypes[lf.Type]:
		case nonRecordTypes[lf.Type]:
			continue
		default:
			// ERF-57: "A consumer MUST preserve unknown fields and unknown
			// record types as opaque data, MUST report them, and MUST NOT
			// reject a corpus solely because it contains them."
			rep.Info("ERF-57", lf.Path, lf.FM.Line, "",
				"unknown record type `%s`; preserved as opaque data and not interpreted", lf.Type)
			continue
		}

		// ERF-53: "The canonical interchange form MUST be one record per
		// file: YAML frontmatter plus markdown body, for every record type.
		// [...] the shape is still frontmatter plus body, not a bare YAML
		// document."
		if !lf.HadFrontmatter {
			rep.Violation("ERF-53", lf.Path, 1, "",
				"record file is a bare YAML document; the interchange form is frontmatter plus body, even when the body is empty")
		}

		r := &Record{File: lf, Type: lf.Type, FM: lf.FM, Owner: c}
		idv := lf.FM.Get("id")
		if idv == nil || !idv.IsStr() || strings.TrimSpace(idv.Str) == "" {
			rep.Violation("ERF-54", lf.Path, lf.FM.Line, "id", "record carries no `id`")
		} else {
			r.ID = idv.Str
			if prev, dup := d.ById[r.ID]; dup {
				// ERF-38: "A validator MUST reject a deployment containing
				// duplicate record ids, regardless of record type."
				rep.Violation("ERF-38", lf.Path, idv.Line, "id",
					"record id %q is already used by %s (%s); ids are unique across every corpus in the deployment (ERF-36)",
					r.ID, prev.File.Path, prev.Type)
			} else {
				d.ById[r.ID] = r
			}
		}
		if cv := lf.FM.Get("corpus"); cv == nil || !cv.IsStr() || strings.TrimSpace(cv.Str) == "" {
			rep.Violation("ERF-54", lf.Path, lf.FM.Line, "corpus", "`corpus` MUST be written on every record")
		} else {
			r.Corpus = cv.Str
		}
		c.Records = append(c.Records, r)
	}
}

// ---------------------------------------------------------------------------
// Shared shape checks
// ---------------------------------------------------------------------------

// checkActorStamp validates an ActorStamp: {timestamp, by}.
// ERF-58: "The event-time key MUST be `timestamp`, everywhere."
func checkActorStamp(lf *LoadedFile, v *Val, where, req string, rep *Report, requireInstant bool) TS {
	if v == nil {
		return TS{Precision: TSInvalid}
	}
	if !v.IsMap() {
		rep.Violation(req, lf.Path, v.Line, where, "must be a {timestamp, by} stamp")
		return TS{Precision: TSInvalid}
	}
	for _, k := range v.Keys {
		if strings.HasPrefix(k, "x_") {
			continue
		}
		if !stampFields[k] {
			hint := ""
			if k == "date" || k == "when" || k == "at" || k == "time" {
				hint = " (ERF-58: the event-time key MUST be `timestamp`, everywhere)"
			}
			rep.Violation("ERF-58", lf.Path, v.Line, where, "field `%s` is not part of an actor stamp%s", k, hint)
		}
	}
	tsv := v.Get("timestamp")
	if tsv == nil {
		rep.Violation("ERF-58", lf.Path, v.Line, where, "stamp carries no `timestamp`")
		return TS{Precision: TSInvalid}
	}
	if !tsv.IsStr() {
		// ERF-65: an unquoted date resolves to a timestamp object on a legacy
		// schema; under the JSON schema it is a string, so a non-string here
		// means something else entirely.
		rep.Violation("ERF-65", lf.Path, tsv.Line, where+".timestamp",
			"`timestamp` did not resolve to a string under the YAML 1.2 JSON schema")
		return TS{Precision: TSInvalid}
	}
	ts := parseTS(tsv.Str)
	if ts.Precision == TSInvalid {
		rep.Violation(req, lf.Path, tsv.Line, where+".timestamp", "`timestamp` %q is neither a date nor an RFC 3339 instant", truncate(tsv.Str, 40))
	} else if requireInstant && ts.Precision != TSInstant {
		rep.Violation("ERF-19", lf.Path, tsv.Line, where+".timestamp",
			"`timestamp` %q MUST be a full RFC 3339 instant carrying both a time and an offset, not a bare date", tsv.Str)
	}
	byv := v.Get("by")
	if byv == nil || !byv.IsStr() || strings.TrimSpace(byv.Str) == "" {
		rep.Violation(req, lf.Path, v.Line, where+".by", "stamp carries no `by` actor")
	} else if !validActor(byv.Str) {
		rep.Violation("ERF-Actor", lf.Path, byv.Line, where+".by",
			"actor %q does not follow the convention human:<id> | <producer>/<version> | process:<id> (section 2, Definitions)", truncate(byv.Str, 40))
	}
	return ts
}

// checkUnknownFieldsAndEmptyLists implements ERF-55 and ERF-72.
func checkUnknownFieldsAndEmptyLists(lf *LoadedFile, r *Record, rep *Report) {
	known := knownFields[r.Type]
	for _, k := range lf.FM.Keys {
		if strings.HasPrefix(k, "x_") {
			rep.Info("ERF-72", lf.Path, lf.FM.Line, "", "extension field `%s` preserved as opaque data", k)
			continue
		}
		if !known[k] {
			// ERF-22: "A claim MUST NOT store a state field: the disposition
			// is computed (ERF-41)."
			if r.Type == "claim" && (k == "state" || k == "status" || k == "disposition") {
				rep.Violation("ERF-22", lf.Path, lf.FM.Line, "",
					"claim carries `%s`; disposition MUST be computed from standings, never stored", k)
				continue
			}
			// ERF-11: "its result MUST NOT be stored".
			if r.Type == "atom" && (k == "quote_check" || k == "verified" || k == "quote_verified" || k == "check_result") {
				rep.Violation("ERF-11", lf.Path, lf.FM.Line, "",
					"atom carries `%s`; the mechanical quote check is recomputable and its result MUST NOT be stored", k)
				continue
			}
			rep.Violation("ERF-55", lf.Path, lf.FM.Line, "",
				"field `%s` is not defined for a `%s` by this spec_version (and is not an `x_` extension field)", k, r.Type)
		}
	}
	// ERF-55: "Empty lists MUST be omitted: a field's absence means none."
	for _, k := range listFields[r.Type] {
		v := lf.FM.Get(k)
		if v == nil {
			continue
		}
		if v.Kind == VNull {
			rep.Violation("ERF-55", lf.Path, v.Line, k, "list field `%s` is present and null; an empty list MUST be omitted", k)
			continue
		}
		if !v.IsSeq() {
			rep.Violation("ERF-55", lf.Path, v.Line, k, "field `%s` is typed as a list", k)
			continue
		}
		if len(v.Seq) == 0 {
			rep.Violation("ERF-55", lf.Path, v.Line, k, "list field `%s` is present and empty; an empty list MUST be omitted", k)
		}
	}
	// ERF-48: "Any change to a record MUST set `last_modified` to a timestamp
	// later than its `created`."
	cr := lf.FM.Get("created")
	lm := lf.FM.Get("last_modified")
	if cr != nil && lm != nil {
		crt, lmt := stampTS(cr), stampTS(lm)
		if crt.Precision != TSInvalid && lmt.Precision != TSInvalid {
			if lmt.T.Before(crt.T) && !sameDay(crt, lmt) {
				rep.Violation("ERF-48", lf.Path, lm.Line, "last_modified",
					"`last_modified` (%s) is earlier than `created` (%s)", lmt.Raw, crt.Raw)
			}
		}
	}
}

// checkIDRefs resolves a list of ids under ERF-35.
func checkIDRefs(d *Deployment, lf *LoadedFile, v *Val, field, wantType string, req string, sev Severity, rep *Report) {
	for i, it := range v.Items() {
		if !it.IsStr() {
			rep.Violation(req, lf.Path, it.Line, field, "entry %d is not a bare id string", i)
			continue
		}
		if strings.ContainsAny(it.Str, "/\\") {
			// ERF-15: "References MUST be bare ids and MUST NOT encode location."
			rep.Violation("ERF-15", lf.Path, it.Line, field, "reference %q encodes a location; references MUST be bare ids", it.Str)
		}
		rec, ok := d.ById[it.Str]
		if !ok {
			msg := "reference `" + it.Str + "` in `" + field + "` resolves to no record in the deployment"
			if sev == SevFlag {
				rep.Flag(req, lf.Path, it.Line, field, "%s (a past-state reference: ERF-35 makes this a flag, never a violation)", msg)
			} else {
				rep.Violation(req, lf.Path, it.Line, field, "%s", msg)
			}
			continue
		}
		if wantType != "" && rec.Type != wantType {
			rep.Advisory(req, lf.Path, it.Line, field,
				"reference `%s` resolves to a `%s`; `%s` is documented as holding %s ids", it.Str, rec.Type, field, wantType)
		}
	}
}

// ---------------------------------------------------------------------------
// Atom (ERF-6, ERF-9, ERF-11, ERF-12, ERF-13, ERF-14, ERF-4, ERF-50, ERF-52)
// ---------------------------------------------------------------------------

var reAtomID = regexp.MustCompile(`^\S*[^\s-]-\d+$`)

func checkAtom(d *Deployment, c *Corpus, r *Record, rep *Report) {
	lf := r.File
	checkUnknownFieldsAndEmptyLists(lf, r, rep)

	// ERF-53: an atom's body is empty.
	if strings.TrimSpace(lf.Body) != "" {
		rep.Violation("ERF-53", lf.Path, lf.BodyLine, "", "an atom's body is empty, so its file is frontmatter and nothing else")
	}

	// ERF-13: "a mint-time prefix plus a sequence number (kwg-117)".
	if r.ID != "" && !reAtomID.MatchString(r.ID) {
		rep.Violation("ERF-13", lf.Path, lf.FM.Line, "id",
			"atom id %q is not a mint-time prefix plus a sequence number (e.g. kwg-117)", r.ID)
	}

	for _, f := range []string{"finding", "quote", "source", "source_quality"} {
		v := lf.FM.Get(f)
		if v == nil || !v.IsStr() || strings.TrimSpace(v.Str) == "" {
			rep.Violation("ERF-4", lf.Path, lf.FM.Line, f, "atom MUST carry a non-empty `%s`", f)
		}
	}

	if sq := lf.FM.Get("source_quality"); sq != nil && sq.IsStr() && !sourceQualities[sq.Str] {
		rep.Violation("ERF-9", lf.Path, sq.Line, "source_quality",
			"`source_quality` %q is outside the closed set {high, medium, low}", sq.Str)
	}
	// ERF-9/ERF-10's substance (the grade is assessed against the attester and
	// the chain) is a judgment; not machine-checkable. Advisory nudge only:
	if sq := lf.FM.Get("source_quality"); sq != nil && (sq.StrOr() == "medium" || sq.StrOr() == "low") {
		if lim := lf.FM.Get("limitations"); lim == nil || strings.TrimSpace(lim.StrOr()) == "" {
			rep.Advisory("ERF-9", lf.Path, sq.Line, "limitations",
				"`source_quality` is %s; section 4.2 asks for the reason in `limitations`", sq.StrOr())
		}
	}

	// ERF-14
	if a := lf.FM.Get("as_of_date"); a != nil {
		if !a.IsStr() {
			rep.Violation("ERF-14", lf.Path, a.Line, "as_of_date", "`as_of_date` must be a string; leave it quoted so a legacy schema does not turn it into a date object (ERF-65)")
		} else {
			ts := parseTS(a.Str)
			if ts.Precision != TSYear && ts.Precision != TSMonth && ts.Precision != TSDate {
				rep.Violation("ERF-14", lf.Path, a.Line, "as_of_date",
					"`as_of_date` %q MAY be a year, a year and month, or a full date; nothing else", truncate(a.Str, 40))
			}
		}
	}

	created := lf.FM.Get("created")
	if created == nil {
		rep.Violation("ERF-47", lf.Path, lf.FM.Line, "created", "record carries no `created` stamp")
	} else {
		checkActorStamp(lf, created, "created", "ERF-47", rep, false)
	}
	if lm := lf.FM.Get("last_modified"); lm != nil {
		checkActorStamp(lf, lm, "last_modified", "ERF-48", rep, false)
	}

	// finding_audit (ERF-11, ERF-12, ERF-47)
	fa := lf.FM.Get("finding_audit")
	lastChange := stampTS(lf.FM.Get("last_modified"))
	for i, e := range fa.Items() {
		w := "finding_audit[" + itoa(i) + "]"
		checkAuditEntry(lf, e, w, rep)
		if lastChange.Precision != TSInvalid {
			at := parseTS(e.Get("timestamp").StrOr())
			if at.Precision != TSInvalid {
				switch isStale(at, lastChange) {
				case StaleStale:
					rep.Flag("ERF-47", lf.Path, e.Line, w,
						"finding_audit entry (%s) is older than the atom's last change (%s); the verdict is stale", at.Raw, lastChange.Raw)
				case StaleIndeterminate:
					rep.Flag("ERF-47", lf.Path, e.Line, w, "staleness of this audit entry is indeterminate")
				}
			}
		}
	}

	// ERF-4 + the quote check (ERF-6, ERF-50, ERF-51, ERF-52).
	srcID := lf.FM.Get("source").StrOr()
	if srcID == "" {
		return
	}
	src, ok := c.Sources[srcID]
	if !ok {
		rep.Violation("ERF-4", lf.Path, lf.FM.Get("source").Line, "source",
			"atom names source `%s`, which does not exist in the corpus's source list", srcID)
		rep.Info("ERF-50", lf.Path, lf.FM.Line, "quote", "quote check unavailable: the named source is not in the source list")
		return
	}
	runQuoteCheck(c, lf, r, src, rep)
}

func checkAuditEntry(lf *LoadedFile, e *Val, where string, rep *Report) {
	if !e.IsMap() {
		rep.Violation("ERF-12", lf.Path, e.Line, where, "audit entry must be a mapping")
		return
	}
	for _, k := range e.Keys {
		if strings.HasPrefix(k, "x_") {
			continue
		}
		if !auditFields[k] {
			rep.Violation("ERF-55", lf.Path, e.Line, where, "field `%s` is not part of an audit entry", k)
		}
	}
	v := e.Get("verdict")
	if v == nil || !v.IsStr() {
		rep.Violation("ERF-12", lf.Path, e.Line, where, "audit entry carries no `verdict`")
	} else if !verdicts[v.Str] {
		// ERF-12: "A verdict MUST be exactly one of SUPPORTED, PARTIAL, or
		// UNSUPPORTED. A failed, unparseable, or abandoned audit MUST NOT be
		// written as a verdict."
		rep.Violation("ERF-12", lf.Path, v.Line, where+".verdict",
			"verdict %q is outside the closed set {SUPPORTED, PARTIAL, UNSUPPORTED}; a failed or abandoned audit MUST NOT be written as a verdict", truncate(v.Str, 40))
	}
	if a := e.Get("auditor"); a == nil || !a.IsStr() || strings.TrimSpace(a.Str) == "" {
		rep.Violation("ERF-11", lf.Path, e.Line, where, "audit entry carries no `auditor`")
	} else if validActor(a.Str) && (strings.HasPrefix(a.Str, "human:") || strings.HasPrefix(a.Str, "process:")) {
		// ERF-11: "The `auditor` is a bare model or tool identifier
		// (deepseek-v4-pro), deliberately not an `Actor`".
		rep.Advisory("ERF-11", lf.Path, a.Line, where+".auditor",
			"`auditor` %q is written in the Actor form; ERF-11 says it is a bare model or tool identifier, deliberately not an Actor", a.Str)
	}
	if p := e.Get("protocol"); p == nil || !p.IsStr() || strings.TrimSpace(p.Str) == "" {
		rep.Violation("ERF-11", lf.Path, e.Line, where, "audit entry carries no `protocol`; the protocol version MUST travel with the verdict")
	}
	if t := e.Get("timestamp"); t == nil || !t.IsStr() || parseTS(t.Str).Precision == TSInvalid {
		rep.Violation("ERF-58", lf.Path, e.Line, where, "audit entry carries no parseable `timestamp`")
	}
}

func runQuoteCheck(c *Corpus, lf *LoadedFile, r *Record, src *Source, rep *Report) {
	qv := lf.FM.Get("quote")
	if qv == nil || !qv.IsStr() {
		return
	}
	// ERF-6: "An omission inside a quote MUST be written `[...]`; bare `...`
	// is reserved for dots the source itself contains." Nothing forbids a
	// bare `...`, so this is not checked; ERF-52 makes it match literally.

	nz := src.Val.Get("normalized")
	if nz == nil || !nz.IsStr() || strings.TrimSpace(nz.Str) == "" {
		// ERF-51: "exactly as it does for a text it does not hold".
		rep.Info("ERF-50", lf.Path, qv.Line, "quote",
			"quote check UNAVAILABLE: source `%s` holds no normalized text (status %q)", src.ID, src.Val.Get("status").StrOr())
		return
	}
	abs := resolveCorpusPath(c, srcListFileFor(c, src), nz.Str)
	data, err := os.ReadFile(abs)
	if err != nil {
		rep.Info("ERF-50", lf.Path, qv.Line, "quote",
			"quote check UNAVAILABLE: normalized text for `%s` is not present in the corpus", src.ID)
		return
	}
	if !isTextLike(nz.Str, data) {
		// ERF-51: "Facing a normalized text that is not text or markdown it
		// MUST report the check as unavailable rather than pass or fail it."
		rep.Info("ERF-51", lf.Path, qv.Line, "quote",
			"quote check UNAVAILABLE: normalized text for `%s` is not text or markdown", src.ID)
		return
	}
	res := CheckQuote(qv.Str, string(data))
	switch res.Result {
	case QuoteFail:
		rep.Violation("ERF-6", lf.Path, qv.Line, "quote",
			"quote is not verbatim from the normalized text of `%s`: %s", src.ID, res.Detail)
	case QuoteUnavailable:
		rep.Info("ERF-50", lf.Path, qv.Line, "quote", "quote check UNAVAILABLE: %s", res.Detail)
	}
}

func srcListFileFor(c *Corpus, src *Source) *LoadedFile {
	p := c.SourceFile[src.ID]
	for _, f := range c.SourceLists {
		if f.Path == p {
			return f
		}
	}
	if len(c.SourceLists) > 0 {
		return c.SourceLists[0]
	}
	return &LoadedFile{AbsPath: c.Root}
}

func isTextLike(name string, data []byte) bool {
	e := strings.ToLower(name)
	if i := strings.LastIndex(e, "."); i >= 0 {
		e = e[i:]
	} else {
		e = ""
	}
	if !textyExt[e] {
		return false
	}
	// A NUL byte is the cheapest complete evidence that this is not text.
	return !strings.ContainsRune(string(data), 0)
}

// ---------------------------------------------------------------------------
// Claim (ERF-17..ERF-25, ERF-39..ERF-44, ERF-47..ERF-49)
// ---------------------------------------------------------------------------

func checkClaim(d *Deployment, c *Corpus, r *Record, rep *Report) {
	lf := r.File
	checkUnknownFieldsAndEmptyLists(lf, r, rep)

	if t := lf.FM.Get("title"); t == nil || !t.IsStr() || strings.TrimSpace(t.Str) == "" {
		rep.Violation("ERF-18", lf.Path, lf.FM.Line, "title", "`title` MUST state the claim; it is the normative statement")
	}
	// ERF-17
	if r.Corpus != "" && !d.corpusDeclared(r.Corpus) {
		rep.Violation("ERF-17", lf.Path, lf.FM.Line, "corpus", "`corpus: %s` names no declared corpus in the deployment", r.Corpus)
	}
	ek := lf.FM.Get("epistemic_kind")
	kind := ek.StrOr()
	if ek == nil || !ek.IsStr() || !epistemicKinds[kind] {
		rep.Violation("ERF-24", lf.Path, lf.FM.Line, "epistemic_kind",
			"`epistemic_kind` %q is outside the closed set {observation, argument, bet, commitment}", ek.StrOr())
	}
	if cr := lf.FM.Get("created"); cr == nil {
		rep.Violation("ERF-47", lf.Path, lf.FM.Line, "created", "record carries no `created` stamp")
	} else {
		checkActorStamp(lf, cr, "created", "ERF-47", rep, false)
	}
	if lm := lf.FM.Get("last_modified"); lm != nil {
		checkActorStamp(lf, lm, "last_modified", "ERF-48", rep, false)
	}

	// ERF-18: "The body SHOULD open by restating it".
	body := strings.TrimSpace(lf.Body)
	title := strings.TrimSpace(lf.FM.Get("title").StrOr())
	if title != "" {
		if body == "" {
			rep.Advisory("ERF-18", lf.Path, lf.BodyLine, "body", "claim body is empty; ERF-18 asks it to open by restating the title")
		} else if !strings.HasPrefix(Normalize(body), Normalize(title)) {
			rep.Advisory("ERF-18", lf.Path, lf.BodyLine, "body",
				"claim body does not open with a verbatim restatement of the title; ERF-18 says keeping the restatement verbatim is what makes later drift visible")
		}
	}

	// ERF-23 / ERF-35: evidence references.
	for _, f := range []string{"atoms_for", "atoms_against"} {
		if v := lf.FM.Get(f); v != nil {
			checkIDRefs(d, lf, v, f, "atom", "ERF-35", SevViolation, rep)
		}
	}
	if v := lf.FM.Get("surveys"); v != nil {
		checkIDRefs(d, lf, v, "surveys", "survey", "ERF-35", SevViolation, rep)
	}

	// ERF-19, ERF-21, ERF-39, ERF-40, ERF-20, ERF-55.
	checkStandings(d, lf, rep)

	// evidence_audit (ERF-24, ERF-47).
	lastChange := stampTS(lf.FM.Get("last_modified"))
	for i, e := range lf.FM.Get("evidence_audit").Items() {
		w := "evidence_audit[" + itoa(i) + "]"
		checkAuditEntry(lf, e, w, rep)
		if kind == "bet" || kind == "commitment" {
			// ERF-24: "`bet` and `commitment` owe no backing, so they have
			// nothing to audit".
			rep.Advisory("ERF-24", lf.Path, e.Line, w,
				"an evidence_audit is recorded on a `%s`, which owes no backing and so has nothing to audit", kind)
		}
		if lastChange.Precision != TSInvalid {
			at := parseTS(e.Get("timestamp").StrOr())
			if at.Precision != TSInvalid {
				switch isStale(at, lastChange) {
				case StaleStale:
					rep.Flag("ERF-47", lf.Path, e.Line, w,
						"evidence_audit entry (%s) is older than the claim's last change (%s); the verdict is stale", at.Raw, lastChange.Raw)
				case StaleIndeterminate:
					rep.Flag("ERF-47", lf.Path, e.Line, w, "staleness of this audit entry is indeterminate")
				}
			}
		}
	}

	// edges (ERF-35, ERF-43, ERF-44).
	seenPairs := map[string]bool{}
	for i, e := range lf.FM.Get("edges").Items() {
		w := "edges[" + itoa(i) + "]"
		if !e.IsMap() {
			rep.Violation("ERF-35", lf.Path, e.Line, w, "edge must be a {to, relation} mapping")
			continue
		}
		for _, k := range e.Keys {
			if !strings.HasPrefix(k, "x_") && !edgeFields[k] {
				rep.Violation("ERF-55", lf.Path, e.Line, w, "field `%s` is not part of an edge", k)
			}
		}
		to := e.Get("to").StrOr()
		rel := e.Get("relation").StrOr()
		if to == "" {
			rep.Violation("ERF-35", lf.Path, e.Line, w, "edge carries no `to`")
		}
		if !relations[rel] {
			rep.Violation("ERF-44", lf.Path, e.Line, w,
				"relation %q is outside the closed set {supports, assumes, decomposes-into, conflicts-with}", truncate(rel, 40))
		}
		if to != "" {
			if to == r.ID {
				rep.Violation("ERF-43", lf.Path, e.Line, w, "self-edge: a claim MUST NOT carry an edge to itself")
			}
			tr, ok := d.ById[to]
			if !ok {
				rep.Violation("ERF-35", lf.Path, e.Line, w, "`edges.to` reference `%s` resolves to no record in the deployment", to)
			} else if tr.Type != "claim" {
				// Section 5 note: "`edges` means claim-to-claim and carries no
				// other record type".
				rep.Violation("ERF-35", lf.Path, e.Line, w, "`edges.to` reference `%s` resolves to a `%s`; edges are claim-to-claim only", to, tr.Type)
			}
			if rel == "conflicts-with" {
				key := to
				if seenPairs[key] {
					rep.Violation("ERF-44", lf.Path, e.Line, w, "`conflicts-with` to `%s` is recorded more than once on this claim", to)
				}
				seenPairs[key] = true
			}
		}
	}
}

func checkStandings(d *Deployment, lf *LoadedFile, rep *Report) {
	for i, s := range lf.FM.Get("standings").Items() {
		w := "standings[" + itoa(i) + "]"
		if !s.IsMap() {
			rep.Violation("ERF-19", lf.Path, s.Line, w, "standing entry must be a mapping")
			continue
		}
		for _, k := range s.Keys {
			if !strings.HasPrefix(k, "x_") && !standingFields[k] {
				hint := ""
				if k == "date" || k == "when" {
					hint = " (ERF-58: the event-time key MUST be `timestamp`, everywhere)"
				}
				rep.Violation("ERF-55", lf.Path, s.Line, w, "field `%s` is not part of a standing entry%s", k, hint)
			}
		}
		// ERF-19: "The `timestamp` MUST be a full RFC 3339 instant carrying
		// both a time and an offset [...] and MUST NOT be a bare date."
		tsv := s.Get("timestamp")
		if tsv == nil || !tsv.IsStr() {
			rep.Violation("ERF-19", lf.Path, s.Line, w, "standing entry carries no string `timestamp`")
		} else {
			ts := parseTS(tsv.Str)
			if ts.Precision == TSInvalid {
				rep.Violation("ERF-19", lf.Path, tsv.Line, w+".timestamp", "`timestamp` %q will not parse", truncate(tsv.Str, 40))
			} else if ts.Precision != TSInstant {
				rep.Violation("ERF-19", lf.Path, tsv.Line, w+".timestamp",
					"`timestamp` %q MUST be a full RFC 3339 instant carrying both a time and an offset, never a bare date", tsv.Str)
			} else if !strings.HasSuffix(tsv.Str, "Z") && !regexp.MustCompile(`[+-]\d{2}:\d{2}$`).MatchString(tsv.Str) {
				rep.Violation("ERF-19", lf.Path, tsv.Line, w+".timestamp", "`timestamp` %q carries no offset", tsv.Str)
			}
		}
		st := s.Get("stance")
		if st == nil || !st.IsStr() || !stances[st.Str] {
			rep.Violation("ERF-19", lf.Path, s.Line, w+".stance",
				"stance %q is outside the closed set {for, against, withdrawn}", st.StrOr())
		}
		// ERF-21 / ERF-39.
		by := s.Get("by")
		if by == nil || !by.IsStr() || strings.TrimSpace(by.Str) == "" {
			rep.Violation("ERF-39", lf.Path, s.Line, w+".by", "standing entry carries no `by`")
		} else if !isHumanActor(by.Str) {
			rep.Violation("ERF-21", lf.Path, by.Line, w+".by",
				"a standing's `by` MUST be a `human:` actor; %q is not. An LLM can propose a claim; only a person takes a stance", truncate(by.Str, 40))
		}
		if why := s.Get("why"); why == nil || !why.IsStr() || strings.TrimSpace(why.Str) == "" {
			rep.Violation("ERF-39", lf.Path, s.Line, w+".why",
				"standing entry carries no non-empty `why`; an entry without a reason is a toggle, not a judgment")
		}
		// ERF-20 + ERF-35 + ERF-55.
		if eas := s.Get("evidence_at_stance"); eas != nil {
			if !eas.IsMap() {
				rep.Violation("ERF-20", lf.Path, eas.Line, w+".evidence_at_stance", "`evidence_at_stance` must be a mapping")
			} else {
				for _, k := range eas.Keys {
					if !evidenceAtStanceFields[k] {
						rep.Violation("ERF-20", lf.Path, eas.Line, w+".evidence_at_stance",
							"field `%s` is not part of evidence_at_stance; ERF-20 forbids storing drift or counts there", k)
					}
				}
				for _, f := range []string{"atoms_for", "atoms_against"} {
					if v := eas.Get(f); v != nil {
						// ERF-35: a past-state reference is a FLAG, never a violation.
						checkIDRefs(d, lf, v, w+".evidence_at_stance."+f, "atom", "ERF-35", SevFlag, rep)
					}
				}
			}
		}
	}
	// ERF-40's "verified against the substrate's history" is not implemented;
	// see README, "what I did not implement".
}

// ---------------------------------------------------------------------------
// Survey (ERF-26, ERF-27, ERF-28, ERF-35)
// ---------------------------------------------------------------------------

var reEndsWithDate = regexp.MustCompile(`\d{4}-\d{2}-\d{2}$`)

func checkSurvey(d *Deployment, c *Corpus, r *Record, rep *Report) {
	lf := r.File
	checkUnknownFieldsAndEmptyLists(lf, r, rep)

	if t := lf.FM.Get("title"); t == nil || !t.IsStr() || strings.TrimSpace(t.Str) == "" {
		rep.Violation("ERF-28", lf.Path, lf.FM.Line, "title", "`title` MUST state what was sought")
	}
	if r.Corpus != "" && !d.corpusDeclared(r.Corpus) {
		rep.Violation("ERF-17", lf.Path, lf.FM.Line, "corpus", "`corpus: %s` names no declared corpus in the deployment", r.Corpus)
	}
	cond := lf.FM.Get("conducted")
	if cond == nil {
		rep.Violation("ERF-28", lf.Path, lf.FM.Line, "conducted", "a survey MUST carry `conducted`")
	} else {
		checkActorStamp(lf, cond, "conducted", "ERF-28", rep, false)
	}
	if lm := lf.FM.Get("last_modified"); lm != nil {
		checkActorStamp(lf, lm, "last_modified", "ERF-48", rep, false)
	}
	// ERF-28: "its id SHOULD end with the conducted date".
	if r.ID != "" && !reEndsWithDate.MatchString(r.ID) {
		rep.Advisory("ERF-28", lf.Path, lf.FM.Line, "id", "a survey id SHOULD end with the conducted date; %q does not", r.ID)
	}
	if ps := lf.FM.Get("prior_survey"); ps != nil {
		if !ps.IsStr() {
			rep.Violation("ERF-28", lf.Path, ps.Line, "prior_survey", "`prior_survey` must be a bare id string")
		} else if rec, ok := d.ById[ps.Str]; !ok {
			rep.Violation("ERF-35", lf.Path, ps.Line, "prior_survey", "`prior_survey` reference `%s` resolves to no record in the deployment", ps.Str)
		} else if rec.Type != "survey" {
			rep.Advisory("ERF-35", lf.Path, ps.Line, "prior_survey", "`prior_survey` resolves to a `%s`, not a survey", rec.Type)
		}
	}

	acts := lf.FM.Get("searches")
	if acts == nil || len(acts.Items()) == 0 {
		rep.Violation("ERF-26", lf.Path, lf.FM.Line, "searches", "a survey records search acts; `searches` is absent or empty")
	}
	for i, a := range acts.Items() {
		w := "searches[" + itoa(i) + "]"
		if !a.IsMap() {
			rep.Violation("ERF-26", lf.Path, a.Line, w, "search act must be a mapping")
			continue
		}
		for _, k := range a.Keys {
			if !strings.HasPrefix(k, "x_") && !searchActFields[k] {
				rep.Violation("ERF-55", lf.Path, a.Line, w, "field `%s` is not part of a search act", k)
			}
		}
		for _, f := range []string{"tool", "query"} {
			v := a.Get(f)
			if v == nil || !v.IsStr() || strings.TrimSpace(v.Str) == "" {
				rep.Violation("ERF-26", lf.Path, a.Line, w, "search act MUST name its `%s`", f)
			}
		}
		// ERF-27: "`hits_reported` MUST record each act's yield as the
		// instrument reported it, as text".
		h := a.Get("hits_reported")
		if h == nil {
			rep.Violation("ERF-27", lf.Path, a.Line, w, "search act carries no `hits_reported`")
		} else if !h.IsStr() {
			rep.Violation("ERF-27", lf.Path, h.Line, w+".hits_reported",
				"`hits_reported` MUST be text; this resolved to a non-string scalar (quote it, e.g. \"0\")")
		} else if strings.TrimSpace(h.Str) == "" {
			rep.Violation("ERF-27", lf.Path, h.Line, w+".hits_reported", "`hits_reported` is empty")
		}
		if t := a.Get("timestamp"); t != nil {
			if !t.IsStr() || parseTS(t.Str).Precision == TSInvalid {
				rep.Violation("ERF-58", lf.Path, t.Line, w+".timestamp", "search act `timestamp` %q will not parse", t.StrOr())
			}
		}
	}

	for i, nrv := range lf.FM.Get("notable_results").Items() {
		w := "notable_results[" + itoa(i) + "]"
		if !nrv.IsMap() {
			rep.Violation("ERF-27", lf.Path, nrv.Line, w, "notable_results entry must be a mapping")
			continue
		}
		for _, k := range nrv.Keys {
			if !strings.HasPrefix(k, "x_") && !notableFields[k] {
				rep.Violation("ERF-55", lf.Path, nrv.Line, w, "field `%s` is not part of a notable_results entry", k)
			}
		}
		for _, f := range []string{"what", "note"} {
			v := nrv.Get(f)
			if v == nil || !v.IsStr() || strings.TrimSpace(v.Str) == "" {
				rep.Violation("ERF-27", lf.Path, nrv.Line, w, "notable_results entry MUST carry a non-empty `%s`", f)
			}
		}
		if v := nrv.Get("atoms"); v != nil {
			checkIDRefs(d, lf, v, w+".atoms", "atom", "ERF-35", SevViolation, rep)
		}
	}
	// ERF-28's immutability ("`searches` and each act's reported yield MUST
	// NOT change after the fact") is a history property; not implemented.
}
