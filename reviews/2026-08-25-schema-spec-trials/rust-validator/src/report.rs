//! Reporting. Every line carries a requirement id.

use std::fmt;

#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub enum Kind {
    /// The corpus does not conform.
    Violation,
    /// A person should look; the corpus still conforms (SPEC section 1).
    Flag,
    /// A check this tool did not run. SPEC section 1: "A validator MUST name the
    /// requirements it does not check".
    Unperformed,
    /// A deployment-wide check run over fewer corpora than a deployment.
    /// SPEC section 1: such a check "MUST be named as partial".
    Partial,
    /// Neither: something the validator observed and reports (ERF-54, ERF-57, ERF-41).
    Info,
}

impl fmt::Display for Kind {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let s = match self {
            Kind::Violation => "VIOLATION",
            Kind::Flag => "FLAG",
            Kind::Unperformed => "UNPERFORMED",
            Kind::Partial => "PARTIAL",
            Kind::Info => "INFO",
        };
        f.pad(s)
    }
}

#[derive(Clone, Debug)]
pub struct Finding {
    pub kind: Kind,
    /// A requirement id: "ERF-41", "YAMLB-1", or "SPEC-3" / "SPEC-2" for the two
    /// normative passages that carry no number (see ambiguities.md).
    pub req: String,
    /// Corpus-relative file path, or "" for corpus- and deployment-level findings.
    pub where_: String,
    pub message: String,
}

impl fmt::Display for Finding {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        if self.where_.is_empty() {
            write!(f, "{:<11} {:<8}  {}", self.kind, self.req, self.message)
        } else {
            write!(
                f,
                "{:<11} {:<8}  {}: {}",
                self.kind, self.req, self.where_, self.message
            )
        }
    }
}

#[derive(Default)]
pub struct Reporter {
    pub findings: Vec<Finding>,
}

impl Reporter {
    pub fn add(&mut self, kind: Kind, req: &str, where_: &str, message: impl Into<String>) {
        self.findings.push(Finding {
            kind,
            req: req.to_string(),
            where_: where_.to_string(),
            message: message.into(),
        });
    }
    pub fn violation(&mut self, req: &str, where_: &str, m: impl Into<String>) {
        self.add(Kind::Violation, req, where_, m);
    }
    pub fn flag(&mut self, req: &str, where_: &str, m: impl Into<String>) {
        self.add(Kind::Flag, req, where_, m);
    }
    pub fn unperformed(&mut self, req: &str, m: impl Into<String>) {
        self.add(Kind::Unperformed, req, "", m);
    }
    pub fn partial(&mut self, req: &str, m: impl Into<String>) {
        self.add(Kind::Partial, req, "", m);
    }
    pub fn info(&mut self, req: &str, where_: &str, m: impl Into<String>) {
        self.add(Kind::Info, req, where_, m);
    }
    pub fn count(&self, k: Kind) -> usize {
        self.findings.iter().filter(|f| f.kind == k).count()
    }
}
