import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { signOut } from 'next-auth/react'
import { FileText, BookOpen, Calendar, Plus, ArrowRight } from 'lucide-react'
import { NotificationBell } from '@/components/notifications/NotificationBell'

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

  const getDeadlineBadgeVariant = (deadline: Date) => {
    const formatted = formatDeadline(deadline)
    if (formatted === 'Today' || formatted === 'Tomorrow' || formatted === 'Overdue') {
      return 'destructive'
    }
    if (formatted.includes('days') && parseInt(formatted) <= 7) {
      return 'accent'
    }
    return 'secondary'
  }

  const getEssayStatusVariant = (status: string) => {
    if (status === 'NEEDS_REVISION') return 'destructive'
    if (status === 'IN_REVIEW') return 'accent'
    return 'secondary'
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {session.user.name || session.user.email}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <form action={async () => {
                'use server'
                await signOut({ callbackUrl: '/' })
              }}>
                <Button variant="outline" type="submit">
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="stagger-item">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Applications
                </CardTitle>
                <BookOpen className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.totalApplications}</div>
              <p className="text-xs text-muted-foreground mt-1">Schools in your list</p>
            </CardContent>
          </Card>

          <Card className="stagger-item">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Essays in Progress
                </CardTitle>
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.essaysInProgress}</div>
              <p className="text-xs text-muted-foreground mt-1">Active drafts</p>
            </CardContent>
          </Card>

          <Card className="stagger-item">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Upcoming Deadlines
                </CardTitle>
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.upcomingDeadlines.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Approaching soon</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard/applications?action=add">
                <Plus className="w-4 h-4" />
                Add Application
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/essays?action=new">
                <FileText className="w-4 h-4" />
                Start New Essay
              </Link>
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
                    <div key={app.id} className="p-4 flex justify-between items-center hover:bg-muted/50 transition-colors">
                      <div>
                        <h3 className="font-semibold">{app.schoolName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {app.deadline ? new Date(app.deadline).toLocaleDateString() : 'No deadline'}
                        </p>
                      </div>
                      <Badge variant={getDeadlineBadgeVariant(app.deadline!)}>
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
                      className="p-4 flex justify-between items-center hover:bg-muted/50 transition-colors group block"
                    >
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">{essay.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {essay.application?.schoolName || 'No application'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{essay.wordCount} words</span>
                        <Badge variant={getEssayStatusVariant(essay.status)}>
                          {essay.status.replace('_', ' ')}
                        </Badge>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
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
              <h3 className="text-lg font-semibold mb-2">Get Started</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first college application.
              </p>
              <Button asChild>
                <Link href="/dashboard/applications?action=add">
                  Add Your First Application
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
