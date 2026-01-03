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

    const body = await req.json()
    const { content } = body

    if (!content && content !== '') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
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

    // Calculate word count
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length

    // Get next version number
    const nextVersion = essay.drafts[0] ? essay.drafts[0].versionNumber + 1 : 1

    // Create new draft
    const draft = await prisma.draft.create({
      data: {
        essayId: params.id,
        content,
        versionNumber: nextVersion,
        wordCount,
      },
    })

    // Update essay word count
    await prisma.essay.update({
      where: { id: params.id },
      data: {
        wordCount,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(draft, { status: 201 })
  } catch (error) {
    console.error('Error creating draft:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
