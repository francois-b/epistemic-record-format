package main

import (
	"fmt"
	"regexp"
	"strconv"

	"gopkg.in/yaml.v3"
)

// ---------------------------------------------------------------------------
// ERF-65: "Frontmatter MUST parse under YAML 1.2 using the JSON schema, the
// narrowest of the three the specification defines. Under it only `null`, the
// literals `true` and `false`, and JSON's own number grammar resolve to
// non-string scalars; everything else stays a string."
//
// gopkg.in/yaml.v3 does NOT implement the JSON schema. Empirically (probe run
// 2026-08-25) it resolves ALL of the following to non-string scalars:
//
//     2026-08-23            -> !!timestamp   (the exact hazard ERF-65 names)
//     2026-08-23T14:02:00Z  -> !!timestamp
//     0o14, 0x1f, 1_000     -> !!int
//     012 (leading zero)    -> !!int
//     +1  (leading plus)    -> !!int
//     1.  (trailing dot)    -> !!float
//     .inf                  -> !!float
//
// None of those is a JSON number, and !!timestamp is not in any YAML 1.2
// schema at all - it is a YAML 1.1 survival. So this file does not use
// yaml.v3's resolution: it decodes to a *yaml.Node tree and re-resolves every
// plain scalar under the JSON schema by hand. See ambiguities.md A-07.
// ---------------------------------------------------------------------------

type ValKind int

const (
	VNull ValKind = iota
	VBool
	VNum
	VStr
	VSeq
	VMap
)

type Val struct {
	Kind ValKind
	Str  string
	Num  float64
	Bool bool
	Seq  []*Val
	Map  map[string]*Val
	Keys []string // insertion order, deduplicated (last wins)
	Line int
	Col  int
	// Quoted records whether the source scalar was written with quotes.
	// Needed only for diagnostics.
	Quoted bool
}

func (v *Val) IsNull() bool { return v == nil || v.Kind == VNull }

func (v *Val) Get(k string) *Val {
	if v == nil || v.Kind != VMap {
		return nil
	}
	return v.Map[k]
}

// StrOr returns the string value, or "" for anything that is not a string.
// Deliberately does NOT coerce: under ERF-65 a value that should be a string
// and is not is itself a finding, reported by the caller.
func (v *Val) StrOr() string {
	if v == nil || v.Kind != VStr {
		return ""
	}
	return v.Str
}

func (v *Val) IsStr() bool { return v != nil && v.Kind == VStr }
func (v *Val) IsSeq() bool { return v != nil && v.Kind == VSeq }
func (v *Val) IsMap() bool { return v != nil && v.Kind == VMap }

func (v *Val) Items() []*Val {
	if v == nil || v.Kind != VSeq {
		return nil
	}
	return v.Seq
}

// jsonNumber is JSON's own number grammar (RFC 8259 section 6), which is what
// ERF-65 points at. Note what it excludes: leading '+', leading zeros, a bare
// trailing '.', hex/octal/binary, underscores, Inf and NaN.
var jsonNumber = regexp.MustCompile(`^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][-+]?[0-9]+)?$`)

// yamlStructural collects the ERF-66 offences and the ERF-65 near-misses found
// while resolving a node tree.
type yamlStructural struct {
	DupKeys []string // "key (line N, first at line M)"
	Anchors []string
	Aliases []string
	Tags    []string
	// Coerced lists plain scalars that yaml.v3 resolved to a non-string type
	// but that the JSON schema keeps as a string. Under ERF-65 the JSON
	// schema governs, so these are silently corrected - but they are exactly
	// where a naive implementation in another language would diverge, so they
	// are recorded.
	Coerced []string
}

func resolveDoc(root *yaml.Node, st *yamlStructural) *Val {
	if root == nil {
		return nil
	}
	if root.Kind == yaml.DocumentNode {
		if len(root.Content) == 0 {
			return &Val{Kind: VNull, Line: root.Line}
		}
		return resolveNode(root.Content[0], st, map[string]*yaml.Node{})
	}
	return resolveNode(root, st, map[string]*yaml.Node{})
}

func resolveNode(n *yaml.Node, st *yamlStructural, anchors map[string]*yaml.Node) *Val {
	if n == nil {
		return nil
	}
	if n.Anchor != "" {
		// Record each anchor once. Resolving an alias walks back into the
		// anchored node, which would otherwise report it a second time.
		if _, seen := anchors[n.Anchor]; !seen {
			st.Anchors = append(st.Anchors, fmt.Sprintf("&%s (line %d)", n.Anchor, n.Line))
		}
		anchors[n.Anchor] = n
	}
	switch n.Kind {
	case yaml.AliasNode:
		st.Aliases = append(st.Aliases, fmt.Sprintf("*%s (line %d)", n.Value, n.Line))
		if n.Alias != nil {
			return resolveNode(n.Alias, st, anchors)
		}
		return &Val{Kind: VNull, Line: n.Line}

	case yaml.MappingNode:
		v := &Val{Kind: VMap, Map: map[string]*Val{}, Line: n.Line, Col: n.Column}
		seen := map[string]int{}
		for i := 0; i+1 < len(n.Content); i += 2 {
			kn, vn := n.Content[i], n.Content[i+1]
			noteTag(kn, st)
			key := kn.Value
			if prev, dup := seen[key]; dup {
				st.DupKeys = append(st.DupKeys,
					fmt.Sprintf("%q (line %d, first at line %d)", key, kn.Line, prev))
			} else {
				v.Keys = append(v.Keys, key)
			}
			seen[key] = kn.Line
			v.Map[key] = resolveNode(vn, st, anchors) // last duplicate wins
		}
		return v

	case yaml.SequenceNode:
		v := &Val{Kind: VSeq, Line: n.Line, Col: n.Column}
		for _, c := range n.Content {
			v.Seq = append(v.Seq, resolveNode(c, st, anchors))
		}
		return v

	case yaml.ScalarNode:
		return resolveScalar(n, st)
	}
	return &Val{Kind: VNull, Line: n.Line}
}

func noteTag(n *yaml.Node, st *yamlStructural) {
	if n.Style&yaml.TaggedStyle != 0 {
		st.Tags = append(st.Tags, fmt.Sprintf("%s (line %d)", n.Tag, n.Line))
	}
}

func resolveScalar(n *yaml.Node, st *yamlStructural) *Val {
	noteTag(n, st)
	quoted := n.Style&(yaml.DoubleQuotedStyle|yaml.SingleQuotedStyle|yaml.LiteralStyle|yaml.FoldedStyle) != 0
	base := &Val{Line: n.Line, Col: n.Column, Quoted: quoted}

	// A quoted or block scalar is always a string, in every YAML schema.
	if quoted {
		base.Kind = VStr
		base.Str = n.Value
		return base
	}
	// An explicitly tagged scalar: the tag governs, but ERF-66 forbids
	// explicit tags outright, so this path only has to not crash.
	if n.Style&yaml.TaggedStyle != 0 {
		base.Kind = VStr
		base.Str = n.Value
		return base
	}

	raw := n.Value
	switch {
	case raw == "null":
		base.Kind = VNull
	case raw == "":
		// An empty plain scalar. JSON has no such production. Treated as null.
		// See ambiguities.md A-28.
		base.Kind = VNull
	case raw == "true":
		base.Kind, base.Bool = VBool, true
	case raw == "false":
		base.Kind, base.Bool = VBool, false
	case jsonNumber.MatchString(raw):
		f, err := strconv.ParseFloat(raw, 64)
		if err != nil {
			base.Kind, base.Str = VStr, raw
		} else {
			base.Kind, base.Num = VNum, f
		}
	default:
		base.Kind, base.Str = VStr, raw
		// Record where yaml.v3's own resolution would have differed.
		if n.Tag != "" && n.Tag != "!!str" {
			st.Coerced = append(st.Coerced,
				fmt.Sprintf("%q at line %d (yaml.v3 tag %s; JSON schema says string)", raw, n.Line, n.Tag))
		}
	}
	return base
}

// parseYAML parses one YAML document and resolves it under the JSON schema.
func parseYAML(src []byte) (*Val, *yamlStructural, error) {
	var doc yaml.Node
	if err := yaml.Unmarshal(src, &doc); err != nil {
		return nil, nil, err
	}
	st := &yamlStructural{}
	return resolveDoc(&doc, st), st, nil
}
