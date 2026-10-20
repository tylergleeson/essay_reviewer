import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get notification preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id },
    })

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId: session.user.id,
          dailyDigestEnabled: true,
          dailyDigestTime: '09:00',
          deadlineWarning3Days: true,
          deadlineWarning1Day: true,
          inactivityReminderDays: 5,
          quietHoursEnabled: false,
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
          vacationModeEnabled: false,
          vacationModeUntil: null,
        },
      })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update notification preferences
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      dailyDigestEnabled,
      dailyDigestTime,
      deadlineWarning3Days,
      deadlineWarning1Day,
      inactivityReminderDays,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
      vacationModeEnabled,
      vacationModeUntil,
    } = body

    // Upsert preferences
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: {
        dailyDigestEnabled: dailyDigestEnabled !== undefined ? dailyDigestEnabled : undefined,
        dailyDigestTime: dailyDigestTime !== undefined ? dailyDigestTime : undefined,
        deadlineWarning3Days: deadlineWarning3Days !== undefined ? deadlineWarning3Days : undefined,
        deadlineWarning1Day: deadlineWarning1Day !== undefined ? deadlineWarning1Day : undefined,
        inactivityReminderDays: inactivityReminderDays !== undefined ? inactivityReminderDays : undefined,
        quietHoursEnabled: quietHoursEnabled !== undefined ? quietHoursEnabled : undefined,
        quietHoursStart: quietHoursStart !== undefined ? quietHoursStart : undefined,
        quietHoursEnd: quietHoursEnd !== undefined ? quietHoursEnd : undefined,
        vacationModeEnabled: vacationModeEnabled !== undefined ? vacationModeEnabled : undefined,
        vacationModeUntil: vacationModeUntil !== undefined
          ? (vacationModeUntil ? new Date(vacationModeUntil) : null)
          : undefined,
      },
      create: {
        userId: session.user.id,
        dailyDigestEnabled: dailyDigestEnabled ?? true,
        dailyDigestTime: dailyDigestTime ?? '09:00',
        deadlineWarning3Days: deadlineWarning3Days ?? true,
        deadlineWarning1Day: deadlineWarning1Day ?? true,
        inactivityReminderDays: inactivityReminderDays ?? 5,
        quietHoursEnabled: quietHoursEnabled ?? false,
        quietHoursStart: quietHoursStart ?? '22:00',
        quietHoursEnd: quietHoursEnd ?? '08:00',
        vacationModeEnabled: vacationModeEnabled ?? false,
        vacationModeUntil: vacationModeUntil ? new Date(vacationModeUntil) : null,
      },
    })

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
