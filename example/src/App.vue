<template>
  <div>
    <div>
      <button @click="handleAdd">Add Item</button>
      <button @click="handleRemove">Remove Item</button>
    </div>

    <div ref="containerRef" class="container">
      <div class="wrapper">
        <div
          v-for="item of dataSource"
          :key="item"
          class="item"
          :style="{ background: item }"
        >
          {{ item }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Carousel from '@humandetail/carousel'
import '@humandetail/carousel/index.css'

const dataSource = ref<string[]>([
  '#abc',
  '#10a20b',
  '#0088ff'
])
const containerRef = ref<HTMLDivElement>()

onMounted(() => {
  if (containerRef.value) {
    new Carousel(containerRef.value, {
      loop: true
    })
  }
})

const handleAdd = () => {
  dataSource.value.push('#f40')
}

const handleRemove = () => {
  dataSource.value.shift()
}
</script>

<style lang="scss" scoped>
.item {
  width: 100%;
  aspect-ratio: 440 / 280;
}
</style>
