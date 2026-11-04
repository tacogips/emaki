@interface Demo
@property int value;
@end
@interface Other
@property int count;
@end
@implementation Demo
- (int)calculate {
  int n = 42;
  int result = n + 1;
  /* explanatory comment
     remains open here
     until this line ends */
  return result;
}
- (void)reset {
  self.value = 0;
}
- (id)label {
  return @"str";
}
@end
