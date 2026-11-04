//! Example module documentation
const std = @import("std");
const number = 42;
const enabled = true;
const message = \\a multiline string
;
fn add(first: i32, second: i32) i32 {
    return first + second;
}
pub fn main() void {
    const result = add(number, 1);
    const longer =
        \\first line
        \\second line
    ;
    _ = longer;
    if (enabled) {
        _ = result;
    }
    _ = message;
    _ = std;
}
fn twice(value: i32) i32 {
    return value * 2;
}
