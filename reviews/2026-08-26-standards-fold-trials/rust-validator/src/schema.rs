//! Schema validation, with every failure attributed to a requirement id.
//!
//! Section 3: "a file conforms to the model when it validates against the
//! schema, with its markdown body attached as `body` where the model has one".
//! The attribution table below is SPEC section 3.1, "an index from field to the
//! requirements that constrain it, by record type", read back the other way.

use jsonschema::Validator;
use jsonschema::error::ValidationErrorKind;
use serde_json::{Value, json};

use crate::model::RecordType;

pub const SCHEMA_SRC: &str = include_str!("../schema/erf.schema.json");

pub struct Schemas {
    pub whole: Validator,
    pub per_type: Vec<(RecordType, Validator)>,
}

pub fn build() -> Result<Schemas, String> {
    let root: Value = serde_json::from_str(SCHEMA_SRC).map_err(|e| e.to_string())?;
    let defs = root.get("$defs").cloned().ok_or("schema has no $defs")?;
    let whole = jsonschema::validator_for(&root).map_err(|e| e.to_string())?;
    let mut per_type = Vec::new();
    for rt in [
        RecordType::Atom,
        RecordType::Claim,
        RecordType::Survey,
        RecordType::CorpusDeclaration,
        RecordType::SourceList,
        RecordType::Narrative,
    ] {
        let s = json!({
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$id": format!("https://erf.example/erf-{}.schema.json", rt.as_str()),
            "$ref": format!("#/$defs/{}", rt.schema_def()),
            "$defs": defs,
        });
        let v = jsonschema::validator_for(&s).map_err(|e| e.to_string())?;
        per_type.push((rt, v));
    }
    Ok(Schemas { whole, per_type })
}

impl Schemas {
    pub fn for_type(&self, rt: RecordType) -> &Validator {
        &self
            .per_type
            .iter()
            .find(|(t, _)| *t == rt)
            .expect("every record type is compiled")
            .1
    }
}

pub struct SchemaFinding {
    pub req: &'static str,
    pub path: String,
    pub msg: String,
    /// `ERF-65`: a string-typed field that arrived as another type. The binding
    /// says the report "is a violation" and names the requirement, so it is
    /// separated here from any other kind of schema failure.
    pub is_wire_type_error: bool,
    /// An `additionalProperties` failure: a field the declared `spec_version`
    /// does not define (`ERF-55`), which is a violation under a known version
    /// and expected content under a newer minor (`ERF-60`).
    pub is_unknown_field: bool,
}

/// The fields that make a file a record. A narrative holding any of them is
/// being modelled as one (`ERF-34`).
const RECORD_FURNITURE: &[&str] = &[
    "id", "standings", "atoms_for", "atoms_against", "surveys", "edges",
    "evidence_audit", "finding_audit", "epistemic_kind", "source",
    "source_quality", "quote", "finding", "last_modified",
];

pub fn validate(schemas: &Schemas, rt: RecordType, instance: &Value) -> Vec<SchemaFinding> {
    let mut out = Vec::new();
    for err in schemas.for_type(rt).iter_errors(instance) {
        let path = err.instance_path().to_string();
        let segs: Vec<String> = path
            .trim_start_matches('/')
            .split('/')
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string())
            .collect();
        let kind = err.kind();
        let (is_wire_type_error, is_unknown_field, extra) = match kind {
            ValidationErrorKind::Type { kind: tk } => {
                let expects_string = format!("{tk:?}").contains("String");
                (expects_string && !instance_at(instance, &segs).is_null(), false, String::new())
            }
            ValidationErrorKind::AdditionalProperties { unexpected } => {
                (false, true, format!(" [{}]", unexpected.join(", ")))
            }
            _ => (false, false, String::new()),
        };
        // A narrative carrying a record's furniture is ERF-34's violation, not
        // a generic undefined field: "A narrative MUST NOT be modelled as a
        // record... It has no evidence, no standings and no disposition."
        let narrative_as_record = rt == RecordType::Narrative
            && match kind {
                ValidationErrorKind::AdditionalProperties { unexpected } => {
                    unexpected.iter().any(|u| RECORD_FURNITURE.contains(&u.as_str()))
                }
                _ => false,
            };
        let req = if narrative_as_record {
            "ERF-34"
        } else if is_unknown_field {
            "ERF-55"
        } else if is_wire_type_error {
            "ERF-65"
        } else {
            req_for(rt, &segs, kind)
        };
        out.push(SchemaFinding {
            req,
            path: if path.is_empty() { "/".into() } else { path },
            msg: format!("{err}{extra}"),
            is_wire_type_error,
            is_unknown_field,
        });
    }
    out
}

fn instance_at<'a>(v: &'a Value, segs: &[String]) -> &'a Value {
    let mut cur = v;
    for s in segs {
        cur = match cur {
            Value::Object(m) => m.get(s).unwrap_or(&Value::Null),
            Value::Array(a) => s
                .parse::<usize>()
                .ok()
                .and_then(|i| a.get(i))
                .unwrap_or(&Value::Null),
            _ => &Value::Null,
        };
    }
    cur
}

/// SPEC section 3.1's field index, inverted. `SPEC-3` is the fallback: the data
/// model itself is normative (section 3) and a shape failure with no
/// finer-grained home belongs to it. `SPEC-4.3` marks the three fields section
/// 3.1 labels *guidance*, bound by the data model alone.
fn req_for(rt: RecordType, segs: &[String], kind: &ValidationErrorKind) -> &'static str {
    let f = |i: usize| segs.get(i).map(|s| s.as_str()).unwrap_or("");
    // A `required` failure names the missing property, which is the field the
    // requirement is about, not the object the error sits on.
    let missing: Option<String> = match kind {
        ValidationErrorKind::Required { property } => property.as_str().map(str::to_string),
        _ => None,
    };
    let head: &str = match &missing {
        Some(m) if segs.is_empty() => m.as_ref(),
        _ => f(0),
    };
    match rt {
        RecordType::Atom => match head {
            "id" => "ERF-13",
            "type" => "ERF-54",
            "corpus" => "ERF-17",
            "finding" => "ERF-11",
            "finding_audit" => {
                if f(2) == "verdict" { "ERF-12" } else { "ERF-11" }
            }
            "quote" => "ERF-6",
            "source" => "ERF-4",
            "source_quality" => "ERF-9",
            "as_of_date" => "ERF-14",
            "limitations" => "ERF-14",
            "created" | "last_modified" => "ERF-48",
            _ => "SPEC-3",
        },
        RecordType::Claim => match head {
            "id" => "ERF-36",
            "type" => "ERF-54",
            "corpus" => "ERF-17",
            "title" | "body" => "ERF-18",
            "epistemic_kind" => "ERF-24",
            "atoms_for" | "atoms_against" => "ERF-23",
            "surveys" => "ERF-25",
            "edges" => {
                if f(2) == "relation" { "ERF-43" } else { "ERF-35" }
            }
            "standings" => match f(2) {
                "stance" => "ERF-41",
                "by" => "ERF-21",
                "why" => "ERF-39",
                "evidence_at_stance" => "ERF-20",
                _ => "ERF-19",
            },
            "evidence_audit" => {
                if f(2) == "verdict" { "ERF-12" } else { "ERF-24" }
            }
            "created" | "last_modified" => "ERF-48",
            "short_name" | "families" | "semantic_query" => "SPEC-4.3",
            _ => "SPEC-3",
        },
        RecordType::Survey => match head {
            "type" => "ERF-54",
            "corpus" => "ERF-17",
            "searches" => match f(2) {
                "hits_reported" => "ERF-27",
                "timestamp" => "ERF-28",
                _ => "ERF-26",
            },
            "notable_results" => "ERF-27",
            "last_modified" => "ERF-48",
            _ => "ERF-28",
        },
        RecordType::CorpusDeclaration => match head {
            "spec_version" => "ERF-61",
            _ => "ERF-59",
        },
        RecordType::SourceList => {
            // /sources/<id>/<field>
            match f(2) {
                "citation_text" => "ERF-7",
                "citation" => "ERF-8",
                "received" => "ERF-2",
                "status" => "ERF-5",
                "normalized" | "normalized_digest" => "ERF-4",
                "reason" => "ERF-5",
                "licence" | "licence_name" => "ERF-68",
                "excerpt" => "ERF-69",
                "extraction" | "normalization" => "ERF-70",
                _ => match missing.as_deref() {
                    Some("normalized") => "ERF-4",
                    Some("reason") => "ERF-5",
                    Some("citation_text") => "ERF-7",
                    Some("status") => "ERF-5",
                    _ => "ERF-3",
                },
            }
        }
        RecordType::Narrative => "ERF-34",
    }
}
