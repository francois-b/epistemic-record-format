use yaml_rust2::parser::{Parser, Event, EventReceiver};
use yaml_rust2::scanner::{TScalarStyle, Marker};
struct R;
impl EventReceiver for R {
    fn on_event(&mut self, ev: Event) { println!("{:?}", ev); }
}
fn main() {
    let s = "a: 1\nb: &x hi\nc: *x\nd: !!str 5\na: dup\ne: \"1\"\nf: 2026-08-22\n";
    let mut p = Parser::new_from_str(s);
    let mut r = R;
    p.load(&mut r, true).unwrap();
    let _ = std::mem::size_of::<Marker>();
    let _ = TScalarStyle::Plain;
}
