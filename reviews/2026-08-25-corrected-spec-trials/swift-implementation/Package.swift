// swift-tools-version:5.9
import PackageDescription

// No external dependencies. See README.md, "Why no Yams": ERF-65 requires
// YAML 1.2 *JSON schema* scalar resolution, which libyaml-backed parsers do
// not expose. A dependency would make ERF-65 unimplementable, so the scalar
// resolver here is hand-written.
let package = Package(
    name: "erfval",
    platforms: [.macOS(.v13)],
    targets: [
        .executableTarget(name: "erfval", path: "Sources/erfval")
    ]
)
