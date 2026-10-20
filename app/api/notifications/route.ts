import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get notifications for current user
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    const notifications = await prisma.studentNotification.findMany({
      where: {
        userId: session.user.id,
        ...(unreadOnly ? { read: false } : {}),
      },
      include: {
        essay: {
          select: {
            id: true,
            title: true,
            application: {
              select: {
                schoolName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Get unread count
    const unreadCount = await prisma.studentNotification.count({
      where: {
        userId: session.user.id,
        read: false,
      },
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a notification (internal use)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    // Only coaches can create notifications for students
    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { userId, essayId, type, title, message } = body

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const notification = await prisma.studentNotification.create({
      data: {
        userId,
        essayId: essayId || null,
        type,
        title,
        message,
      },
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Mark notifications as read
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { notificationIds, markAllRead } = body

    if (markAllRead) {
      // Mark all notifications as read
      await prisma.studentNotification.updateMany({
        where: {
          userId: session.user.id,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      })

      return NextResponse.json({ success: true })
    }

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'Notification IDs required' },
        { status: 400 }
      )
    }

    // Mark specific notifications as read
    await prisma.studentNotification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: session.user.id,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
