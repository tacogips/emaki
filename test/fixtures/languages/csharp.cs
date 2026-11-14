#region Sample
class Demo {
  /// documentation
  string title = "Example";
  string text = @"a""b";
  string message = $"{x}";
  int count = 42;
  bool ready = true;
  int Add(int first, int second) {
    int result = first + second;
    /* multi-line comment
       preserves its state
       while this code is edited */
    return result;
  }
  void Reset() {
    count = 0;
    ready = false;
  }
  string Name() {
    return title;
  }
}
#endregion
