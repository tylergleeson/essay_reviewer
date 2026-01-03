import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const essay = await prisma.essay.findUnique({
      where: { id: params.id },
      include: {
        drafts: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    })

    if (!essay || essay.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Check if there's at least one draft
    if (essay.drafts.length === 0) {
      return NextResponse.json(
        { error: 'Cannot submit an essay without content' },
        { status: 400 }
      )
    }

    // Update essay status to SUBMITTED
    const updatedEssay = await prisma.essay.update({
      where: { id: params.id },
      data: {
        status: 'SUBMITTED',
      },
      include: {
        application: true,
      },
    })

    return NextResponse.json(updatedEssay)
  } catch (error) {
    console.error('Error submitting essay:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
