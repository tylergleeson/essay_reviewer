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
    const { studentId } = body

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

    // Get coach profile
    const coachProfile = await prisma.coachProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!coachProfile) {
      return NextResponse.json(
        { error: 'Coach profile not found' },
        { status: 404 }
      )
    }

    // Find the student-coach relationship
    const studentCoach = await prisma.studentCoach.findUnique({
      where: {
        studentId_coachId: {
          studentId,
          coachId: coachProfile.id,
        },
      },
    })

    if (!studentCoach) {
      return NextResponse.json(
        { error: 'No credit relationship found with this student' },
        { status: 404 }
      )
    }

    if (studentCoach.creditsRemaining <= 0) {
      return NextResponse.json(
        { error: 'Student has no credits remaining' },
        { status: 400 }
      )
    }

    // Deduct 1 credit
    const updated = await prisma.studentCoach.update({
      where: { id: studentCoach.id },
      data: {
        creditsRemaining: {
          decrement: 1,
        },
      },
    })

    return NextResponse.json({
      creditsRemaining: updated.creditsRemaining,
      message: 'Credit deducted successfully',
    })
  } catch (error) {
    console.error('Error deducting credit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
