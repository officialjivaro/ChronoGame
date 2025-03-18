<template>
  <nav class="navbar navbar-expand-md banner-bg">
    <div class="container-fluid align-items-center d-flex" style="position: relative;">
      <a
        href="https://jivaro.net/misc/games-and-fun-by-category"
        target="_blank"
        class="games-fun-btn"
        style="margin-left: 2rem;"
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
  background: linear-gradient(135deg, #444 0%, #777 100%);
  padding: 0.5rem 0;
}

.banner-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  font-weight: 700;
  margin: 0;
}

.banner-title h1 {
  font-size: 1.8rem;
  margin: 0;
}

</style>
