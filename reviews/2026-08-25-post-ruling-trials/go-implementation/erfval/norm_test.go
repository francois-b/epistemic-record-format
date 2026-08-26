package main

import "testing"

// Cases derived from the prose of ERF-51 and ERF-52 alone. The spec points at
// `conformance/cases/normalization.txt` and `conformance/cases/quote-check.yaml`
// as normative and says "where a reading of the prose and a case disagree, the
// case governs". Those files were deliberately NOT consulted for this trial,
// so every expectation below is a reading of the prose. Where the prose is
// silent the test records the reading this implementation chose, and
// ambiguities.md says what the alternative would be.
func TestNormalize(t *testing.T) {
	cases := []struct{ name, in, want string }{
		// Step 3: whitespace.
		{"collapse runs", "a   b\n\tc", "a b c"},
		{"trim", "   a b   ", "a b"},
		{"hand wrap becomes one space", "one phrase\nsplit at a column", "one phrase split at a column"},

		// Step 2: emphasis and code markers.
		{"emphasis stripped", "a *however* b", "a however b"},
		{"underscore stripped", "a _however_ b", "a however b"},
		{"backtick stripped", "a `code` b", "a code b"},
		// Chosen reading: the three characters are removed unconditionally.
		// See ambiguities.md A-06.
		{"snake_case is mangled", "source_quality", "sourcequality"},
		{"a literal asterisk in the source is removed", "2 * 3 = 6", "2 3 = 6"},

		// Step 1: NFKC.
		{"ligature decomposed", "ﬁnding", "finding"},
		{"fullwidth folded", "ＡＢ", "AB"},
		{"nbsp becomes a space then collapses", "a b", "a b"},

		// Case is NOT folded.
		{"case preserved", "The Ledger", "The Ledger"},

		// Not folded, deliberately (see the ERF-51 note).
		{"curly quotes survive", "“quoted”", "“quoted”"},
		{"em dash survives", "a — b", "a — b"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := Normalize(c.in); got != c.want {
				t.Errorf("Normalize(%q) = %q, want %q", c.in, got, c.want)
			}
		})
	}
}

func TestCheckQuote(t *testing.T) {
	text := "All the entries that have been made in the day book must be " +
		"entered in the ledger. **All entries** made in the ledger have to " +
		"be double entries -- that is, if you make one creditor, you must " +
		"make some one debtor."

	cases := []struct {
		name  string
		quote string
		want  QuoteResult
	}{
		{"verbatim", "made in the ledger have to be double entries", QuotePass},
		{"across an emphasis marker", "ledger. All entries made in the ledger", QuotePass},
		{"elision spans in order", "All the entries [...] must be entered in the ledger.", QuotePass},
		{"case mismatch fails", "all the entries", QuoteFail},
		{"one word changed fails", "made in the ledger must be double entries", QuoteFail},
		// ERF-52: "A bare `...` and a bare `…` are literal source characters
		// and MUST be matched literally".
		{"bare ellipsis is literal, not a wildcard", "All the entries ... must be entered", QuoteFail},
		{"bare unicode ellipsis is literal", "All the entries … must be entered", QuoteFail},
		// ERF-52: "A quote whose spans are all empty MUST fail rather than
		// trivially pass."
		{"marker alone fails", "[...]", QuoteFail},
		{"two markers alone fail", "[...][...]", QuoteFail},
		{"whitespace-only spans fail", "  [...]  ", QuoteFail},
		// ERF-52: "in order and without overlap".
		{"spans out of order fail", "one debtor[...]All the entries", QuoteFail},
		{"overlapping spans fail", "double entries[...]double entries", QuoteFail},
		// A leading and trailing marker: the empty outer spans impose nothing.
		{"leading and trailing markers", "[...]double entries[...]", QuotePass},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := CheckQuote(c.quote, text)
			if got.Result != c.want {
				t.Errorf("CheckQuote(%q) = %v (%s), want %v", c.quote, got.Result, got.Detail, c.want)
			}
		})
	}
}

// The behaviour that makes ambiguities.md A-03 serious: because each span is
// trimmed independently, a two-span quote can match inside longer words and a
// fabricated sentence passes a check whose whole job is fidelity.
func TestElisionMatchesMidWord(t *testing.T) {
	text := "The catapult was heavy. Someone eventually sat on the mat beside it."
	got := CheckQuote("The cat[...]sat", text)
	if got.Result != QuotePass {
		t.Fatalf("expected the (undesirable) pass that documents A-03, got %v", got.Result)
	}
}

func TestParseBinding(t *testing.T) {
	good := `<!-- claims: no-continuous-claim-check "no test that runs on claims" bound-at=2026-08-23 -->`
	b := parseBinding(good)
	if b.ParseErr != "" {
		t.Fatalf("the spec's own example failed the grammar: %s", b.ParseErr)
	}
	if len(b.IDs) != 1 || b.IDs[0] != "no-continuous-claim-check" {
		t.Errorf("ids = %v", b.IDs)
	}
	if b.Anchor != "no test that runs on claims" {
		t.Errorf("anchor = %q", b.Anchor)
	}
	if b.BoundAt != "2026-08-23" {
		t.Errorf("bound-at = %q", b.BoundAt)
	}

	bad := []struct{ name, in string }{
		{"no bound-at", `<!-- claims: a "b" -->`},
		{"no anchor", `<!-- claims: a bound-at=2026-08-23 -->`},
		{"no ids", `<!-- claims: "b" bound-at=2026-08-23 -->`},
		{"unclosed anchor", `<!-- claims: a "b bound-at=2026-08-23 -->`},
		{"undefined escape", `<!-- claims: a "b\nc" bound-at=2026-08-23 -->`},
		{"date not YYYY-MM-DD", `<!-- claims: a "b" bound-at=23-08-2026 -->`},
		{"trailing junk", `<!-- claims: a "b" bound-at=2026-08-23 extra -->`},
	}
	for _, c := range bad {
		t.Run(c.name, func(t *testing.T) {
			if got := parseBinding(c.in); got.ParseErr == "" {
				t.Errorf("expected a grammar failure for %q", c.in)
			}
		})
	}

	// The two escapes the grammar defines.
	esc := parseBinding(`<!-- claims: a "he said \"no\" and \\ left" bound-at=2026-08-23 -->`)
	if esc.ParseErr != "" {
		t.Fatalf("escapes rejected: %s", esc.ParseErr)
	}
	if esc.Anchor != `he said "no" and \ left` {
		t.Errorf("anchor = %q", esc.Anchor)
	}

	// ambiguities.md A-09: the grammar's `id` admits any non-whitespace,
	// non-quote character, so a comma-separated list parses as ids WITH the
	// commas attached rather than failing the grammar - despite the prose
	// saying ids are "never" separated by commas.
	comma := parseBinding(`<!-- claims: a, b "anchor" bound-at=2026-08-23 -->`)
	if comma.ParseErr != "" {
		t.Fatalf("expected the comma list to PARSE (that is the finding), got %s", comma.ParseErr)
	}
	if comma.IDs[0] != "a," {
		t.Errorf("expected the trailing comma to be part of the id, got %q", comma.IDs[0])
	}
}

func TestIsStale(t *testing.T) {
	d := func(s string) TS { return parseTS(s) }
	cases := []struct {
		name          string
		judge, judged TS
		want          StalenessVerdict
	}{
		{"judged later by days", d("2026-08-01"), d("2026-08-05"), StaleStale},
		{"judged earlier", d("2026-08-05"), d("2026-08-01"), StaleCurrent},
		// ERF-47: "Two bare dates that are equal read as current, because the
		// re-audit that follows an edit lands on the same day."
		{"equal bare dates read current", d("2026-08-01"), d("2026-08-01"), StaleCurrent},
		// ERF-47: "a bare date against a full instant on the same day [...]
		// MUST resolve to stale".
		{"bare date vs instant same day", d("2026-08-01"), d("2026-08-01T09:00:00Z"), StaleStale},
		{"instant vs bare date same day", d("2026-08-01T09:00:00Z"), d("2026-08-01"), StaleStale},
		{"two instants, judged later", d("2026-08-01T09:00:00Z"), d("2026-08-01T10:00:00Z"), StaleStale},
		{"two instants, judged earlier", d("2026-08-01T10:00:00Z"), d("2026-08-01T09:00:00Z"), StaleCurrent},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := isStale(c.judge, c.judged); got != c.want {
				t.Errorf("isStale = %v, want %v", got, c.want)
			}
		})
	}
}

// ERF-65: the YAML 1.2 JSON schema. Everything except null / true / false /
// a JSON number stays a string.
func TestJSONSchemaResolution(t *testing.T) {
	src := `
bare_date: 2026-08-23
bare_instant: 2026-08-23T14:02:00Z
yes_word: yes
no_word: no
octal: 0o14
hex: 0x1f
underscored: 1_000
leading_zero: 012
leading_plus: +1
trailing_dot: 1.
infinity: .inf
real_null: null
real_true: true
real_int: 12
real_float: -1.5e3
`
	v, _, err := parseYAML([]byte(src))
	if err != nil {
		t.Fatal(err)
	}
	mustStr := []string{"bare_date", "bare_instant", "yes_word", "no_word",
		"octal", "hex", "underscored", "leading_zero", "leading_plus",
		"trailing_dot", "infinity"}
	for _, k := range mustStr {
		if got := v.Get(k); !got.IsStr() {
			t.Errorf("%s: kind %v, want a string under the JSON schema", k, got.Kind)
		}
	}
	if v.Get("real_null").Kind != VNull {
		t.Error("null did not resolve to null")
	}
	if v.Get("real_true").Kind != VBool {
		t.Error("true did not resolve to a bool")
	}
	if v.Get("real_int").Kind != VNum || v.Get("real_float").Kind != VNum {
		t.Error("a JSON number did not resolve to a number")
	}
}

// ERF-66: duplicate keys, anchors, aliases and explicit tags are all detected.
func TestStructuralOffences(t *testing.T) {
	src := "a: 1\na: 2\nb: &x hi\nc: *x\nd: !!str 9\n"
	_, st, err := parseYAML([]byte(src))
	if err != nil {
		t.Fatal(err)
	}
	if len(st.DupKeys) != 1 {
		t.Errorf("DupKeys = %v", st.DupKeys)
	}
	if len(st.Anchors) != 1 {
		t.Errorf("Anchors = %v", st.Anchors)
	}
	if len(st.Aliases) != 1 {
		t.Errorf("Aliases = %v", st.Aliases)
	}
	if len(st.Tags) != 1 {
		t.Errorf("Tags = %v", st.Tags)
	}
}

// ERF-41: disposition is computed from each person's newest entry, with
// `withdrawn` discarded.
func TestDisposition(t *testing.T) {
	mk := func(fm string) *Record {
		v, _, err := parseYAML([]byte(fm))
		if err != nil {
			t.Fatal(err)
		}
		return &Record{FM: v}
	}
	none := mk("id: c\n")
	if got := disposition(none); got != DispProposal {
		t.Errorf("no standings = %v, want proposal", got)
	}
	allFor := mk(`
standings:
  - {timestamp: "2026-01-01T00:00:00Z", stance: for, by: "human:a", why: x}
  - {timestamp: "2026-01-01T00:00:00Z", stance: for, by: "human:b", why: x}
`)
	if got := disposition(allFor); got != DispActive {
		t.Errorf("all for = %v, want active", got)
	}
	split := mk(`
standings:
  - {timestamp: "2026-01-01T00:00:00Z", stance: for, by: "human:a", why: x}
  - {timestamp: "2026-01-01T00:00:00Z", stance: against, by: "human:b", why: x}
`)
	if got := disposition(split); got != DispContested {
		t.Errorf("split = %v, want contested", got)
	}
	// A newer entry supersedes the same person's older one.
	flipped := mk(`
standings:
  - {timestamp: "2026-01-01T00:00:00Z", stance: for, by: "human:a", why: x}
  - {timestamp: "2026-02-01T00:00:00Z", stance: against, by: "human:a", why: x}
`)
	if got := disposition(flipped); got != DispRejected {
		t.Errorf("flipped = %v, want rejected", got)
	}
	// Everyone has withdrawn: "nothing remaining means retired".
	gone := mk(`
standings:
  - {timestamp: "2026-01-01T00:00:00Z", stance: for, by: "human:a", why: x}
  - {timestamp: "2026-02-01T00:00:00Z", stance: withdrawn, by: "human:a", why: x}
`)
	if got := disposition(gone); got != DispRetired {
		t.Errorf("all withdrawn = %v, want retired", got)
	}
}
