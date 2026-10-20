import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const essay = await prisma.essay.findUnique({
      where: { id: params.id },
      include: {
        application: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        drafts: {
          orderBy: { versionNumber: 'desc' },
        },
        feedback: {
          include: {
            coach: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!essay) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Students can only access their own essays
    if (session.user.role !== 'COACH' && essay.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // If coach is viewing, include coach-specific context
    if (session.user.role === 'COACH') {
      // Get coach notes for this student
      const studentCoach = await prisma.studentCoach.findUnique({
        where: {
          studentId_coachId: {
            studentId: essay.userId,
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

      // Get student's other essays for context
      const studentOtherEssays = await prisma.essay.findMany({
        where: {
          userId: essay.userId,
          id: { not: essay.id },
        },
        select: {
          id: true,
          title: true,
          status: true,
          application: {
            select: {
              schoolName: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      })

      // Get student's cohort memberships
      const cohortMemberships = await prisma.cohortMember.findMany({
        where: { studentId: essay.userId },
        include: {
          cohort: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      })

      return NextResponse.json({
        ...essay,
        coachContext: {
          coachNotes: studentCoach?.coachNotes || null,
          creditsRemaining: studentCoach?.creditsRemaining || null,
          packageName: studentCoach?.package?.name || null,
          reviewCredits: studentCoach?.package?.reviewCredits || null,
          studentOtherEssays,
          cohorts: cohortMemberships.map(m => m.cohort),
        },
      })
    }

    return NextResponse.json(essay)
  } catch (error) {
    console.error('Error fetching essay:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, prompt, applicationId, status } = body

    // Verify ownership
    const existingEssay = await prisma.essay.findUnique({
      where: { id: params.id },
    })

    if (!existingEssay || existingEssay.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const essay = await prisma.essay.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(prompt !== undefined && { prompt }),
        ...(applicationId !== undefined && { applicationId }),
        ...(status && { status }),
      },
      include: {
        application: true,
      },
    })

    return NextResponse.json(essay)
  } catch (error) {
    console.error('Error updating essay:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const existingEssay = await prisma.essay.findUnique({
      where: { id: params.id },
    })

    if (!existingEssay || existingEssay.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.essay.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting essay:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
