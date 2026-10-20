import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Increment usage count for template
export async function POST(
  req: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { templateId } = await params

    // Verify ownership
    const template = await prisma.feedbackTemplate.findUnique({
      where: { id: templateId },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (template.coachId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Increment usage count
    const updated = await prisma.feedbackTemplate.update({
      where: { id: templateId },
      data: {
        usageCount: { increment: 1 },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error using template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
