package main

import (
	"encoding/json"
	"fmt"
	"os"
	"sort"
	"strings"
)

// Severity separates the four kinds of thing this validator can say.
//
// The specification names two explicitly (section 2, "A flag is not a
// violation"). It does not name a category for a breached SHOULD, nor for
// a check that could not be run at all, and both arise constantly. See
// ambiguities.md, A-29.
type Severity int

const (
	// SevViolation: a machine-checkable MUST was breached. The corpus does
	// not conform.
	SevViolation Severity = iota
	// SevFlag: a condition the spec explicitly directs a validator to FLAG
	// (ERF-31 anchor, ERF-32/47 staleness, ERF-35 past-state reference,
	// ERF-43 retired leaf, ERF-49 unbacked). A corpus carrying flags and no
	// violations conforms.
	SevFlag
	// SevAdvisory: a SHOULD was breached, or a MUST whose trigger condition
	// is not machine-decidable was breached under a stated heuristic.
	SevAdvisory
	// SevInfo: something the validator did not recognize (ERF-57), or a
	// check it could not run (ERF-51 "report the check as unavailable").
	SevInfo
)

func (s Severity) String() string {
	switch s {
	case SevViolation:
		return "VIOLATION"
	case SevFlag:
		return "FLAG"
	case SevAdvisory:
		return "ADVISORY"
	default:
		return "INFO"
	}
}

type Finding struct {
	Severity Severity `json:"severity"`
	Req      string   `json:"requirement"`
	File     string   `json:"file"`
	Line     int      `json:"line,omitempty"`
	Where    string   `json:"where,omitempty"`
	Message  string   `json:"message"`
}

type Report struct {
	Findings []Finding
}

func (r *Report) add(sev Severity, req, file string, line int, where, format string, args ...interface{}) {
	r.Findings = append(r.Findings, Finding{
		Severity: sev,
		Req:      req,
		File:     file,
		Line:     line,
		Where:    where,
		Message:  fmt.Sprintf(format, args...),
	})
}

func (r *Report) Violation(req, file string, line int, where, format string, args ...interface{}) {
	r.add(SevViolation, req, file, line, where, format, args...)
}
func (r *Report) Flag(req, file string, line int, where, format string, args ...interface{}) {
	r.add(SevFlag, req, file, line, where, format, args...)
}
func (r *Report) Advisory(req, file string, line int, where, format string, args ...interface{}) {
	r.add(SevAdvisory, req, file, line, where, format, args...)
}
func (r *Report) Info(req, file string, line int, where, format string, args ...interface{}) {
	r.add(SevInfo, req, file, line, where, format, args...)
}

func (r *Report) Count(sev Severity) int {
	n := 0
	for _, f := range r.Findings {
		if f.Severity == sev {
			n++
		}
	}
	return n
}

func (r *Report) sorted() []Finding {
	out := append([]Finding(nil), r.Findings...)
	sort.SliceStable(out, func(i, j int) bool {
		if out[i].Severity != out[j].Severity {
			return out[i].Severity < out[j].Severity
		}
		if out[i].File != out[j].File {
			return out[i].File < out[j].File
		}
		return out[i].Line < out[j].Line
	})
	return out
}

func (r *Report) Print(w *os.File, minSev Severity) {
	byS := map[Severity][]Finding{}
	for _, f := range r.sorted() {
		byS[f.Severity] = append(byS[f.Severity], f)
	}
	for _, sev := range []Severity{SevViolation, SevFlag, SevAdvisory, SevInfo} {
		if sev > minSev {
			continue
		}
		fs := byS[sev]
		if len(fs) == 0 {
			continue
		}
		fmt.Fprintf(w, "\n%s (%d)\n%s\n", sev, len(fs), strings.Repeat("-", 60))
		for _, f := range fs {
			loc := f.File
			if f.Line > 0 {
				loc = fmt.Sprintf("%s:%d", f.File, f.Line)
			}
			if f.Where != "" {
				loc = loc + " [" + f.Where + "]"
			}
			fmt.Fprintf(w, "  %-8s %s\n           %s\n", f.Req, loc, f.Message)
		}
	}
	fmt.Fprintf(w, "\n%s\nsummary: %d violation(s), %d flag(s), %d advisory, %d info\n",
		strings.Repeat("=", 60),
		r.Count(SevViolation), r.Count(SevFlag), r.Count(SevAdvisory), r.Count(SevInfo))
	if r.Count(SevViolation) == 0 {
		fmt.Fprintf(w, "verdict: CONFORMS (a corpus carrying flags and no violations conforms - section 2)\n")
	} else {
		fmt.Fprintf(w, "verdict: DOES NOT CONFORM\n")
	}
}

func (r *Report) PrintJSON(w *os.File) {
	type out struct {
		Findings []struct {
			Severity string `json:"severity"`
			Req      string `json:"requirement"`
			File     string `json:"file"`
			Line     int    `json:"line,omitempty"`
			Where    string `json:"where,omitempty"`
			Message  string `json:"message"`
		} `json:"findings"`
		Violations int  `json:"violations"`
		Flags      int  `json:"flags"`
		Advisories int  `json:"advisories"`
		Infos      int  `json:"infos"`
		Conforms   bool `json:"conforms"`
	}
	var o out
	for _, f := range r.sorted() {
		o.Findings = append(o.Findings, struct {
			Severity string `json:"severity"`
			Req      string `json:"requirement"`
			File     string `json:"file"`
			Line     int    `json:"line,omitempty"`
			Where    string `json:"where,omitempty"`
			Message  string `json:"message"`
		}{f.Severity.String(), f.Req, f.File, f.Line, f.Where, f.Message})
	}
	o.Violations = r.Count(SevViolation)
	o.Flags = r.Count(SevFlag)
	o.Advisories = r.Count(SevAdvisory)
	o.Infos = r.Count(SevInfo)
	o.Conforms = o.Violations == 0
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	_ = enc.Encode(o)
}
