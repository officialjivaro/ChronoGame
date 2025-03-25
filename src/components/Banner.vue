<!-- Banner.vue -->
<template>
  <div class="banner-wrapper">
    <header class="main-banner">
      <h1 class="banner-title">ChronoGame</h1>
    </header>
    <div class="button-banner">
      <a
        href="https://jivaro.net/misc/games-and-fun-by-category"
        target="_top"
        class="games-fun-btn"
      >
        Games & Fun
      </a>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Banner'
}
</script>

<style scoped>
.banner-wrapper {
  width: 100%;
  height: 10vh;
  position: relative;
  overflow: hidden;
  margin: 0;
}
.main-banner {
  width: 100%;
  height: 100%;
  background: #333;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
}
.banner-title {
  font-size: 2rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  margin: 0;
}
.button-banner {
  position: absolute;
  top: 50%;
  left: 2vw;
  transform: translateY(-50%);
}
.games-fun-btn {
  font-size: 1rem;
  text-decoration: none;
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
  transition: all 0.2s ease-in-out;
  background-color: #444;
}
.games-fun-btn:hover {
  background-color: #222;
  transform: translateY(-2px);
}
.games-fun-btn:active {
  background-color: #111;
  transform: translateY(0);
}
</style>
