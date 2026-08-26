import Foundation

// ---------------------------------------------------------------------------
// ERF-43, the premise closure.
//
// "An argument's premise closure, followed transitively (its outgoing
//  `assumes` edges and the incoming `supports` edges of other claims, per
//  `ERF-24`), MUST terminate in non-argument leaves. The closure is what the
//  edges *reach* and does not include the argument itself [...] Self-edges
//  MUST NOT exist. The premise relation MUST admit no cycles, where
//  `X assumes Y` and `Y supports X` both make `Y` a premise of `X` (`ERF-24`):
//  a chain of premises that returns to its own argument grounds nothing.
//  `decomposes-into` MUST admit no cycles likewise. The closure is followed
//  over distinct claims, a claim reached twice being visited once, so that a
//  validator terminates on any input, conforming or not. [...] A validator
//  MUST flag a closure that terminates in a leaf whose disposition is
//  `retired`."
//
// Orientation is given explicitly: Y is a premise of X iff (X assumes Y) or
// (Y supports X). So `assumes` is followed forward and `supports` backward.
// ---------------------------------------------------------------------------

struct PremiseGraph {
    /// premisesOf[X] = the claims that are premises of X.
    private(set) var premisesOf: [String: [String]] = [:]
    /// decomposesTo[X] = the targets of X's `decomposes-into` edges.
    private(set) var decomposesTo: [String: [String]] = [:]

    init(claims: [String: Claim]) {
        for (id, c) in claims {
            for e in c.edges {
                switch e.relation {
                case "assumes":
                    // X assumes Y  =>  Y is a premise of X.
                    premisesOf[id, default: []].append(e.to)
                case "supports":
                    // Y supports X  =>  Y is a premise of X, where Y is the
                    // edge's subject and X its target.
                    premisesOf[e.to, default: []].append(id)
                case "decomposes-into":
                    decomposesTo[id, default: []].append(e.to)
                default:
                    break
                }
            }
        }
        // Determinism of reporting.
        for k in premisesOf.keys { premisesOf[k]!.sort() }
        for k in decomposesTo.keys { decomposesTo[k]!.sort() }
    }
}

enum ClosureCheck {

    static func run(corpus: Corpus, report: Report) {
        let graph = PremiseGraph(claims: corpus.claims)

        // --- cycles in the premise relation ---------------------------------
        // Stated without restriction to arguments, so it is checked over every
        // claim that carries or receives one of the two relations. See
        // ambiguities.md, ERF-43 #2.
        reportCycles(edges: graph.premisesOf, corpus: corpus, report: report,
                     requirement: "ERF-43", label: "the premise relation")
        reportCycles(edges: graph.decomposesTo, corpus: corpus, report: report,
                     requirement: "ERF-43", label: "`decomposes-into`")

        // --- closures of arguments -----------------------------------------
        for (id, claim) in corpus.claims.sorted(by: { $0.key < $1.key }) {
            guard claim.epistemicKind == "argument" else { continue }
            var visited = Set<String>()
            var order: [String] = []
            var stack = graph.premisesOf[id] ?? []
            // The closure is what the edges REACH; the argument itself is not in it.
            while let next = stack.popLast() {
                if visited.contains(next) { continue }   // a claim reached twice is visited once
                visited.insert(next)
                order.append(next)
                stack.append(contentsOf: graph.premisesOf[next] ?? [])
            }

            if visited.isEmpty {
                // "an argument with no premises has an empty closure and
                // satisfies this rule vacuously". ERF-49 handles the unbacked case.
                continue
            }

            for member in order.sorted() {
                guard let mc = corpus.claims[member] else {
                    // The dangling reference is ERF-35's violation; do not
                    // double-report it here.
                    continue
                }
                let hasPremises = !(graph.premisesOf[member] ?? []).isEmpty
                if hasPremises { continue }
                // `member` is a leaf of this closure.
                if mc.epistemicKind == "argument" {
                    report.add(.violation, "ERF-43", claim.file, nil,
                               "argument `\(id)`: premise closure terminates in the leaf `\(member)`, which is itself an `argument`; a closure MUST terminate in non-argument leaves")
                }
                let d = DispositionCalc.compute(mc.standings).disposition
                if d == .retired {
                    report.add(.flag, "ERF-43", claim.file, nil,
                               "argument `\(id)`: premise closure terminates in the leaf `\(member)`, whose computed disposition is `retired`")
                }
            }
        }
    }

    /// Iterative depth-first search with explicit colouring, so it terminates
    /// on a cyclic graph and names one cycle per strongly-connected entry.
    private static func reportCycles(edges: [String: [String]], corpus: Corpus, report: Report,
                                     requirement: String, label: String) {
        enum Colour { case white, grey, black }
        var colour: [String: Colour] = [:]
        var reported = Set<String>()

        var nodes = Set(edges.keys)
        for (_, vs) in edges { for v in vs { nodes.insert(v) } }

        for start in nodes.sorted() {
            if colour[start] != nil && colour[start] != .white { continue }
            var path: [String] = []
            var onPath = Set<String>()
            var stack: [(node: String, childIdx: Int)] = [(start, 0)]
            colour[start] = .grey
            path.append(start); onPath.insert(start)

            while let top = stack.last {
                let children = edges[top.node] ?? []
                if top.childIdx < children.count {
                    stack[stack.count - 1].childIdx += 1
                    let child = children[top.childIdx]
                    if onPath.contains(child) {
                        // Cycle found: from `child` round to `top.node`.
                        if let i = path.firstIndex(of: child) {
                            let cyc = Array(path[i...]) + [child]
                            let key = cyc.sorted().joined(separator: ">")
                            if !reported.contains(key) {
                                reported.insert(key)
                                let file = corpus.claims[child]?.file ?? "<unknown>"
                                report.add(.violation, requirement, file, nil,
                                           "\(label) admits a cycle: \(cyc.joined(separator: " -> "))")
                            }
                        }
                        continue
                    }
                    if colour[child] == .black { continue }
                    colour[child] = .grey
                    stack.append((child, 0))
                    path.append(child); onPath.insert(child)
                } else {
                    colour[top.node] = .black
                    stack.removeLast()
                    if let last = path.last { onPath.remove(last); path.removeLast() }
                }
            }
        }
    }
}
