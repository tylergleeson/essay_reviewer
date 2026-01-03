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

    if (!essay || essay.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
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
