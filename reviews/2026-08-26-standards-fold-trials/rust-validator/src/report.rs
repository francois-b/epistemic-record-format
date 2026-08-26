//! The three output kinds and the report that carries them.
//!
//! SPEC section 2: "A validator reports two kinds of thing... A violation says
//! the corpus does not conform. A flag says something here is worth a person's
//! attention, and a corpus carrying flags and no violations conforms."
//! The third kind is the naming duty, also section 2: "A validator MUST name
//! the requirements it does not check, and a deployment-wide check (`ERF-36`,
//! `ERF-38`) run over a single corpus MUST be named as partial."

use std::fmt;

#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub enum Kind {
    /// The corpus does not conform.
    Violation,
    /// The corpus conforms; a person should look.
    Flag,
    /// A check this tool did not run (or ran only in part), named as the
    /// Validator conformance class requires.
    Unperformed,
}

impl fmt::Display for Kind {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(match self {
            Kind::Violation => "VIOLATION",
            Kind::Flag => "FLAG",
            Kind::Unperformed => "UNPERFORMED",
        })
    }
}

/// Which of the two conformances a line reports (SPEC section 7: "A validator
/// for a binding checks both and says which it is reporting").
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Layer {
    /// Conformance to the data model and the invariants: the same in every binding.
    Model,
    /// Conformance to the YAML/Markdown binding's own rules: a property of the bytes.
    Binding,
}

impl Layer {
    pub fn tag(&self) -> &'static str {
        match self {
            Layer::Model => "model",
            Layer::Binding => "binding",
        }
    }
}

#[derive(Clone, Debug)]
pub struct Finding {
    pub kind: Kind,
    pub layer: Layer,
    /// The requirement id. Every line carries one.
    pub req: String,
    /// File path (corpus-relative) plus any finer locator.
    pub loc: String,
    pub msg: String,
}

#[derive(Default)]
pub struct Report {
    pub findings: Vec<Finding>,
}

impl Report {
    pub fn new() -> Self {
        Report::default()
    }

    pub fn push(&mut self, kind: Kind, layer: Layer, req: &str, loc: &str, msg: impl Into<String>) {
        self.findings.push(Finding {
            kind,
            layer,
            req: req.to_string(),
            loc: loc.to_string(),
            msg: msg.into(),
        });
    }

    pub fn violation(&mut self, req: &str, loc: &str, msg: impl Into<String>) {
        self.push(Kind::Violation, Layer::Model, req, loc, msg);
    }

    pub fn violation_binding(&mut self, req: &str, loc: &str, msg: impl Into<String>) {
        self.push(Kind::Violation, Layer::Binding, req, loc, msg);
    }

    pub fn flag(&mut self, req: &str, loc: &str, msg: impl Into<String>) {
        self.push(Kind::Flag, Layer::Model, req, loc, msg);
    }

    pub fn flag_binding(&mut self, req: &str, loc: &str, msg: impl Into<String>) {
        self.push(Kind::Flag, Layer::Binding, req, loc, msg);
    }

    pub fn unperformed(&mut self, req: &str, msg: impl Into<String>) {
        self.push(Kind::Unperformed, Layer::Model, req, "-", msg);
    }

    pub fn violations(&self) -> usize {
        self.findings.iter().filter(|f| f.kind == Kind::Violation).count()
    }
    pub fn flags(&self) -> usize {
        self.findings.iter().filter(|f| f.kind == Kind::Flag).count()
    }
    pub fn unperformeds(&self) -> usize {
        self.findings.iter().filter(|f| f.kind == Kind::Unperformed).count()
    }

    /// Requirement ids sort numerically within their prefix so `ERF-9` precedes
    /// `ERF-51`; the id sequence is flat and carries no meaning beyond identity
    /// (SPEC, "Versioning and change control"), so this is display order only.
    fn req_sort_key(req: &str) -> (String, u32) {
        match req.rsplit_once('-') {
            Some((pre, num)) => match num.parse::<u32>() {
                Ok(n) => (pre.to_string(), n),
                Err(_) => (req.to_string(), 0),
            },
            None => (req.to_string(), 0),
        }
    }

    pub fn render(&self, quiet_unperformed: bool) -> String {
        let mut out = String::new();
        let mut sorted: Vec<&Finding> = self.findings.iter().collect();
        sorted.sort_by(|a, b| {
            a.kind
                .cmp(&b.kind)
                .then_with(|| Self::req_sort_key(&a.req).cmp(&Self::req_sort_key(&b.req)))
                .then_with(|| a.loc.cmp(&b.loc))
                .then_with(|| a.msg.cmp(&b.msg))
        });
        let mut last_kind: Option<Kind> = None;
        for f in sorted {
            if quiet_unperformed && f.kind == Kind::Unperformed {
                continue;
            }
            if last_kind != Some(f.kind) {
                if last_kind.is_some() {
                    out.push('\n');
                }
                let header = match f.kind {
                    Kind::Violation => "== VIOLATIONS (the corpus does not conform) ==",
                    Kind::Flag => "== FLAGS (the corpus conforms; a person should look) ==",
                    Kind::Unperformed => "== UNPERFORMED (checks this validator did not run, or ran only in part) ==",
                };
                out.push_str(header);
                out.push('\n');
                last_kind = Some(f.kind);
            }
            out.push_str(&format!(
                "{:<11} {:<9} {:<8} {}  {}\n",
                f.kind.to_string(),
                f.req,
                f.layer.tag(),
                f.loc,
                f.msg
            ));
        }
        out
    }
}
