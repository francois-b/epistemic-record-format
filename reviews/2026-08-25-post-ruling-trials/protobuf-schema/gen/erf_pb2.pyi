from google.protobuf import struct_pb2 as _struct_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class EpistemicKind(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    EPISTEMIC_KIND_UNSPECIFIED: _ClassVar[EpistemicKind]
    EPISTEMIC_KIND_OBSERVATION: _ClassVar[EpistemicKind]
    EPISTEMIC_KIND_ARGUMENT: _ClassVar[EpistemicKind]
    EPISTEMIC_KIND_BET: _ClassVar[EpistemicKind]
    EPISTEMIC_KIND_COMMITMENT: _ClassVar[EpistemicKind]

class Stance(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    STANCE_UNSPECIFIED: _ClassVar[Stance]
    STANCE_FOR: _ClassVar[Stance]
    STANCE_AGAINST: _ClassVar[Stance]
    STANCE_WITHDRAWN: _ClassVar[Stance]

class Relation(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    RELATION_UNSPECIFIED: _ClassVar[Relation]
    RELATION_SUPPORTS: _ClassVar[Relation]
    RELATION_ASSUMES: _ClassVar[Relation]
    RELATION_DECOMPOSES_INTO: _ClassVar[Relation]
    RELATION_CONFLICTS_WITH: _ClassVar[Relation]

class SourceQuality(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    SOURCE_QUALITY_UNSPECIFIED: _ClassVar[SourceQuality]
    SOURCE_QUALITY_HIGH: _ClassVar[SourceQuality]
    SOURCE_QUALITY_MEDIUM: _ClassVar[SourceQuality]
    SOURCE_QUALITY_LOW: _ClassVar[SourceQuality]

class Verdict(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    VERDICT_UNSPECIFIED: _ClassVar[Verdict]
    VERDICT_SUPPORTED: _ClassVar[Verdict]
    VERDICT_PARTIAL: _ClassVar[Verdict]
    VERDICT_UNSUPPORTED: _ClassVar[Verdict]

class SourceStatus(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    SOURCE_STATUS_UNSPECIFIED: _ClassVar[SourceStatus]
    SOURCE_STATUS_SHIPPED: _ClassVar[SourceStatus]
    SOURCE_STATUS_SHIPPED_AS_QUOTATION: _ClassVar[SourceStatus]
    SOURCE_STATUS_NOT_REDISTRIBUTABLE: _ClassVar[SourceStatus]
    SOURCE_STATUS_ACCESS_RESTRICTED: _ClassVar[SourceStatus]
    SOURCE_STATUS_LICENCE_UNVERIFIED: _ClassVar[SourceStatus]
EPISTEMIC_KIND_UNSPECIFIED: EpistemicKind
EPISTEMIC_KIND_OBSERVATION: EpistemicKind
EPISTEMIC_KIND_ARGUMENT: EpistemicKind
EPISTEMIC_KIND_BET: EpistemicKind
EPISTEMIC_KIND_COMMITMENT: EpistemicKind
STANCE_UNSPECIFIED: Stance
STANCE_FOR: Stance
STANCE_AGAINST: Stance
STANCE_WITHDRAWN: Stance
RELATION_UNSPECIFIED: Relation
RELATION_SUPPORTS: Relation
RELATION_ASSUMES: Relation
RELATION_DECOMPOSES_INTO: Relation
RELATION_CONFLICTS_WITH: Relation
SOURCE_QUALITY_UNSPECIFIED: SourceQuality
SOURCE_QUALITY_HIGH: SourceQuality
SOURCE_QUALITY_MEDIUM: SourceQuality
SOURCE_QUALITY_LOW: SourceQuality
VERDICT_UNSPECIFIED: Verdict
VERDICT_SUPPORTED: Verdict
VERDICT_PARTIAL: Verdict
VERDICT_UNSUPPORTED: Verdict
SOURCE_STATUS_UNSPECIFIED: SourceStatus
SOURCE_STATUS_SHIPPED: SourceStatus
SOURCE_STATUS_SHIPPED_AS_QUOTATION: SourceStatus
SOURCE_STATUS_NOT_REDISTRIBUTABLE: SourceStatus
SOURCE_STATUS_ACCESS_RESTRICTED: SourceStatus
SOURCE_STATUS_LICENCE_UNVERIFIED: SourceStatus

class ActorStamp(_message.Message):
    __slots__ = ("timestamp", "by")
    TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    BY_FIELD_NUMBER: _ClassVar[int]
    timestamp: str
    by: str
    def __init__(self, timestamp: _Optional[str] = ..., by: _Optional[str] = ...) -> None: ...

class EvidenceAtStance(_message.Message):
    __slots__ = ("atoms_for", "atoms_against")
    ATOMS_FOR_FIELD_NUMBER: _ClassVar[int]
    ATOMS_AGAINST_FIELD_NUMBER: _ClassVar[int]
    atoms_for: _containers.RepeatedScalarFieldContainer[str]
    atoms_against: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, atoms_for: _Optional[_Iterable[str]] = ..., atoms_against: _Optional[_Iterable[str]] = ...) -> None: ...

class StandingEntry(_message.Message):
    __slots__ = ("timestamp", "stance", "by", "why", "evidence_at_stance")
    TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    STANCE_FIELD_NUMBER: _ClassVar[int]
    BY_FIELD_NUMBER: _ClassVar[int]
    WHY_FIELD_NUMBER: _ClassVar[int]
    EVIDENCE_AT_STANCE_FIELD_NUMBER: _ClassVar[int]
    timestamp: str
    stance: Stance
    by: str
    why: str
    evidence_at_stance: EvidenceAtStance
    def __init__(self, timestamp: _Optional[str] = ..., stance: _Optional[_Union[Stance, str]] = ..., by: _Optional[str] = ..., why: _Optional[str] = ..., evidence_at_stance: _Optional[_Union[EvidenceAtStance, _Mapping]] = ...) -> None: ...

class AuditEntry(_message.Message):
    __slots__ = ("auditor", "verdict", "timestamp", "protocol")
    AUDITOR_FIELD_NUMBER: _ClassVar[int]
    VERDICT_FIELD_NUMBER: _ClassVar[int]
    TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    PROTOCOL_FIELD_NUMBER: _ClassVar[int]
    auditor: str
    verdict: Verdict
    timestamp: str
    protocol: str
    def __init__(self, auditor: _Optional[str] = ..., verdict: _Optional[_Union[Verdict, str]] = ..., timestamp: _Optional[str] = ..., protocol: _Optional[str] = ...) -> None: ...

class SurveyIdList(_message.Message):
    __slots__ = ("values",)
    VALUES_FIELD_NUMBER: _ClassVar[int]
    values: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, values: _Optional[_Iterable[str]] = ...) -> None: ...

class AtomIdList(_message.Message):
    __slots__ = ("values",)
    VALUES_FIELD_NUMBER: _ClassVar[int]
    values: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, values: _Optional[_Iterable[str]] = ...) -> None: ...

class Atom(_message.Message):
    __slots__ = ("id", "type", "corpus", "finding", "quote", "source", "source_quality", "as_of_date", "limitations", "created", "last_modified", "finding_audit", "x_fields", "unrecognized")
    class XFieldsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _struct_pb2.Value
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ...) -> None: ...
    class UnrecognizedEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _struct_pb2.Value
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ...) -> None: ...
    ID_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    CORPUS_FIELD_NUMBER: _ClassVar[int]
    FINDING_FIELD_NUMBER: _ClassVar[int]
    QUOTE_FIELD_NUMBER: _ClassVar[int]
    SOURCE_FIELD_NUMBER: _ClassVar[int]
    SOURCE_QUALITY_FIELD_NUMBER: _ClassVar[int]
    AS_OF_DATE_FIELD_NUMBER: _ClassVar[int]
    LIMITATIONS_FIELD_NUMBER: _ClassVar[int]
    CREATED_FIELD_NUMBER: _ClassVar[int]
    LAST_MODIFIED_FIELD_NUMBER: _ClassVar[int]
    FINDING_AUDIT_FIELD_NUMBER: _ClassVar[int]
    X_FIELDS_FIELD_NUMBER: _ClassVar[int]
    UNRECOGNIZED_FIELD_NUMBER: _ClassVar[int]
    id: str
    type: str
    corpus: str
    finding: str
    quote: str
    source: str
    source_quality: SourceQuality
    as_of_date: str
    limitations: str
    created: ActorStamp
    last_modified: ActorStamp
    finding_audit: _containers.RepeatedCompositeFieldContainer[AuditEntry]
    x_fields: _containers.MessageMap[str, _struct_pb2.Value]
    unrecognized: _containers.MessageMap[str, _struct_pb2.Value]
    def __init__(self, id: _Optional[str] = ..., type: _Optional[str] = ..., corpus: _Optional[str] = ..., finding: _Optional[str] = ..., quote: _Optional[str] = ..., source: _Optional[str] = ..., source_quality: _Optional[_Union[SourceQuality, str]] = ..., as_of_date: _Optional[str] = ..., limitations: _Optional[str] = ..., created: _Optional[_Union[ActorStamp, _Mapping]] = ..., last_modified: _Optional[_Union[ActorStamp, _Mapping]] = ..., finding_audit: _Optional[_Iterable[_Union[AuditEntry, _Mapping]]] = ..., x_fields: _Optional[_Mapping[str, _struct_pb2.Value]] = ..., unrecognized: _Optional[_Mapping[str, _struct_pb2.Value]] = ...) -> None: ...

class Edge(_message.Message):
    __slots__ = ("to", "relation")
    TO_FIELD_NUMBER: _ClassVar[int]
    RELATION_FIELD_NUMBER: _ClassVar[int]
    to: str
    relation: Relation
    def __init__(self, to: _Optional[str] = ..., relation: _Optional[_Union[Relation, str]] = ...) -> None: ...

class Claim(_message.Message):
    __slots__ = ("id", "type", "corpus", "title", "epistemic_kind", "created", "last_modified", "short_name", "families", "atoms_for", "atoms_against", "surveys", "edges", "standings", "evidence_audit", "semantic_query", "body", "x_fields", "unrecognized")
    class XFieldsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _struct_pb2.Value
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ...) -> None: ...
    class UnrecognizedEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _struct_pb2.Value
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ...) -> None: ...
    ID_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    CORPUS_FIELD_NUMBER: _ClassVar[int]
    TITLE_FIELD_NUMBER: _ClassVar[int]
    EPISTEMIC_KIND_FIELD_NUMBER: _ClassVar[int]
    CREATED_FIELD_NUMBER: _ClassVar[int]
    LAST_MODIFIED_FIELD_NUMBER: _ClassVar[int]
    SHORT_NAME_FIELD_NUMBER: _ClassVar[int]
    FAMILIES_FIELD_NUMBER: _ClassVar[int]
    ATOMS_FOR_FIELD_NUMBER: _ClassVar[int]
    ATOMS_AGAINST_FIELD_NUMBER: _ClassVar[int]
    SURVEYS_FIELD_NUMBER: _ClassVar[int]
    EDGES_FIELD_NUMBER: _ClassVar[int]
    STANDINGS_FIELD_NUMBER: _ClassVar[int]
    EVIDENCE_AUDIT_FIELD_NUMBER: _ClassVar[int]
    SEMANTIC_QUERY_FIELD_NUMBER: _ClassVar[int]
    BODY_FIELD_NUMBER: _ClassVar[int]
    X_FIELDS_FIELD_NUMBER: _ClassVar[int]
    UNRECOGNIZED_FIELD_NUMBER: _ClassVar[int]
    id: str
    type: str
    corpus: str
    title: str
    epistemic_kind: EpistemicKind
    created: ActorStamp
    last_modified: ActorStamp
    short_name: str
    families: _containers.RepeatedScalarFieldContainer[str]
    atoms_for: _containers.RepeatedScalarFieldContainer[str]
    atoms_against: _containers.RepeatedScalarFieldContainer[str]
    surveys: SurveyIdList
    edges: _containers.RepeatedCompositeFieldContainer[Edge]
    standings: _containers.RepeatedCompositeFieldContainer[StandingEntry]
    evidence_audit: _containers.RepeatedCompositeFieldContainer[AuditEntry]
    semantic_query: str
    body: str
    x_fields: _containers.MessageMap[str, _struct_pb2.Value]
    unrecognized: _containers.MessageMap[str, _struct_pb2.Value]
    def __init__(self, id: _Optional[str] = ..., type: _Optional[str] = ..., corpus: _Optional[str] = ..., title: _Optional[str] = ..., epistemic_kind: _Optional[_Union[EpistemicKind, str]] = ..., created: _Optional[_Union[ActorStamp, _Mapping]] = ..., last_modified: _Optional[_Union[ActorStamp, _Mapping]] = ..., short_name: _Optional[str] = ..., families: _Optional[_Iterable[str]] = ..., atoms_for: _Optional[_Iterable[str]] = ..., atoms_against: _Optional[_Iterable[str]] = ..., surveys: _Optional[_Union[SurveyIdList, _Mapping]] = ..., edges: _Optional[_Iterable[_Union[Edge, _Mapping]]] = ..., standings: _Optional[_Iterable[_Union[StandingEntry, _Mapping]]] = ..., evidence_audit: _Optional[_Iterable[_Union[AuditEntry, _Mapping]]] = ..., semantic_query: _Optional[str] = ..., body: _Optional[str] = ..., x_fields: _Optional[_Mapping[str, _struct_pb2.Value]] = ..., unrecognized: _Optional[_Mapping[str, _struct_pb2.Value]] = ...) -> None: ...

class SearchAct(_message.Message):
    __slots__ = ("tool", "query", "scope", "hits_reported", "timestamp")
    TOOL_FIELD_NUMBER: _ClassVar[int]
    QUERY_FIELD_NUMBER: _ClassVar[int]
    SCOPE_FIELD_NUMBER: _ClassVar[int]
    HITS_REPORTED_FIELD_NUMBER: _ClassVar[int]
    TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    tool: str
    query: str
    scope: str
    hits_reported: str
    timestamp: str
    def __init__(self, tool: _Optional[str] = ..., query: _Optional[str] = ..., scope: _Optional[str] = ..., hits_reported: _Optional[str] = ..., timestamp: _Optional[str] = ...) -> None: ...

class NotableResult(_message.Message):
    __slots__ = ("what", "note", "atoms")
    WHAT_FIELD_NUMBER: _ClassVar[int]
    NOTE_FIELD_NUMBER: _ClassVar[int]
    ATOMS_FIELD_NUMBER: _ClassVar[int]
    what: str
    note: str
    atoms: AtomIdList
    def __init__(self, what: _Optional[str] = ..., note: _Optional[str] = ..., atoms: _Optional[_Union[AtomIdList, _Mapping]] = ...) -> None: ...

class Survey(_message.Message):
    __slots__ = ("id", "type", "corpus", "title", "conducted", "searches", "notable_results", "prior_survey", "last_modified", "body", "x_fields", "unrecognized")
    class XFieldsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _struct_pb2.Value
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ...) -> None: ...
    class UnrecognizedEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _struct_pb2.Value
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ...) -> None: ...
    ID_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    CORPUS_FIELD_NUMBER: _ClassVar[int]
    TITLE_FIELD_NUMBER: _ClassVar[int]
    CONDUCTED_FIELD_NUMBER: _ClassVar[int]
    SEARCHES_FIELD_NUMBER: _ClassVar[int]
    NOTABLE_RESULTS_FIELD_NUMBER: _ClassVar[int]
    PRIOR_SURVEY_FIELD_NUMBER: _ClassVar[int]
    LAST_MODIFIED_FIELD_NUMBER: _ClassVar[int]
    BODY_FIELD_NUMBER: _ClassVar[int]
    X_FIELDS_FIELD_NUMBER: _ClassVar[int]
    UNRECOGNIZED_FIELD_NUMBER: _ClassVar[int]
    id: str
    type: str
    corpus: str
    title: str
    conducted: ActorStamp
    searches: _containers.RepeatedCompositeFieldContainer[SearchAct]
    notable_results: _containers.RepeatedCompositeFieldContainer[NotableResult]
    prior_survey: str
    last_modified: ActorStamp
    body: str
    x_fields: _containers.MessageMap[str, _struct_pb2.Value]
    unrecognized: _containers.MessageMap[str, _struct_pb2.Value]
    def __init__(self, id: _Optional[str] = ..., type: _Optional[str] = ..., corpus: _Optional[str] = ..., title: _Optional[str] = ..., conducted: _Optional[_Union[ActorStamp, _Mapping]] = ..., searches: _Optional[_Iterable[_Union[SearchAct, _Mapping]]] = ..., notable_results: _Optional[_Iterable[_Union[NotableResult, _Mapping]]] = ..., prior_survey: _Optional[str] = ..., last_modified: _Optional[_Union[ActorStamp, _Mapping]] = ..., body: _Optional[str] = ..., x_fields: _Optional[_Mapping[str, _struct_pb2.Value]] = ..., unrecognized: _Optional[_Mapping[str, _struct_pb2.Value]] = ...) -> None: ...

class CorpusDeclaration(_message.Message):
    __slots__ = ("type", "id", "title", "spec_version", "classification", "owner", "x_fields", "unrecognized")
    class XFieldsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _struct_pb2.Value
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ...) -> None: ...
    class UnrecognizedEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _struct_pb2.Value
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ...) -> None: ...
    TYPE_FIELD_NUMBER: _ClassVar[int]
    ID_FIELD_NUMBER: _ClassVar[int]
    TITLE_FIELD_NUMBER: _ClassVar[int]
    SPEC_VERSION_FIELD_NUMBER: _ClassVar[int]
    CLASSIFICATION_FIELD_NUMBER: _ClassVar[int]
    OWNER_FIELD_NUMBER: _ClassVar[int]
    X_FIELDS_FIELD_NUMBER: _ClassVar[int]
    UNRECOGNIZED_FIELD_NUMBER: _ClassVar[int]
    type: str
    id: str
    title: str
    spec_version: str
    classification: str
    owner: str
    x_fields: _containers.MessageMap[str, _struct_pb2.Value]
    unrecognized: _containers.MessageMap[str, _struct_pb2.Value]
    def __init__(self, type: _Optional[str] = ..., id: _Optional[str] = ..., title: _Optional[str] = ..., spec_version: _Optional[str] = ..., classification: _Optional[str] = ..., owner: _Optional[str] = ..., x_fields: _Optional[_Mapping[str, _struct_pb2.Value]] = ..., unrecognized: _Optional[_Mapping[str, _struct_pb2.Value]] = ...) -> None: ...

class Received(_message.Message):
    __slots__ = ("url", "path", "digest", "timestamp")
    URL_FIELD_NUMBER: _ClassVar[int]
    PATH_FIELD_NUMBER: _ClassVar[int]
    DIGEST_FIELD_NUMBER: _ClassVar[int]
    TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    url: str
    path: str
    digest: str
    timestamp: str
    def __init__(self, url: _Optional[str] = ..., path: _Optional[str] = ..., digest: _Optional[str] = ..., timestamp: _Optional[str] = ...) -> None: ...

class Source(_message.Message):
    __slots__ = ("citation_text", "citation", "received", "status", "normalized", "normalized_digest", "reason", "licence", "licence_name", "excerpt", "extraction", "normalization", "x_fields", "unrecognized")
    class XFieldsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _struct_pb2.Value
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ...) -> None: ...
    class UnrecognizedEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _struct_pb2.Value
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ...) -> None: ...
    CITATION_TEXT_FIELD_NUMBER: _ClassVar[int]
    CITATION_FIELD_NUMBER: _ClassVar[int]
    RECEIVED_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    NORMALIZED_FIELD_NUMBER: _ClassVar[int]
    NORMALIZED_DIGEST_FIELD_NUMBER: _ClassVar[int]
    REASON_FIELD_NUMBER: _ClassVar[int]
    LICENCE_FIELD_NUMBER: _ClassVar[int]
    LICENCE_NAME_FIELD_NUMBER: _ClassVar[int]
    EXCERPT_FIELD_NUMBER: _ClassVar[int]
    EXTRACTION_FIELD_NUMBER: _ClassVar[int]
    NORMALIZATION_FIELD_NUMBER: _ClassVar[int]
    X_FIELDS_FIELD_NUMBER: _ClassVar[int]
    UNRECOGNIZED_FIELD_NUMBER: _ClassVar[int]
    citation_text: str
    citation: _struct_pb2.Struct
    received: Received
    status: SourceStatus
    normalized: str
    normalized_digest: str
    reason: str
    licence: str
    licence_name: str
    excerpt: ActorStamp
    extraction: str
    normalization: str
    x_fields: _containers.MessageMap[str, _struct_pb2.Value]
    unrecognized: _containers.MessageMap[str, _struct_pb2.Value]
    def __init__(self, citation_text: _Optional[str] = ..., citation: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ..., received: _Optional[_Union[Received, _Mapping]] = ..., status: _Optional[_Union[SourceStatus, str]] = ..., normalized: _Optional[str] = ..., normalized_digest: _Optional[str] = ..., reason: _Optional[str] = ..., licence: _Optional[str] = ..., licence_name: _Optional[str] = ..., excerpt: _Optional[_Union[ActorStamp, _Mapping]] = ..., extraction: _Optional[str] = ..., normalization: _Optional[str] = ..., x_fields: _Optional[_Mapping[str, _struct_pb2.Value]] = ..., unrecognized: _Optional[_Mapping[str, _struct_pb2.Value]] = ...) -> None: ...

class SourceList(_message.Message):
    __slots__ = ("type", "sources", "x_fields", "unrecognized")
    class SourcesEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: Source
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[Source, _Mapping]] = ...) -> None: ...
    class XFieldsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _struct_pb2.Value
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ...) -> None: ...
    class UnrecognizedEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _struct_pb2.Value
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ...) -> None: ...
    TYPE_FIELD_NUMBER: _ClassVar[int]
    SOURCES_FIELD_NUMBER: _ClassVar[int]
    X_FIELDS_FIELD_NUMBER: _ClassVar[int]
    UNRECOGNIZED_FIELD_NUMBER: _ClassVar[int]
    type: str
    sources: _containers.MessageMap[str, Source]
    x_fields: _containers.MessageMap[str, _struct_pb2.Value]
    unrecognized: _containers.MessageMap[str, _struct_pb2.Value]
    def __init__(self, type: _Optional[str] = ..., sources: _Optional[_Mapping[str, Source]] = ..., x_fields: _Optional[_Mapping[str, _struct_pb2.Value]] = ..., unrecognized: _Optional[_Mapping[str, _struct_pb2.Value]] = ...) -> None: ...

class Narrative(_message.Message):
    __slots__ = ("type", "title", "corpus", "created", "body", "bindings", "unrecognized")
    class UnrecognizedEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _struct_pb2.Value
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ...) -> None: ...
    TYPE_FIELD_NUMBER: _ClassVar[int]
    TITLE_FIELD_NUMBER: _ClassVar[int]
    CORPUS_FIELD_NUMBER: _ClassVar[int]
    CREATED_FIELD_NUMBER: _ClassVar[int]
    BODY_FIELD_NUMBER: _ClassVar[int]
    BINDINGS_FIELD_NUMBER: _ClassVar[int]
    UNRECOGNIZED_FIELD_NUMBER: _ClassVar[int]
    type: str
    title: str
    corpus: str
    created: ActorStamp
    body: str
    bindings: _containers.RepeatedCompositeFieldContainer[NarrativeBinding]
    unrecognized: _containers.MessageMap[str, _struct_pb2.Value]
    def __init__(self, type: _Optional[str] = ..., title: _Optional[str] = ..., corpus: _Optional[str] = ..., created: _Optional[_Union[ActorStamp, _Mapping]] = ..., body: _Optional[str] = ..., bindings: _Optional[_Iterable[_Union[NarrativeBinding, _Mapping]]] = ..., unrecognized: _Optional[_Mapping[str, _struct_pb2.Value]] = ...) -> None: ...

class NarrativeBinding(_message.Message):
    __slots__ = ("claim_ids", "anchor", "bound_at", "raw", "well_formed")
    CLAIM_IDS_FIELD_NUMBER: _ClassVar[int]
    ANCHOR_FIELD_NUMBER: _ClassVar[int]
    BOUND_AT_FIELD_NUMBER: _ClassVar[int]
    RAW_FIELD_NUMBER: _ClassVar[int]
    WELL_FORMED_FIELD_NUMBER: _ClassVar[int]
    claim_ids: _containers.RepeatedScalarFieldContainer[str]
    anchor: str
    bound_at: str
    raw: str
    well_formed: bool
    def __init__(self, claim_ids: _Optional[_Iterable[str]] = ..., anchor: _Optional[str] = ..., bound_at: _Optional[str] = ..., raw: _Optional[str] = ..., well_formed: _Optional[bool] = ...) -> None: ...

class Corpus(_message.Message):
    __slots__ = ("declaration", "source_list", "atoms", "claims", "surveys", "narratives", "opaque")
    DECLARATION_FIELD_NUMBER: _ClassVar[int]
    SOURCE_LIST_FIELD_NUMBER: _ClassVar[int]
    ATOMS_FIELD_NUMBER: _ClassVar[int]
    CLAIMS_FIELD_NUMBER: _ClassVar[int]
    SURVEYS_FIELD_NUMBER: _ClassVar[int]
    NARRATIVES_FIELD_NUMBER: _ClassVar[int]
    OPAQUE_FIELD_NUMBER: _ClassVar[int]
    declaration: CorpusDeclaration
    source_list: SourceList
    atoms: _containers.RepeatedCompositeFieldContainer[Atom]
    claims: _containers.RepeatedCompositeFieldContainer[Claim]
    surveys: _containers.RepeatedCompositeFieldContainer[Survey]
    narratives: _containers.RepeatedCompositeFieldContainer[Narrative]
    opaque: _containers.RepeatedCompositeFieldContainer[OpaqueFile]
    def __init__(self, declaration: _Optional[_Union[CorpusDeclaration, _Mapping]] = ..., source_list: _Optional[_Union[SourceList, _Mapping]] = ..., atoms: _Optional[_Iterable[_Union[Atom, _Mapping]]] = ..., claims: _Optional[_Iterable[_Union[Claim, _Mapping]]] = ..., surveys: _Optional[_Iterable[_Union[Survey, _Mapping]]] = ..., narratives: _Optional[_Iterable[_Union[Narrative, _Mapping]]] = ..., opaque: _Optional[_Iterable[_Union[OpaqueFile, _Mapping]]] = ...) -> None: ...

class OpaqueFile(_message.Message):
    __slots__ = ("path", "type_value", "frontmatter", "body")
    class FrontmatterEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _struct_pb2.Value
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ...) -> None: ...
    PATH_FIELD_NUMBER: _ClassVar[int]
    TYPE_VALUE_FIELD_NUMBER: _ClassVar[int]
    FRONTMATTER_FIELD_NUMBER: _ClassVar[int]
    BODY_FIELD_NUMBER: _ClassVar[int]
    path: str
    type_value: str
    frontmatter: _containers.MessageMap[str, _struct_pb2.Value]
    body: str
    def __init__(self, path: _Optional[str] = ..., type_value: _Optional[str] = ..., frontmatter: _Optional[_Mapping[str, _struct_pb2.Value]] = ..., body: _Optional[str] = ...) -> None: ...
