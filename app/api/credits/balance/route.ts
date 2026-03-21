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

    const { searchParams } = new URL(req.url)
    const coachId = searchParams.get('coachId')

    if (session.user.role === 'STUDENT') {
      // If coachId is provided, get balance with that specific coach
      if (coachId) {
        const studentCoach = await prisma.studentCoach.findUnique({
          where: {
            studentId_coachId: {
              studentId: session.user.id,
              coachId,
            },
          },
          include: {
            coach: {
              include: {
                user: {
                  select: { name: true, email: true },
                },
              },
            },
            package: true,
          },
        })

        if (!studentCoach) {
          return NextResponse.json({
            creditsRemaining: 0,
            coachName: null,
          })
        }

        return NextResponse.json({
          creditsRemaining: studentCoach.creditsRemaining,
          coachName: studentCoach.coach.user.name || studentCoach.coach.user.email,
          packageName: studentCoach.package?.name || null,
        })
      }

      // Return all coach balances for this student
      const balances = await prisma.studentCoach.findMany({
        where: { studentId: session.user.id },
        include: {
          coach: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          package: true,
        },
      })

      return NextResponse.json(
        balances.map((b) => ({
          coachId: b.coachId,
          coachUserId: b.coach.user.id,
          coachName: b.coach.user.name || b.coach.user.email,
          creditsRemaining: b.creditsRemaining,
          packageName: b.package?.name || null,
        }))
      )
    }

    // Coach: return all student balances
    if (session.user.role === 'COACH') {
      const coachProfile = await prisma.coachProfile.findUnique({
        where: { userId: session.user.id },
      })

      if (!coachProfile) {
        return NextResponse.json({ error: 'Coach profile not found' }, { status: 404 })
      }

      const balances = await prisma.studentCoach.findMany({
        where: { coachId: coachProfile.id },
        include: {
          package: true,
        },
      })

      // Get student names
      const studentIds = balances.map((b) => b.studentId)
      const students = await prisma.user.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, name: true, email: true },
      })

      const studentMap = new Map(students.map((s) => [s.id, s]))

      return NextResponse.json(
        balances.map((b) => {
          const student = studentMap.get(b.studentId)
          return {
            studentId: b.studentId,
            studentName: student?.name || student?.email || 'Unknown',
            creditsRemaining: b.creditsRemaining,
            packageName: b.package?.name || null,
          }
        })
      )
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching credit balance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
