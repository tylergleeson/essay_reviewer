import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
        inlineComments: inlineComments || null,
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

    // TODO: Decrement coach credits from StudentCoach if applicable
    // This would require checking if there's a StudentCoach relationship
    // and decrementing creditsRemaining

    // TODO: Send email notification to student

    return NextResponse.json(feedback, { status: 201 })
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
