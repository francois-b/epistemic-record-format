# Probe: what does Psych (Ruby's bundled YAML) actually return for scalars the
# ERF spec assumes are strings? Run: ruby probes/psych_probe.rb
require 'yaml'
require 'psych'

def show(label, yaml)
  begin
    v = Psych.load(yaml)
  rescue => e
    v = "!! #{e.class}: #{e.message}"
  end
  if v.is_a?(Hash)
    v.each do |k, val|
      printf("  %-34s key=%-14s (%-8s)  val=%-24s (%s)\n",
             label, k.inspect, k.class, val.inspect, val.class)
    end
  else
    printf("  %-34s -> %-30s (%s)\n", label, v.inspect, v.class)
  end
end

puts "RUBY #{RUBY_VERSION}  PSYCH #{Psych::VERSION}  libyaml #{Psych::LIBYAML_VERSION rescue '?'}"
puts
puts "== 1. Timestamps the spec writes unquoted in its own examples =="
show("created.timestamp bare date",  "timestamp: 2026-07-19")
show("received.timestamp bare date", "timestamp: 2026-08-23")
show("standing full instant",        "timestamp: 2026-08-23T14:02:00Z")
show("instant with offset",          "timestamp: 2026-08-23T14:02:00+02:00")
show("quoted date",                  "timestamp: '2026-07-19'")
show("as_of_date year only",         "as_of_date: 2018")
show("as_of_date year-month",        "as_of_date: 2018-06")
show("bound-at style date",          "d: 2026-08-23")

puts
puts "== 2. YAML 1.1 boolean words (JSON schema: all of these are strings) =="
%w[yes no on off y n Y N true false True TRUE Off ~ null Null NULL].each do |w|
  show("scalar #{w.inspect}", "v: #{w}")
end

puts
puts "== 3. YAML 1.1 boolean words as MAPPING KEYS (source ids / family names) =="
["no: {}", "on: {}", "y: {}", "off: {}", "null: {}", "2026-08-23: {}", "1984: {}",
 "012: {}", "1.0: {}"].each do |y|
  show("key #{y[0, y.index(':')].inspect}", y)
end

puts
puts "== 4. Numbers: hits_reported MUST be text (ERF-27) =="
show("hits_reported 0",     "hits_reported: 0")
show("hits_reported '0'",   "hits_reported: '0'")
show("hits_reported 012",   "hits_reported: 012")
show("hits_reported 0o12",  "hits_reported: 0o12")
show("hits_reported 1_000", "hits_reported: 1_000")
show("hits_reported 1:30",  "hits_reported: 1:30")
show("hits_reported 12:30:00", "hits_reported: 12:30:00")
show("hits_reported .inf",  "hits_reported: .inf")
show("hits_reported .nan",  "hits_reported: .nan")
show("hits_reported 0x1F",  "hits_reported: 0x1F")
show("hits_reported +3",    "hits_reported: +3")
show("query 'no'",          "query: no")
show("scope '~120'",        "scope: ~120")

puts
puts "== 5. Digest / id shaped scalars =="
show("digest unquoted", "digest: sha256:05e58ce3f2")
show("id kwg-117",      "id: kwg-117")
show("id 2026-08-22",   "id: 2026-08-22")
show("survey id ending in date", "id: granted-flag-uses-2026-08-22")
show("actor agent/claude", "by: agent/claude-fable-5")
show("actor human:fb",  "by: human:francois")

puts
puts "== 6. Things ERF-66 forbids: duplicate keys, anchors, aliases, tags =="
show("duplicate key", "a: 1\na: 2")
show("anchor+alias",  "a: &x 1\nb: *x")
show("explicit tag",  "a: !!str 7")
show("merge key",     "a: &x {p: 1}\nb: {<<: *x, q: 2}")

puts
puts "== 7. Round-trip: what does a Ruby producer EMIT? =="
require 'date'
puts "  Date object          -> #{ {'timestamp' => Date.new(2026,8,23)}.to_yaml.inspect }"
puts "  String '2026-08-23'  -> #{ {'timestamp' => '2026-08-23'}.to_yaml.inspect }"
puts "  String '0'           -> #{ {'hits_reported' => '0'}.to_yaml.inspect }"
puts "  String 'no'          -> #{ {'query' => 'no'}.to_yaml.inspect }"
puts "  Time object          -> #{ {'timestamp' => Time.utc(2026,8,23,14,2,0)}.to_yaml.inspect }"

puts
puts "== 8. NFKC + normalization primitives (ERF-51) =="
s = "ﬁrst   café  x ‘q’ — …"
puts "  raw           #{s.inspect}"
puts "  NFKC          #{s.unicode_normalize(:nfkc).inspect}"
puts "  NBSP->space?  #{" ".unicode_normalize(:nfkc) == ' '}"
puts "  thin->space?  #{" ".unicode_normalize(:nfkc) == ' '}"
puts "  ellipsis      #{"…".unicode_normalize(:nfkc).inspect}"
puts "  emdash        #{"—".unicode_normalize(:nfkc).inspect}"
puts "  curly quote   #{"‘".unicode_normalize(:nfkc).inspect}"
puts "  ligature fi   #{"ﬁ".unicode_normalize(:nfkc).inspect}"
puts "  \\s vs [[:space:]] on NEL: #{"" =~ /\s/ ? 'ascii-s matches' : 'ascii-s NO'} / #{"" =~ /[[:space:]]/ ? 'posix matches' : 'posix NO'}"

puts
puts "== 9. AST-level access needed to implement ERF-65 (JSON schema) =="
doc = Psych.parse_stream("a: 2026-08-23\nb: '2026-08-23'\nc: \"x\"\nd: no\n")
doc.children[0].root.children.each_slice(2) do |k, v|
  printf("  %-4s value=%-14s quoted=%-6s style=%-2s tag=%s\n",
         k.value, v.value.inspect, v.quoted, v.style, v.tag.inspect)
end
