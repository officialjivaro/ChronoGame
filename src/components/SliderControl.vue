<template>
  <div class="slider-control">
    <div class="year-display">{{ yearValue }}</div>
    <input
      type="range"
      min="1960"
      max="2030"
      :value="yearValue"
      @input="onInput"
      class="custom-range"
    />
  </div>
</template>

<script>
export default {
  name: 'SliderControl',
  props: ['year'],
  data() {
    return {
      yearValue: this.year
    }
  },
  watch: {
    year(val) {
      this.yearValue = val
    }
  },
  methods: {
    onInput(e) {
      this.yearValue = parseInt(e.target.value)
      this.$emit('update-year', this.yearValue)
    }
  }
}
</script>

<style scoped>
.slider-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 1rem auto;
  width: 50%;
}

.year-display {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.custom-range {
  width: 100%;
  appearance: none;
  height: 6px;
  background-color: #444;
  border-radius: 3px;
  outline: none;
  cursor: pointer;
  transition: background 0.2s;
}

.custom-range::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #777;
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}
.custom-range::-webkit-slider-thumb:hover {
  background: #999;
  transform: scale(1.1);
}

.custom-range::-moz-range-track {
  height: 6px;
  background-color: #444;
  border-radius: 3px;
}
.custom-range::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #777;
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}
.custom-range::-moz-range-thumb:hover {
  background: #999;
  transform: scale(1.1);
}
</style>
