<!-- Banner.vue -->
<template>
  <nav class="navbar navbar-expand-md banner-bg">
    <div class="container-fluid align-items-center d-flex banner-container">
      <a
        href="https://jivaro.net/misc/games-and-fun-by-category"
        target="_top"
        class="games-fun-btn"
      >
        Games & Fun
      </a>
      <div class="banner-title">
        <h1>ChronoGame</h1>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'Banner'
}
</script>

<style scoped>
.banner-bg {
  background: #222;
  height: 5vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.banner-container {
  position: relative;
  width: 100%;
  height: 100%;
  align-items: center;
}
.banner-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: #f0f0f0;
  font-weight: 700;
  margin: 0;
}
.banner-title h1 {
  font-size: 1.8rem;
  margin: 0;
  text-shadow: 2px 3px 6px rgba(0,0,0,0.7);
}
</style>
