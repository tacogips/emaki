<!-- example -->
<script lang="ts">
interface Box { value: unknown }
const count = 1;
const title = "Hello";
function increment() {
  return count + 1;
}
</script>
<style>
a { color: red; }
.card { width: 12px; }
</style>
<template>
<p class="hello">{{ true }}</p>
<section id="content">
  <h1>{{ title }}</h1>
  <button @click="increment">Add</button>
  <span>{{ count }}</span>
</section>
</template>
