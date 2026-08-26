package main

import (
	"strings"
	"unicode"
)

// ---------------------------------------------------------------------------
// SCOPE AREA 2: narrative bindings.
// ERF-31 (grammar, recognition, anchor), ERF-32 (staleness), ERF-33
// (unresolved id), ERF-34 (the narrative document), ERF-47 (staleness rule).
//
// The grammar as given in ERF-31:
//
//   narrative-binding ::= "<!--" ws* "claims:" ws+ ids ws+ anchor
//                         ws+ "bound-at=" date ws* "-->"
//   date     ::= YYYY "-" MM "-" DD
//   ids      ::= id (ws+ id)*
//   id       ::= one or more characters, none of them whitespace or '"'
//   anchor   ::= '"' char* '"'
//   char     ::= any character other than '"' and '\', or one of the
//                two-character escapes '\"' and '\\'
//
// `ws` is never defined. This implementation takes it to be any Unicode
// whitespace, which lets a binding span lines. See ambiguities.md A-28.
// ---------------------------------------------------------------------------

type Binding struct {
	File     string
	Raw      string // the whole comment, `<!--` .. `-->`
	Start    int    // byte offset of `<!--` in the body
	End      int    // byte offset just past `-->`
	Line     int
	IDs      []string
	Anchor   string // unescaped
	BoundAt  string
	ParseErr string // non-empty if the comment failed the grammar
	Passage  string
}

// findComments returns every HTML comment in the body, using the HTML rule
// that a comment ends at the first `-->`.
func findComments(body string) []struct{ start, end int } {
	var out []struct{ start, end int }
	i := 0
	for {
		s := strings.Index(body[i:], "<!--")
		if s < 0 {
			return out
		}
		s += i
		e := strings.Index(body[s+4:], "-->")
		if e < 0 {
			// An unterminated comment. Everything to end of file is the
			// comment under the HTML rules.
			out = append(out, struct{ start, end int }{s, len(body)})
			return out
		}
		e = s + 4 + e + 3
		out = append(out, struct{ start, end int }{s, e})
		i = e
	}
}

// isRecognizedBinding implements ERF-31's recognition rule, which is
// deliberately looser than the grammar: "A comment opening `<!--` followed by
// `claims:` IS a narrative binding: recognizing one and validating one are
// separate acts, and a consumer performs them in that order."
func isRecognizedBinding(comment string) bool {
	if !strings.HasPrefix(comment, "<!--") {
		return false
	}
	rest := strings.TrimLeftFunc(comment[4:], unicode.IsSpace)
	return strings.HasPrefix(rest, "claims:")
}

// parseBinding validates a recognized comment against the ERF-31 grammar.
func parseBinding(comment string) *Binding {
	b := &Binding{Raw: comment}

	if !strings.HasSuffix(comment, "-->") {
		b.ParseErr = "comment is not terminated by `-->`"
		return b
	}
	inner := comment[4 : len(comment)-3]

	// "<!--" ws* "claims:"
	p := 0
	for p < len(inner) && isWS(rune(inner[p])) {
		p++
	}
	if !strings.HasPrefix(inner[p:], "claims:") {
		b.ParseErr = "does not open `claims:`"
		return b
	}
	p += len("claims:")

	// ws+ before the first id
	n := skipWS(inner, p)
	if n == p {
		b.ParseErr = "no whitespace after `claims:` (grammar requires ws+)"
		return b
	}
	p = n

	// ids ::= id (ws+ id)*, terminated by the anchor's opening quote.
	// An id may contain no whitespace and no '"', so the first '"' after the
	// ids is unambiguously the anchor's opening delimiter.
	for {
		if p >= len(inner) {
			b.ParseErr = "ends after the ids: no anchor and no `bound-at=`"
			return b
		}
		if inner[p] == '"' {
			break
		}
		start := p
		for p < len(inner) && !isWS(rune(inner[p])) && inner[p] != '"' {
			p++
		}
		if p == start {
			b.ParseErr = "empty id token"
			return b
		}
		b.IDs = append(b.IDs, inner[start:p])
		n := skipWS(inner, p)
		if n == p && p < len(inner) && inner[p] != '"' {
			b.ParseErr = "id runs straight into the anchor with no whitespace between"
			return b
		}
		if n == p && p < len(inner) && inner[p] == '"' {
			b.ParseErr = "no whitespace between the last id and the anchor (grammar requires ws+)"
			return b
		}
		p = n
	}
	if len(b.IDs) == 0 {
		b.ParseErr = "no claim ids before the anchor (grammar requires at least one)"
		return b
	}

	// anchor ::= '"' char* '"'
	p++ // consume opening quote
	var sb strings.Builder
	closed := false
	for p < len(inner) {
		c := inner[p]
		if c == '"' {
			closed = true
			p++
			break
		}
		if c == '\\' {
			if p+1 >= len(inner) {
				b.ParseErr = "anchor ends with a dangling backslash"
				return b
			}
			nx := inner[p+1]
			if nx != '"' && nx != '\\' {
				b.ParseErr = "anchor contains `\\" + string(nx) + "`; the only escapes the grammar defines are `\\\"` and `\\\\`"
				return b
			}
			sb.WriteByte(nx)
			p += 2
			continue
		}
		sb.WriteByte(c)
		p++
	}
	if !closed {
		b.ParseErr = "anchor is not closed by an unescaped `\"`"
		return b
	}
	b.Anchor = sb.String()

	// ws+ "bound-at=" date ws* (end)
	n = skipWS(inner, p)
	if n == p {
		b.ParseErr = "no whitespace between the anchor and `bound-at=` (grammar requires ws+)"
		return b
	}
	p = n
	if !strings.HasPrefix(inner[p:], "bound-at=") {
		b.ParseErr = "expected `bound-at=` after the anchor, found " + shortRest(inner[p:])
		return b
	}
	p += len("bound-at=")
	dstart := p
	for p < len(inner) && !isWS(rune(inner[p])) {
		p++
	}
	b.BoundAt = inner[dstart:p]
	if !reDate.MatchString(b.BoundAt) {
		b.ParseErr = "`bound-at=" + truncate(b.BoundAt, 30) + "` is not a YYYY-MM-DD date"
		return b
	}
	// ws* then end of the comment
	p = skipWS(inner, p)
	if p != len(inner) {
		b.ParseErr = "trailing content after the date: " + shortRest(inner[p:])
		return b
	}
	return b
}

func isWS(r rune) bool { return unicode.IsSpace(r) }

func skipWS(s string, i int) int {
	for i < len(s) && isWS(rune(s[i])) {
		i++
	}
	return i
}

func shortRest(s string) string {
	s = strings.TrimSpace(s)
	return "`" + truncate(s, 30) + "`"
}

// PassageMode selects how a binding's "passage" is delimited. The spec never
// defines it. See ambiguities.md A-02.
type PassageMode int

const (
	// PassageSincePrevious: the passage runs from the end of the previous
	// recognized narrative binding (or the start of the body) to the start of
	// this one. This implementation's default.
	PassageSincePrevious PassageMode = iota
	// PassageParagraph: the passage is the last blank-line-delimited block
	// before the binding.
	PassageParagraph
	// PassageDocument: the passage is the whole body.
	PassageDocument
)

func passageFor(body string, comments []struct{ start, end int }, idx int, recognized []bool, mode PassageMode) string {
	c := comments[idx]
	switch mode {
	case PassageDocument:
		return body
	case PassageParagraph:
		pre := body[:c.start]
		pre = strings.TrimRight(pre, " \t\n")
		if i := strings.LastIndex(pre, "\n\n"); i >= 0 {
			return pre[i+2:]
		}
		return pre
	default:
		start := 0
		for j := idx - 1; j >= 0; j-- {
			if recognized[j] {
				start = comments[j].end
				break
			}
		}
		return body[start:c.start]
	}
}

func checkNarratives(d *Deployment, c *Corpus, mode PassageMode, rep *Report) {
	for _, lf := range c.Files {
		if lf.Type != "narrative" {
			// A binding-shaped comment in a record body is territory the spec
			// does not describe. See ambiguities.md A-28.
			if lf.Type == "claim" || lf.Type == "survey" {
				for _, cm := range findComments(lf.Body) {
					if isRecognizedBinding(lf.Body[cm.start:cm.end]) {
						rep.Info("ERF-31", lf.Path, lineOf(lf, cm.start), "",
							"a narrative binding appears in the body of a `%s` record; ERF-31 places bindings in narratives and states no rule for one here, so it was recognized but not validated", lf.Type)
					}
				}
			}
			continue
		}
		checkNarrativeDoc(d, c, lf, mode, rep)
	}
}

func lineOf(lf *LoadedFile, off int) int {
	base := lf.BodyLine
	if base == 0 {
		base = 1
	}
	return base + strings.Count(lf.Body[:off], "\n")
}

// ERF-34: "It carries frontmatter with `type: narrative` [...] plus `title`, a
// string; `corpus`, the id of the corpus it belongs to; and `created`, the
// `{timestamp, by}` stamp every other created thing in this format carries."
func checkNarrativeDoc(d *Deployment, c *Corpus, lf *LoadedFile, mode PassageMode, rep *Report) {
	if !lf.HadFrontmatter {
		rep.Violation("ERF-34", lf.Path, 1, "",
			"a narrative carries frontmatter and prose; this file is a bare YAML document with no body")
	}
	for _, k := range lf.FM.Keys {
		if strings.HasPrefix(k, "x_") {
			continue
		}
		if !knownFields["narrative"][k] {
			rep.Violation("ERF-55", lf.Path, lf.FM.Line, "", "field `%s` is not defined for a narrative (ERF-34 names type, title, corpus, created)", k)
		}
	}
	if t := lf.FM.Get("title"); t == nil || !t.IsStr() || strings.TrimSpace(t.Str) == "" {
		rep.Violation("ERF-34", lf.Path, lf.FM.Line, "title", "a narrative MUST carry `title`, a string")
	}
	cid := lf.FM.Get("corpus")
	if cid == nil || !cid.IsStr() || strings.TrimSpace(cid.Str) == "" {
		rep.Violation("ERF-34", lf.Path, lf.FM.Line, "corpus", "a narrative MUST carry `corpus`, the id of the corpus it belongs to")
	} else if !d.corpusDeclared(cid.Str) {
		rep.Violation("ERF-34", lf.Path, cid.Line, "corpus", "`corpus: %s` names no declared corpus in the deployment", cid.Str)
	}
	cr := lf.FM.Get("created")
	if cr == nil {
		rep.Violation("ERF-34", lf.Path, lf.FM.Line, "created", "a narrative MUST carry `created`, the {timestamp, by} stamp")
	} else {
		checkActorStamp(lf, cr, "created", "ERF-34", rep, false)
	}

	comments := findComments(lf.Body)
	recognized := make([]bool, len(comments))
	for i, cm := range comments {
		recognized[i] = isRecognizedBinding(lf.Body[cm.start:cm.end])
	}

	for i, cm := range comments {
		if !recognized[i] {
			continue
		}
		raw := lf.Body[cm.start:cm.end]
		line := lineOf(lf, cm.start)
		b := parseBinding(raw)
		b.File = lf.Path
		b.Line = line
		b.Start, b.End = cm.start, cm.end

		if b.ParseErr != "" {
			// ERF-31: "A binding that does not match this grammar MUST be
			// reported, never skipped."
			rep.Violation("ERF-31", lf.Path, line, "",
				"narrative binding does not match the grammar: %s -- in %s", b.ParseErr, truncate(collapse(raw), 90))
			// The specific case where HTML and the grammar disagree.
			if strings.Contains(raw, "\"") && !strings.HasSuffix(strings.TrimSpace(raw), "-->") {
				rep.Info("ERF-31", lf.Path, line, "",
					"note: an HTML comment ends at the first `-->`, but the ERF-31 grammar lets an anchor contain that sequence; such an anchor is unwritable")
			}
			continue
		}

		b.Passage = passageFor(lf.Body, comments, i, recognized, mode)

		// ERF-31: "The anchor occurs in its passage under ERF-51 [...]
		// A validator MUST flag an anchor that does not occur in its passage."
		if Normalize(b.Anchor) == "" {
			rep.Flag("ERF-31", lf.Path, line, "", "anchor is empty after ERF-51 normalization, so it can pin nothing")
		} else if !strings.Contains(Normalize(b.Passage), Normalize(b.Anchor)) {
			rep.Flag("ERF-31", lf.Path, line, "",
				"anchor %q does not occur in its passage under ERF-51; the prose has probably been edited", truncate(b.Anchor, 70))
		}

		// ERF-33 + ERF-32.
		bound := parseTS(b.BoundAt)
		for _, id := range b.IDs {
			rec, ok := d.ById[id]
			if !ok {
				// ERF-33: "A consumer encountering a narrative binding whose
				// id resolves to no record MUST report it and MUST NOT drop
				// it silently."
				rep.Violation("ERF-33", lf.Path, line, "",
					"narrative binding names `%s`, which resolves to no record in the deployment", id)
				rep.Flag("ERF-32", lf.Path, line, "",
					"staleness of the binding on `%s` is indeterminate: the comparison cannot be run against a record that does not resolve", id)
				continue
			}
			if rec.Type != "claim" {
				// `claims:` names claims. The spec says only "resolves to no
				// record". See ambiguities.md A-28.
				rep.Advisory("ERF-33", lf.Path, line, "",
					"narrative binding names `%s` under `claims:`, but that id is a `%s`, not a claim", id, rec.Type)
			}
			lm := rec.FM.Get("last_modified")
			if lm == nil {
				continue // never edited since minting: not stale
			}
			lmts := stampTS(lm)
			if bound.Precision == TSInvalid || lmts.Precision == TSInvalid {
				rep.Flag("ERF-32", lf.Path, line, "",
					"staleness of the binding on `%s` is indeterminate: a timestamp will not parse (bound-at=%q, last_modified=%q)", id, b.BoundAt, lmts.Raw)
				continue
			}
			switch isStale(bound, lmts) {
			case StaleStale:
				rep.Flag("ERF-32", lf.Path, line, "",
					"narrative binding on `%s` is stale: the claim's last_modified (%s) is later than bound-at=%s", id, lmts.Raw, b.BoundAt)
			case StaleIndeterminate:
				rep.Flag("ERF-32", lf.Path, line, "",
					"narrative binding on `%s` has indeterminate staleness", id)
			}
		}
	}
}

func collapse(s string) string { return strings.Join(strings.Fields(s), " ") }

func stampTS(stamp *Val) TS {
	if stamp == nil {
		return TS{Precision: TSInvalid}
	}
	if stamp.IsMap() {
		return parseTS(stamp.Get("timestamp").StrOr())
	}
	return TS{Precision: TSInvalid}
}
