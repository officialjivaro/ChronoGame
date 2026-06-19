// Round Scoring | Preserves the current score curve and cut-off behavior
export function calculateRoundScore(selectedYear, correctYear) {
  const difference = Math.abs(selectedYear - correctYear)
  const decayRate = 0.2027
  const exponent = 1.3
  const rawScore = 1000 * Math.exp(-decayRate * Math.pow(difference, exponent))
  let score = Math.floor(rawScore)

  if (score > 1000) score = 1000
  if (score < 1 && difference > 15) score = 0

  return score
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

// Run Ranking | Converts the final score into an arcade-style grade
export function getRunRank(totalScore, maxScore = 5000) {
  const ratio = maxScore > 0 ? totalScore / maxScore : 0

  if (ratio >= 0.9) {
    return { rank: 'S', message: 'Timeline master. The arcade cabinet is suspiciously impressed.' }
  }
  if (ratio >= 0.75) {
    return { rank: 'A', message: 'Excellent run. Your release-date radar is finely tuned.' }
  }
  if (ratio >= 0.55) {
    return { rank: 'B', message: 'A strong trip through gaming history with only a few timeline wobbles.' }
  }
  if (ratio >= 0.35) {
    return { rank: 'C', message: 'Respectable work. A second run could turn those near misses into big points.' }
  }
  return { rank: 'D', message: 'The timeline fought back. Insert another coin and give it one more go.' }
}
