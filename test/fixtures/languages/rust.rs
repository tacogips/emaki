#[derive(Debug)]
struct Counter {
    value: i32,
}
fn f<'a>(x: &'a str) {
    let c = 'z';
    let n = 42;
    let text = r#"hello
world"#;
    /* outer comment
       /* nested inner comment */
       still inside outer
       and ends here */
    macro!();
    let result = n + 1;
    if result > 0 {
        consume(x, text, c);
    }
}
fn consume(a: &str, b: &str, c: char) {
    let size = a.len() + b.len();
    let _value = (size, c);
}
