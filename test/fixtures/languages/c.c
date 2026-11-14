#include <stdio.h>
int sum(int first, int second) {
  int value = first + second;
  return value;
}
int main(void) {
  char c = '\n';
  int n = 0x1Fu;
  int total = sum(n, 2);
  if (total > 0) {
    /* multi-line
       comment stays open
       across this midpoint */
    total = total + 1;
  }
  printf("%d", total);
  if (c == 0) {
    return 1;
  }
  return 0;
}
