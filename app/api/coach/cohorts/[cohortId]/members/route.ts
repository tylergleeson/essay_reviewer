import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Add member to cohort
export async function POST(
  req: Request,
  { params }: { params: Promise<{ cohortId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cohortId } = await params
    const body = await req.json()
    const { studentId } = body

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 })
    }

    // Verify cohort ownership
    const cohort = await prisma.studentCohort.findUnique({
      where: { id: cohortId },
    })

    if (!cohort) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 })
    }

    if (cohort.coachId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Verify student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Check if already a member
    const existingMember = await prisma.cohortMember.findUnique({
      where: {
        cohortId_studentId: {
          cohortId,
          studentId,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'Student is already in this cohort' },
        { status: 400 }
      )
    }

    // Add member
    const member = await prisma.cohortMember.create({
      data: {
        cohortId,
        studentId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error adding cohort member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove member from cohort
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ cohortId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cohortId } = await params
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 })
    }

    // Verify cohort ownership
    const cohort = await prisma.studentCohort.findUnique({
      where: { id: cohortId },
    })

    if (!cohort) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 })
    }

    if (cohort.coachId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Remove member
    await prisma.cohortMember.delete({
      where: {
        cohortId_studentId: {
          cohortId,
          studentId,
        },
      },
    })

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('Error removing cohort member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
