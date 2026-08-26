import Foundation

// erfval -- a validator for the Epistemic Record Format, YAML/Markdown binding v1.
//
// Conformance class claimed: Validator (SPEC section 1), over the input it
// accepts: a directory of UTF-8 files in the YAML/Markdown binding, with no
// substrate edit history. See README.md, "What this validator does not check",
// for the MUSTs that fall outside that input, and ambiguities.md ERF-1a for
// why that escape hatch is a hole in the class.

func usage() -> Never {
    FileHandle.standardError.write("""
    usage: erfval <corpus-directory> [options]

      --model-dump        print the canonical model instance (ERF-53 loss probe)
      --dispositions      print each claim's computed disposition (ERF-41) with its trace
      --quote-trace       print the span-by-span trace of every quote check (ERF-52)
      --bindings          print every narrative binding with its passage (ERF-31)
      --comment-first     delimit each HTML comment at the first `-->` before
                          applying the ERF-31 grammar (the competing reading)
      --quiet             suppress INFO findings

    exit status: 1 if the corpus carries a violation, 0 otherwise.
    A flag is not a violation (SPEC section 1): a corpus carrying flags and no
    violations conforms.

    """.data(using: .utf8)!)
    exit(2)
}

var args = Array(CommandLine.arguments.dropFirst())
var showDump = false, showDisp = false, showQuote = false, showBindings = false, quiet = false
var dir: String? = nil
for a in args {
    switch a {
    case "--model-dump": showDump = true
    case "--dispositions": showDisp = true
    case "--quote-trace": showQuote = true
    case "--bindings": showBindings = true
    case "--comment-first": Options.commentFirst = true
    case "--quiet": quiet = true
    case "-h", "--help": usage()
    default:
        if a.hasPrefix("-") { usage() }
        if dir != nil { usage() }
        dir = a
    }
}
guard let dirPath = dir else { usage() }

var isDir: ObjCBool = false
guard FileManager.default.fileExists(atPath: dirPath, isDirectory: &isDir), isDir.boolValue else {
    FileHandle.standardError.write("erfval: not a directory: \(dirPath)\n".data(using: .utf8)!)
    exit(2)
}

let root = URL(fileURLWithPath: dirPath).standardizedFileURL
let report = Report()
let loader = Loader(root: root, report: report)
loader.load()
let validator = Validator(corpus: loader.corpus, report: report, root: root, loader: loader)
validator.run()

// ---------------------------------------------------------------------------

func emit(_ s: String) { print(s) }

let c = loader.corpus
emit("corpus: \(root.lastPathComponent)  (\(c.atoms.count) atoms, \(c.claims.count) claims, \(c.surveys.count) surveys, \(c.narratives.count) narratives, \(c.sources.count) sources)")
emit("")

let order: [Severity] = [.violation, .flag, .info]
for sev in order {
    if quiet && sev == .info { continue }
    let fs = report.findings.filter { $0.severity == sev }
    if fs.isEmpty { continue }
    emit("== \(sev.rawValue)S (\(fs.count)) ==")
    for f in fs.sorted(by: { ($0.file, $0.requirement) < ($1.file, $1.requirement) }) {
        let loc = f.line.map { ":\($0)" } ?? ""
        emit("  [\(f.requirement)] \(f.file)\(loc)")
        emit("      \(f.message)")
    }
    emit("")
}

if showDisp {
    emit("== COMPUTED DISPOSITIONS (ERF-41) ==")
    for k in c.claims.keys.sorted() {
        let r = validator.dispositions[k]!
        emit("  \(k): \(r.disposition.rawValue)")
        for t in r.trace { emit("      \(t)") }
    }
    emit("")
}

if showQuote {
    emit("== QUOTE CHECK TRACE (ERF-51 / ERF-52) ==")
    for t in validator.quoteTraces { emit("  " + t) }
    emit("")
}

if showBindings {
    emit("== NARRATIVE BINDINGS (ERF-31) ==")
    for n in c.narratives.sorted(by: { $0.file < $1.file }) {
        emit("  \(n.file): \(n.bindings.count) binding(s)")
        for (i, b) in n.bindings.enumerated() {
            emit("    #\(i + 1) wellFormed=\(b.wellFormed) marker=[\(b.markerStart)..<\(b.markerEnd)]")
            if let e = b.grammarError { emit("        grammar error: \(e)") }
            emit("        ids: \(b.claimIds.joined(separator: " "))")
            emit("        anchor: \(b.anchor.map { QuoteCheck.debugQuote($0) } ?? "<none>")")
            emit("        bound-at: \(b.boundAt ?? "<none>")")
            let p = ERF51.normalize(b.passage)
            emit("        passage (normalized, \(p.count) chars): \(p.count > 120 ? String(p.prefix(117)) + "..." : p)")
            if let a = b.anchor {
                let na = ERF51.normalize(a)
                emit("        anchor occurs in passage: \(na.isEmpty ? "vacuously (empty anchor)" : String(p.contains(na)))")
            }
        }
    }
    emit("")
}

if showDump {
    emit(ModelDump.emit(c, dispositions: validator.dispositions))
}

let vcount = report.violations.count
let fcount = report.flags.count
emit("result: \(vcount) violation(s), \(fcount) flag(s) -- corpus \(vcount == 0 ? "CONFORMS" : "DOES NOT CONFORM")")
exit(vcount == 0 ? 0 : 1)
