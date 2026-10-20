/**
 * Priority Score and Time Estimation Algorithms
 *
 * These algorithms power the smart queue and work session planning features.
 */

import { prisma } from './prisma'

// Types for essays with related data
export type EssayWithRelations = {
  id: string
  wordCount: number
  status: string
  submittedAt: Date | null
  studentUrgentFlag: boolean
  urgentFlagReason: string | null
  estimatedReviewMinutes: number | null
  priorityScore: number | null
  feedback: { id: string }[]
  application: {
    deadline: Date | null
    schoolName: string
  } | null
  user: {
    id: string
    name: string | null
    email: string
  }
  drafts: {
    id: string
    versionNumber: number
    wordCount: number
    content: string
    createdAt: Date
  }[]
}

export type CoachStatsType = {
  avgMinutesPerHundredWords: number | null
  avgMinutesPerReview: number | null
  totalReviewsCompleted: number
}

// Default values for time estimation
const DEFAULT_MINUTES_PER_100_WORDS = 3
const MINIMUM_REVIEW_MINUTES = 5
const REVISION_TIME_MULTIPLIER = 0.65 // Revisions are 35% faster

// Priority score weights (totals to 100)
const PRIORITY_WEIGHTS = {
  DEADLINE_URGENCY: 40,      // Max 40 points
  WAIT_TIME: 25,             // Max 25 points
  FIRST_REVIEW_BONUS: 15,    // Max 15 points
  STUDENT_URGENT_FLAG: 20,   // Max 20 points
}

/**
 * Calculate the priority score for an essay (0-100)
 * Higher score = higher priority
 */
export function calculatePriorityScore(essay: {
  submittedAt: Date | null
  studentUrgentFlag: boolean
  feedback: { id: string }[]
  application: { deadline: Date | null } | null
}): number {
  let score = 0
  const now = new Date()

  // 1. Deadline Urgency (0-40 points)
  if (essay.application?.deadline) {
    const deadline = new Date(essay.application.deadline)
    const daysUntilDeadline = Math.ceil(
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilDeadline <= 0) {
      score += PRIORITY_WEIGHTS.DEADLINE_URGENCY // 40 points - Overdue
    } else if (daysUntilDeadline <= 3) {
      score += 35 // Very urgent
    } else if (daysUntilDeadline <= 7) {
      score += 25 // Urgent
    } else if (daysUntilDeadline <= 14) {
      score += 15 // Moderate
    } else if (daysUntilDeadline <= 30) {
      score += 5 // Low urgency
    }
    // > 30 days = 0 points
  }

  // 2. Wait Time (0-25 points) - 3 points per day waiting, max 25
  if (essay.submittedAt) {
    const daysSinceSubmit = Math.floor(
      (now.getTime() - new Date(essay.submittedAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    score += Math.min(daysSinceSubmit * 3, PRIORITY_WEIGHTS.WAIT_TIME)
  }

  // 3. First Review Bonus (0-15 points) - New essays need faster turnaround
  if (essay.feedback.length === 0) {
    score += PRIORITY_WEIGHTS.FIRST_REVIEW_BONUS
  }

  // 4. Student Urgent Flag (0-20 points)
  if (essay.studentUrgentFlag) {
    score += PRIORITY_WEIGHTS.STUDENT_URGENT_FLAG
  }

  return Math.min(score, 100)
}

/**
 * Get priority level string from score
 */
export function getPriorityLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 70) return 'critical'
  if (score >= 50) return 'high'
  if (score >= 25) return 'medium'
  return 'low'
}

/**
 * Get priority color for UI display
 */
export function getPriorityColor(score: number): string {
  const level = getPriorityLevel(score)
  switch (level) {
    case 'critical': return 'red'
    case 'high': return 'orange'
    case 'medium': return 'yellow'
    case 'low': return 'green'
  }
}

/**
 * Estimate review time in minutes based on word count and coach velocity
 */
export function estimateReviewMinutes(
  essay: {
    wordCount: number
    feedback: { id: string }[]
  },
  coachStats?: CoachStatsType | null
): number {
  // Base rate: use coach's historical rate or default
  const baseRate = coachStats?.avgMinutesPerHundredWords ?? DEFAULT_MINUTES_PER_100_WORDS

  // Calculate base estimate from word count
  let estimate = (essay.wordCount / 100) * baseRate

  // Revision reviews are faster - coach already knows the essay
  if (essay.feedback.length > 0) {
    estimate *= REVISION_TIME_MULTIPLIER
  }

  // Apply minimum and round
  return Math.max(Math.round(estimate), MINIMUM_REVIEW_MINUTES)
}

/**
 * Format minutes as human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours}h`
  }
  return `${hours}h ${mins}m`
}

/**
 * Calculate days until deadline
 */
export function getDaysUntilDeadline(deadline: Date | null): number | null {
  if (!deadline) return null
  const now = new Date()
  const deadlineDate = new Date(deadline)
  return Math.ceil(
    (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
}

/**
 * Calculate days since submission
 */
export function getDaysSinceSubmission(submittedAt: Date | null): number | null {
  if (!submittedAt) return null
  const now = new Date()
  return Math.floor(
    (now.getTime() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24)
  )
}

/**
 * Get deadline urgency text
 */
export function getDeadlineText(deadline: Date | null): string {
  const days = getDaysUntilDeadline(deadline)
  if (days === null) return 'No deadline'
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `${days}d left`
}

/**
 * Get wait time text
 */
export function getWaitTimeText(submittedAt: Date | null): string {
  const days = getDaysSinceSubmission(submittedAt)
  if (days === null) return 'Not submitted'
  if (days === 0) return 'Today'
  if (days === 1) return '1 day'
  return `${days} days`
}

/**
 * Calculate deadline risk score (0-100)
 * Higher score = higher risk of missing deadline
 *
 * Risk factors:
 * - Time pressure: How close is the deadline?
 * - Wait penalty: How long has the student been waiting?
 * - First review bonus: First reviews are more critical
 */
export function calculateDeadlineRisk(essay: {
  submittedAt: Date | null
  feedback: { id: string }[]
  application: { deadline: Date | null } | null
}): number {
  let risk = 0

  const daysUntil = getDaysUntilDeadline(essay.application?.deadline ?? null)
  const daysSinceSubmit = getDaysSinceSubmission(essay.submittedAt)
  const isFirstReview = essay.feedback.length === 0

  // Time pressure (0-50 points)
  if (daysUntil !== null) {
    if (daysUntil <= 0) {
      risk += 50 // Past deadline - maximum time pressure
    } else if (daysUntil <= 3) {
      risk += 45 // Critical - 3 days or less
    } else if (daysUntil <= 7) {
      risk += 35 // Urgent - within a week
    } else if (daysUntil <= 14) {
      risk += 20 // Moderate - within 2 weeks
    } else if (daysUntil <= 21) {
      risk += 10 // Low - within 3 weeks
    }
    // More than 3 weeks = minimal time pressure
  }

  // Wait penalty (0-30 points)
  if (daysSinceSubmit !== null) {
    if (isFirstReview) {
      // First reviews: more aggressive wait penalty
      if (daysSinceSubmit > 5) risk += 30
      else if (daysSinceSubmit > 3) risk += 25
      else if (daysSinceSubmit > 2) risk += 15
      else if (daysSinceSubmit > 1) risk += 8
    } else {
      // Revisions: slightly more lenient
      if (daysSinceSubmit > 5) risk += 25
      else if (daysSinceSubmit > 3) risk += 20
      else if (daysSinceSubmit > 2) risk += 10
    }
  }

  // First review bonus (0-20 points)
  // First reviews are riskier because students need more lead time
  if (isFirstReview && daysUntil !== null && daysUntil <= 14) {
    risk += 20
  } else if (isFirstReview && daysUntil !== null && daysUntil <= 21) {
    risk += 10
  }

  return Math.min(risk, 100)
}

/**
 * Get risk level from score
 */
export function getRiskLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 70) return 'critical'
  if (score >= 50) return 'high'
  if (score >= 30) return 'medium'
  return 'low'
}

/**
 * Get risk color for UI display
 */
export function getRiskColor(score: number): string {
  const level = getRiskLevel(score)
  switch (level) {
    case 'critical': return 'red'
    case 'high': return 'orange'
    case 'medium': return 'yellow'
    case 'low': return 'green'
  }
}

/**
 * Get essays at risk of missing deadlines
 */
export function getAtRiskEssays<T extends {
  submittedAt: Date | null
  feedback: { id: string }[]
  application: { deadline: Date | null } | null
}>(essays: T[], threshold: number = 50): (T & { riskScore: number })[] {
  return essays
    .map(essay => ({
      ...essay,
      riskScore: calculateDeadlineRisk(essay),
    }))
    .filter(essay => essay.riskScore >= threshold)
    .sort((a, b) => b.riskScore - a.riskScore)
}

/**
 * Calculate required daily review rate to meet all deadlines
 */
export function calculateRequiredDailyRate(
  essays: {
    submittedAt: Date | null
    application: { deadline: Date | null } | null
    estimatedMinutes?: number
  }[],
  coachStats?: { avgMinutesPerReview: number | null }
): { reviewsPerDay: number; hoursPerDay: number } {
  const avgMinutes = coachStats?.avgMinutesPerReview || 15
  const now = new Date()

  // Group essays by deadline
  const essaysByDeadline = essays.reduce((acc, essay) => {
    const deadline = essay.application?.deadline
    if (!deadline) return acc

    const key = deadline.toISOString().split('T')[0]
    if (!acc[key]) acc[key] = []
    acc[key].push(essay)
    return acc
  }, {} as Record<string, typeof essays>)

  // Calculate how many essays need to be completed by each deadline
  let totalEssaysNeeded = 0
  let shortestDays = Infinity

  for (const [dateStr, essayGroup] of Object.entries(essaysByDeadline)) {
    const deadline = new Date(dateStr)
    const daysUntil = Math.max(1, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

    totalEssaysNeeded += essayGroup.length
    if (daysUntil < shortestDays) {
      shortestDays = daysUntil
    }
  }

  if (shortestDays === Infinity || totalEssaysNeeded === 0) {
    return { reviewsPerDay: 0, hoursPerDay: 0 }
  }

  // Simple approximation: distribute work evenly
  const reviewsPerDay = Math.ceil(totalEssaysNeeded / shortestDays * 10) / 10
  const hoursPerDay = Math.round((reviewsPerDay * avgMinutes) / 60 * 10) / 10

  return { reviewsPerDay, hoursPerDay }
}

/**
 * Select optimal essays for a given time budget
 * Uses a greedy algorithm that prioritizes high-priority essays first
 */
export function selectEssaysForSession(
  essays: (EssayWithRelations & { estimatedMinutes: number; priorityScore: number })[],
  availableMinutes: number
): (EssayWithRelations & { estimatedMinutes: number; priorityScore: number })[] {
  // Sort by priority (highest first)
  const sortedEssays = [...essays].sort((a, b) => b.priorityScore - a.priorityScore)

  const selected: (EssayWithRelations & { estimatedMinutes: number; priorityScore: number })[] = []
  let remainingMinutes = availableMinutes

  for (const essay of sortedEssays) {
    if (essay.estimatedMinutes <= remainingMinutes) {
      selected.push(essay)
      remainingMinutes -= essay.estimatedMinutes
    }
  }

  return selected
}

/**
 * Calculate total estimated time for a list of essays
 */
export function calculateTotalTime(
  essays: { estimatedMinutes?: number; estimatedReviewMinutes?: number | null }[]
): number {
  return essays.reduce((total, essay) => {
    return total + (essay.estimatedMinutes ?? essay.estimatedReviewMinutes ?? 0)
  }, 0)
}

/**
 * Get workload summary for a coach
 */
export async function getWorkloadSummary(coachId: string) {
  // Get pending essays
  const pendingEssays = await prisma.essay.findMany({
    where: {
      status: { in: ['SUBMITTED', 'IN_REVIEW'] },
    },
    include: {
      feedback: { select: { id: true } },
      application: { select: { deadline: true, schoolName: true } },
    },
  })

  // Get coach stats
  const coachStats = await prisma.coachStats.findUnique({
    where: { coachId },
  })

  // Calculate estimates
  const essaysWithEstimates = pendingEssays.map(essay => ({
    ...essay,
    estimatedMinutes: estimateReviewMinutes(essay, coachStats),
    priorityScore: calculatePriorityScore(essay),
  }))

  const totalMinutes = calculateTotalTime(essaysWithEstimates)
  const criticalCount = essaysWithEstimates.filter(e => e.priorityScore >= 70).length
  const overdueCount = essaysWithEstimates.filter(e => {
    if (!e.application?.deadline) return false
    return getDaysUntilDeadline(e.application.deadline)! < 0
  }).length

  return {
    totalEssays: pendingEssays.length,
    totalMinutes,
    totalHours: Math.round(totalMinutes / 60 * 10) / 10, // 1 decimal place
    criticalCount,
    overdueCount,
    essaysWithEstimates,
  }
}

/**
 * Update priority scores for all pending essays
 * Called periodically or when essays are submitted
 */
export async function updatePriorityScores() {
  const pendingEssays = await prisma.essay.findMany({
    where: {
      status: { in: ['SUBMITTED', 'IN_REVIEW'] },
    },
    include: {
      feedback: { select: { id: true } },
      application: { select: { deadline: true } },
    },
  })

  for (const essay of pendingEssays) {
    const priorityScore = calculatePriorityScore(essay)
    await prisma.essay.update({
      where: { id: essay.id },
      data: { priorityScore },
    })
  }

  return pendingEssays.length
}

/**
 * Update coach stats after a review is completed
 */
export async function updateCoachStats(
  coachId: string,
  reviewDurationMinutes: number,
  essayWordCount: number
) {
  const existing = await prisma.coachStats.findUnique({
    where: { coachId },
  })

  if (!existing) {
    // Create initial stats
    await prisma.coachStats.create({
      data: {
        coachId,
        totalReviewsCompleted: 1,
        totalReviewMinutes: reviewDurationMinutes,
        avgMinutesPerReview: reviewDurationMinutes,
        avgMinutesPerHundredWords: essayWordCount > 0
          ? (reviewDurationMinutes / (essayWordCount / 100))
          : DEFAULT_MINUTES_PER_100_WORDS,
      },
    })
  } else {
    // Update existing stats with rolling average
    const newTotalReviews = existing.totalReviewsCompleted + 1
    const newTotalMinutes = existing.totalReviewMinutes + reviewDurationMinutes
    const newAvgMinutes = newTotalMinutes / newTotalReviews

    // Calculate new words-per-minute avg with exponential smoothing
    const currentAvgPerHundred = existing.avgMinutesPerHundredWords ?? DEFAULT_MINUTES_PER_100_WORDS
    const newSamplePerHundred = essayWordCount > 0
      ? (reviewDurationMinutes / (essayWordCount / 100))
      : currentAvgPerHundred

    // Use exponential smoothing (alpha = 0.3 for recent data weight)
    const ALPHA = 0.3
    const smoothedAvgPerHundred = ALPHA * newSamplePerHundred + (1 - ALPHA) * currentAvgPerHundred

    await prisma.coachStats.update({
      where: { coachId },
      data: {
        totalReviewsCompleted: newTotalReviews,
        totalReviewMinutes: newTotalMinutes,
        avgMinutesPerReview: newAvgMinutes,
        avgMinutesPerHundredWords: smoothedAvgPerHundred,
      },
    })
  }
}

/**
 * Estimate queue clearance date based on coach availability
 */
export async function estimateQueueClearanceDate(
  coachId: string,
  totalPendingMinutes: number
): Promise<Date | null> {
  // Get coach availability
  const availability = await prisma.coachAvailability.findMany({
    where: {
      coachId,
      isBlackout: false,
    },
  })

  if (availability.length === 0) {
    // No availability set - estimate based on 2 hours per day
    const daysNeeded = Math.ceil(totalPendingMinutes / 120)
    const clearanceDate = new Date()
    clearanceDate.setDate(clearanceDate.getDate() + daysNeeded)
    return clearanceDate
  }

  // Calculate available minutes per week
  let weeklyMinutes = 0
  for (const slot of availability) {
    if (slot.dayOfWeek !== null && slot.startTime && slot.endTime) {
      const [startHour, startMin] = slot.startTime.split(':').map(Number)
      const [endHour, endMin] = slot.endTime.split(':').map(Number)
      const slotMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin)
      weeklyMinutes += slotMinutes
    }
  }

  if (weeklyMinutes === 0) {
    return null // Can't estimate without availability
  }

  const weeksNeeded = totalPendingMinutes / weeklyMinutes
  const daysNeeded = Math.ceil(weeksNeeded * 7)
  const clearanceDate = new Date()
  clearanceDate.setDate(clearanceDate.getDate() + daysNeeded)
  return clearanceDate
}
