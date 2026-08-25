//! What the validator emits.
//!
//! The spec distinguishes three strengths of report and the CLI keeps them apart:
//!
//! * `Violation` — a machine-checkable MUST is breached. Non-conformance (section 1).
//! * `Flag`      — the spec explicitly says a validator *flags* rather than rejects:
//!                 ERF-43 (retired leaf), ERF-47 (staleness), ERF-49 (unbacked),
//!                 plus the "check unavailable" outcome ERF-51 mandates.
//! * `Notice`    — a SHOULD departure, a piece of section-4 guidance, or something the
//!                 validator wants the operator to see but the spec does not make binding.
//!
//! Every finding carries a requirement id. Where the spec states a rule with no number
//! (the actor grammar of section 2, "a required field is present" from section 3) the
//! citation is the section: `§2`, `§3`. That gap is itself recorded in ambiguities.md.

use std::fmt;
use std::path::{Path, PathBuf};

#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub enum Severity {
    Violation,
    Flag,
    Notice,
}

impl Severity {
    pub fn label(self) -> &'static str {
        match self {
            Severity::Violation => "VIOLATION",
            Severity::Flag => "FLAG",
            Severity::Notice => "NOTICE",
        }
    }
}

impl fmt::Display for Severity {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.label())
    }
}

/// One reported problem. `subject` is the record id where there is one, the corpus id or
/// the file stem where there is not; `field` is a dotted path into the record.
#[derive(Clone, Debug)]
pub struct Finding {
    pub severity: Severity,
    pub req: String,
    pub subject: String,
    pub field: String,
    pub file: PathBuf,
    pub line: usize,
    pub message: String,
}

impl Finding {
    pub fn render(&self, base: &Path) -> String {
        let rel = self.file.strip_prefix(base).unwrap_or(&self.file);
        let loc = if self.line > 0 {
            format!("{}:{}", rel.display(), self.line)
        } else {
            format!("{}", rel.display())
        };
        format!(
            "{}\t{}\t{}\t{}\t{}\t{}",
            self.severity.label(),
            self.req,
            if self.subject.is_empty() { "-" } else { &self.subject },
            if self.field.is_empty() { "-" } else { &self.field },
            loc,
            self.message
        )
    }

    pub fn to_json(&self, base: &Path) -> String {
        let rel = self.file.strip_prefix(base).unwrap_or(&self.file);
        format!(
            "{{\"severity\":\"{}\",\"requirement\":\"{}\",\"subject\":{},\"field\":{},\"file\":{},\"line\":{},\"message\":{}}}",
            self.severity.label(),
            self.req,
            json_str(&self.subject),
            json_str(&self.field),
            json_str(&rel.display().to_string()),
            self.line,
            json_str(&self.message)
        )
    }
}

pub fn json_str(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 2);
    out.push('"');
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

/// Collects findings and carries the "where am I" context so call sites stay short.
#[derive(Default)]
pub struct Report {
    pub findings: Vec<Finding>,
}

impl Report {
    pub fn new() -> Self {
        Report { findings: Vec::new() }
    }

    pub fn push(
        &mut self,
        severity: Severity,
        req: &str,
        subject: &str,
        field: &str,
        file: &Path,
        line: usize,
        message: impl Into<String>,
    ) {
        self.findings.push(Finding {
            severity,
            req: req.to_string(),
            subject: subject.to_string(),
            field: field.to_string(),
            file: file.to_path_buf(),
            line,
            message: message.into(),
        });
    }

    pub fn violation(
        &mut self,
        req: &str,
        subject: &str,
        field: &str,
        file: &Path,
        line: usize,
        message: impl Into<String>,
    ) {
        self.push(Severity::Violation, req, subject, field, file, line, message);
    }

    pub fn flag(
        &mut self,
        req: &str,
        subject: &str,
        field: &str,
        file: &Path,
        line: usize,
        message: impl Into<String>,
    ) {
        self.push(Severity::Flag, req, subject, field, file, line, message);
    }

    pub fn notice(
        &mut self,
        req: &str,
        subject: &str,
        field: &str,
        file: &Path,
        line: usize,
        message: impl Into<String>,
    ) {
        self.push(Severity::Notice, req, subject, field, file, line, message);
    }

    pub fn counts(&self) -> (usize, usize, usize) {
        let mut v = 0;
        let mut f = 0;
        let mut n = 0;
        for x in &self.findings {
            match x.severity {
                Severity::Violation => v += 1,
                Severity::Flag => f += 1,
                Severity::Notice => n += 1,
            }
        }
        (v, f, n)
    }
}
