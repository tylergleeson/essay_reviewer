'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Link from 'next/link'
import { toast } from 'sonner'

type Cohort = {
  id: string
  name: string
  description: string | null
  color: string | null
  members: {
    id: string
    studentId: string
    student: {
      id: string
      name: string | null
      email: string
    }
  }[]
  stats: {
    totalEssays: number
    completedEssays: number
    pendingEssays: number
  }
}

const COLORS = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#6b7280', label: 'Gray' },
]

export default function CohortsPage() {
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCohort, setEditingCohort] = useState<Cohort | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
  })

  useEffect(() => {
    fetchCohorts()
  }, [])

  const fetchCohorts = async () => {
    try {
      const response = await fetch('/api/coach/cohorts')
      if (response.ok) {
        const data = await response.json()
        setCohorts(data)
      }
    } catch (error) {
      console.error('Error fetching cohorts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('Name is required')
      return
    }

    try {
      const isEditing = !!editingCohort

      const response = await fetch('/api/coach/cohorts', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEditing
            ? { id: editingCohort.id, ...formData }
            : formData
        ),
      })

      if (response.ok) {
        toast.success(isEditing ? 'Cohort updated' : 'Cohort created')
        fetchCohorts()
        setDialogOpen(false)
        setEditingCohort(null)
        setFormData({ name: '', description: '', color: '#3b82f6' })
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save cohort')
      }
    } catch (error) {
      console.error('Error saving cohort:', error)
      toast.error('Failed to save cohort')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cohort? Members will not be deleted.')) return

    try {
      const response = await fetch(`/api/coach/cohorts?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCohorts(prev => prev.filter(c => c.id !== id))
        toast.success('Cohort deleted')
      } else {
        toast.error('Failed to delete cohort')
      }
    } catch (error) {
      console.error('Error deleting cohort:', error)
      toast.error('Failed to delete cohort')
    }
  }

  const openEditDialog = (cohort: Cohort) => {
    setEditingCohort(cohort)
    setFormData({
      name: cohort.name,
      description: cohort.description || '',
      color: cohort.color || '#3b82f6',
    })
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingCohort(null)
    setFormData({ name: '', description: '', color: '#3b82f6' })
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">Loading cohorts...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Cohorts</h1>
              <p className="text-sm text-gray-600">
                Group students by deadline cluster, school, or essay type
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={openCreateDialog}>
                Create Cohort
              </Button>
              <Button variant="outline" asChild>
                <Link href="/coach">Back to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cohorts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-medium mb-2">No Cohorts</h3>
              <p className="text-gray-600 mb-4">
                Create cohorts to group students by deadline or other criteria
              </p>
              <Button onClick={openCreateDialog}>Create Cohort</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cohorts.map(cohort => (
              <Card key={cohort.id} className="overflow-hidden">
                <div
                  className="h-2"
                  style={{ backgroundColor: cohort.color || '#3b82f6' }}
                />
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{cohort.name}</CardTitle>
                      {cohort.description && (
                        <CardDescription>{cohort.description}</CardDescription>
                      )}
                    </div>
                    <Badge variant="secondary">
                      {cohort.members.length} student{cohort.members.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Essay Progress</span>
                      <span>
                        {cohort.stats.completedEssays}/{cohort.stats.totalEssays}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: cohort.stats.totalEssays > 0
                            ? `${(cohort.stats.completedEssays / cohort.stats.totalEssays) * 100}%`
                            : '0%'
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{cohort.stats.pendingEssays} pending</span>
                      <span>{cohort.stats.completedEssays} complete</span>
                    </div>
                  </div>

                  {/* Members Preview */}
                  <div className="mb-4">
                    {cohort.members.slice(0, 3).map(member => (
                      <div key={member.id} className="text-sm text-gray-600">
                        {member.student.name || member.student.email}
                      </div>
                    ))}
                    {cohort.members.length > 3 && (
                      <div className="text-sm text-gray-500">
                        +{cohort.members.length - 3} more
                      </div>
                    )}
                    {cohort.members.length === 0 && (
                      <div className="text-sm text-gray-500 italic">
                        No students yet
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/coach/cohorts/${cohort.id}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(cohort)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(cohort.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCohort ? 'Edit Cohort' : 'Create Cohort'}
            </DialogTitle>
            <DialogDescription>
              {editingCohort
                ? 'Update cohort details'
                : 'Create a new student cohort'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Early Decision Nov 1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g., Students applying early decision"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {COLORS.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color.value
                        ? 'border-gray-900 ring-2 ring-offset-2'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingCohort ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
