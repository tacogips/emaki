@interface Demo
@property int value;
@end
class Widget {
public:
  int count = 42;
  int next() { return count + 1; }
};
@implementation Demo
- (int)calculate {
  /* explanatory comment
     remains open here
     until this line ends */
  Widget item;
  return item.next();
}
- (id)label {
  return @"str";
}
- (void)reset {
  self.value = 0;
}
@end
