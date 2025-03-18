<!-- src/App.vue -->
<template>
  <div>
    <Banner />
    <router-view />
  </div>
</template>

<script>
import Banner from './components/Banner.vue'
export default {
  name: 'App',
  components: {
    Banner
  }
}
</script>
