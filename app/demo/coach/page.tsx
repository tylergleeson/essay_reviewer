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

export default function DemoCoachDashboard() {
  // Mock data
  const mockData = {
    pendingReviews: 4,
    totalStudents: 8,
    essaysReviewed: 23,
    turnaroundDays: 2,
    pendingEssays: [
      {
        id: '1',
        student: { name: 'Jane Student', email: 'jane@example.com' },
        title: 'Common App Personal Statement',
        application: { schoolName: 'Harvard University', deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        wordCount: 542,
        status: 'SUBMITTED',
        submittedDays: 2
      },
      {
        id: '2',
        student: { name: 'John Doe', email: 'john@example.com' },
        title: 'Why Stanford Essay',
        application: { schoolName: 'Stanford University', deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
        wordCount: 289,
        status: 'SUBMITTED',
        submittedDays: 1
      },
      {
        id: '3',
        student: { name: 'Alice Brown', email: 'alice@example.com' },
        title: 'MIT Supplemental',
        application: { schoolName: 'MIT', deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
        wordCount: 421,
        status: 'IN_REVIEW',
        submittedDays: 3
      },
    ],
    recentFeedback: [
      { id: '1', student: 'Jane Student', essayTitle: 'Yale Personal Statement', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { id: '2', student: 'John Doe', essayTitle: 'Princeton Why Major', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    ]
  }

  const getDaysUntil = (date: Date) => {
    const days = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    if (days <= 3) return `${days} days`
    return `${Math.ceil(days / 7)} weeks`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coach Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome back, Dr. Smith (DEMO)</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/demo/dashboard">View Student Demo</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Home</Link>
            </Button>
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
              <div className="text-3xl font-bold">{mockData.pendingReviews}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{mockData.totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Essays Reviewed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{mockData.essaysReviewed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Turnaround Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{mockData.turnaroundDays}d</div>
            </CardContent>
          </Card>
        </div>

        {/* Review Queue */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Review Queue</h2>
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
                  {mockData.pendingEssays.map((essay) => (
                    <TableRow key={essay.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{essay.student.name}</div>
                          <div className="text-sm text-gray-600">{essay.student.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{essay.title}</div>
                        <div className="text-sm text-gray-600">{essay.wordCount} words</div>
                      </TableCell>
                      <TableCell>{essay.application.schoolName}</TableCell>
                      <TableCell>
                        <Badge variant={essay.submittedDays <= 3 ? 'destructive' : 'secondary'}>
                          {getDaysUntil(essay.application.deadline)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {essay.submittedDays} day{essay.submittedDays !== 1 ? 's' : ''} ago
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={essay.status === 'IN_REVIEW' ? 'default' : 'secondary'}>
                          {essay.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm">Review</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Recent Feedback */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Feedback</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {mockData.recentFeedback.map((feedback) => (
                  <div key={feedback.id} className="p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{feedback.essayTitle}</h3>
                      <p className="text-sm text-gray-600">{feedback.student}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {feedback.date.toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Demo Mode:</strong> This is a demonstration with mock data. In the full application, coaches can review essays, add inline comments, and provide structured feedback.
          </p>
        </div>
      </main>
    </div>
  )
}
