import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export default function DemoDashboard() {
  // Mock data
  const mockData = {
    totalApplications: 5,
    essaysInProgress: 3,
    upcomingDeadlines: [
      { id: '1', schoolName: 'Harvard University', deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { id: '2', schoolName: 'Stanford University', deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
      { id: '3', schoolName: 'MIT', deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) },
    ],
    recentEssays: [
      { id: '1', title: 'Common App Personal Statement', application: { schoolName: 'Harvard University' }, wordCount: 542, status: 'DRAFT' },
      { id: '2', title: 'Why Stanford Essay', application: { schoolName: 'Stanford University' }, wordCount: 289, status: 'NEEDS_REVISION' },
      { id: '3', title: 'MIT Supplemental', application: { schoolName: 'MIT' }, wordCount: 421, status: 'IN_REVIEW' },
    ]
  }

  const formatDeadline = (date: Date) => {
    const now = new Date()
    const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntil <= 7) return `${daysUntil} days`
    return `${Math.ceil(daysUntil / 7)} weeks`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome back, Jane Student (DEMO)</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/demo/coach">View Coach Demo</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Home</Link>
            </Button>
          </div>
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
              <div className="text-3xl font-bold">{mockData.totalApplications}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Essays in Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{mockData.essaysInProgress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{mockData.upcomingDeadlines.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <Button>Add Application</Button>
            <Button variant="outline">Start New Essay</Button>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Upcoming Deadlines</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {mockData.upcomingDeadlines.map((app) => (
                  <div key={app.id} className="p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{app.schoolName}</h3>
                      <p className="text-sm text-gray-600">
                        {app.deadline.toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {formatDeadline(app.deadline)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Essays */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Essays</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {mockData.recentEssays.map((essay) => (
                  <div
                    key={essay.id}
                    className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <h3 className="font-medium">{essay.title}</h3>
                      <p className="text-sm text-gray-600">
                        {essay.application.schoolName}
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
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Demo Mode:</strong> This is a demonstration with mock data. In the full application, this data would be connected to a real database.
          </p>
        </div>
      </main>
    </div>
  )
}
