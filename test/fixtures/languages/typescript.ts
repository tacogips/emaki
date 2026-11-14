// example
interface Box { value: unknown }
const count: number = 12;
const text: string = "hi";
type Result = Box | never;
enum Status { Ready, Done }
declare const ready: boolean;
const box: Box = { value: text };
function identity<T>(value: T): T {
  return value;
}
const selected = identity<Box>(box);
const checked = selected satisfies Box;
const answer = checked as Box;
class Store {
  readonly value: unknown;
  constructor(value: unknown) {
    this.value = value;
  }
}
/* A typed store. */
export { Store, answer, count, ready };
