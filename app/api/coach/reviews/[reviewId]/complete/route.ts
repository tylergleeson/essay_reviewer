import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateCoachStats } from '@/lib/prioritization'

// POST - Complete a review session
export async function POST(
  req: Request,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reviewId } = await params

    // Verify review session belongs to this coach
    const reviewSession = await prisma.reviewSession.findUnique({
      where: { id: reviewId },
      include: {
        essay: true,
        workSession: true,
      },
    })

    if (!reviewSession) {
      return NextResponse.json(
        { error: 'Review session not found' },
        { status: 404 }
      )
    }

    if (reviewSession.coachId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Calculate duration
    const endedAt = new Date()
    const durationMinutes = Math.floor(
      (endedAt.getTime() - new Date(reviewSession.startedAt).getTime()) / 60000
    )

    // Update review session
    const updated = await prisma.reviewSession.update({
      where: { id: reviewId },
      data: {
        status: 'COMPLETED',
        endedAt,
        durationMinutes,
        draftFeedback: null, // Clear draft since feedback is submitted
        draftComments: null,
      },
    })

    // Update work session essay count if applicable
    if (reviewSession.workSessionId) {
      await prisma.coachWorkSession.update({
        where: { id: reviewSession.workSessionId },
        data: {
          essaysCompleted: {
            increment: 1,
          },
        },
      })
    }

    // Update coach stats with this review data
    await updateCoachStats(
      session.user.id,
      durationMinutes,
      reviewSession.essay.wordCount
    )

    return NextResponse.json({
      completed: true,
      durationMinutes,
      reviewSession: updated,
    })
  } catch (error) {
    console.error('Error completing review session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
