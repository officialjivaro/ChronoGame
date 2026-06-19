<template>
  <AppShell>
    <router-view v-slot="{ Component, route }">
      <transition name="route-fade" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </transition>
    </router-view>
  </AppShell>
</template>

<script>
import AppShell from './components/layout/AppShell.vue'

export default {
  name: 'App',
  components: {
    AppShell
  }
}
</script>
