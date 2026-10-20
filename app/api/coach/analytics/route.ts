import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  calculatePriorityScore,
  estimateReviewMinutes,
  getDaysUntilDeadline,
  getDaysSinceSubmission,
  estimateQueueClearanceDate,
  calculateDeadlineRisk,
  calculateRequiredDailyRate,
} from '@/lib/prioritization'

// GET - Get analytics data for coach dashboard
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const coachId = session.user.id

    // Get coach stats
    const coachStats = await prisma.coachStats.findUnique({
      where: { coachId },
    })

    // Get pending essays
    const pendingEssays = await prisma.essay.findMany({
      where: {
        status: { in: ['SUBMITTED', 'IN_REVIEW'] },
      },
      include: {
        feedback: { select: { id: true } },
        application: { select: { deadline: true } },
      },
    })

    // Calculate workload summary
    const essaysWithEstimates = pendingEssays.map(essay => ({
      ...essay,
      estimatedMinutes: estimateReviewMinutes(
        { wordCount: essay.wordCount, feedback: essay.feedback },
        coachStats
      ),
      priorityScore: calculatePriorityScore({
        submittedAt: essay.submittedAt,
        studentUrgentFlag: essay.studentUrgentFlag,
        feedback: essay.feedback,
        application: essay.application,
      }),
      riskScore: calculateDeadlineRisk({
        submittedAt: essay.submittedAt,
        feedback: essay.feedback,
        application: essay.application,
      }),
      daysSinceSubmit: getDaysSinceSubmission(essay.submittedAt),
    }))

    const totalPendingMinutes = essaysWithEstimates.reduce(
      (sum, e) => sum + e.estimatedMinutes,
      0
    )

    const criticalCount = essaysWithEstimates.filter(e => e.priorityScore >= 70).length
    const overdueCount = essaysWithEstimates.filter(e => {
      const days = getDaysUntilDeadline(e.application?.deadline ?? null)
      return days !== null && days < 0
    }).length
    const firstReviewCount = essaysWithEstimates.filter(e => e.feedback.length === 0).length

    // Get queue clearance estimate
    const clearanceDate = await estimateQueueClearanceDate(coachId, totalPendingMinutes)

    // Get review velocity (last 4 weeks)
    const fourWeeksAgo = new Date()
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

    const recentReviews = await prisma.reviewSession.findMany({
      where: {
        coachId,
        status: 'COMPLETED',
        endedAt: { gte: fourWeeksAgo },
      },
      select: {
        endedAt: true,
        durationMinutes: true,
      },
    })

    // Group by week for chart
    const weeklyData = getWeeklyData(recentReviews)

    // Get work session history
    const recentSessions = await prisma.coachWorkSession.findMany({
      where: {
        coachId,
        status: 'COMPLETED',
        endedAt: { gte: fourWeeksAgo },
      },
      select: {
        startedAt: true,
        endedAt: true,
        actualDurationMinutes: true,
        essaysCompleted: true,
      },
    })

    // Calculate averages
    const avgSessionDuration = recentSessions.length > 0
      ? Math.round(
          recentSessions.reduce((sum, s) => sum + (s.actualDurationMinutes || 0), 0) /
          recentSessions.length
        )
      : 0

    const avgEssaysPerSession = recentSessions.length > 0
      ? Math.round(
          recentSessions.reduce((sum, s) => sum + s.essaysCompleted, 0) /
          recentSessions.length * 10
        ) / 10
      : 0

    // Get all-time stats
    const totalFeedback = await prisma.feedback.count({
      where: { coachId },
    })

    // Calculate risk metrics
    const atRiskEssays = essaysWithEstimates.filter(e => e.riskScore >= 50)
    const criticalRiskCount = essaysWithEstimates.filter(e => e.riskScore >= 70).length
    const highRiskCount = essaysWithEstimates.filter(e => e.riskScore >= 50 && e.riskScore < 70).length

    // Risk distribution
    const riskDistribution = {
      critical: essaysWithEstimates.filter(e => e.riskScore >= 70).length,
      high: essaysWithEstimates.filter(e => e.riskScore >= 50 && e.riskScore < 70).length,
      medium: essaysWithEstimates.filter(e => e.riskScore >= 30 && e.riskScore < 50).length,
      low: essaysWithEstimates.filter(e => e.riskScore < 30).length,
    }

    // Students waiting longest (top 5)
    const studentsWaitingLongest = essaysWithEstimates
      .filter(e => e.daysSinceSubmit !== null && e.daysSinceSubmit > 0)
      .sort((a, b) => (b.daysSinceSubmit || 0) - (a.daysSinceSubmit || 0))
      .slice(0, 5)
      .map(e => ({
        essayId: e.id,
        essayTitle: e.title,
        studentId: e.userId,
        daysWaiting: e.daysSinceSubmit,
        isFirstReview: e.feedback.length === 0,
        deadline: e.application?.deadline || null,
        riskScore: e.riskScore,
      }))

    // Calculate required daily rate to meet deadlines
    const requiredRate = calculateRequiredDailyRate(essaysWithEstimates, coachStats || undefined)

    // "On Track" status calculation
    let onTrackStatus: 'green' | 'yellow' | 'red' = 'green'
    if (criticalRiskCount > 0 || overdueCount > 0) {
      onTrackStatus = 'red'
    } else if (highRiskCount > 0 || atRiskEssays.length > pendingEssays.length * 0.3) {
      onTrackStatus = 'yellow'
    }

    return NextResponse.json({
      workload: {
        pendingEssays: pendingEssays.length,
        totalPendingMinutes,
        totalPendingHours: Math.round(totalPendingMinutes / 60 * 10) / 10,
        criticalCount,
        overdueCount,
        firstReviewCount,
        clearanceDate: clearanceDate?.toISOString() || null,
      },
      velocity: {
        weeklyData,
        totalReviewsLast4Weeks: recentReviews.length,
        avgReviewsPerWeek: Math.round(recentReviews.length / 4 * 10) / 10,
      },
      sessions: {
        sessionsLast4Weeks: recentSessions.length,
        avgSessionDuration,
        avgEssaysPerSession,
      },
      allTime: {
        totalFeedback,
        totalReviewMinutes: coachStats?.totalReviewMinutes || 0,
        totalReviewHours: Math.round((coachStats?.totalReviewMinutes || 0) / 60 * 10) / 10,
        avgMinutesPerReview: Math.round(coachStats?.avgMinutesPerReview || 0),
        avgMinutesPerHundredWords: Math.round((coachStats?.avgMinutesPerHundredWords || 3) * 10) / 10,
      },
      // New risk & tracking metrics
      risk: {
        atRiskCount: atRiskEssays.length,
        criticalRiskCount,
        highRiskCount,
        distribution: riskDistribution,
      },
      tracking: {
        onTrackStatus,
        studentsWaitingLongest,
        requiredDailyReviews: requiredRate.reviewsPerDay,
        requiredDailyHours: requiredRate.hoursPerDay,
      },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getWeeklyData(reviews: { endedAt: Date | null; durationMinutes: number | null }[]) {
  const weeks: { week: string; reviews: number; minutes: number }[] = []

  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - (i * 7 + weekStart.getDay()))
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const weekReviews = reviews.filter(r => {
      if (!r.endedAt) return false
      const date = new Date(r.endedAt)
      return date >= weekStart && date <= weekEnd
    })

    weeks.push({
      week: `Week ${4 - i}`,
      reviews: weekReviews.length,
      minutes: weekReviews.reduce((sum, r) => sum + (r.durationMinutes || 0), 0),
    })
  }

  return weeks
}
