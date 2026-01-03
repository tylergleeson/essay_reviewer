'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

type Essay = {
  id: string
  title: string
  prompt: string | null
  status: string
  wordCount: number
  updatedAt: string
  application: {
    id: string
    schoolName: string
  } | null
}

type Application = {
  id: string
  schoolName: string
}

export default function EssaysPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [essays, setEssays] = useState<Essay[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    prompt: '',
    applicationId: '',
  })
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    fetchEssays()
    fetchApplications()
    if (searchParams.get('action') === 'new') {
      setDialogOpen(true)
    }
  }, [searchParams])

  const fetchEssays = async () => {
    try {
      const response = await fetch('/api/essays')
      if (response.ok) {
        const data = await response.json()
        setEssays(data)
      }
    } catch (error) {
      console.error('Error fetching essays:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications')
      if (response.ok) {
        const data = await response.json()
        setApplications(data)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/essays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          applicationId: formData.applicationId || null,
        }),
      })

      if (response.ok) {
        const essay = await response.json()
        setDialogOpen(false)
        setFormData({ title: '', prompt: '', applicationId: '' })
        router.push(`/dashboard/essays/${essay.id}`)
      }
    } catch (error) {
      console.error('Error creating essay:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'default'
      case 'IN_REVIEW':
        return 'secondary'
      case 'NEEDS_REVISION':
        return 'destructive'
      case 'SUBMITTED':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const filteredEssays = essays.filter((essay) => {
    if (filter === 'ALL') return true
    return essay.status === filter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Essays</h1>
            <p className="text-sm text-gray-600">View and manage all your essays</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>Start New Essay</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Essay</DialogTitle>
                  <DialogDescription>
                    Start a new essay for your college applications.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Essay Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="e.g., Common App Personal Statement"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prompt">Essay Prompt (Optional)</Label>
                    <Textarea
                      id="prompt"
                      value={formData.prompt}
                      onChange={(e) =>
                        setFormData({ ...formData, prompt: e.target.value })
                      }
                      placeholder="Enter the essay prompt..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="applicationId">Application (Optional)</Label>
                    <Select
                      value={formData.applicationId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, applicationId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an application" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {applications.map((app) => (
                          <SelectItem key={app.id} value={app.id}>
                            {app.schoolName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Create Essay</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Essays</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="IN_REVIEW">In Review</SelectItem>
              <SelectItem value="NEEDS_REVISION">Needs Revision</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Essays Grid */}
        {filteredEssays.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-medium mb-2">
                {filter === 'ALL' ? 'No Essays Yet' : `No ${filter.replace('_', ' ')} Essays`}
              </h3>
              <p className="text-gray-600 mb-4">
                {filter === 'ALL'
                  ? 'Start by creating your first essay.'
                  : 'Try selecting a different filter.'}
              </p>
              {filter === 'ALL' && (
                <Button onClick={() => setDialogOpen(true)}>
                  Create Your First Essay
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEssays.map((essay) => (
              <Link key={essay.id} href={`/dashboard/essays/${essay.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg">{essay.title}</CardTitle>
                      <Badge variant={getStatusColor(essay.status)}>
                        {essay.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardDescription>
                      {essay.application?.schoolName || 'No application'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {essay.prompt && (
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {essay.prompt}
                        </p>
                      )}
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>{essay.wordCount} words</span>
                        <span>
                          {new Date(essay.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
