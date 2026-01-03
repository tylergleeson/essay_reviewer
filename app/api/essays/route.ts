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

    const essays = await prisma.essay.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        application: true,
        drafts: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json(essays)
  } catch (error) {
    console.error('Error fetching essays:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, prompt, applicationId } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Verify application ownership if applicationId is provided
    if (applicationId) {
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
      })

      if (!application || application.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Invalid application' },
          { status: 400 }
        )
      }
    }

    const essay = await prisma.essay.create({
      data: {
        userId: session.user.id,
        title,
        prompt,
        applicationId,
        status: 'DRAFT',
      },
      include: {
        application: true,
      },
    })

    return NextResponse.json(essay, { status: 201 })
  } catch (error) {
    console.error('Error creating essay:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
