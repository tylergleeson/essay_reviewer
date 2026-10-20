'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Link from 'next/link'
import { toast } from 'sonner'

type Template = {
  id: string
  name: string
  category: string | null
  content: string
  usageCount: number
  createdAt: string
}

const CATEGORIES = [
  { value: 'strengths', label: 'Strengths' },
  { value: 'common_issues', label: 'Common Issues' },
  { value: 'quick_approval', label: 'Quick Approval' },
  { value: 'structure', label: 'Structure' },
  { value: 'clarity', label: 'Clarity' },
  { value: 'voice', label: 'Voice & Tone' },
  { value: 'other', label: 'Other' },
]

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    content: '',
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/coach/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.content) {
      toast.error('Name and content are required')
      return
    }

    try {
      const isEditing = !!editingTemplate

      const response = await fetch('/api/coach/templates', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEditing
            ? { id: editingTemplate.id, ...formData }
            : formData
        ),
      })

      if (response.ok) {
        const template = await response.json()

        if (isEditing) {
          setTemplates(prev => prev.map(t => t.id === template.id ? template : t))
        } else {
          setTemplates(prev => [...prev, template])
        }

        setDialogOpen(false)
        setEditingTemplate(null)
        setFormData({ name: '', category: '', content: '' })
        toast.success(isEditing ? 'Template updated' : 'Template created')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(`/api/coach/templates?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id))
        toast.success('Template deleted')
      } else {
        toast.error('Failed to delete template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Failed to delete template')
    }
  }

  const openEditDialog = (template: Template) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      category: template.category || '',
      content: template.content,
    })
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingTemplate(null)
    setFormData({ name: '', category: '', content: '' })
    setDialogOpen(true)
  }

  const filteredTemplates = filterCategory === 'all'
    ? templates
    : templates.filter(t => t.category === filterCategory)

  // Group templates by category
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const category = template.category || 'uncategorized'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(template)
    return acc
  }, {} as Record<string, Template[]>)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">Loading templates...</div>
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
              <h1 className="text-2xl font-bold text-gray-900">Feedback Templates</h1>
              <p className="text-sm text-gray-600">
                Save and reuse common feedback snippets
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={openCreateDialog}>
                Create Template
              </Button>
              <Button variant="outline" asChild>
                <Link href="/coach">Back to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 flex justify-between items-center">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
              <SelectItem value="uncategorized">Uncategorized</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-600">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Templates List */}
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-medium mb-2">No Templates</h3>
              <p className="text-gray-600 mb-4">
                Create your first feedback template to speed up reviews
              </p>
              <Button onClick={openCreateDialog}>Create Template</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
              <div key={category}>
                <h2 className="text-sm font-medium text-gray-600 mb-3 capitalize">
                  {category.replace('_', ' ')}
                </h2>
                <div className="space-y-3">
                  {categoryTemplates.map(template => (
                    <Card key={template.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">{template.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              {template.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {CATEGORIES.find(c => c.value === template.category)?.label || template.category}
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500">
                                Used {template.usageCount} time{template.usageCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(template)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(template.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                          {template.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? 'Update your feedback template'
                : 'Save a reusable feedback snippet'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Strong Opening"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your feedback template..."
                rows={6}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingTemplate ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
