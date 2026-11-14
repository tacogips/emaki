package demo
// example counter
var count = 42
var ready = true
func add(first int, second int) int {
  return first + second
}
func sample() {
  value := add(count, 2)
  var text = `hello
world`
  /* multiline comment
     remains open here
     while the edit occurs */
  if ready {
    count = value
  }
  _ = text
}
func reset() {
  count = 0
}
