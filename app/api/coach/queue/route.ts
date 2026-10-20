import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  calculatePriorityScore,
  estimateReviewMinutes,
} from '@/lib/prioritization'

// GET - Get prioritized queue of essays for review
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const cohortId = searchParams.get('cohortId')

    // Get coach stats for time estimation
    const coachStats = await prisma.coachStats.findUnique({
      where: { coachId: session.user.id },
    })

    // If cohort filter is applied, get student IDs in that cohort
    let studentIdsInCohort: string[] | null = null
    if (cohortId) {
      const cohortMembers = await prisma.cohortMember.findMany({
        where: { cohortId },
        select: { studentId: true },
      })
      studentIdsInCohort = cohortMembers.map(m => m.studentId)
    }

    // Get pending essays
    const pendingEssays = await prisma.essay.findMany({
      where: {
        status: { in: ['SUBMITTED', 'IN_REVIEW'] },
        ...(studentIdsInCohort ? { userId: { in: studentIdsInCohort } } : {}),
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
        feedback: {
          select: { id: true },
        },
      },
    })

    // Calculate priority scores and time estimates
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

      return {
        id: essay.id,
        title: essay.title,
        wordCount: essay.wordCount,
        studentName: essay.user.name || essay.user.email,
        schoolName: essay.application?.schoolName || null,
        priorityScore,
        estimatedMinutes,
        deadline: essay.application?.deadline || null,
        feedbackCount: essay.feedback.length,
      }
    })

    // Sort by priority (highest first)
    essaysWithScores.sort((a, b) => b.priorityScore - a.priorityScore)

    return NextResponse.json(essaysWithScores)
  } catch (error) {
    console.error('Error fetching queue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
