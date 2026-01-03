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

async function getStudents(userId: string) {
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
    return { students: [] }
  }

  // Get student details for each StudentCoach relationship
  const studentsWithDetails = await Promise.all(
    coachProfile.students.map(async (sc) => {
      const user = await prisma.user.findUnique({
        where: { id: sc.studentId },
        select: {
          id: true,
          name: true,
          email: true,
        },
      })

      const essaysCount = await prisma.essay.count({
        where: { userId: sc.studentId },
      })

      const lastActivity = await prisma.essay.findFirst({
        where: { userId: sc.studentId },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      })

      return {
        ...sc,
        user,
        essaysCount,
        lastActivity: lastActivity?.updatedAt || sc.createdAt,
      }
    })
  )

  return {
    students: studentsWithDetails,
  }
}

export default async function StudentsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/signin')
  }

  if (session.user.role !== 'COACH') {
    redirect('/dashboard')
  }

  const { students } = await getStudents(session.user.id)

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return '1 day ago'
    if (days <= 7) return `${days} days ago`
    if (days <= 30) return `${Math.floor(days / 7)} weeks ago`
    return `${Math.floor(days / 30)} months ago`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Roster</h1>
            <p className="text-sm text-gray-600">
              View and manage your students
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/coach">Back to Dashboard</Link>
          </Button>
        </div>

        {students.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-medium mb-2">No Students Yet</h3>
              <p className="text-gray-600 mb-4">
                Students will appear here after they purchase a package from you.
              </p>
              <Button variant="outline" asChild>
                <Link href="/coach/packages">Manage Packages</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                {students.length} Student{students.length !== 1 ? 's' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Credits Remaining</TableHead>
                    <TableHead>Essays</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {student.user?.name || 'Student'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {student.user?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.package ? (
                          <div>
                            <div className="font-medium">{student.package.name}</div>
                            <div className="text-sm text-gray-600">
                              {student.package.reviewCredits} reviews
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">No package</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            student.creditsRemaining === 0
                              ? 'destructive'
                              : student.creditsRemaining <= 1
                              ? 'outline'
                              : 'secondary'
                          }
                        >
                          {student.creditsRemaining} credits
                        </Badge>
                      </TableCell>
                      <TableCell>{student.essaysCount}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {getTimeAgo(student.lastActivity)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(student.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
