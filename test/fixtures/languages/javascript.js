// example
const r = /a+b/g;
const total = 1_000n;
const t = `hello world`;
const binary = 0b1;
const ratio = total / 2 / 3;
const nested = `value ${ {a: 1}.a }`;
const multi = `first
second
third`;
function choose(value) {
  if (value) return /yes/i;
  return /no/;
}
/* A block comment
   continues here. */
const result = choose(true);
const list = [1, 2, 3];
for (const item of list) {
  console.log(item);
}
export { result };
