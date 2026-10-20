import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Save draft feedback (auto-save)
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
    const body = await req.json()
    const { feedback, comments } = body

    // Verify review session belongs to this coach
    const reviewSession = await prisma.reviewSession.findUnique({
      where: { id: reviewId },
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

    // Save draft
    const updated = await prisma.reviewSession.update({
      where: { id: reviewId },
      data: {
        draftFeedback: feedback ? JSON.stringify(feedback) : null,
        draftComments: comments ? JSON.stringify(comments) : null,
        lastSavedAt: new Date(),
      },
    })

    return NextResponse.json({
      saved: true,
      lastSavedAt: updated.lastSavedAt,
    })
  } catch (error) {
    console.error('Error saving draft:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get draft feedback
export async function GET(
  req: Request,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reviewId } = await params

    const reviewSession = await prisma.reviewSession.findUnique({
      where: { id: reviewId },
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

    let feedback = null
    let comments = null

    try {
      if (reviewSession.draftFeedback) {
        feedback = JSON.parse(reviewSession.draftFeedback)
      }
      if (reviewSession.draftComments) {
        comments = JSON.parse(reviewSession.draftComments)
      }
    } catch {
      // Invalid JSON, return null
    }

    return NextResponse.json({
      feedback,
      comments,
      lastSavedAt: reviewSession.lastSavedAt,
    })
  } catch (error) {
    console.error('Error fetching draft:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
