import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

async function getCoachData(userId: string) {
  // Get coach profile
  const coachProfile = await prisma.coachProfile.findUnique({
    where: { userId },
    include: {
      students: {
        include: {
          package: true,
        },
      },
    },
  })

  if (!coachProfile) {
    return null
  }

  // Get essays pending review
  const pendingEssays = await prisma.essay.findMany({
    where: {
      status: {
        in: ['SUBMITTED', 'IN_REVIEW'],
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      application: true,
      drafts: {
        orderBy: { versionNumber: 'desc' },
        take: 1,
      },
    },
    orderBy: [
      { application: { deadline: 'asc' } },
      { updatedAt: 'asc' },
    ],
  })

  // Get recently reviewed essays
  const recentFeedback = await prisma.feedback.findMany({
    where: {
      coachId: userId,
    },
    include: {
      essay: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          application: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  })

  // Calculate stats
  const totalStudents = coachProfile.students.length
  const essaysReviewed = await prisma.feedback.count({
    where: { coachId: userId },
  })

  return {
    coachProfile,
    pendingEssays,
    recentFeedback,
    totalStudents,
    essaysReviewed,
  }
}

export default async function CoachDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/signin')
  }

  if (session.user.role !== 'COACH') {
    redirect('/dashboard')
  }

  const data = await getCoachData(session.user.id)

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-medium mb-2">Coach Profile Not Found</h3>
              <p className="text-gray-600">
                There was an error loading your coach profile.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const getDaysAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return '1 day ago'
    return `${days} days ago`
  }

  const getDaysUntil = (date: Date | null) => {
    if (!date) return null
    const now = new Date()
    const deadline = new Date(date)
    const diff = deadline.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (days < 0) return 'Overdue'
    if (days === 0) return 'Today'
    if (days === 1) return 'Tomorrow'
    return `${days} days`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coach Dashboard</h1>
            <p className="text-sm text-gray-600">
              Welcome back, {session.user.name || session.user.email}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/coach/students">Students</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/coach/packages">Packages</Link>
            </Button>
            <form action={async () => {
              'use server'
              const { signOut } = await import('next-auth/react')
              await signOut({ redirectTo: '/' })
            }}>
              <Button variant="outline" type="submit">Sign Out</Button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.pendingEssays.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Essays Reviewed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.essaysReviewed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Turnaround Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.coachProfile.turnaroundDays}d</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Reviews Queue */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Review Queue</h2>
          {data.pendingEssays.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <h3 className="text-lg font-medium mb-2">No Pending Reviews</h3>
                <p className="text-gray-600">
                  You&apos;re all caught up! Check back later for new submissions.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Essay</TableHead>
                      <TableHead>Application</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.pendingEssays.map((essay) => (
                      <TableRow key={essay.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{essay.user.name || 'Student'}</div>
                            <div className="text-sm text-gray-600">{essay.user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{essay.title}</div>
                          <div className="text-sm text-gray-600">{essay.wordCount} words</div>
                        </TableCell>
                        <TableCell>
                          {essay.application?.schoolName || 'No application'}
                        </TableCell>
                        <TableCell>
                          {essay.application?.deadline ? (
                            <Badge
                              variant={
                                getDaysUntil(essay.application.deadline) === 'Overdue' ||
                                (getDaysUntil(essay.application.deadline)?.includes('days') &&
                                  parseInt(getDaysUntil(essay.application.deadline)!) <= 7)
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {getDaysUntil(essay.application.deadline)}
                            </Badge>
                          ) : (
                            <span className="text-gray-500">No deadline</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {getDaysAgo(essay.updatedAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={essay.status === 'IN_REVIEW' ? 'default' : 'secondary'}
                          >
                            {essay.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" asChild>
                            <Link href={`/coach/review/${essay.id}`}>Review</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Feedback */}
        {data.recentFeedback.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Recent Feedback</h2>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {data.recentFeedback.map((feedback) => (
                    <div key={feedback.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{feedback.essay.title}</h3>
                          <p className="text-sm text-gray-600">
                            {feedback.essay.user.name || feedback.essay.user.email}
                            {feedback.essay.application && ` • ${feedback.essay.application.schoolName}`}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(feedback.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {feedback.summaryFeedback}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
