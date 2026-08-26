# frozen_string_literal: true

module Erfval
  # Section 2: "A flag is not a violation." Two of the four severities below
  # are the spec's own; two are ours, and ambiguities.md #A1 records why.
  #
  #   :violation   - the corpus does not conform (a MUST was broken)
  #   :flag        - "something here is worth a person's attention"; a corpus
  #                  carrying flags and no violations conforms
  #   :unavailable - a check the spec says MUST be reported as not runnable
  #                  (ERF-51's non-text normalized text, ERF-32's
  #                  `indeterminate`). The spec never places this on the
  #                  violation/flag axis; we keep it separate rather than
  #                  guess.
  #   :info        - our own reporting channel (ERF-57 "report what you did
  #                  not recognize", plus the YAML divergence register).
  SEVERITIES = %i[violation flag unavailable info].freeze

  SEVERITY_LABEL = {
    violation: 'VIOLATION',
    flag: 'FLAG',
    unavailable: 'UNAVAILABLE',
    info: 'INFO'
  }.freeze

  Finding = Struct.new(:severity, :req, :where, :message, :detail) do
    def to_s
      s = format('%-11s %-9s %s', SEVERITY_LABEL[severity], req, where)
      s << "\n              #{message}"
      s << "\n              #{detail}" if detail && !detail.empty?
      s
    end

    def to_h
      { severity: severity, requirement: req, where: where,
        message: message, detail: detail }
    end
  end

  class Report
    attr_reader :findings

    def initialize
      @findings = []
    end

    def add(severity, req, where, message, detail = nil)
      raise ArgumentError, "bad severity #{severity}" unless SEVERITIES.include?(severity)

      @findings << Finding.new(severity, req, where.to_s, message, detail)
    end

    def violation(req, where, msg, detail = nil) = add(:violation, req, where, msg, detail)
    def flag(req, where, msg, detail = nil)      = add(:flag, req, where, msg, detail)
    def unavailable(req, where, msg, d = nil)    = add(:unavailable, req, where, msg, d)
    def info(req, where, msg, detail = nil)      = add(:info, req, where, msg, detail)

    def count(sev) = @findings.count { |f| f.severity == sev }
    def conforms? = count(:violation).zero?

    def requirements_touched
      @findings.map(&:req).uniq.sort
    end
  end
end
