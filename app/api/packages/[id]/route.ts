import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // Verify ownership
    const existingPackage = await prisma.package.findUnique({
      where: { id: params.id },
    })

    if (!existingPackage || existingPackage.coachId !== coachProfile.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const package_ = await prisma.package.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(reviewCredits !== undefined && { reviewCredits }),
        ...(priceInCents !== undefined && { priceInCents }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(package_)
  } catch (error) {
    console.error('Error updating package:', error)
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

    // Verify ownership
    const existingPackage = await prisma.package.findUnique({
      where: { id: params.id },
    })

    if (!existingPackage || existingPackage.coachId !== coachProfile.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.package.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting package:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
