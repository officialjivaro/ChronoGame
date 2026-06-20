// Round Scoring | Preserves the score curve and adds hints and feedback details
import { HINT_DEFINITIONS } from '../config/gameModes.js'

export function calculateRoundScore(selectedYear, correctYear) {
  const difference = Math.abs(Number(selectedYear) - Number(correctYear))
  const decayRate = 0.2027
  const exponent = 1.3
  const rawScore = 1000 * Math.exp(-decayRate * Math.pow(difference, exponent))
  let score = Math.floor(rawScore)

  if (score > 1000) score = 1000
  if (score < 1 && difference > 15) score = 0

  return score
}

export function getHintScoreCeiling(usedHints = []) {
  const penalty = [...new Set(usedHints)].reduce((total, hintId) => {
    return total + Number(HINT_DEFINITIONS[hintId]?.penalty || 0)
  }, 0)

  return Math.max(500, 1000 - penalty)
}

export function createRoundScoreResult(selectedYear, correctYear, usedHints = []) {
  const difference = Math.abs(Number(selectedYear) - Number(correctYear))
  const baseScore = calculateRoundScore(selectedYear, correctYear)
  const scoreCeiling = getHintScoreCeiling(usedHints)
  const score = Math.min(baseScore, scoreCeiling)

  return {
    selectedYear: Number(selectedYear),
    correctYear: Number(correctYear),
    difference,
    baseScore,
    score,
    scoreCeiling,
    usedHints: [...new Set(usedHints)]
  }
}

// Accuracy Feedback | Gives every distance a clear and playful response
export function getAccuracyFeedback(difference) {
  if (difference === 0) {
    return { label: 'Timeline Bullseye', message: 'Perfect hit. The timeline salutes you.' }
  }
  if (difference === 1) {
    return { label: 'Time-Traveler Close', message: 'One year off. Suspiciously time-traveler-like.' }
  }
  if (difference <= 3) {
    return { label: 'Very Close', message: 'Close enough to smell the launch-day plastic.' }
  }
  if (difference <= 7) {
    return { label: 'Right Neighborhood', message: 'Right neighborhood, wrong calendar.' }
  }
  if (difference <= 14) {
    return { label: 'Timeline Wobble', message: 'The timeline is wobbling, but it has not fallen over.' }
  }
  return { label: 'Scenic Route', message: 'That guess took the scenic route through gaming history.' }
}

// Performance Labels | Adds text meaning alongside score colors
export function getPerformanceBand(score) {
  if (score === 1000) {
    return { label: 'Perfect Hit', className: 'score-perfect' }
  }
  if (score >= 745) {
    return { label: 'Excellent', className: 'score-excellent' }
  }
  if (score >= 500) {
    return { label: 'Strong Guess', className: 'score-strong' }
  }
  if (score >= 250) {
    return { label: 'Off Target', className: 'score-close' }
  }
  return { label: 'Way Off', className: 'score-low' }
}

// Run Ranking | Converts fixed-round totals into an arcade-style grade
export function getRunRank(totalScore, maxScore = 10000) {
  const ratio = maxScore > 0 ? totalScore / maxScore : 0

  if (ratio >= 0.9) {
    return { rank: 'S', message: 'Timeline master. The arcade cabinet is suspiciously impressed.' }
  }
  if (ratio >= 0.75) {
    return { rank: 'A', message: 'Excellent run. Your release-date radar is finely tuned.' }
  }
  if (ratio >= 0.6) {
    return { rank: 'B', message: 'A strong trip through gaming history with only a few timeline wobbles.' }
  }
  if (ratio >= 0.4) {
    return { rank: 'C', message: 'Respectable work. A second run could turn those near misses into big points.' }
  }
  return { rank: 'D', message: 'The timeline fought back. Insert another coin and give it one more go.' }
}
