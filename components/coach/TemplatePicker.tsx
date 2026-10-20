'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Template = {
  id: string
  name: string
  category: string | null
  content: string
  usageCount: number
}

interface TemplatePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (content: string) => void
  targetField?: string
}

export function TemplatePicker({ open, onOpenChange, onSelect, targetField }: TemplatePickerProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchTemplates()
    }
  }, [open])

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

  const categories = useMemo(() => {
    const cats = new Set(templates.map(t => t.category).filter(Boolean))
    return Array.from(cats) as string[]
  }, [templates])

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = search === '' ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.content.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = selectedCategory === null || t.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [templates, search, selectedCategory])

  const groupedTemplates = useMemo(() => {
    const groups: Record<string, Template[]> = {}
    filteredTemplates.forEach(t => {
      const cat = t.category || 'Uncategorized'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(t)
    })
    return groups
  }, [filteredTemplates])

  const handleSelect = async (template: Template) => {
    onSelect(template.content)
    onOpenChange(false)

    // Track usage
    try {
      await fetch(`/api/coach/templates/${template.id}/use`, { method: 'POST' })
    } catch (error) {
      console.error('Error tracking template usage:', error)
    }
  }

  const getCategoryColor = (category: string | null): string => {
    const colors: Record<string, string> = {
      'strengths': 'bg-green-100 text-green-800',
      'common_issues': 'bg-red-100 text-red-800',
      'structure': 'bg-blue-100 text-blue-800',
      'voice': 'bg-purple-100 text-purple-800',
      'quick_approval': 'bg-yellow-100 text-yellow-800',
      'revision': 'bg-orange-100 text-orange-800',
    }
    return colors[category || ''] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Insert Template</DialogTitle>
          <DialogDescription>
            {targetField ? `Select a template to insert into ${targetField}` : 'Select a template to insert'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-2">
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-1 flex-wrap">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {formatCategory(cat)}
                </Button>
              ))}
            </div>
          </div>

          {/* Templates List */}
          <div className="overflow-y-auto max-h-[50vh] space-y-4 pr-2">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading templates...</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {search ? 'No templates match your search' : 'No templates available'}
              </div>
            ) : (
              Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">{formatCategory(category)}</h3>
                  <div className="space-y-2">
                    {categoryTemplates.map(template => (
                      <Card
                        key={template.id}
                        className="cursor-pointer hover:border-blue-300 transition-colors"
                        onClick={() => handleSelect(template)}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium">{template.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className={getCategoryColor(template.category)}>
                                {formatCategory(template.category || 'uncategorized')}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                Used {template.usageCount}x
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{template.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="outline" asChild>
            <a href="/coach/templates" target="_blank" rel="noopener noreferrer">
              Manage Templates
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Collapsible template panel for sidebar
interface TemplatePanelProps {
  onInsert: (content: string) => void
  activeField: string | null
}

export function TemplatePanel({ onInsert, activeField }: TemplatePanelProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

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

  const groupedTemplates = useMemo(() => {
    const groups: Record<string, Template[]> = {}
    templates.forEach(t => {
      const cat = t.category || 'uncategorized'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(t)
    })
    return groups
  }, [templates])

  const handleInsert = async (template: Template) => {
    onInsert(template.content)

    // Track usage
    try {
      await fetch(`/api/coach/templates/${template.id}/use`, { method: 'POST' })
    } catch (error) {
      console.error('Error tracking template usage:', error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex justify-between items-center">
          Templates
          {activeField && (
            <Badge variant="outline" className="text-xs font-normal">
              {formatCategory(activeField)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-64 overflow-y-auto">
          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
            <div key={category} className="border-b last:border-b-0">
              <button
                onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                className="w-full px-3 py-2 flex justify-between items-center hover:bg-gray-50 text-sm font-medium"
              >
                <span>{formatCategory(category)}</span>
                <span className="text-gray-400">{categoryTemplates.length}</span>
              </button>
              {expandedCategory === category && (
                <div className="px-3 pb-2 space-y-1">
                  {categoryTemplates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleInsert(template)}
                      className="w-full text-left p-2 rounded text-xs hover:bg-blue-50 border border-transparent hover:border-blue-200"
                    >
                      <div className="font-medium truncate">{template.name}</div>
                      <div className="text-gray-500 truncate">{template.content.substring(0, 50)}...</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {templates.length === 0 && (
            <div className="p-3 text-sm text-gray-500 text-center">
              No templates yet.{' '}
              <a href="/coach/templates" className="text-blue-600 hover:underline">
                Create one
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function formatCategory(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
