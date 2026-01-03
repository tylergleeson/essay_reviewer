import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { signOut } from 'next-auth/react'

async function getDashboardData(userId: string) {
  const [applications, essays, upcomingDeadlines] = await Promise.all([
    prisma.application.count({
      where: { userId },
    }),
    prisma.essay.findMany({
      where: {
        userId,
        status: {
          in: ['DRAFT', 'IN_REVIEW', 'NEEDS_REVISION'],
        },
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        application: true,
      },
    }),
    prisma.application.findMany({
      where: {
        userId,
        deadline: {
          gte: new Date(),
        },
      },
      orderBy: { deadline: 'asc' },
      take: 3,
    }),
  ])

  const essaysInProgress = await prisma.essay.count({
    where: {
      userId,
      status: {
        in: ['DRAFT', 'IN_REVIEW', 'NEEDS_REVISION'],
      },
    },
  })

  return {
    totalApplications: applications,
    essaysInProgress,
    recentEssays: essays,
    upcomingDeadlines,
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/signin')
  }

  if (session.user.role !== 'STUDENT') {
    redirect('/coach')
  }

  const data = await getDashboardData(session.user.id)

  const formatDeadline = (date: Date) => {
    const now = new Date()
    const deadline = new Date(date)
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntil === 0) return 'Today'
    if (daysUntil === 1) return 'Tomorrow'
    if (daysUntil < 0) return 'Overdue'
    return `${daysUntil} days`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome back, {session.user.name || session.user.email}</p>
          </div>
          <form action={async () => {
            'use server'
            await signOut({ redirectTo: '/' })
          }}>
            <Button variant="outline" type="submit">Sign Out</Button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.totalApplications}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Essays in Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.essaysInProgress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.upcomingDeadlines.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/dashboard/applications?action=add">Add Application</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/essays?action=new">Start New Essay</Link>
            </Button>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        {data.upcomingDeadlines.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Upcoming Deadlines</h2>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {data.upcomingDeadlines.map((app) => (
                    <div key={app.id} className="p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{app.schoolName}</h3>
                        <p className="text-sm text-gray-600">
                          {app.deadline ? new Date(app.deadline).toLocaleDateString() : 'No deadline'}
                        </p>
                      </div>
                      <Badge variant={
                        formatDeadline(app.deadline!).includes('days') &&
                        parseInt(formatDeadline(app.deadline!)) <= 7
                          ? 'destructive'
                          : 'secondary'
                      }>
                        {app.deadline ? formatDeadline(app.deadline) : 'No deadline'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Essays */}
        {data.recentEssays.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Recent Essays</h2>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {data.recentEssays.map((essay) => (
                    <Link
                      key={essay.id}
                      href={`/dashboard/essays/${essay.id}`}
                      className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors block"
                    >
                      <div>
                        <h3 className="font-medium">{essay.title}</h3>
                        <p className="text-sm text-gray-600">
                          {essay.application?.schoolName || 'No application'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{essay.wordCount} words</span>
                        <Badge variant={
                          essay.status === 'NEEDS_REVISION' ? 'destructive' :
                          essay.status === 'IN_REVIEW' ? 'default' :
                          'secondary'
                        }>
                          {essay.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {data.totalApplications === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-medium mb-2">Get Started</h3>
              <p className="text-gray-600 mb-4">
                Start by adding your first college application.
              </p>
              <Button asChild>
                <Link href="/dashboard/applications?action=add">Add Your First Application</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
