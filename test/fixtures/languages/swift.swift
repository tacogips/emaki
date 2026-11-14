#if DEBUG
@objc class Demo {
  let number = 42
  let enabled = true
  let label = "sample"
  func count() -> Int {
    return number
  }
  let text = """
  hello
  multiline content
  remains open here
  until closing quotes
  """
  /* outer comment
     /* nested inner comment */
     outer continues */
  func display() {
    print(text)
  }
}
#endif
