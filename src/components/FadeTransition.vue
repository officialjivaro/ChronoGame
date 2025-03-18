<template>
    <transition name="fade">
      <div v-if="show" class="fade-container">
        <slot></slot>
      </div>
    </transition>
  </template>
  
  <script>
  export default {
    name: 'FadeTransition',
    props: ['show']
  }
  </script>
  
  <style scoped>
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s;
  }
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
  .fade-container {
    display: inline-block;
    width: 100%;
  }
  </style>
  