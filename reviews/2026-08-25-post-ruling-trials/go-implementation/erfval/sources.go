package main

import (
	"crypto/sha256"
	"encoding/hex"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// ---------------------------------------------------------------------------
// SCOPE AREA 1: the source list.
// ERF-3, ERF-4, ERF-5, ERF-1, ERF-2, ERF-7, ERF-8, ERF-68, ERF-69, ERF-70,
// ERF-71.
// ---------------------------------------------------------------------------

// reURL is the ERF-7 detector. The spec says "MUST NOT contain a URL" and does
// not define URL. See ambiguities.md A-28.
var reURL = regexp.MustCompile(`(?i)\b(?:[a-z][a-z0-9+.-]*://|www\.)\S+|\bdoi:\s*10\.\d{4,}/\S+`)

// reDigest is the shape ERF-71 states literally: "sha256:<hex>".
var reDigest = regexp.MustCompile(`^[a-z0-9][a-z0-9-]*:[0-9a-f]+$`)

// reVersionish looks for a version token in an ERF-70 tool name.
var reVersionish = regexp.MustCompile(`\d`)

// textyExt are the extensions a normalized text may plausibly carry.
// ERF-51: "Facing a normalized text that is not text or markdown it MUST
// report the check as unavailable rather than pass or fail it." The spec gives
// a validator no way to decide this. See ambiguities.md A-28.
var textyExt = set(".md", ".markdown", ".txt", ".text", "")

// binaryRawExt are extensions that make ERF-70's "produced from a raw file in
// another format" true under this implementation's heuristic.
var binaryRawExt = set(".pdf", ".epub", ".docx", ".doc", ".html", ".htm",
	".xhtml", ".mobi", ".azw3", ".rtf", ".odt", ".pptx", ".xlsx")

func checkSourceLists(c *Corpus, rep *Report) {
	var lists []*LoadedFile
	for _, f := range c.Files {
		if f.Type == "sources" {
			lists = append(lists, f)
		}
	}
	c.SourceLists = lists

	// ERF-3: "A corpus MUST keep a source list".
	if len(lists) == 0 {
		rep.Violation("ERF-3", c.Root, 0, "", "corpus keeps no source list (no file carries `type: sources`)")
		return
	}
	// The spec never says a corpus has EXACTLY one source list, only that it
	// MUST keep one. See ambiguities.md A-28.
	if len(lists) > 1 {
		var names []string
		for _, l := range lists {
			names = append(names, l.Path)
		}
		rep.Advisory("ERF-3", c.Root, 0, "",
			"corpus carries %d source lists (%s); the spec states no rule for more than one, so their entries were merged and a clash would be silent",
			len(lists), strings.Join(names, ", "))
	}

	for _, lf := range lists {
		checkOneSourceList(c, lf, rep)
	}
}

func checkOneSourceList(c *Corpus, lf *LoadedFile, rep *Report) {
	// ERF-3: "a document whose top level is a mapping of exactly two keys,
	// `type` with the value `sources`, and `sources`".
	extra := []string{}
	for _, k := range lf.FM.Keys {
		if k != "type" && k != "sources" {
			extra = append(extra, k)
		}
	}
	if len(extra) > 0 {
		rep.Violation("ERF-3", lf.Path, lf.FM.Line, "",
			"source list top level carries key(s) %s; ERF-3 requires exactly two keys, `type` and `sources`",
			strings.Join(quoteAll(extra), ", "))
	}
	if lf.FM.Get("type").StrOr() != "sources" {
		rep.Violation("ERF-3", lf.Path, lf.FM.Line, "type", "`type` must have the value `sources`")
	}
	sv := lf.FM.Get("sources")
	if sv == nil {
		rep.Violation("ERF-3", lf.Path, lf.FM.Line, "", "source list has no `sources` key")
		return
	}
	if !sv.IsMap() {
		rep.Violation("ERF-3", lf.Path, sv.Line, "sources", "`sources` must be a mapping of source id to Source")
		return
	}

	for _, id := range sv.Keys {
		if prev, dup := c.SourceFile[id]; dup {
			rep.Violation("ERF-3", lf.Path, sv.Line, "sources."+id,
				"source id %q is not unique within the corpus (also declared in %s)", id, prev)
		}
		c.SourceFile[id] = lf.Path
		s := &Source{ID: id, Val: sv.Map[id]}
		c.Sources[id] = s
		checkSource(c, lf, s, rep)
	}
}

func quoteAll(ss []string) []string {
	out := make([]string, len(ss))
	for i, s := range ss {
		out[i] = "`" + s + "`"
	}
	return out
}

func checkSource(c *Corpus, lf *LoadedFile, s *Source, rep *Report) {
	where := "sources." + s.ID
	v := s.Val
	if !v.IsMap() {
		rep.Violation("ERF-3", lf.Path, v.Line, where, "source entry is not a mapping")
		return
	}

	// Unknown fields on a source (ERF-55, with ERF-72's `x_` exemption:
	// "a producer MAY originate one on any record, declaration, or source").
	for _, k := range v.Keys {
		if strings.HasPrefix(k, "x_") {
			rep.Info("ERF-72", lf.Path, v.Line, where, "extension field `%s` preserved as opaque data", k)
			continue
		}
		if !sourceFields[k] {
			rep.Violation("ERF-55", lf.Path, v.Line, where,
				"field `%s` is not defined for a Source by this spec_version", k)
		}
	}

	// --- citation_text (ERF-7, ERF-8) -------------------------------------
	ct := v.Get("citation_text")
	if ct == nil {
		rep.Violation("ERF-3", lf.Path, v.Line, where, "`citation_text` is required by the Source shape (it is not optional in section 3)")
	} else if !ct.IsStr() || strings.TrimSpace(ct.Str) == "" {
		rep.Violation("ERF-3", lf.Path, ct.Line, where+".citation_text", "`citation_text` must be a non-empty string")
	} else if m := reURL.FindString(ct.Str); m != "" {
		// ERF-7: "A source's `citation_text` MUST NOT contain a URL."
		rep.Violation("ERF-7", lf.Path, ct.Line, where+".citation_text",
			"citation_text contains a URL (%s); the retrieved locator is `received.url`", truncate(m, 60))
	}
	if cit := v.Get("citation"); cit != nil {
		if !cit.IsMap() {
			rep.Violation("ERF-8", lf.Path, cit.Line, where+".citation", "`citation` must be a CSL mapping")
		} else {
			// ERF-8's substance ("citation_text MUST be rendered from it,
			// carrying chapter, translator and edition") needs a CSL engine
			// and a style. Not machine-checkable here. See ambiguities.md
			// A-28.
			rep.Info("ERF-8", lf.Path, cit.Line, where+".citation",
				"citation block present; ERF-8's 'citation_text MUST be rendered from it' was NOT checked (requires a CSL processor and a named style)")
		}
	}

	// --- status (ERF-5) ---------------------------------------------------
	st := v.Get("status")
	statusStr := ""
	if st == nil {
		rep.Violation("ERF-5", lf.Path, v.Line, where, "`status` is required on every source (it is not optional in section 3)")
	} else if !st.IsStr() {
		rep.Violation("ERF-5", lf.Path, st.Line, where+".status", "`status` must be a string")
	} else if !sourceStatuses[st.Str] {
		rep.Violation("ERF-5", lf.Path, st.Line, where+".status",
			"status %q is outside the closed set {shipped, shipped-as-quotation, not-redistributable, access-restricted, licence-unverified}", st.Str)
	} else {
		statusStr = st.Str
	}

	// --- normalized text: present or absence recorded (ERF-4, ERF-5) ------
	nz := v.Get("normalized")
	hasNormalized := nz != nil && nz.IsStr() && strings.TrimSpace(nz.Str) != ""
	reason := v.Get("reason")
	hasReason := reason != nil && reason.IsStr() && strings.TrimSpace(reason.Str) != ""

	if nz != nil && !nz.IsStr() {
		rep.Violation("ERF-4", lf.Path, nz.Line, where+".normalized", "`normalized` must be a string path")
	}

	if !hasNormalized {
		// ERF-4: "Every source MUST either give the path of its normalized
		// text or record that none is held and why."
		// ERF-5: "A source recording an absence MUST carry a `status` from a
		// closed set and a human-readable `reason`."
		if !absenceStatuses[statusStr] {
			rep.Violation("ERF-4", lf.Path, v.Line, where,
				"source holds no `normalized` path and does not record an absence: status is %q, which is not one of {not-redistributable, access-restricted, licence-unverified}", statusStr)
		}
		if !hasReason {
			rep.Violation("ERF-5", lf.Path, v.Line, where,
				"source records an absence but carries no non-empty `reason`")
		}
	} else {
		if absenceStatuses[statusStr] {
			// The spec never states what a source that both ships a text and
			// declares an absence status means. See ambiguities.md A-28.
			rep.Violation("ERF-5", lf.Path, v.Line, where,
				"source gives a `normalized` path but carries the absence status %q; the two contradict each other", statusStr)
		}
		if hasReason && !absenceStatuses[statusStr] {
			rep.Advisory("ERF-5", lf.Path, reason.Line, where+".reason",
				"`reason` is documented as REQUIRED when no normalized text ships; a shipping source carrying one is unspecified")
		}
	}

	// --- licence (ERF-68) -------------------------------------------------
	lic := v.Get("licence")
	hasLic := lic != nil && lic.IsStr() && strings.TrimSpace(lic.Str) != ""
	if hasNormalized {
		if !hasLic {
			// ERF-68 hard MUST: "The text may also ship under no licence at
			// all, as a short quotation [...]; such a source MUST carry the
			// status `shipped-as-quotation`".
			// Absence of `licence` is the only signal a validator has for
			// "ships under no licence". See ambiguities.md A-12.
			if statusStr == "shipped" {
				rep.Violation("ERF-68", lf.Path, v.Line, where,
					"normalized text ships with no `licence`, so it ships under none, and ERF-68 then requires status `shipped-as-quotation`, not `shipped`")
			}
		} else {
			if statusStr == "shipped-as-quotation" {
				rep.Advisory("ERF-68", lf.Path, lic.Line, where,
					"status is `shipped-as-quotation` (documented as 'under none') yet a `licence` is named; the spec states no rule for the combination")
			}
			if v.Get("licence_name") == nil {
				// "with the licence's plain name alongside because an
				// identifier does not explain itself" - a SHOULD.
				rep.Advisory("ERF-68", lf.Path, lic.Line, where,
					"`licence` is named without `licence_name`; ERF-68 asks for the plain name alongside")
			}
		}
	} else if hasLic {
		rep.Advisory("ERF-68", lf.Path, lic.Line, where,
			"a `licence` is named on a source that ships no normalized text; ERF-68 scopes the field to a source whose text ships")
	}

	// --- excerpt (ERF-69) -------------------------------------------------
	if ex := v.Get("excerpt"); ex != nil {
		checkActorStamp(lf, ex, where+".excerpt", "ERF-69", rep, false)
		if !hasNormalized {
			rep.Advisory("ERF-69", lf.Path, ex.Line, where+".excerpt",
				"an `excerpt` stamp is recorded but the source ships no normalized text to have excerpted")
		}
	}
	// ERF-69's own trigger ("A source's normalized text MAY be an excerpt [...]
	// and MUST then record who selected the passage and when") is not
	// machine-decidable: nothing in the record says whether a text is whole or
	// partial. See ambiguities.md A-18.

	// --- pipeline tools (ERF-70) ------------------------------------------
	ext := v.Get("extraction")
	nzn := v.Get("normalization")
	for _, pair := range []struct {
		k string
		v *Val
	}{{"extraction", ext}, {"normalization", nzn}} {
		if pair.v == nil {
			continue
		}
		if !pair.v.IsStr() || strings.TrimSpace(pair.v.Str) == "" {
			rep.Violation("ERF-70", lf.Path, pair.v.Line, where+"."+pair.k, "`%s` must be a non-empty string naming the tool", pair.k)
			continue
		}
		if !reVersionish.MatchString(pair.v.Str) {
			rep.Violation("ERF-70", lf.Path, pair.v.Line, where+"."+pair.k,
				"`%s` must name the tool AND its exact version; %q carries no version token", pair.k, pair.v.Str)
		}
	}

	// --- received (ERF-2, ERF-7, ERF-71) ----------------------------------
	rcv := v.Get("received")
	var rurl, rpath, rdigest, rts *Val
	if rcv != nil {
		if !rcv.IsMap() {
			rep.Violation("ERF-2", lf.Path, rcv.Line, where+".received", "`received` must be a mapping")
		} else {
			for _, k := range rcv.Keys {
				if strings.HasPrefix(k, "x_") {
					continue
				}
				if !receivedFields[k] {
					rep.Violation("ERF-55", lf.Path, rcv.Line, where+".received",
						"field `%s` is not defined for Received by this spec_version", k)
				}
			}
			rurl, rpath, rdigest, rts = rcv.Get("url"), rcv.Get("path"), rcv.Get("digest"), rcv.Get("timestamp")

			if rdigest != nil {
				checkDigestShape(lf, rdigest, where+".received.digest", rep)
			}
			if rurl != nil && rts == nil {
				// ERF-2: "A source whose raw file is mutable at its location,
				// a web page above all, MUST record `received.timestamp`."
				// Mutability is not machine-decidable; a URL is the stated
				// paradigm case. Reported as advisory. See ambiguities.md A-19.
				rep.Advisory("ERF-2", lf.Path, rcv.Line, where+".received",
					"a `received.url` is recorded with no `received.timestamp`; if the raw file is mutable at that location ERF-2 makes the timestamp a MUST, and a validator cannot tell")
			}
			if rpath == nil && rurl == nil {
				rep.Violation("ERF-2", lf.Path, rcv.Line, where+".received",
					"`received` records neither `path` nor `url`, so nothing says where the raw file is or was")
			}
			if rpath == nil && rurl != nil && rdigest == nil {
				rep.Advisory("ERF-2", lf.Path, rcv.Line, where+".received",
					"the corpus does not hold the raw file (`received.path` absent), and ERF-2 says such a corpus holds `received.url` and `received.digest` instead; no digest is recorded")
			}
			if rts != nil {
				if ts := parseTS(rts.StrOr()); ts.Precision == TSInvalid {
					rep.Violation("ERF-2", lf.Path, rts.Line, where+".received.timestamp",
						"`received.timestamp` %q is not a date or an RFC 3339 instant", rts.StrOr())
				}
			}
			// ERF-7: "The retrieved locator is `received.url`, and it names
			// the artifact actually retrieved (the file, not a landing page
			// describing it)". Not machine-decidable.
		}
	}

	// --- normalized_digest (ERF-71) ---------------------------------------
	nzd := v.Get("normalized_digest")
	if nzd != nil {
		checkDigestShape(lf, nzd, where+".normalized_digest", rep)
	}

	// --- the normalized text file itself (ERF-1) --------------------------
	if hasNormalized {
		abs := resolveCorpusPath(c, lf, nz.Str)
		data, err := os.ReadFile(abs)
		if err != nil {
			// ERF-1: "A source's normalized text MUST exist before any check
			// runs against it". Read as: a source that names a path must have
			// the file there. See ambiguities.md A-21.
			rep.Violation("ERF-1", lf.Path, nz.Line, where+".normalized",
				"normalized text %q is named but is not present in the corpus (%v); no quote check against this source can run", nz.Str, err)
		} else {
			if nzd != nil && nzd.IsStr() {
				verifyDigest(lf, nzd, data, where+".normalized_digest", rep)
			}
			e := strings.ToLower(filepath.Ext(nz.Str))
			if !textyExt[e] {
				rep.Info("ERF-51", lf.Path, nz.Line, where+".normalized",
					"normalized text %q does not look like text or markdown; every quote check against this source is reported unavailable", nz.Str)
			}
		}

		// ERF-70 trigger heuristic: normalized text ships and the raw file's
		// extension is a non-text format, so a conversion happened.
		rawName := ""
		if rpath != nil {
			rawName = rpath.StrOr()
		} else if rurl != nil {
			rawName = rurl.StrOr()
		}
		if rawName != "" {
			e := strings.ToLower(filepath.Ext(strings.SplitN(rawName, "?", 2)[0]))
			if binaryRawExt[e] && ext == nil {
				rep.Advisory("ERF-70", lf.Path, v.Line, where,
					"the raw file looks like %s, so normalized text was produced by conversion, and ERF-70 then requires `extraction` naming the tool and version", e)
			}
			if binaryRawExt[e] && nzd == nil && rdigest == nil {
				rep.Advisory("ERF-71", lf.Path, v.Line, where,
					"normalized text is a conversion but neither `received.digest` nor `normalized_digest` is recorded")
			}
		}
	}

	// ERF-7 last clause: "A received file has no retrieval locator, so its
	// source carries no `received`." Nothing in the record marks a source as
	// "received rather than fetched", so this is not checkable either.
}

func checkDigestShape(lf *LoadedFile, d *Val, where string, rep *Report) {
	if !d.IsStr() {
		rep.Violation("ERF-71", lf.Path, d.Line, where, "digest must be a string of the form \"sha256:<hex>\"")
		return
	}
	if !reDigest.MatchString(d.Str) {
		rep.Violation("ERF-71", lf.Path, d.Line, where,
			"digest %q does not have the form \"<algorithm>:<hex>\"", truncate(d.Str, 40))
		return
	}
	if !strings.HasPrefix(d.Str, "sha256:") {
		rep.Advisory("ERF-71", lf.Path, d.Line, where,
			"digest names an algorithm other than sha256; ERF-71 states only the sha256 form")
	}
}

func verifyDigest(lf *LoadedFile, d *Val, data []byte, where string, rep *Report) {
	parts := strings.SplitN(d.Str, ":", 2)
	if len(parts) != 2 || parts[0] != "sha256" {
		return
	}
	sum := sha256.Sum256(data)
	got := hex.EncodeToString(sum[:])
	if !strings.EqualFold(got, parts[1]) {
		rep.Violation("ERF-71", lf.Path, d.Line, where,
			"normalized_digest does not match the file on disk (recorded %s, computed sha256:%s)", truncate(d.Str, 30), got[:16]+"...")
	}
}

// resolveCorpusPath interprets a source's `normalized` / `received.path`.
//
// Ambiguity A-20: the spec never says what these paths are relative to.
// The section 4.1 example writes `normalized/pacioli-1494-geijsbeek.md` and
// `raw/pacioli-1494-geijsbeek.pdf`, which are relative to something, but
// ERF-54 says "no meaning lives in a path" and a corpus "travels as a
// directory or archive of its records and their normalized texts" (ERF-59).
// This implementation tries the corpus root first, then the directory holding
// the source list.
func resolveCorpusPath(c *Corpus, lf *LoadedFile, p string) string {
	if filepath.IsAbs(p) {
		return p
	}
	cand := filepath.Join(c.Root, p)
	if _, err := os.Stat(cand); err == nil {
		return cand
	}
	return filepath.Join(filepath.Dir(lf.AbsPath), p)
}
