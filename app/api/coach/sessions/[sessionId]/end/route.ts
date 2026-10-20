import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - End a work session
export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await params
    const body = await req.json()
    const { elapsedMinutes } = body

    // Verify the session belongs to this coach
    const workSession = await prisma.coachWorkSession.findUnique({
      where: { id: sessionId },
      include: {
        reviewSessions: {
          where: { status: 'COMPLETED' },
        },
      },
    })

    if (!workSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (workSession.coachId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (workSession.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Session is not active' },
        { status: 400 }
      )
    }

    // Calculate actual duration
    const actualDuration = elapsedMinutes ||
      Math.floor((Date.now() - new Date(workSession.startedAt).getTime()) / 60000)

    // Update work session
    const updatedSession = await prisma.coachWorkSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        actualDurationMinutes: actualDuration,
        essaysCompleted: workSession.reviewSessions.length,
      },
    })

    // Mark any in-progress review sessions as PAUSED
    await prisma.reviewSession.updateMany({
      where: {
        workSessionId: sessionId,
        status: 'IN_PROGRESS',
      },
      data: {
        status: 'PAUSED',
      },
    })

    // Update coach stats
    const existingStats = await prisma.coachStats.findUnique({
      where: { coachId: session.user.id },
    })

    if (existingStats) {
      const newTotalSessions = existingStats.totalWorkSessions + 1
      const newTotalMinutes = existingStats.totalWorkMinutes + actualDuration

      await prisma.coachStats.update({
        where: { coachId: session.user.id },
        data: {
          totalWorkSessions: newTotalSessions,
          totalWorkMinutes: newTotalMinutes,
          avgSessionDurationMinutes: newTotalMinutes / newTotalSessions,
        },
      })
    } else {
      await prisma.coachStats.create({
        data: {
          coachId: session.user.id,
          totalWorkSessions: 1,
          totalWorkMinutes: actualDuration,
          avgSessionDurationMinutes: actualDuration,
        },
      })
    }

    return NextResponse.json({
      session: updatedSession,
      summary: {
        plannedMinutes: workSession.plannedDurationMinutes,
        actualMinutes: actualDuration,
        essaysCompleted: workSession.reviewSessions.length,
      },
    })
  } catch (error) {
    console.error('Error ending work session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
