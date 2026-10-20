import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculatePriorityScore, estimateReviewMinutes } from '@/lib/prioritization'

// Admission round colors
const ROUND_COLORS: Record<string, { bg: string; border: string }> = {
  ED1: { bg: '#dc2626', border: '#b91c1c' },     // Red
  ED2: { bg: '#ea580c', border: '#c2410c' },     // Orange
  EA: { bg: '#ca8a04', border: '#a16207' },      // Yellow/Gold
  REA: { bg: '#9333ea', border: '#7e22ce' },     // Purple
  RD: { bg: '#2563eb', border: '#1d4ed8' },      // Blue
  ROLLING: { bg: '#16a34a', border: '#15803d' }, // Green
}

// GET - Get calendar events (deadlines and availability)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const roundFilter = searchParams.get('round') // ED, EA, RD, or null for all

    // Get coach stats for time estimation
    const coachStats = await prisma.coachStats.findUnique({
      where: { coachId: session.user.id },
    })

    // Build where clause for admission round filter
    const roundWhereClause = roundFilter ? {
      admissionRound: roundFilter === 'ED'
        ? { in: ['ED1', 'ED2'] }
        : roundFilter === 'EA'
        ? { in: ['EA', 'REA'] }
        : { equals: roundFilter }
    } : {}

    // Get all essays with deadlines
    const essays = await prisma.essay.findMany({
      where: {
        status: { in: ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'NEEDS_REVISION'] },
        application: {
          deadline: { not: null },
          ...roundWhereClause,
        },
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
        application: {
          select: { deadline: true, schoolName: true, admissionRound: true },
        },
        feedback: {
          select: { id: true },
        },
      },
    })

    // Group essays by deadline date
    const deadlineMap = new Map<string, {
      deadline: Date
      essays: typeof essays
      totalMinutes: number
      roundCounts: Record<string, number>
    }>()

    essays.forEach(essay => {
      if (!essay.application?.deadline) return

      const deadlineDate = new Date(essay.application.deadline)
      const dateKey = deadlineDate.toISOString().split('T')[0]

      if (!deadlineMap.has(dateKey)) {
        deadlineMap.set(dateKey, {
          deadline: deadlineDate,
          essays: [],
          totalMinutes: 0,
          roundCounts: {},
        })
      }

      const group = deadlineMap.get(dateKey)!
      const estimatedMinutes = estimateReviewMinutes(
        { wordCount: essay.wordCount, feedback: essay.feedback },
        coachStats
      )

      // Track round counts
      const round = essay.application?.admissionRound || 'UNKNOWN'
      group.roundCounts[round] = (group.roundCounts[round] || 0) + 1

      group.essays.push(essay)
      group.totalMinutes += estimatedMinutes
    })

    // Calculate round summary for all essays
    const roundSummary: Record<string, number> = {}
    essays.forEach(essay => {
      const round = essay.application?.admissionRound || 'UNKNOWN'
      roundSummary[round] = (roundSummary[round] || 0) + 1
    })

    // Convert to calendar events
    const deadlineEvents = Array.from(deadlineMap.entries()).map(([dateKey, group]) => {
      // Determine dominant round for coloring
      const dominantRound = Object.entries(group.roundCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'UNKNOWN'

      const roundColor = ROUND_COLORS[dominantRound] || { bg: '#6b7280', border: '#4b5563' }

      return {
        id: `deadline-${dateKey}`,
        title: `${group.essays.length} essay${group.essays.length !== 1 ? 's' : ''} due`,
        start: dateKey,
        allDay: true,
        extendedProps: {
          type: 'deadline',
          essayCount: group.essays.length,
          totalMinutes: group.totalMinutes,
          roundCounts: group.roundCounts,
          dominantRound,
          essays: group.essays.map(e => ({
            id: e.id,
            title: e.title,
            studentName: e.user.name || e.user.email,
            schoolName: e.application?.schoolName,
            admissionRound: e.application?.admissionRound || null,
            status: e.status,
            wordCount: e.wordCount,
            estimatedMinutes: estimateReviewMinutes(
              { wordCount: e.wordCount, feedback: e.feedback },
              coachStats
            ),
            priorityScore: calculatePriorityScore({
              submittedAt: e.submittedAt,
              studentUrgentFlag: e.studentUrgentFlag,
              feedback: e.feedback,
              application: e.application,
            }),
          })),
        },
        backgroundColor: roundColor.bg,
        borderColor: roundColor.border,
      }
    })

    // Get coach availability
    const availability = await prisma.coachAvailability.findMany({
      where: { coachId: session.user.id },
    })

    // Convert availability to events
    const availabilityEvents = availability
      .filter(a => a.specificDate && a.isBlackout)
      .map(a => ({
        id: `blackout-${a.id}`,
        title: 'Unavailable',
        start: a.specificDate!.toISOString().split('T')[0],
        allDay: true,
        extendedProps: {
          type: 'blackout',
        },
        backgroundColor: '#e5e7eb',
        borderColor: '#9ca3af',
        textColor: '#6b7280',
      }))

    return NextResponse.json({
      events: [...deadlineEvents, ...availabilityEvents],
      weeklyAvailability: availability
        .filter(a => a.dayOfWeek !== null)
        .map(a => ({
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
          isBlackout: a.isBlackout,
        })),
      roundSummary,
      roundColors: ROUND_COLORS,
    })
  } catch (error) {
    console.error('Error fetching calendar data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

