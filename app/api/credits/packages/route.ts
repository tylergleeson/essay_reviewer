import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET all active packages from all coaches (for student browsing)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const packages = await prisma.package.findMany({
      where: { isActive: true },
      include: {
        coach: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
      orderBy: { priceInCents: 'asc' },
    })

    return NextResponse.json(
      packages.map((pkg) => ({
        id: pkg.id,
        coachId: pkg.coachId,
        name: pkg.name,
        reviewCredits: pkg.reviewCredits,
        priceInCents: pkg.priceInCents,
        isActive: pkg.isActive,
        coachName: pkg.coach.user.name || pkg.coach.user.email,
      }))
    )
  } catch (error) {
    console.error('Error fetching packages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
