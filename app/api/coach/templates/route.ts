import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get all templates for coach
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templates = await prisma.feedbackTemplate.findMany({
      where: { coachId: session.user.id },
      orderBy: [
        { category: 'asc' },
        { usageCount: 'desc' },
      ],
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new template
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, category, content } = body

    if (!name || !content) {
      return NextResponse.json(
        { error: 'Name and content are required' },
        { status: 400 }
      )
    }

    const template = await prisma.feedbackTemplate.create({
      data: {
        coachId: session.user.id,
        name,
        category: category || null,
        content,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update template
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, name, category, content } = body

    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    // Verify ownership
    const existing = await prisma.feedbackTemplate.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (existing.coachId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const template = await prisma.feedbackTemplate.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        category: category !== undefined ? category : existing.category,
        content: content !== undefined ? content : existing.content,
      },
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete template
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    // Verify ownership
    const existing = await prisma.feedbackTemplate.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (existing.coachId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.feedbackTemplate.delete({
      where: { id },
    })

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
