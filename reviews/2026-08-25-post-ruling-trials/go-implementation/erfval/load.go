package main

import (
	"bytes"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"unicode/utf8"
)

// LoadedFile is one file the validator was handed that turned out to carry a
// `type` (ERF-54).
type LoadedFile struct {
	Path     string // path as reported (relative to the corpus root given)
	AbsPath  string
	CorpusRt string // the corpus directory this file was found under
	Type     string
	FM       *Val // frontmatter (or the whole document, for a bare YAML doc)
	Body     string
	BodyLine int // 1-based line in the file where the body starts
	Struct   *yamlStructural
	// HadFrontmatter records the serialization shape actually found:
	// true  = `---` fence, YAML, `---` fence, then a markdown body (ERF-53)
	// false = a bare YAML document with no body
	HadFrontmatter bool
}

type Deployment struct {
	Corpora []*Corpus
	// ById indexes every record in the deployment (ERF-36: ids are
	// deployment-unique regardless of record type).
	ById map[string]*Record
	Rep  *Report
}

type Corpus struct {
	Root        string
	Declaration *LoadedFile
	DeclID      string
	SpecVersion string
	SourceLists []*LoadedFile
	Sources     map[string]*Source
	SourceFile  map[string]string // source id -> file it was declared in
	Records     []*Record
	Narratives  []*LoadedFile
	Files       []*LoadedFile
}

// splitFrontmatter separates an ERF-53 frontmatter block from its body.
//
// Ambiguity A-13: a corpus declaration and a source list are specified as
// "a YAML document under this section's rules" (ERF-59, ERF-3), NOT as
// frontmatter plus body - but a bare YAML document may legally open with the
// `---` document-start marker, which is byte-identical to the opening of a
// frontmatter block. This function calls it frontmatter only when a closing
// `---` or `...` line is also present.
func splitFrontmatter(src string) (fm string, body string, bodyLine int, ok bool) {
	if !strings.HasPrefix(src, "---\n") && src != "---" && !strings.HasPrefix(src, "---\r\n") {
		return "", "", 0, false
	}
	rest := src[len("---"):]
	rest = strings.TrimPrefix(rest, "\r")
	rest = strings.TrimPrefix(rest, "\n")
	lines := strings.Split(rest, "\n")
	for i, ln := range lines {
		t := strings.TrimRight(ln, "\r")
		if t == "---" || t == "..." {
			fm = strings.Join(lines[:i], "\n")
			body = strings.Join(lines[i+1:], "\n")
			// line 1 = "---", lines 2..i+1 = fm, line i+2 = closing fence
			return fm, body, i + 3, true
		}
	}
	return "", "", 0, false
}

func loadCorpus(root string, rep *Report) *Corpus {
	c := &Corpus{
		Root:       root,
		Sources:    map[string]*Source{},
		SourceFile: map[string]string{},
	}

	_ = filepath.WalkDir(root, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			rep.Info("-", p, 0, "", "could not read: %v", err)
			return nil
		}
		if d.IsDir() {
			base := d.Name()
			// .git is substrate machinery, not corpus content.
			if base == ".git" {
				return filepath.SkipDir
			}
			return nil
		}
		rel, _ := filepath.Rel(root, p)
		loadFile(c, p, rel, rep)
		return nil
	})
	return c
}

func loadFile(c *Corpus, abs, rel string, rep *Report) {
	raw, err := os.ReadFile(abs)
	if err != nil {
		rep.Info("-", rel, 0, "", "could not read: %v", err)
		return
	}

	// ERF-54: "A file carrying no `type` is not part of the corpus; a consumer
	// MUST ignore it and MUST report that it did (ERF-57)."
	if !utf8.Valid(raw) {
		rep.Info("ERF-54", rel, 0, "", "not valid UTF-8; carries no readable `type`, so it is not part of the corpus and was ignored")
		return
	}
	src := string(raw)

	fmText, body, bodyLine, hadFM := splitFrontmatter(src)
	yamlSrc := fmText
	if !hadFM {
		yamlSrc = src
		bodyLine = 0
	}

	val, st, perr := parseYAML([]byte(yamlSrc))
	if perr != nil {
		// A file that will not parse as YAML at all cannot state a `type`.
		// Reported as ignored, per ERF-54, but with the parse error attached,
		// because silently ignoring a broken record file is exactly the
		// failure mode ERF-31's "reported, never skipped" is about.
		rep.Info("ERF-54", rel, 0, "", "does not parse as YAML, so it states no `type` and was ignored (%v)", firstLine(perr.Error()))
		return
	}
	if !val.IsMap() {
		rep.Info("ERF-54", rel, 0, "", "top level is not a mapping, so it states no `type` and was ignored")
		return
	}
	tv := val.Get("type")
	if tv == nil {
		rep.Info("ERF-54", rel, 0, "", "carries no `type`; ignored and reported, per ERF-54")
		return
	}
	if !tv.IsStr() {
		rep.Violation("ERF-54", rel, tv.Line, "type", "`type` must be a string naming what the file holds")
		return
	}

	lf := &LoadedFile{
		Path: rel, AbsPath: abs, CorpusRt: c.Root,
		Type: tv.Str, FM: val, Body: body, BodyLine: bodyLine,
		Struct: st, HadFrontmatter: hadFM,
	}
	c.Files = append(c.Files, lf)

	checkFileEncoding(rel, raw, rep)
	checkYAMLStructural(lf, rep)
}

func firstLine(s string) string {
	if i := strings.IndexByte(s, '\n'); i >= 0 {
		return s[:i]
	}
	return s
}

// ERF-67: "a file MUST be UTF-8 encoded with LF line endings and no
// byte-order mark."
func checkFileEncoding(rel string, raw []byte, rep *Report) {
	if bytes.HasPrefix(raw, []byte{0xEF, 0xBB, 0xBF}) {
		rep.Violation("ERF-67", rel, 1, "", "file begins with a UTF-8 byte-order mark")
	}
	if i := bytes.IndexByte(raw, '\r'); i >= 0 {
		line := bytes.Count(raw[:i], []byte("\n")) + 1
		rep.Violation("ERF-67", rel, line, "", "file contains a CR byte; line endings must be LF")
	}
}

// ERF-66: "A record's frontmatter MUST NOT contain a duplicate key, an
// anchor, an alias, or an explicit tag."
//
// Ambiguity A-08: ERF-66 says "a record's frontmatter". The corpus
// declaration and the source list are explicitly NOT records (section 3
// comment, ERF-3). Read literally, a source list may carry duplicate keys -
// which is precisely where a duplicate would do the most damage, since source
// ids are mapping keys. This implementation applies ERF-66 to every typed
// file and reports the declaration/source-list cases under ERF-66 anyway.
func checkYAMLStructural(lf *LoadedFile, rep *Report) {
	for _, d := range lf.Struct.DupKeys {
		rep.Violation("ERF-66", lf.Path, 0, "", "duplicate key %s", d)
	}
	for _, a := range lf.Struct.Anchors {
		rep.Violation("ERF-66", lf.Path, 0, "", "YAML anchor %s", a)
	}
	for _, a := range lf.Struct.Aliases {
		rep.Violation("ERF-66", lf.Path, 0, "", "YAML alias %s", a)
	}
	for _, t := range lf.Struct.Tags {
		rep.Violation("ERF-66", lf.Path, 0, "", "explicit YAML tag %s", t)
	}
	for _, cz := range lf.Struct.Coerced {
		rep.Info("ERF-65", lf.Path, 0, "",
			"scalar %s - resolved as a string here, but a parser on a wider schema would not agree; quote it", cz)
	}
}
