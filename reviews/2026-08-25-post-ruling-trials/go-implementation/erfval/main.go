// erfval - a conformance validator for the Epistemic Record Format v0.9
// (draft), written cold from SPEC-as-tried.md and from nothing else.
//
// Usage:
//
//	erfval [flags] <corpus-dir> [<corpus-dir> ...]
//
// Every directory given is one corpus. The union of them is the deployment,
// which is the scope for ERF-36 / ERF-38 id uniqueness and for ERF-35
// reference resolution. The specification never says how a validator is
// handed a deployment; see ambiguities.md A-25.
package main

import (
	"flag"
	"fmt"
	"os"
)

func main() {
	var (
		jsonOut  = flag.Bool("json", false, "emit findings as JSON")
		showInfo = flag.Bool("info", false, "include INFO findings (unrecognized files/fields, unavailable checks)")
		passage  = flag.String("passage", "since-previous",
			"how a narrative binding's passage is delimited: since-previous | paragraph | document (the spec does not define this; see ambiguities.md A-02)")
	)
	flag.Usage = func() {
		fmt.Fprintf(os.Stderr, "usage: erfval [flags] <corpus-dir> [<corpus-dir> ...]\n\n")
		flag.PrintDefaults()
	}
	flag.Parse()
	if flag.NArg() == 0 {
		flag.Usage()
		os.Exit(2)
	}

	var mode PassageMode
	switch *passage {
	case "since-previous":
		mode = PassageSincePrevious
	case "paragraph":
		mode = PassageParagraph
	case "document":
		mode = PassageDocument
	default:
		fmt.Fprintf(os.Stderr, "erfval: unknown -passage mode %q\n", *passage)
		os.Exit(2)
	}

	rep := &Report{}
	d := &Deployment{ById: map[string]*Record{}, Rep: rep}

	// Pass 1: load every corpus, read the declarations.
	for _, root := range flag.Args() {
		st, err := os.Stat(root)
		if err != nil || !st.IsDir() {
			fmt.Fprintf(os.Stderr, "erfval: %s is not a directory\n", root)
			os.Exit(2)
		}
		c := loadCorpus(root, rep)
		checkDeclaration(c, rep)
		d.Corpora = append(d.Corpora, c)
	}

	// Pass 2: intake records so that ids resolve across the whole deployment
	// before any reference is checked (ERF-35, ERF-36).
	for _, c := range d.Corpora {
		intakeRecords(d, c, rep)
	}

	// Pass 3: source lists, then per-record checks, then the graph.
	for _, c := range d.Corpora {
		checkSourceLists(c, rep)
	}
	for _, c := range d.Corpora {
		for _, r := range c.Records {
			switch r.Type {
			case "atom":
				checkAtom(d, c, r, rep)
			case "claim":
				checkClaim(d, c, r, rep)
			case "survey":
				checkSurvey(d, c, r, rep)
			}
		}
	}
	checkGraph(d, rep)
	for _, c := range d.Corpora {
		checkNarratives(d, c, mode, rep)
	}

	minSev := SevAdvisory
	if *showInfo {
		minSev = SevInfo
	}
	if *jsonOut {
		rep.PrintJSON(os.Stdout)
	} else {
		rep.Print(os.Stdout, minSev)
	}
	if rep.Count(SevViolation) > 0 {
		os.Exit(1)
	}
}
