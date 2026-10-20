import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get coach availability
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const availability = await prisma.coachAvailability.findMany({
      where: { coachId: session.user.id },
      orderBy: [
        { dayOfWeek: 'asc' },
        { specificDate: 'asc' },
      ],
    })

    // Separate recurring and one-time
    const recurring = availability.filter(a => a.dayOfWeek !== null)
    const blackouts = availability.filter(a => a.specificDate !== null && a.isBlackout)

    return NextResponse.json({ recurring, blackouts })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create availability slot
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { dayOfWeek, startTime, endTime, specificDate, isBlackout } = body

    // Validate input
    if (dayOfWeek === undefined && !specificDate) {
      return NextResponse.json(
        { error: 'Either dayOfWeek or specificDate is required' },
        { status: 400 }
      )
    }

    // For recurring availability
    if (dayOfWeek !== undefined) {
      // Check for existing slot on same day
      const existing = await prisma.coachAvailability.findFirst({
        where: {
          coachId: session.user.id,
          dayOfWeek,
        },
      })

      if (existing) {
        // Update existing
        const updated = await prisma.coachAvailability.update({
          where: { id: existing.id },
          data: {
            startTime,
            endTime,
            isBlackout: isBlackout || false,
          },
        })
        return NextResponse.json(updated)
      }
    }

    // Create new availability
    const availability = await prisma.coachAvailability.create({
      data: {
        coachId: session.user.id,
        dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : null,
        startTime,
        endTime,
        specificDate: specificDate ? new Date(specificDate) : null,
        isBlackout: isBlackout || false,
      },
    })

    return NextResponse.json(availability, { status: 201 })
  } catch (error) {
    console.error('Error creating availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove availability slot
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Verify ownership
    const availability = await prisma.coachAvailability.findUnique({
      where: { id },
    })

    if (!availability) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (availability.coachId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.coachAvailability.delete({
      where: { id },
    })

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('Error deleting availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
