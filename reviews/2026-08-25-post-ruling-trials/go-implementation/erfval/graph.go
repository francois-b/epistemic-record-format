package main

import "sort"

// ---------------------------------------------------------------------------
// ERF-41: disposition, computed, never stored.
//
//	"from the current stances alone, meaning each person's newest entry. With
//	 no standings at all the disposition is `proposal`. Otherwise discard every
//	 current stance of `withdrawn` [...] nothing remaining means `retired`; all
//	 `for` means `active`; all `against` means `rejected`; both `for` and
//	 `against` remaining means `contested`."
// ---------------------------------------------------------------------------

type Disposition string

const (
	DispProposal  Disposition = "proposal"
	DispActive    Disposition = "active"
	DispContested Disposition = "contested"
	DispRejected  Disposition = "rejected"
	DispRetired   Disposition = "retired"
)

func disposition(r *Record) Disposition {
	entries := r.FM.Get("standings").Items()
	if len(entries) == 0 {
		return DispProposal
	}
	// "each person's newest entry"
	type cur struct {
		ts     TS
		stance string
		order  int
	}
	byPerson := map[string]cur{}
	for i, e := range entries {
		by := e.Get("by").StrOr()
		st := e.Get("stance").StrOr()
		ts := parseTS(e.Get("timestamp").StrOr())
		c, seen := byPerson[by]
		if !seen {
			byPerson[by] = cur{ts, st, i}
			continue
		}
		// Newest wins. Where timestamps do not order (equal, or unparseable),
		// document order breaks the tie: `standings` is append-only (ERF-19,
		// ERF-40), so a later entry in the file is a later entry in the
		// ledger. The spec does not say this. See ambiguities.md A-24.
		if ts.Precision == TSInvalid || c.ts.Precision == TSInvalid {
			if i > c.order {
				byPerson[by] = cur{ts, st, i}
			}
			continue
		}
		if ts.T.After(c.ts.T) || (ts.T.Equal(c.ts.T) && i > c.order) {
			byPerson[by] = cur{ts, st, i}
		}
	}
	nFor, nAgainst := 0, 0
	for _, c := range byPerson {
		switch c.stance {
		case "for":
			nFor++
		case "against":
			nAgainst++
		case "withdrawn":
			// discarded: "withdrawal is exit rather than opposition"
		}
	}
	switch {
	case nFor == 0 && nAgainst == 0:
		return DispRetired
	case nFor > 0 && nAgainst > 0:
		return DispContested
	case nFor > 0:
		return DispActive
	default:
		return DispRejected
	}
}

// ---------------------------------------------------------------------------
// ERF-43 / ERF-24: the premise graph.
//
//	"An argument's premises are the targets of its own outgoing `assumes` edges
//	 together with the claims that carry `supports` edges pointing at it".
//
//	ERF-43: "An argument's premise closure, followed transitively [...] MUST
//	 terminate in non-argument leaves. [...] Self-edges MUST NOT exist;
//	 `assumes` and `decomposes-into` MUST admit no cycles. A validator MUST
//	 flag a closure that terminates in a leaf whose disposition is `retired`."
// ---------------------------------------------------------------------------

type claimGraph struct {
	claims map[string]*Record
	// premises[id] = the premise ids of claim id
	premises map[string][]string
	// assumesOut and decomposesOut are the two relations that must admit no
	// cycles.
	assumesOut    map[string][]string
	decomposesOut map[string][]string
}

func buildGraph(d *Deployment) *claimGraph {
	g := &claimGraph{
		claims:        map[string]*Record{},
		premises:      map[string][]string{},
		assumesOut:    map[string][]string{},
		decomposesOut: map[string][]string{},
	}
	for id, r := range d.ById {
		if r.Type == "claim" {
			g.claims[id] = r
		}
	}
	supportsInto := map[string][]string{}
	for id, r := range g.claims {
		for _, e := range r.FM.Get("edges").Items() {
			to := e.Get("to").StrOr()
			rel := e.Get("relation").StrOr()
			if to == "" {
				continue
			}
			switch rel {
			case "assumes":
				g.assumesOut[id] = append(g.assumesOut[id], to)
			case "decomposes-into":
				g.decomposesOut[id] = append(g.decomposesOut[id], to)
			case "supports":
				supportsInto[to] = append(supportsInto[to], id)
			}
		}
	}
	for id := range g.claims {
		seen := map[string]bool{}
		var ps []string
		for _, p := range append(append([]string{}, g.assumesOut[id]...), supportsInto[id]...) {
			if !seen[p] {
				seen[p] = true
				ps = append(ps, p)
			}
		}
		sort.Strings(ps)
		g.premises[id] = ps
	}
	return g
}

func checkGraph(d *Deployment, rep *Report) {
	g := buildGraph(d)

	// Cycles in `assumes` and in `decomposes-into`.
	detectCycles(g.assumesOut, "assumes", g, rep)
	detectCycles(g.decomposesOut, "decomposes-into", g, rep)

	// `conflicts-with` stored once per pair (ERF-44), across claims.
	seen := map[[2]string]string{}
	for id, r := range g.claims {
		for _, e := range r.FM.Get("edges").Items() {
			if e.Get("relation").StrOr() != "conflicts-with" {
				continue
			}
			to := e.Get("to").StrOr()
			if to == "" {
				continue
			}
			key := [2]string{id, to}
			rev := [2]string{to, id}
			if other, ok := seen[rev]; ok {
				rep.Violation("ERF-44", r.File.Path, e.Line, "edges",
					"`conflicts-with` between `%s` and `%s` is stored twice (the reciprocal is in %s); it MUST be stored once per pair, the reciprocal derived", id, to, other)
			}
			seen[key] = r.File.Path
		}
	}

	// ERF-43 closure + ERF-49 unbacked.
	for id, r := range g.claims {
		kind := r.FM.Get("epistemic_kind").StrOr()
		disp := disposition(r)

		if kind == "argument" {
			leaves := closureLeaves(g, id)
			for _, leaf := range leaves {
				lr := g.claims[leaf]
				if lr == nil {
					continue // unresolved: already reported under ERF-35
				}
				if lr.FM.Get("epistemic_kind").StrOr() == "argument" {
					// A leaf of the closure with no premises of its own that
					// is itself an argument.
					rep.Violation("ERF-43", r.File.Path, r.FM.Line, "edges",
						"the premise closure of argument `%s` terminates in `%s`, which is itself an `argument` with no premises; a closure MUST terminate in non-argument leaves", id, leaf)
				}
				if disposition(lr) == DispRetired {
					rep.Flag("ERF-43", r.File.Path, r.FM.Line, "edges",
						"the premise closure of argument `%s` terminates in leaf `%s`, whose computed disposition is `retired`", id, leaf)
				}
			}
		}

		// ERF-49: "A validator MUST flag as unbacked an `observation` someone
		// stands on with empty `atoms_for` and empty `surveys`, and such an
		// `argument` with no premises".
		//
		// "someone stands on" is read as: the claim carries at least one
		// standing entry. See ambiguities.md A-15.
		if disp == DispProposal {
			continue
		}
		switch kind {
		case "observation":
			nFor := len(r.FM.Get("atoms_for").Items())
			nSurveys := len(r.FM.Get("surveys").Items())
			if nFor == 0 && nSurveys == 0 {
				rep.Flag("ERF-49", r.File.Path, r.FM.Line, "",
					"observation `%s` is stood on (disposition %s) with empty `atoms_for` and empty `surveys`: unbacked", id, disp)
			}
		case "argument":
			if len(g.premises[id]) == 0 {
				rep.Flag("ERF-49", r.File.Path, r.FM.Line, "",
					"argument `%s` is stood on (disposition %s) with no premises: no outgoing `assumes` edge and no incoming `supports` edge", id, disp)
			}
		}
	}
}

// closureLeaves returns the members of the transitive premise closure of id
// that have no premises of their own.
//
// ERF-43: "The closure is what the edges *reach* and does not include the
// argument itself, so an argument with no premises has an empty closure and
// satisfies this rule vacuously".
func closureLeaves(g *claimGraph, root string) []string {
	seen := map[string]bool{}
	var leaves []string
	var walk func(string)
	walk = func(id string) {
		for _, p := range g.premises[id] {
			if seen[p] {
				continue
			}
			seen[p] = true
			if len(g.premises[p]) == 0 {
				leaves = append(leaves, p)
			}
			walk(p)
		}
	}
	walk(root)
	sort.Strings(leaves)
	return leaves
}

func detectCycles(edges map[string][]string, rel string, g *claimGraph, rep *Report) {
	const (
		white = 0
		grey  = 1
		black = 2
	)
	color := map[string]int{}
	var stack []string
	var visit func(string)
	reported := map[string]bool{}
	visit = func(id string) {
		color[id] = grey
		stack = append(stack, id)
		for _, to := range edges[id] {
			switch color[to] {
			case grey:
				// Found a cycle.
				cyc := ""
				for i, s := range stack {
					if s == to {
						cyc = joinArrow(append(append([]string{}, stack[i:]...), to))
						break
					}
				}
				if cyc == "" {
					cyc = joinArrow([]string{id, to})
				}
				if !reported[cyc] {
					reported[cyc] = true
					f := "-"
					if r := g.claims[id]; r != nil {
						f = r.File.Path
					}
					rep.Violation("ERF-43", f, 0, "edges", "`%s` admits no cycles; found %s", rel, cyc)
				}
			case white:
				visit(to)
			}
		}
		stack = stack[:len(stack)-1]
		color[id] = black
	}
	var ids []string
	for id := range g.claims {
		ids = append(ids, id)
	}
	sort.Strings(ids)
	for _, id := range ids {
		if color[id] == white {
			visit(id)
		}
	}
}

func joinArrow(ss []string) string {
	out := ""
	for i, s := range ss {
		if i > 0 {
			out += " -> "
		}
		out += s
	}
	return out
}
