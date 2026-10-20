import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { QuickResumeCard } from '@/components/coach/QuickResumeCard'
import { PriorityQueue } from '@/components/coach/PriorityQueue'
import {
  calculatePriorityScore,
  estimateReviewMinutes,
  formatDuration,
  getDaysUntilDeadline,
  getDaysSinceSubmission,
  calculateDeadlineRisk,
  getRiskLevel,
} from '@/lib/prioritization'
import { RiskAlertBanner } from '@/components/coach/RiskAlertBanner'
import { StudentsWaitingLongest } from '@/components/coach/StudentsWaitingLongest'

async function getCoachData(userId: string) {
  // Get coach profile
  const coachProfile = await prisma.coachProfile.findUnique({
    where: { userId },
    include: {
      students: {
        include: {
          package: true,
        },
      },
    },
  })

  if (!coachProfile) {
    return null
  }

  // Get coach stats for time estimation
  const coachStats = await prisma.coachStats.findUnique({
    where: { coachId: userId },
  })

  // Get in-progress review session for Quick Resume
  const inProgressReview = await prisma.reviewSession.findFirst({
    where: {
      coachId: userId,
      status: 'IN_PROGRESS',
    },
    include: {
      essay: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          application: {
            select: { schoolName: true, deadline: true },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // Get essays pending review with all needed data
  const pendingEssays = await prisma.essay.findMany({
    where: {
      status: {
        in: ['SUBMITTED', 'IN_REVIEW'],
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      application: {
        select: {
          schoolName: true,
          deadline: true,
        },
      },
      drafts: {
        orderBy: { versionNumber: 'desc' },
        take: 1,
      },
      feedback: {
        select: { id: true },
      },
    },
  })

  // Get cohorts for filtering
  const cohorts = await prisma.studentCohort.findMany({
    where: { coachId: userId },
    include: {
      members: {
        select: { studentId: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Calculate priority scores, time estimates, and risk for each essay
  const essaysWithScores = pendingEssays.map((essay) => {
    const priorityScore = calculatePriorityScore({
      submittedAt: essay.submittedAt,
      studentUrgentFlag: essay.studentUrgentFlag,
      feedback: essay.feedback,
      application: essay.application,
    })

    const estimatedMinutes = estimateReviewMinutes(
      { wordCount: essay.wordCount, feedback: essay.feedback },
      coachStats
    )

    const riskScore = calculateDeadlineRisk({
      submittedAt: essay.submittedAt,
      feedback: essay.feedback,
      application: essay.application,
    })

    const daysSinceSubmit = getDaysSinceSubmission(essay.submittedAt)

    return {
      ...essay,
      priorityScore,
      estimatedReviewMinutes: estimatedMinutes,
      feedbackCount: essay.feedback.length,
      riskScore,
      riskLevel: getRiskLevel(riskScore),
      daysSinceSubmit,
    }
  })

  // Sort by priority score (highest first)
  essaysWithScores.sort((a, b) => b.priorityScore - a.priorityScore)

  // Calculate total estimated time
  const totalEstimatedMinutes = essaysWithScores.reduce(
    (sum, essay) => sum + essay.estimatedReviewMinutes,
    0
  )

  // Get recently reviewed essays
  const recentFeedback = await prisma.feedback.findMany({
    where: {
      coachId: userId,
    },
    include: {
      essay: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          application: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  })

  // Calculate stats
  const totalStudents = coachProfile.students.length
  const essaysReviewed = await prisma.feedback.count({
    where: { coachId: userId },
  })

  // Get active work session if any
  const activeWorkSession = await prisma.coachWorkSession.findFirst({
    where: {
      coachId: userId,
      status: 'ACTIVE',
    },
    orderBy: { startedAt: 'desc' },
  })

  // Count essays by urgency
  const overdueCount = essaysWithScores.filter((e) => {
    const days = getDaysUntilDeadline(e.application?.deadline ?? null)
    return days !== null && days < 0
  }).length

  const criticalCount = essaysWithScores.filter((e) => e.priorityScore >= 70).length

  // At-risk essays (risk score >= 50)
  const atRiskEssays = essaysWithScores.filter(e => e.riskScore >= 50)

  // Students waiting longest (sorted by days since submission)
  const studentsWaitingLongest = essaysWithScores
    .filter(e => e.daysSinceSubmit !== null && e.daysSinceSubmit > 0)
    .sort((a, b) => (b.daysSinceSubmit || 0) - (a.daysSinceSubmit || 0))
    .slice(0, 5)

  return {
    coachProfile,
    coachStats,
    pendingEssays: essaysWithScores,
    totalEstimatedMinutes,
    recentFeedback,
    totalStudents,
    essaysReviewed,
    inProgressReview,
    activeWorkSession,
    overdueCount,
    criticalCount,
    cohorts,
    atRiskEssays,
    studentsWaitingLongest,
  }
}

export default async function CoachDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/signin')
  }

  if (session.user.role !== 'COACH') {
    redirect('/dashboard')
  }

  const data = await getCoachData(session.user.id)

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-medium mb-2">Coach Profile Not Found</h3>
              <p className="text-gray-600">
                There was an error loading your coach profile.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Prepare in-progress review data for Quick Resume card
  const quickResumeData = data.inProgressReview
    ? {
        id: data.inProgressReview.id,
        essayId: data.inProgressReview.essayId,
        essayTitle: data.inProgressReview.essay.title,
        studentName: data.inProgressReview.essay.user.name || '',
        studentEmail: data.inProgressReview.essay.user.email,
        schoolName: data.inProgressReview.essay.application?.schoolName || null,
        startedAt: data.inProgressReview.startedAt,
        lastSavedAt: data.inProgressReview.lastSavedAt,
        draftFeedback: data.inProgressReview.draftFeedback,
        timeSpentMinutes: data.inProgressReview.durationMinutes ||
          Math.floor((Date.now() - new Date(data.inProgressReview.startedAt).getTime()) / 60000),
      }
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coach Dashboard</h1>
            <p className="text-sm text-gray-600">
              Welcome back, {session.user.name || session.user.email}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="default" asChild>
              <Link href="/coach/session">Start Session</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/coach/calendar">Calendar</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/coach/analytics">Analytics</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/coach/students">Students</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/coach/templates">Templates</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Risk Alert Banner - Shows when essays are at risk */}
        <RiskAlertBanner
          atRiskEssays={data.atRiskEssays}
          overdueCount={data.overdueCount}
        />

        {/* Quick Resume Card - Shows when there's an in-progress review */}
        {quickResumeData && (
          <div className="mb-6">
            <QuickResumeCard review={quickResumeData} />
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.pendingEssays.length}</div>
              <p className="text-xs text-gray-500">
                Est. {formatDuration(data.totalEstimatedMinutes)}
              </p>
            </CardContent>
          </Card>

          <Card className={data.criticalCount > 0 ? 'border-orange-200 bg-orange-50' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Critical Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${data.criticalCount > 0 ? 'text-orange-600' : ''}`}>
                {data.criticalCount}
              </div>
              <p className="text-xs text-gray-500">Score 70+</p>
            </CardContent>
          </Card>

          <Card className={data.overdueCount > 0 ? 'border-red-200 bg-red-50' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${data.overdueCount > 0 ? 'text-red-600' : ''}`}>
                {data.overdueCount}
              </div>
              <p className="text-xs text-gray-500">Past deadline</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Reviews Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.essaysReviewed}</div>
              {data.coachStats && (
                <p className="text-xs text-gray-500">
                  Avg {Math.round(data.coachStats.avgMinutesPerReview || 0)}m per review
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Review Queue and Students Waiting */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Review Queue</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/coach/session">
                  Plan Work Session
                </Link>
              </Button>
            </div>
            <PriorityQueue
              essays={data.pendingEssays}
              totalEstimatedMinutes={data.totalEstimatedMinutes}
              cohorts={data.cohorts}
            />
          </div>
          <div className="lg:col-span-1">
            <StudentsWaitingLongest essays={data.studentsWaitingLongest} />
          </div>
        </div>

        {/* Recent Feedback */}
        {data.recentFeedback.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Recent Feedback</h2>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {data.recentFeedback.map((feedback) => (
                    <div key={feedback.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{feedback.essay.title}</h3>
                          <p className="text-sm text-gray-600">
                            {feedback.essay.user.name || feedback.essay.user.email}
                            {feedback.essay.application && ` • ${feedback.essay.application.schoolName}`}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(feedback.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {feedback.summaryFeedback}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
