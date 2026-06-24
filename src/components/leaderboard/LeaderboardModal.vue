<template>
  <transition name="modal-fade">
    <div
      v-if="leaderboardOpen"
      class="leaderboard-overlay"
      role="presentation"
      @click.self="close"
    >
      <ArcadePanel class="leaderboard-modal" :accent="true" role="dialog" aria-modal="true" aria-labelledby="leaderboard-title">
        <button class="modal-close" type="button" aria-label="Close leaderboard" @click="close">×</button>

        <div class="leaderboard-heading">
          <span>Online Rankings</span>
          <h2 id="leaderboard-title">Top Timeline Hunters</h2>
          <p>Each mode shows the best saved score for every signed-in player.</p>
        </div>

        <div class="mode-tabs" role="tablist" aria-label="Leaderboard mode">
          <button
            v-for="modeId in modeOrder"
            :key="modeId"
            type="button"
            role="tab"
            :aria-selected="selectedMode === modeId"
            :class="['mode-tab', { active: selectedMode === modeId }]"
            @click="selectMode(modeId)"
          >
            {{ modes[modeId].name }}
          </button>
        </div>

        <p v-if="selectedMode === 'daily'" class="daily-label">
          UTC challenge: {{ activeDailyDate }}
        </p>

        <div v-if="!configured" class="leaderboard-state">
          Online rankings are unavailable until Supabase is configured.
        </div>
        <div v-else-if="loading" class="leaderboard-state">Loading scores…</div>
        <div v-else-if="error" class="leaderboard-state leaderboard-error" role="alert">
          {{ error }}
          <button type="button" @click="loadEntries">Try Again</button>
        </div>
        <div v-else-if="!entries.length" class="leaderboard-state">
          No saved scores yet. The cabinet awaits its first champion.
        </div>

        <div v-else class="leaderboard-table-wrap internal-scroll">
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th scope="col">Rank</th>
                <th scope="col">Player</th>
                <th scope="col">Score</th>
                <th scope="col">Rounds</th>
                <th scope="col">Avg. Miss</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in entries" :key="`${entry.rank}-${entry.display_name}`">
                <td class="rank-cell">#{{ entry.rank }}</td>
                <td>{{ entry.display_name }}</td>
                <td class="score-cell">{{ Number(entry.score).toLocaleString() }}</td>
                <td>{{ entry.rounds_completed }}</td>
                <td>{{ Number(entry.average_year_error).toFixed(1) }} yrs</td>
              </tr>
            </tbody>
          </table>
        </div>
      </ArcadePanel>
    </div>
  </transition>
</template>

<script>
import { mapState } from 'vuex'
import ArcadePanel from '../common/ArcadePanel.vue'
import { GAME_MODES, MODE_ORDER } from '../../config/gameModes.js'
import { getUtcDateKey } from '../../utils/dailyChallenge.js'
import { fetchLeaderboard } from '../../services/onlineScores.js'

export default {
  name: 'LeaderboardModal',
  components: {
    ArcadePanel
  },
  props: {
    initialMode: {
      type: String,
      default: 'classic'
    },
    dailyDateKey: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      modes: GAME_MODES,
      modeOrder: MODE_ORDER,
      selectedMode: 'classic',
      entries: [],
      loading: false,
      error: ''
    }
  },
  computed: {
    ...mapState('online', ['leaderboardOpen', 'configured']),
    activeDailyDate() {
      return this.dailyDateKey || getUtcDateKey()
    }
  },
  watch: {
    leaderboardOpen(open) {
      if (!open) return
      this.selectedMode = GAME_MODES[this.initialMode] ? this.initialMode : 'classic'
      this.loadEntries()
      window.addEventListener('keydown', this.handleKeydown)
    }
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown)
  },
  methods: {
    close() {
      this.$store.commit('online/setLeaderboardOpen', false)
      window.removeEventListener('keydown', this.handleKeydown)
    },
    handleKeydown(event) {
      if (event.key === 'Escape') this.close()
    },
    selectMode(modeId) {
      if (this.selectedMode === modeId) return
      this.selectedMode = modeId
      this.loadEntries()
    },
    async loadEntries() {
      if (!this.configured) return

      this.loading = true
      this.error = ''

      try {
        this.entries = await fetchLeaderboard({
          modeId: this.selectedMode,
          dailyDate: this.selectedMode === 'daily' ? this.activeDailyDate : null,
          limit: 25
        })
      } catch (error) {
        this.entries = []
        this.error = error.message || 'The leaderboard could not be loaded.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.leaderboard-overlay {
  position: fixed;
  z-index: calc(var(--z-modal) + 10);
  inset: 0;
  display: grid;
  place-items: center;
  padding: clamp(0.55rem, 2vw, 1.5rem);
  background: rgba(3, 4, 6, 0.82);
  backdrop-filter: blur(8px);
}

.leaderboard-modal {
  width: min(62rem, 100%);
  max-height: 90dvh;
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr);
  gap: var(--space-2);
  padding: clamp(0.8rem, 2.2vw, 1.6rem);
  overflow: hidden;
}

.modal-close {
  position: absolute;
  z-index: 3;
  top: 0.65rem;
  right: 0.75rem;
  width: 2.35rem;
  height: 2.35rem;
  color: var(--color-text);
  font-size: 1.7rem;
  line-height: 1;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: var(--radius-small);
  background: #20232a;
  cursor: pointer;
}

.leaderboard-heading span {
  color: var(--color-accent-bright);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.leaderboard-heading h2 {
  margin: 0.25rem 0 0.35rem;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 4vw, 2.25rem);
}

.leaderboard-heading p,
.daily-label {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.72rem;
}

.mode-tabs {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.35rem;
}

.mode-tab {
  min-height: 2.5rem;
  padding: 0.4rem;
  color: var(--color-text-muted);
  font-size: clamp(0.56rem, 1vw, 0.72rem);
  font-weight: 800;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-small);
  background: rgba(0, 0, 0, 0.24);
  cursor: pointer;
}

.mode-tab.active {
  color: #1a1009;
  border-color: #ffbd82;
  background: linear-gradient(180deg, #ffb66f, #ff8a32);
}

.daily-label {
  text-align: center;
}

.leaderboard-state {
  min-height: 10rem;
  display: grid;
  place-items: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
  text-align: center;
}

.leaderboard-state button {
  color: var(--color-accent-bright);
  background: transparent;
  cursor: pointer;
}

.leaderboard-error {
  color: var(--color-danger);
}

.leaderboard-table-wrap {
  min-height: 0;
  overflow: auto;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-small);
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
  font-size: clamp(0.64rem, 1.2vw, 0.82rem);
}

.leaderboard-table th,
.leaderboard-table td {
  padding: 0.62rem 0.7rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.leaderboard-table th {
  position: sticky;
  top: 0;
  color: var(--color-text-muted);
  font-size: 0.58rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  background: #171a20;
}

.leaderboard-table tbody tr:nth-child(odd) {
  background: rgba(255, 255, 255, 0.018);
}

.rank-cell,
.score-cell {
  color: var(--color-accent-bright);
  font-family: var(--font-display);
  font-weight: 800;
}

@media (max-width: 620px) {
  .mode-tabs {
    grid-template-columns: repeat(5, minmax(2.8rem, 1fr));
  }

  .mode-tab {
    font-size: 0.5rem;
  }

  .leaderboard-table th:nth-child(4),
  .leaderboard-table td:nth-child(4) {
    display: none;
  }
}
</style>
