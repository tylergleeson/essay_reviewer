import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get coach profile
    const coachProfile = await prisma.coachProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!coachProfile && session.user.role === 'COACH') {
      return NextResponse.json({ error: 'Coach profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const coachId = searchParams.get('coachId')

    // If coachId is provided, get that coach's packages (for public viewing)
    // Otherwise, get the current user's packages
    const targetCoachId = coachId || (coachProfile?.id || '')

    const packages = await prisma.package.findMany({
      where: {
        coachId: targetCoachId,
      },
      include: {
        _count: {
          select: { studentCoaches: true },
        },
      },
      orderBy: {
        priceInCents: 'asc',
      },
    })

    return NextResponse.json(packages)
  } catch (error) {
    console.error('Error fetching packages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get coach profile
    const coachProfile = await prisma.coachProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!coachProfile) {
      return NextResponse.json({ error: 'Coach profile not found' }, { status: 404 })
    }

    const body = await req.json()
    const { name, reviewCredits, priceInCents, isActive } = body

    if (!name || !reviewCredits || priceInCents === undefined) {
      return NextResponse.json(
        { error: 'Name, review credits, and price are required' },
        { status: 400 }
      )
    }

    if (reviewCredits < 1) {
      return NextResponse.json(
        { error: 'Review credits must be at least 1' },
        { status: 400 }
      )
    }

    if (priceInCents < 0) {
      return NextResponse.json(
        { error: 'Price cannot be negative' },
        { status: 400 }
      )
    }

    const package_ = await prisma.package.create({
      data: {
        coachId: coachProfile.id,
        name,
        reviewCredits,
        priceInCents,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json(package_, { status: 201 })
  } catch (error) {
    console.error('Error creating package:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
