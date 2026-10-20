import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Create or get existing review session for an essay
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { essayId, workSessionId } = body

    if (!essayId) {
      return NextResponse.json(
        { error: 'Essay ID is required' },
        { status: 400 }
      )
    }

    // Check for existing in-progress or paused review session for this essay
    const existingSession = await prisma.reviewSession.findFirst({
      where: {
        essayId,
        coachId: session.user.id,
        status: { in: ['IN_PROGRESS', 'PAUSED'] },
      },
      orderBy: { updatedAt: 'desc' },
    })

    if (existingSession) {
      // Resume existing session
      const updated = await prisma.reviewSession.update({
        where: { id: existingSession.id },
        data: {
          status: 'IN_PROGRESS',
          workSessionId: workSessionId || existingSession.workSessionId,
        },
      })
      return NextResponse.json({ reviewSession: updated, resumed: true })
    }

    // Create new review session
    const reviewSession = await prisma.reviewSession.create({
      data: {
        essayId,
        coachId: session.user.id,
        workSessionId: workSessionId || null,
        status: 'IN_PROGRESS',
      },
    })

    // Update essay status to IN_REVIEW if needed
    await prisma.essay.update({
      where: { id: essayId },
      data: { status: 'IN_REVIEW' },
    })

    return NextResponse.json({ reviewSession, resumed: false }, { status: 201 })
  } catch (error) {
    console.error('Error creating review session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get in-progress review sessions for coach
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reviewSessions = await prisma.reviewSession.findMany({
      where: {
        coachId: session.user.id,
        status: { in: ['IN_PROGRESS', 'PAUSED'] },
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

    return NextResponse.json(reviewSessions)
  } catch (error) {
    console.error('Error fetching review sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
