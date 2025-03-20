<!-- App.vue -->
<template>
  <div class="app-root">
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
