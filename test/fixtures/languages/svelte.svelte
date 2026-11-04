<!-- example -->
<script>
let count = 1;
const title = "Hello";
function increment() {
  count = count + 1;
}
</script>
<style>
a { color: red; }
.card { width: 12px; }
</style>
{#if count}
<p class="hello">{count}</p>
{:else}
<p>Empty</p>
{/if}
{#each [1, 2] as item}
<span>{item}</span>
{/each}
<button on:click={increment}>{title}</button>
