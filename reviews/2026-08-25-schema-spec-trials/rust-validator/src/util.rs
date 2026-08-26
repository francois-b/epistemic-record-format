//! Dates, instants, and the ERF-47 precision rule.

pub fn truncate(s: &str, n: usize) -> String {
    if s.chars().count() <= n {
        s.to_string()
    } else {
        format!("{}…", s.chars().take(n).collect::<String>())
    }
}

pub fn is_date_shape(s: &str) -> bool {
    let b = s.as_bytes();
    b.len() == 10
        && b[0..4].iter().all(u8::is_ascii_digit)
        && b[4] == b'-'
        && b[5..7].iter().all(u8::is_ascii_digit)
        && b[7] == b'-'
        && b[8..10].iter().all(u8::is_ascii_digit)
}

fn is_leap(y: i64) -> bool {
    (y % 4 == 0 && y % 100 != 0) || y % 400 == 0
}

pub fn days_in_month(y: i64, m: i64) -> i64 {
    match m {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 => {
            if is_leap(y) {
                29
            } else {
                28
            }
        }
        _ => 0,
    }
}

/// Howard Hinnant's days_from_civil.
fn days_from_civil(y: i64, m: i64, d: i64) -> i64 {
    let y = if m <= 2 { y - 1 } else { y };
    let era = if y >= 0 { y } else { y - 399 } / 400;
    let yoe = y - era * 400;
    let mp = (m + 9) % 12;
    let doy = (153 * mp + 2) / 5 + d - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    era * 146097 + doe - 719468
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Stamp {
    /// A bare RFC 3339 full-date. Nothing orders within it.
    Date { y: i64, m: i64, d: i64 },
    /// An RFC 3339 instant. `day` is the calendar day as written, in its own
    /// offset, which is what a bare date on the same day is compared against.
    Instant { utc: i64, y: i64, m: i64, d: i64 },
}

impl Stamp {
    pub fn day(&self) -> (i64, i64, i64) {
        match *self {
            Stamp::Date { y, m, d } | Stamp::Instant { y, m, d, .. } => (y, m, d),
        }
    }
    pub fn is_instant(&self) -> bool {
        matches!(self, Stamp::Instant { .. })
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Ord3 {
    Less,
    Equal,
    Greater,
    /// Two stamps of differing precision that land on the same day: the coarser
    /// one cannot order them (ERF-47).
    Indeterminate,
}

pub fn compare(a: &Stamp, b: &Stamp) -> Ord3 {
    match (a, b) {
        (Stamp::Instant { utc: x, .. }, Stamp::Instant { utc: y, .. }) => match x.cmp(y) {
            std::cmp::Ordering::Less => Ord3::Less,
            std::cmp::Ordering::Equal => Ord3::Equal,
            std::cmp::Ordering::Greater => Ord3::Greater,
        },
        _ => {
            let da = a.day();
            let db = b.day();
            if da < db {
                Ord3::Less
            } else if da > db {
                Ord3::Greater
            } else if a.is_instant() == b.is_instant() {
                Ord3::Equal
            } else {
                Ord3::Indeterminate
            }
        }
    }
}

/// Parse an RFC 3339 full-date or instant, rejecting impossible calendar dates.
pub fn parse_stamp(s: &str) -> Result<Stamp, String> {
    let b = s.as_bytes();
    if b.len() < 10 || !is_date_shape(&s[..10.min(s.len())]) {
        return Err(format!("`{}` is neither a full-date nor an instant", s));
    }
    let y: i64 = s[0..4].parse().unwrap();
    let m: i64 = s[5..7].parse().unwrap();
    let d: i64 = s[8..10].parse().unwrap();
    if !(1..=12).contains(&m) || d < 1 || d > days_in_month(y, m) {
        return Err(format!("`{}` is not a date on any calendar", s));
    }
    if s.len() == 10 {
        return Ok(Stamp::Date { y, m, d });
    }
    // instant
    let rest = &s[10..];
    let rb = rest.as_bytes();
    if rb.is_empty() || rb[0] != b'T' {
        return Err(format!("`{}` has a date and trailing text but no `T`", s));
    }
    let rest = &rest[1..];
    // HH:MM[:SS[.frac]] then Z or +/-HH:MM
    let (timepart, offpart) = if let Some(stripped) = rest.strip_suffix('Z') {
        (stripped, 0i64)
    } else {
        let n = rest.len();
        if n < 6 {
            return Err(format!("`{}` has no UTC offset", s));
        }
        let off = &rest[n - 6..];
        let ob = off.as_bytes();
        if (ob[0] != b'+' && ob[0] != b'-') || ob[3] != b':' {
            return Err(format!("`{}` has no UTC offset (ERF-19 wants one)", s));
        }
        let oh: i64 = off[1..3].parse().map_err(|_| format!("`{}`: bad offset", s))?;
        let om: i64 = off[4..6].parse().map_err(|_| format!("`{}`: bad offset", s))?;
        let sign = if ob[0] == b'-' { -1 } else { 1 };
        (&rest[..n - 6], sign * (oh * 3600 + om * 60))
    };
    let tb = timepart.as_bytes();
    if tb.len() < 5 || tb[2] != b':' {
        return Err(format!("`{}` has no HH:MM", s));
    }
    let hh: i64 = timepart[0..2]
        .parse()
        .map_err(|_| format!("`{}`: bad hour", s))?;
    let mi: i64 = timepart[3..5]
        .parse()
        .map_err(|_| format!("`{}`: bad minute", s))?;
    let mut ss: i64 = 0;
    if timepart.len() > 5 {
        if tb[5] != b':' {
            return Err(format!("`{}`: unexpected text after HH:MM", s));
        }
        ss = timepart[6..8]
            .parse()
            .map_err(|_| format!("`{}`: bad second", s))?;
    }
    if hh > 23 || mi > 59 || ss > 60 {
        return Err(format!("`{}` is not a time of day", s));
    }
    let utc = days_from_civil(y, m, d) * 86400 + hh * 3600 + mi * 60 + ss - offpart;
    Ok(Stamp::Instant { utc, y, m, d })
}
