'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { TemplatePicker, TemplatePanel } from '@/components/coach/TemplatePicker'
import { FeedbackHistory } from '@/components/coach/FeedbackHistory'
import { DraftComparison } from '@/components/coach/DraftComparison'
import { StudentContext } from '@/components/coach/StudentContext'
import { FEEDBACK_PROMPTS, ESSAY_RUBRIC, QUICK_FEEDBACK } from '@/lib/feedbackPrompts'

type InlineComment = {
  id: string
  startIndex: number
  endIndex: number
  comment: string
}

type Essay = {
  id: string
  title: string
  prompt: string | null
  status: string
  wordCount: number
  wordLimit?: number
  user: {
    id: string
    name: string | null
    email: string
  }
  application: {
    schoolName: string
    deadline: Date | null
  } | null
  drafts: {
    id: string
    content: string
    versionNumber: number
    wordCount: number
    createdAt: string
  }[]
  coachContext?: {
    coachNotes: string | null
    creditsRemaining: number | null
    packageName: string | null
    totalCredits: number | null
    studentOtherEssays: {
      id: string
      title: string
      status: string
      application: { schoolName: string } | null
    }[]
    cohorts: {
      id: string
      name: string
      color: string | null
    }[]
  }
}

type ReviewSession = {
  id: string
  startedAt: string
  draftFeedback: string | null
  draftComments: string | null
  lastSavedAt: string | null
}

type RubricScores = {
  authenticity?: number
  structure?: number
  clarity?: number
  promptResponse?: number
}

const AUTO_SAVE_INTERVAL = 30000 // 30 seconds

export default function EssayReviewPage({ params }: { params: { essayId: string } }) {
  const { essayId } = params
  const router = useRouter()
  const searchParams = useSearchParams()
  const workSessionId = searchParams.get('session')

  const [essay, setEssay] = useState<Essay | null>(null)
  const [reviewSession, setReviewSession] = useState<ReviewSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [inlineComments, setInlineComments] = useState<InlineComment[]>([])
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [selectedText, setSelectedText] = useState({ start: 0, end: 0, text: '' })
  const [currentComment, setCurrentComment] = useState('')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saving, setSaving] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // New state for enhanced features
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const [templateTargetField, setTemplateTargetField] = useState<string | null>(null)
  const [activeField, setActiveField] = useState<string | null>(null)
  const [draftCompareOpen, setDraftCompareOpen] = useState(false)
  const [guidesExpanded, setGuidesExpanded] = useState(true)
  const [rubricExpanded, setRubricExpanded] = useState(false)
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false)
  const [templateToSave, setTemplateToSave] = useState({ name: '', category: '', content: '' })

  const [formData, setFormData] = useState({
    summaryFeedback: '',
    strengths: '',
    priorityRevisions: '',
    overallGuidance: '',
    status: 'NEEDS_REVISION',
  })
  const [rubricScores, setRubricScores] = useState<RubricScores>({})

  const formDataRef = useRef(formData)
  const inlineCommentsRef = useRef(inlineComments)
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})

  // Keep refs in sync with state
  useEffect(() => {
    formDataRef.current = formData
  }, [formData])

  useEffect(() => {
    inlineCommentsRef.current = inlineComments
  }, [inlineComments])

  // Keyboard shortcut for template picker (Cmd+Shift+T)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 't') {
        e.preventDefault()
        setTemplateTargetField(activeField)
        setTemplatePickerOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeField])

  // Fetch essay and start/resume review session
  useEffect(() => {
    async function initReview() {
      try {
        // Fetch essay
        const essayResponse = await fetch(`/api/essays/${essayId}`)
        if (!essayResponse.ok) {
          router.push('/coach')
          return
        }
        const essayData = await essayResponse.json()
        setEssay(essayData)

        // Start or resume review session
        const sessionResponse = await fetch('/api/coach/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ essayId, workSessionId }),
        })

        if (sessionResponse.ok) {
          const { reviewSession: session, resumed } = await sessionResponse.json()
          setReviewSession(session)

          // Load draft data if resuming
          if (resumed && (session.draftFeedback || session.draftComments)) {
            try {
              if (session.draftFeedback) {
                const draftFeedback = JSON.parse(session.draftFeedback)
                setFormData(prev => ({ ...prev, ...draftFeedback }))
                if (draftFeedback.rubricScores) {
                  setRubricScores(draftFeedback.rubricScores)
                }
              }
              if (session.draftComments) {
                const draftComments = JSON.parse(session.draftComments)
                setInlineComments(draftComments)
              }
              if (session.lastSavedAt) {
                setLastSaved(new Date(session.lastSavedAt))
              }
              toast.success('Resumed from saved draft')
            } catch (e) {
              console.error('Error parsing draft data:', e)
            }
          }

          // Calculate initial elapsed time if resuming
          if (resumed) {
            const startedAt = new Date(session.startedAt)
            const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000)
            setElapsedSeconds(elapsed)
          }
        }
      } catch (error) {
        console.error('Error initializing review:', error)
        router.push('/coach')
      } finally {
        setLoading(false)
      }
    }

    initReview()
  }, [essayId, workSessionId, router])

  // Timer for elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Auto-save functionality
  const saveDraft = useCallback(async () => {
    if (!reviewSession?.id) return

    setSaving(true)
    try {
      const response = await fetch(`/api/coach/reviews/${reviewSession.id}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback: { ...formDataRef.current, rubricScores },
          comments: inlineCommentsRef.current,
        }),
      })

      if (response.ok) {
        const { lastSavedAt } = await response.json()
        setLastSaved(new Date(lastSavedAt))
      }
    } catch (error) {
      console.error('Error saving draft:', error)
    } finally {
      setSaving(false)
    }
  }, [reviewSession?.id, rubricScores])

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (formDataRef.current.summaryFeedback || inlineCommentsRef.current.length > 0) {
        saveDraft()
      }
    }, AUTO_SAVE_INTERVAL)

    return () => clearInterval(interval)
  }, [saveDraft])

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (formDataRef.current.summaryFeedback || inlineCommentsRef.current.length > 0) {
        navigator.sendBeacon(
          `/api/coach/reviews/${reviewSession?.id}/draft`,
          JSON.stringify({
            feedback: formDataRef.current,
            comments: inlineCommentsRef.current,
          })
        )
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [reviewSession?.id])

  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (!selection || selection.toString().trim() === '') return

    const range = selection.getRangeAt(0)
    const preSelectionRange = range.cloneRange()
    const container = document.getElementById('essay-content')

    if (!container || !container.contains(range.commonAncestorContainer)) {
      return
    }

    preSelectionRange.selectNodeContents(container)
    preSelectionRange.setEnd(range.startContainer, range.startOffset)
    const start = preSelectionRange.toString().length

    const selectedTextStr = selection.toString()
    const end = start + selectedTextStr.length

    setSelectedText({
      start,
      end,
      text: selectedTextStr,
    })
    setCurrentComment('')
    setCommentDialogOpen(true)
  }

  const addInlineComment = () => {
    if (!currentComment.trim()) return

    const newComment: InlineComment = {
      id: Date.now().toString(),
      startIndex: selectedText.start,
      endIndex: selectedText.end,
      comment: currentComment,
    }

    setInlineComments([...inlineComments, newComment])
    setCommentDialogOpen(false)
    setCurrentComment('')
    toast.success('Inline comment added')
  }

  const removeInlineComment = (id: string) => {
    setInlineComments(inlineComments.filter(c => c.id !== id))
    toast.success('Comment removed')
  }

  const renderContentWithComments = (content: string) => {
    if (inlineComments.length === 0) {
      return content
    }

    const sortedComments = [...inlineComments].sort((a, b) => a.startIndex - b.startIndex)
    const parts: (string | JSX.Element)[] = []
    let lastIndex = 0

    sortedComments.forEach((comment, idx) => {
      if (comment.startIndex > lastIndex) {
        parts.push(content.substring(lastIndex, comment.startIndex))
      }

      parts.push(
        <mark
          key={`comment-${idx}`}
          className="bg-yellow-200 cursor-help relative group"
          title={comment.comment}
        >
          {content.substring(comment.startIndex, comment.endIndex)}
          <span className="invisible group-hover:visible absolute bottom-full left-0 bg-gray-900 text-white text-xs rounded p-2 mb-1 w-64 z-10 whitespace-normal">
            {comment.comment}
          </span>
        </mark>
      )

      lastIndex = comment.endIndex
    })

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex))
    }

    return parts
  }

  // Template insertion handler
  const handleTemplateInsert = (content: string) => {
    if (templateTargetField && textareaRefs.current[templateTargetField]) {
      const textarea = textareaRefs.current[templateTargetField]!
      const start = textarea.selectionStart || 0
      const end = textarea.selectionEnd || 0
      const currentValue = formData[templateTargetField as keyof typeof formData] || ''
      const newValue = currentValue.substring(0, start) + content + currentValue.substring(end)
      setFormData({ ...formData, [templateTargetField]: newValue })

      // Move cursor to end of inserted content
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + content.length, start + content.length)
      }, 0)
    } else if (activeField) {
      const currentValue = formData[activeField as keyof typeof formData] || ''
      setFormData({ ...formData, [activeField]: currentValue + content })
    }
  }

  // Quick feedback insertion
  const handleQuickFeedback = (text: string) => {
    if (activeField) {
      const currentValue = formData[activeField as keyof typeof formData] || ''
      const newValue = currentValue ? `${currentValue}\n\n${text}` : text
      setFormData({ ...formData, [activeField]: newValue })
    }
  }

  // Save as template
  const handleSaveAsTemplate = (field: string) => {
    const content = formData[field as keyof typeof formData]
    if (!content) {
      toast.error('No content to save as template')
      return
    }
    setTemplateToSave({ name: '', category: field, content })
    setSaveTemplateDialogOpen(true)
  }

  const saveTemplate = async () => {
    if (!templateToSave.name.trim()) {
      toast.error('Please enter a template name')
      return
    }
    try {
      const response = await fetch('/api/coach/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateToSave),
      })
      if (response.ok) {
        toast.success('Template saved!')
        setSaveTemplateDialogOpen(false)
        setTemplateToSave({ name: '', category: '', content: '' })
      } else {
        toast.error('Failed to save template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.summaryFeedback.trim()) {
      toast.error('Summary feedback is required')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          essayId,
          ...formData,
          inlineComments: inlineComments.length > 0 ? inlineComments : null,
          rubricScores: Object.keys(rubricScores).length > 0 ? JSON.stringify(rubricScores) : null,
          reviewSessionId: reviewSession?.id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const duration = data.reviewDurationMinutes
        toast.success(
          duration
            ? `Feedback submitted! Review took ${duration} minutes.`
            : 'Feedback submitted successfully!'
        )
        router.push('/coach')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to submit feedback')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const formatElapsedTime = () => {
    const minutes = Math.floor(elapsedSeconds / 60)
    const seconds = elapsedSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Word count display with warning
  const getWordCountDisplay = () => {
    if (!essay) return null
    const wordLimit = essay.wordLimit
    if (!wordLimit) return <span>{essay.wordCount} words</span>

    const percentage = (essay.wordCount / wordLimit) * 100
    let colorClass = 'text-green-600'
    if (percentage > 100) colorClass = 'text-red-600'
    else if (percentage >= 90) colorClass = 'text-yellow-600'

    return (
      <span className={colorClass}>
        {essay.wordCount}/{wordLimit} words ({Math.round(percentage)}%)
      </span>
    )
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

  const latestDraft = essay.drafts[0]

  if (!latestDraft) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-medium mb-2">No Content to Review</h3>
              <p className="text-gray-600 mb-4">
                This essay doesn&apos;t have any drafts yet.
              </p>
              <Button asChild>
                <Link href="/coach">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

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
              <div className="text-sm text-gray-600">
                <p>Student: {essay.user.name || essay.user.email}</p>
                {essay.application && (
                  <p>Application: {essay.application.schoolName}</p>
                )}
                <p>Version {latestDraft.versionNumber} • {getWordCountDisplay()}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Timer and Save Status */}
              <div className="text-right">
                <div className="flex items-center gap-2 text-sm">
                  <ClockIcon className="h-4 w-4 text-gray-500" />
                  <span className="font-mono">{formatElapsedTime()}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {saving ? (
                    'Saving...'
                  ) : lastSaved ? (
                    `Saved ${formatTimeAgo(lastSaved)}`
                  ) : (
                    'Auto-save enabled'
                  )}
                </div>
              </div>
              <Button variant="outline" onClick={saveDraft} disabled={saving}>
                Save Draft
              </Button>
              {essay.drafts.length > 1 && (
                <Button variant="outline" onClick={() => setDraftCompareOpen(true)}>
                  Compare Drafts
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link href="/coach">Back to Dashboard</Link>
              </Button>
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
          {/* Essay Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Essay Content</CardTitle>
                    <CardDescription>
                      Select text to add inline comments
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTextSelection}
                  >
                    Add Comment
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  id="essay-content"
                  className="bg-gray-50 p-6 rounded border min-h-[500px] whitespace-pre-wrap font-mono text-sm select-text"
                  onMouseUp={handleTextSelection}
                >
                  {renderContentWithComments(latestDraft.content)}
                </div>

                {/* Inline Comments List */}
                {inlineComments.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-3">
                      Inline Comments ({inlineComments.length})
                    </h3>
                    <div className="space-y-2">
                      {inlineComments.map((comment) => (
                        <div
                          key={comment.id}
                          className="bg-yellow-50 border border-yellow-200 rounded p-3 flex justify-between items-start"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              &quot;{latestDraft.content.substring(
                                comment.startIndex,
                                Math.min(comment.endIndex, comment.startIndex + 50)
                              )}
                              {comment.endIndex - comment.startIndex > 50 && '...'}&quot;
                            </p>
                            <p className="text-sm text-gray-700">{comment.comment}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeInlineComment(comment.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Feedback Sidebar */}
          <div className="space-y-4">
            {/* Student Context - Only shown for coaches */}
            {essay.coachContext && (
              <StudentContext
                studentId={essay.user.id}
                studentName={essay.user.name || ''}
                studentEmail={essay.user.email}
                coachNotes={essay.coachContext.coachNotes}
                creditsRemaining={essay.coachContext.creditsRemaining}
                packageName={essay.coachContext.packageName}
                totalCredits={essay.coachContext.totalCredits}
                studentOtherEssays={essay.coachContext.studentOtherEssays}
                cohorts={essay.coachContext.cohorts}
              />
            )}

            {/* Feedback History */}
            <FeedbackHistory
              essayId={essayId}
              currentDraftVersion={latestDraft.versionNumber}
            />

            {/* Templates Panel */}
            <TemplatePanel
              onInsert={handleTemplateInsert}
              activeField={activeField}
            />

            {/* Feedback Form */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Provide Feedback</CardTitle>
                    <CardDescription>
                      Fill out the feedback form below
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTemplateTargetField(activeField)
                      setTemplatePickerOpen(true)
                    }}
                    title="Insert template (Cmd+Shift+T)"
                  >
                    <TemplateIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Feedback Guide */}
                <Collapsible open={guidesExpanded} onOpenChange={setGuidesExpanded}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between mb-4">
                      <span className="text-xs font-medium text-gray-500">Feedback Guide</span>
                      <ChevronIcon expanded={guidesExpanded} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="bg-blue-50 border border-blue-100 rounded p-3 mb-4 text-xs">
                      <p className="font-medium text-blue-800 mb-2">Key Questions to Consider:</p>
                      <ul className="space-y-1 text-blue-700">
                        <li>• What&apos;s the ONE thing this essay needs most?</li>
                        <li>• Where does their voice shine through?</li>
                        <li>• What should they cut vs. expand?</li>
                      </ul>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Summary Feedback */}
                  <FeedbackField
                    id="summaryFeedback"
                    label="Summary Feedback"
                    required
                    value={formData.summaryFeedback}
                    onChange={(value) => setFormData({ ...formData, summaryFeedback: value })}
                    onFocus={() => setActiveField('summaryFeedback')}
                    placeholder="Provide an overall summary of the essay..."
                    prompts={FEEDBACK_PROMPTS.summaryFeedback}
                    onSaveAsTemplate={() => handleSaveAsTemplate('summaryFeedback')}
                    ref={(el) => { textareaRefs.current.summaryFeedback = el }}
                  />

                  {/* Strengths */}
                  <FeedbackField
                    id="strengths"
                    label="Strengths"
                    value={formData.strengths}
                    onChange={(value) => setFormData({ ...formData, strengths: value })}
                    onFocus={() => setActiveField('strengths')}
                    placeholder="What did the student do well?"
                    prompts={FEEDBACK_PROMPTS.strengths}
                    onSaveAsTemplate={() => handleSaveAsTemplate('strengths')}
                    ref={(el) => { textareaRefs.current.strengths = el }}
                  />

                  {/* Priority Revisions */}
                  <FeedbackField
                    id="priorityRevisions"
                    label="Priority Revisions"
                    value={formData.priorityRevisions}
                    onChange={(value) => setFormData({ ...formData, priorityRevisions: value })}
                    onFocus={() => setActiveField('priorityRevisions')}
                    placeholder="What should the student focus on first?"
                    prompts={FEEDBACK_PROMPTS.priorityRevisions}
                    onSaveAsTemplate={() => handleSaveAsTemplate('priorityRevisions')}
                    ref={(el) => { textareaRefs.current.priorityRevisions = el }}
                  />

                  {/* Overall Guidance */}
                  <FeedbackField
                    id="overallGuidance"
                    label="Overall Guidance"
                    value={formData.overallGuidance}
                    onChange={(value) => setFormData({ ...formData, overallGuidance: value })}
                    onFocus={() => setActiveField('overallGuidance')}
                    placeholder="Additional guidance for the next draft..."
                    prompts={FEEDBACK_PROMPTS.overallGuidance}
                    onSaveAsTemplate={() => handleSaveAsTemplate('overallGuidance')}
                    ref={(el) => { textareaRefs.current.overallGuidance = el }}
                  />

                  {/* Quick Feedback Buttons */}
                  {activeField && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500">Quick Feedback</p>
                      <div className="flex flex-wrap gap-1">
                        {(activeField === 'strengths' ? QUICK_FEEDBACK.positive : QUICK_FEEDBACK.constructive)
                          .slice(0, 4)
                          .map((item) => (
                            <Button
                              key={item.label}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleQuickFeedback(item.text)}
                            >
                              {item.label}
                            </Button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Rubric Scoring */}
                  <Collapsible open={rubricExpanded} onOpenChange={setRubricExpanded}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between">
                        <span className="text-sm font-medium">Rubric Scoring (Optional)</span>
                        <ChevronIcon expanded={rubricExpanded} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <div className="space-y-3 bg-gray-50 rounded p-3">
                        {ESSAY_RUBRIC.map((category) => (
                          <div key={category.id}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium">{category.name}</span>
                              <span className="text-xs text-gray-500">
                                {rubricScores[category.id as keyof RubricScores]
                                  ? `${rubricScores[category.id as keyof RubricScores]}/5`
                                  : 'Not rated'}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((score) => (
                                <button
                                  key={score}
                                  type="button"
                                  onClick={() => setRubricScores({
                                    ...rubricScores,
                                    [category.id]: rubricScores[category.id as keyof RubricScores] === score ? undefined : score
                                  })}
                                  className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                                    rubricScores[category.id as keyof RubricScores] === score
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-white border hover:bg-gray-100'
                                  }`}
                                  title={category.levels.find(l => l.score === score)?.description}
                                >
                                  {score}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Essay Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status">Essay Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEEDS_REVISION">Needs Revision</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="IN_REVIEW">Keep In Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Inline Comment</DialogTitle>
            <DialogDescription>
              Add a comment for the selected text
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm font-medium mb-1">Selected text:</p>
              <p className="text-sm text-gray-700 italic">
                &quot;{selectedText.text}&quot;
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Your Comment</Label>
              <Textarea
                id="comment"
                value={currentComment}
                onChange={(e) => setCurrentComment(e.target.value)}
                placeholder="Enter your comment..."
                rows={4}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCommentDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={addInlineComment} disabled={!currentComment.trim()}>
                Add Comment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Picker Dialog */}
      <TemplatePicker
        open={templatePickerOpen}
        onOpenChange={setTemplatePickerOpen}
        onSelect={handleTemplateInsert}
        targetField={templateTargetField || undefined}
      />

      {/* Draft Comparison Dialog */}
      <DraftComparison
        open={draftCompareOpen}
        onOpenChange={setDraftCompareOpen}
        drafts={essay.drafts}
        currentVersion={latestDraft.versionNumber}
      />

      {/* Save Template Dialog */}
      <Dialog open={saveTemplateDialogOpen} onOpenChange={setSaveTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save this feedback for reuse later
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name</Label>
              <input
                id="templateName"
                type="text"
                value={templateToSave.name}
                onChange={(e) => setTemplateToSave({ ...templateToSave, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., Strong opening feedback"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={templateToSave.category}
                onValueChange={(value) => setTemplateToSave({ ...templateToSave, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strengths">Strengths</SelectItem>
                  <SelectItem value="common_issues">Common Issues</SelectItem>
                  <SelectItem value="structure">Structure</SelectItem>
                  <SelectItem value="voice">Voice</SelectItem>
                  <SelectItem value="revision">Revision</SelectItem>
                  <SelectItem value="quick_approval">Quick Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-gray-50 rounded p-3 text-sm">
              <p className="font-medium mb-1">Content Preview:</p>
              <p className="text-gray-600 line-clamp-3">{templateToSave.content}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSaveTemplateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveTemplate}>
                Save Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Feedback field component with prompts
interface FeedbackFieldProps {
  id: string
  label: string
  required?: boolean
  value: string
  onChange: (value: string) => void
  onFocus: () => void
  placeholder: string
  prompts?: { id: string; question: string; hint?: string }[]
  onSaveAsTemplate: () => void
}

const FeedbackField = ({
  id,
  label,
  required,
  value,
  onChange,
  onFocus,
  placeholder,
  prompts,
  onSaveAsTemplate,
  ref,
}: FeedbackFieldProps & { ref: (el: HTMLTextAreaElement | null) => void }) => {
  const [showPrompts, setShowPrompts] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor={id}>
          {label} {required && <span className="text-red-600">*</span>}
        </Label>
        <div className="flex gap-1">
          {prompts && prompts.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setShowPrompts(!showPrompts)}
            >
              {showPrompts ? 'Hide' : 'Tips'}
            </Button>
          )}
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={onSaveAsTemplate}
              title="Save as template"
            >
              Save
            </Button>
          )}
        </div>
      </div>
      {showPrompts && prompts && (
        <div className="bg-amber-50 border border-amber-100 rounded p-2 text-xs space-y-1">
          {prompts.map(prompt => (
            <div key={prompt.id}>
              <p className="font-medium text-amber-800">{prompt.question}</p>
              {prompt.hint && (
                <p className="text-amber-600">{prompt.hint}</p>
              )}
            </div>
          ))}
        </div>
      )}
      <Textarea
        id={id}
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        rows={3}
        required={required}
      />
    </div>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <path strokeWidth="2" strokeLinecap="round" d="M12 6v6l4 2" />
    </svg>
  )
}

function TemplateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes === 1) return '1 min ago'
  return `${minutes} min ago`
}
