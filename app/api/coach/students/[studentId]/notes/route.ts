import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH - Update coach notes for a student
export async function PATCH(
  req: Request,
  { params }: { params: { studentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { notes } = await req.json()

    // Update or create the student-coach relationship with notes
    const studentCoach = await prisma.studentCoach.upsert({
      where: {
        studentId_coachId: {
          studentId: params.studentId,
          coachId: session.user.id,
        },
      },
      update: {
        coachNotes: notes,
        updatedAt: new Date(),
      },
      create: {
        studentId: params.studentId,
        coachId: session.user.id,
        coachNotes: notes,
      },
      select: {
        coachNotes: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(studentCoach)
  } catch (error) {
    console.error('Error updating coach notes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get coach notes for a student
export async function GET(
  req: Request,
  { params }: { params: { studentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const studentCoach = await prisma.studentCoach.findUnique({
      where: {
        studentId_coachId: {
          studentId: params.studentId,
          coachId: session.user.id,
        },
      },
      select: {
        coachNotes: true,
        creditsRemaining: true,
        package: {
          select: {
            name: true,
            reviewCredits: true,
          },
        },
      },
    })

    return NextResponse.json({
      coachNotes: studentCoach?.coachNotes || null,
      creditsRemaining: studentCoach?.creditsRemaining || null,
      packageName: studentCoach?.package?.name || null,
      totalCredits: studentCoach?.package?.reviewCredits || null,
    })
  } catch (error) {
    console.error('Error fetching coach notes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
