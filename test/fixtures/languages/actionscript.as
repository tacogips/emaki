package demo {
  public class Demo {
    var text = "hello";
    var count = 42;
    var ready = true;
    function add(first:int, second:int):int {
      return first + second;
    }
    function run():void {
      var result = add(count, 1);
      /* multiline comment
         remains open here
         until this line closes */
      if (ready) {
        count = result;
      }
    }
    function reset():void {
      count = 0;
    }
  }
}
