-- validator-report.sql -- everything the format says MUST be computed.
-- usage: sqlite3 out/canonical.db < validator-report.sql
.mode box
.headers on

SELECT '--- ERF-41 computed disposition (never a stored field, ERF-22) ---' AS "";
SELECT claim_id, disposition FROM v_claim_disposition ORDER BY disposition, claim_id;

SELECT '--- ERF-41 current stance per person ---' AS "";
SELECT claim_id, by, stance, timestamp FROM v_current_stance ORDER BY claim_id, by;

SELECT '--- ERF-49 unbacked, flagged not rejected ---' AS "";
SELECT * FROM v_erf49_unbacked;

SELECT '--- ERF-24 auditability computed from the kind ---' AS "";
SELECT claim_id, is_auditable FROM v_claim_auditable ORDER BY claim_id;

SELECT '--- ERF-47 stale audits ---' AS "";
SELECT * FROM v_erf47_stale_finding_audit;
SELECT * FROM v_erf47_stale_evidence_audit;

SELECT '--- ERF-43 argument closure terminating in a retired leaf ---' AS "";
SELECT * FROM v_erf43_retired_leaf;

SELECT '--- ERF-32/33 narrative bindings ---' AS "";
SELECT path, claim_id, staleness FROM v_erf32_binding_staleness ORDER BY pos;
SELECT claim_id AS unresolved_binding, anchor FROM v_erf33_unresolved_binding;
SELECT * FROM v_erf31_anchor_missing;

SELECT '--- ERF-55/57/72 what a tolerant consumer must report ---' AS "";
SELECT * FROM v_erf55_unknown_field;
SELECT * FROM v_erf57_unknown_type;
