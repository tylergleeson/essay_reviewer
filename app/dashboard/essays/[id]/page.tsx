'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Essay = {
  id: string
  title: string
  prompt: string | null
  status: string
  wordCount: number
  application: {
    id: string
    schoolName: string
  } | null
  drafts: {
    id: string
    content: string
    versionNumber: number
    wordCount: number
    createdAt: string
  }[]
  feedback: {
    id: string
    draftVersionReviewed: number
    summaryFeedback: string
    createdAt: string
  }[]
}

export default function EssayEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [essay, setEssay] = useState<Essay | null>(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [wordCount, setWordCount] = useState(0)

  const fetchEssay = useCallback(async () => {
    try {
      const response = await fetch(`/api/essays/${id}`)
      if (response.ok) {
        const data = await response.json()
        setEssay(data)
        // Load the latest draft if available
        if (data.drafts.length > 0) {
          setContent(data.drafts[0].content)
          setWordCount(data.drafts[0].wordCount)
        }
        setLoading(false)
      } else {
        router.push('/dashboard/essays')
      }
    } catch (error) {
      console.error('Error fetching essay:', error)
      router.push('/dashboard/essays')
    }
  }, [id, router])

  useEffect(() => {
    fetchEssay()
  }, [fetchEssay])

  const saveDraft = useCallback(async (contentToSave: string) => {
    if (!contentToSave.trim()) return

    setSaving(true)
    setSaveStatus('saving')

    try {
      const response = await fetch(`/api/essays/${id}/drafts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: contentToSave }),
      })

      if (response.ok) {
        setSaveStatus('saved')
        // Refresh essay data to update version history
        fetchEssay()
      } else {
        setSaveStatus('unsaved')
      }
    } catch (error) {
      console.error('Error saving draft:', error)
      setSaveStatus('unsaved')
    } finally {
      setSaving(false)
    }
  }, [id, fetchEssay])

  // Auto-save with debounce
  useEffect(() => {
    if (!content) return

    setSaveStatus('unsaved')
    const timer = setTimeout(() => {
      saveDraft(content)
    }, 2000) // Auto-save after 2 seconds of no typing

    return () => clearTimeout(timer)
  }, [content, saveDraft])

  // Calculate word count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length
    setWordCount(words)
  }, [content])

  const handleManualSave = () => {
    saveDraft(content)
  }

  const handleSubmitForReview = async () => {
    if (!confirm('Submit this essay for review?')) return

    // Save current draft first
    await saveDraft(content)

    try {
      const response = await fetch(`/api/essays/${id}/submit`, {
        method: 'POST',
      })

      if (response.ok) {
        alert('Essay submitted for review!')
        fetchEssay()
      }
    } catch (error) {
      console.error('Error submitting essay:', error)
      alert('Failed to submit essay')
    }
  }

  const loadDraft = (draftContent: string) => {
    setContent(draftContent)
  }

  if (loading || !essay) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    )
  }

  const canEdit = essay.status === 'DRAFT' || essay.status === 'NEEDS_REVISION'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{essay.title}</h1>
                <Badge>{essay.status.replace('_', ' ')}</Badge>
              </div>
              {essay.application && (
                <p className="text-sm text-gray-600">
                  For: {essay.application.schoolName}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/essays">Back to Essays</Link>
              </Button>
              {essay.feedback.length > 0 && (
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/essays/${id}/feedback`}>
                    View Feedback
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {essay.prompt && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Essay Prompt</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{essay.prompt}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Essay Content</CardTitle>
                    <CardDescription>
                      {canEdit ? 'Write your essay below' : 'Essay is read-only'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{wordCount} words</span>
                    <span className="text-sm">
                      {saveStatus === 'saved' && '✓ Saved'}
                      {saveStatus === 'saving' && '⏳ Saving...'}
                      {saveStatus === 'unsaved' && '• Unsaved'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing your essay..."
                  className="min-h-[500px] font-mono text-base"
                  disabled={!canEdit}
                />
                {canEdit && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={handleManualSave}
                      variant="outline"
                      disabled={saving || saveStatus === 'saved'}
                    >
                      Save Now
                    </Button>
                    <Button
                      onClick={handleSubmitForReview}
                      disabled={!content.trim() || essay.status === 'SUBMITTED'}
                    >
                      Submit for Review
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Version History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Version History</CardTitle>
                <CardDescription>
                  {essay.drafts.length} version{essay.drafts.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {essay.drafts.length === 0 ? (
                    <p className="text-sm text-gray-500">No versions yet</p>
                  ) : (
                    essay.drafts.map((draft, index) => (
                      <div
                        key={draft.id}
                        className="border rounded p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => canEdit && loadDraft(draft.content)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-sm">
                            Version {draft.versionNumber}
                            {index === 0 && ' (Latest)'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {draft.wordCount} words
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {new Date(draft.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Feedback Summary */}
            {essay.feedback.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {essay.feedback.slice(0, 3).map((fb) => (
                      <div key={fb.id} className="border-l-4 border-blue-500 pl-3">
                        <p className="text-sm font-medium">Version {fb.draftVersionReviewed}</p>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {fb.summaryFeedback}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(fb.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    asChild
                  >
                    <Link href={`/dashboard/essays/${id}/feedback`}>
                      View All Feedback
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
