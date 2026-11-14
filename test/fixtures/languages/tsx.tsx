// example
interface Box { value: unknown }
const count = 1;
const view = <Button title="hello">Hi</Button>;
type Props = { label: string };
function App(props: Props) {
  const active: boolean = true;
  return <section className="app">
    <h1>{props.label}</h1>
    <Button title="More" onClick={() => count + 1} />
    {active && <span>Ready</span>}
  </section>;
}
/* A typed component. */
const footer = <footer>End</footer>;
const values: number[] = [1, 2, 3];
function identity<T>(value: T): T {
  return value;
}
const first = identity(values[0]);
export { App, view, footer, first };
