import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { packageId } = body

    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      )
    }

    // Fetch the package and verify it's active
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
      include: {
        coach: true,
      },
    })

    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    if (!pkg.isActive) {
      return NextResponse.json(
        { error: 'This package is no longer available' },
        { status: 400 }
      )
    }

    // Mock payment — in production, this would go through Stripe
    // For now, just allocate credits

    // Upsert the StudentCoach relationship — add credits
    const studentCoach = await prisma.studentCoach.upsert({
      where: {
        studentId_coachId: {
          studentId: session.user.id,
          coachId: pkg.coachId,
        },
      },
      update: {
        creditsRemaining: {
          increment: pkg.reviewCredits,
        },
        packageId: pkg.id,
      },
      create: {
        studentId: session.user.id,
        coachId: pkg.coachId,
        creditsRemaining: pkg.reviewCredits,
        packageId: pkg.id,
      },
    })

    return NextResponse.json({
      message: 'Credits purchased successfully',
      creditsAdded: pkg.reviewCredits,
      creditsRemaining: studentCoach.creditsRemaining,
      packageName: pkg.name,
    }, { status: 201 })
  } catch (error) {
    console.error('Error purchasing credits:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
