import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get all cohorts for coach
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cohorts = await prisma.studentCohort.findMany({
      where: { coachId: session.user.id },
      include: {
        members: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Enrich with essay stats
    const cohortsWithStats = await Promise.all(
      cohorts.map(async (cohort) => {
        const studentIds = cohort.members.map(m => m.studentId)

        if (studentIds.length === 0) {
          return {
            ...cohort,
            stats: {
              totalEssays: 0,
              completedEssays: 0,
              pendingEssays: 0,
            },
          }
        }

        const essays = await prisma.essay.findMany({
          where: {
            userId: { in: studentIds },
          },
          select: {
            status: true,
          },
        })

        const completedStatuses = ['APPROVED']
        const pendingStatuses = ['SUBMITTED', 'IN_REVIEW']

        return {
          ...cohort,
          stats: {
            totalEssays: essays.length,
            completedEssays: essays.filter(e => completedStatuses.includes(e.status)).length,
            pendingEssays: essays.filter(e => pendingStatuses.includes(e.status)).length,
          },
        }
      })
    )

    return NextResponse.json(cohortsWithStats)
  } catch (error) {
    console.error('Error fetching cohorts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new cohort
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, color } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const cohort = await prisma.studentCohort.create({
      data: {
        coachId: session.user.id,
        name,
        description: description || null,
        color: color || '#3b82f6', // Default blue
      },
      include: {
        members: true,
      },
    })

    return NextResponse.json(cohort, { status: 201 })
  } catch (error) {
    console.error('Error creating cohort:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update cohort
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, name, description, color } = body

    if (!id) {
      return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 })
    }

    // Verify ownership
    const existing = await prisma.studentCohort.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 })
    }

    if (existing.coachId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const cohort = await prisma.studentCohort.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        description: description !== undefined ? description : existing.description,
        color: color !== undefined ? color : existing.color,
      },
    })

    return NextResponse.json(cohort)
  } catch (error) {
    console.error('Error updating cohort:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete cohort
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 })
    }

    // Verify ownership
    const existing = await prisma.studentCohort.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 })
    }

    if (existing.coachId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.studentCohort.delete({
      where: { id },
    })

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('Error deleting cohort:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
