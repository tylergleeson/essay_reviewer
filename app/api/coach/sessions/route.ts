import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Create a new work session
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { plannedDurationMinutes } = body

    // Check for existing active session
    const existingSession = await prisma.coachWorkSession.findFirst({
      where: {
        coachId: session.user.id,
        status: 'ACTIVE',
      },
    })

    if (existingSession) {
      return NextResponse.json(
        { error: 'You already have an active work session', sessionId: existingSession.id },
        { status: 400 }
      )
    }

    // Create new work session
    const workSession = await prisma.coachWorkSession.create({
      data: {
        coachId: session.user.id,
        plannedDurationMinutes: plannedDurationMinutes || null,
        status: 'ACTIVE',
      },
    })

    return NextResponse.json(workSession, { status: 201 })
  } catch (error) {
    console.error('Error creating work session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get current active session or recent sessions
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get('active') === 'true'

    if (activeOnly) {
      // Get active session
      const activeSession = await prisma.coachWorkSession.findFirst({
        where: {
          coachId: session.user.id,
          status: 'ACTIVE',
        },
        include: {
          reviewSessions: {
            include: {
              essay: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      })

      return NextResponse.json(activeSession)
    }

    // Get recent sessions
    const recentSessions = await prisma.coachWorkSession.findMany({
      where: {
        coachId: session.user.id,
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: 10,
      include: {
        reviewSessions: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    return NextResponse.json(recentSessions)
  } catch (error) {
    console.error('Error fetching work sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
