'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { toast } from 'sonner'

type Member = {
  id: string
  studentId: string
  student: {
    id: string
    name: string | null
    email: string
  }
}

type Cohort = {
  id: string
  name: string
  description: string | null
  color: string | null
  members: Member[]
  stats: {
    totalEssays: number
    completedEssays: number
    pendingEssays: number
  }
}

type Student = {
  id: string
  name: string | null
  email: string
}

export default function CohortDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [cohort, setCohort] = useState<Cohort | null>(null)
  const [availableStudents, setAvailableStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchCohortDetails = useCallback(async () => {
    try {
      const response = await fetch('/api/coach/cohorts')
      if (response.ok) {
        const cohorts = await response.json()
        const found = cohorts.find((c: Cohort) => c.id === id)
        if (found) {
          setCohort(found)
        } else {
          router.push('/coach/cohorts')
        }
      }
    } catch (error) {
      console.error('Error fetching cohort:', error)
    } finally {
      setLoading(false)
    }
  }, [id, router])

  const fetchAvailableStudents = useCallback(async () => {
    try {
      const response = await fetch('/api/coach/students')
      if (response.ok) {
        const students = await response.json()
        setAvailableStudents(students)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }, [])

  useEffect(() => {
    fetchCohortDetails()
    fetchAvailableStudents()
  }, [fetchCohortDetails, fetchAvailableStudents])

  const addMember = async () => {
    if (!selectedStudent) return

    try {
      const response = await fetch(`/api/coach/cohorts/${id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudent }),
      })

      if (response.ok) {
        toast.success('Student added to cohort')
        fetchCohortDetails()
        setSelectedStudent('')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add student')
      }
    } catch (error) {
      console.error('Error adding member:', error)
      toast.error('Failed to add student')
    }
  }

  const removeMember = async (studentId: string) => {
    try {
      const response = await fetch(`/api/coach/cohorts/${id}/members?studentId=${studentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCohort(prev => prev ? {
          ...prev,
          members: prev.members.filter(m => m.studentId !== studentId),
        } : null)
        toast.success('Student removed from cohort')
      } else {
        toast.error('Failed to remove student')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Failed to remove student')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">Loading cohort...</div>
        </div>
      </div>
    )
  }

  if (!cohort) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p>Cohort not found</p>
        </div>
      </div>
    )
  }

  // Filter out students already in the cohort
  const memberIds = cohort.members.map(m => m.studentId)
  const studentsToAdd = availableStudents.filter(s => !memberIds.includes(s.id))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div
          className="h-2"
          style={{ backgroundColor: cohort.color || '#3b82f6' }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{cohort.name}</h1>
              {cohort.description && (
                <p className="text-sm text-gray-600">{cohort.description}</p>
              )}
            </div>
            <Button variant="outline" asChild>
              <Link href="/coach/cohorts">Back to Cohorts</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{cohort.members.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Essays
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{cohort.stats.totalEssays}</div>
              <p className="text-xs text-gray-500">
                {cohort.stats.pendingEssays} pending review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {cohort.stats.totalEssays > 0
                  ? Math.round((cohort.stats.completedEssays / cohort.stats.totalEssays) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-gray-500">
                {cohort.stats.completedEssays} of {cohort.stats.totalEssays} complete
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Add Student */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add Student</CardTitle>
            <CardDescription>
              Add a student to this cohort
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {studentsToAdd.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No students available
                    </SelectItem>
                  ) : (
                    studentsToAdd.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name || student.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button onClick={addMember} disabled={!selectedStudent}>
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              {cohort.members.length} student{cohort.members.length !== 1 ? 's' : ''} in this cohort
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cohort.members.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No students in this cohort yet. Add students above.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cohort.members.map(member => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.student.name || 'Unnamed'}
                      </TableCell>
                      <TableCell>{member.student.email}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMember(member.studentId)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
