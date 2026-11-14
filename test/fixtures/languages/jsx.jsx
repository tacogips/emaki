// example
const count = 1;
const view = <Button title="hello">Hi</Button>;
const text = "hi";
function App() {
  const active = true;
  return <section className="app">
    <h1>{text}</h1>
    <Button title="More" onClick={() => count + 1} />
    {active && <span>Ready</span>}
  </section>;
}
/* Components may contain children. */
const footer = <footer>End</footer>;
const items = [1, 2, 3];
function label(item) {
  return <span>{item}</span>;
}
const first = label(items[0]);
const enabled = false;
export { App, view, footer, first, enabled };
