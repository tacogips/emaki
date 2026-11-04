module demo;
struct Counter {
  int value;
  int next() {
    return value + 1;
  }
}
auto text = `raw`;
int count = 42;
/+ outer /+ inner +/ end +/
int calculate(int value) {
  /+ multiline comment
     remains open here
     and closes later +/
  return value + count;
}
void reset() {
  count = 0;
}
int twice(int value) {
  return value * 2;
}
