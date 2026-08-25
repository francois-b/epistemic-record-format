---
# ERF-57: "A consumer MUST preserve unknown fields and unknown record types as
# opaque data, MUST report them, and MUST NOT reject a corpus solely because it
# contains them."
#
# `type: question` is an unknown record type. A generated .proto has no message
# to parse it into: the set of message types is fixed at compile time, and no
# amount of unknown-FIELD retention helps, because the problem is the record
# type itself. The only home is an explicitly declared opaque bag, which means
# a schema serving the Consumer conformance class must be authored with the
# hatch already in it. See finding F7.
type: question
id: pt-q-001
corpus: proto-trial
title: "Does any deployment run two writers minting into one id space?"
opened: {timestamp: "2026-08-24", by: "human:francois"}
blocking: [presence-is-data]
---
The uniqueness note under ERF-52 defers content-addressed identity behind
exactly this trigger.
