import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateCoachStats } from '@/lib/prioritization'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      essayId,
      summaryFeedback,
      strengths,
      priorityRevisions,
      overallGuidance,
      inlineComments,
      rubricScores,
      status,
      reviewSessionId,
    } = body

    if (!essayId || !summaryFeedback) {
      return NextResponse.json(
        { error: 'Essay ID and summary feedback are required' },
        { status: 400 }
      )
    }

    // Verify essay exists
    const essay = await prisma.essay.findUnique({
      where: { id: essayId },
      include: {
        drafts: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    })

    if (!essay) {
      return NextResponse.json({ error: 'Essay not found' }, { status: 404 })
    }

    if (essay.drafts.length === 0) {
      return NextResponse.json(
        { error: 'Essay has no drafts to review' },
        { status: 400 }
      )
    }

    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        essayId,
        coachId: session.user.id,
        draftVersionReviewed: essay.drafts[0].versionNumber,
        summaryFeedback,
        strengths,
        priorityRevisions,
        overallGuidance,
        inlineComments: inlineComments ? JSON.stringify(inlineComments) : null,
        rubricScores: rubricScores || null,
      },
    })

    // Update essay status
    const newStatus = status || 'NEEDS_REVISION'
    await prisma.essay.update({
      where: { id: essayId },
      data: {
        status: newStatus,
      },
    })

    // Create notification for student
    const statusText = newStatus === 'APPROVED'
      ? 'Your essay has been approved!'
      : 'Your coach has left feedback for you to review.'

    await prisma.studentNotification.create({
      data: {
        userId: essay.userId,
        essayId,
        type: 'FEEDBACK_POSTED',
        title: `Feedback Ready: ${essay.title}`,
        message: statusText,
      },
    })

    // Complete the review session if one exists
    let reviewDurationMinutes = 0
    if (reviewSessionId) {
      const reviewSession = await prisma.reviewSession.findUnique({
        where: { id: reviewSessionId },
      })

      if (reviewSession && reviewSession.coachId === session.user.id) {
        const endedAt = new Date()
        reviewDurationMinutes = Math.floor(
          (endedAt.getTime() - new Date(reviewSession.startedAt).getTime()) / 60000
        )

        await prisma.reviewSession.update({
          where: { id: reviewSessionId },
          data: {
            status: 'COMPLETED',
            endedAt,
            durationMinutes: reviewDurationMinutes,
            draftFeedback: null,
            draftComments: null,
          },
        })

        // Update work session essay count if applicable
        if (reviewSession.workSessionId) {
          await prisma.coachWorkSession.update({
            where: { id: reviewSession.workSessionId },
            data: {
              essaysCompleted: { increment: 1 },
            },
          })
        }

        // Update coach stats
        await updateCoachStats(session.user.id, reviewDurationMinutes, essay.wordCount)
      }
    } else {
      // Check for any in-progress review session for this essay
      const activeReview = await prisma.reviewSession.findFirst({
        where: {
          essayId,
          coachId: session.user.id,
          status: 'IN_PROGRESS',
        },
      })

      if (activeReview) {
        const endedAt = new Date()
        reviewDurationMinutes = Math.floor(
          (endedAt.getTime() - new Date(activeReview.startedAt).getTime()) / 60000
        )

        await prisma.reviewSession.update({
          where: { id: activeReview.id },
          data: {
            status: 'COMPLETED',
            endedAt,
            durationMinutes: reviewDurationMinutes,
            draftFeedback: null,
            draftComments: null,
          },
        })

        if (activeReview.workSessionId) {
          await prisma.coachWorkSession.update({
            where: { id: activeReview.workSessionId },
            data: {
              essaysCompleted: { increment: 1 },
            },
          })
        }

        await updateCoachStats(session.user.id, reviewDurationMinutes, essay.wordCount)
      }
    }

    return NextResponse.json({ ...feedback, reviewDurationMinutes }, { status: 201 })
  } catch (error) {
    console.error('Error creating feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const essayId = searchParams.get('essayId')

    if (!essayId) {
      return NextResponse.json(
        { error: 'Essay ID is required' },
        { status: 400 }
      )
    }

    // Verify essay ownership or coach access
    const essay = await prisma.essay.findUnique({
      where: { id: essayId },
    })

    if (!essay) {
      return NextResponse.json({ error: 'Essay not found' }, { status: 404 })
    }

    // Students can only view feedback for their own essays
    // Coaches can view feedback they've given
    if (
      session.user.role === 'STUDENT' &&
      essay.userId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const feedback = await prisma.feedback.findMany({
      where: { essayId },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
