'use client'

import { useEffect, useState, use } from 'react'
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
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

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
  }[]
}

export default function EssayReviewPage({ params }: { params: Promise<{ essayId: string }> }) {
  const { essayId } = use(params)
  const router = useRouter()
  const [essay, setEssay] = useState<Essay | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [inlineComments, setInlineComments] = useState<InlineComment[]>([])
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [selectedText, setSelectedText] = useState({ start: 0, end: 0, text: '' })
  const [currentComment, setCurrentComment] = useState('')
  const [studentCredits, setStudentCredits] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    summaryFeedback: '',
    strengths: '',
    priorityRevisions: '',
    overallGuidance: '',
    status: 'NEEDS_REVISION',
  })

  useEffect(() => {
    fetchEssay()
  }, [essayId])

  const fetchEssay = async () => {
    try {
      const response = await fetch(`/api/essays/${essayId}`)
      if (response.ok) {
        const data = await response.json()
        setEssay(data)
        setLoading(false)

        // Check student's credit balance with this coach
        try {
          const creditsRes = await fetch('/api/credits/balance')
          if (creditsRes.ok) {
            const balances = await creditsRes.json()
            // Find this student's balance
            const studentBalance = balances.find(
              (b: { studentId: string }) => b.studentId === data.user.id
            )
            setStudentCredits(studentBalance?.creditsRemaining ?? 0)
          }
        } catch {
          // Non-critical — don't block review loading
        }
      } else {
        router.push('/coach')
      }
    } catch (error) {
      console.error('Error fetching essay:', error)
      router.push('/coach')
    }
  }

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

    const selectedText = selection.toString()
    const end = start + selectedText.length

    setSelectedText({
      start,
      end,
      text: selectedText,
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

    // Sort comments by start index
    const sortedComments = [...inlineComments].sort((a, b) => a.startIndex - b.startIndex)

    const parts: (string | JSX.Element)[] = []
    let lastIndex = 0

    sortedComments.forEach((comment, idx) => {
      // Add text before comment
      if (comment.startIndex > lastIndex) {
        parts.push(content.substring(lastIndex, comment.startIndex))
      }

      // Add highlighted comment
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

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex))
    }

    return parts
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
        }),
      })

      if (response.ok) {
        toast.success('Feedback submitted successfully!')
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
                <p>Version {latestDraft.versionNumber} • {latestDraft.wordCount} words</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/coach">Back to Dashboard</Link>
            </Button>
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

        {/* Credit Warning */}
        {studentCredits !== null && studentCredits <= 0 && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="py-4">
              <p className="text-sm font-medium text-red-800">
                This student has no credits remaining. They need to purchase more credits before you can submit feedback.
              </p>
            </CardContent>
          </Card>
        )}
        {studentCredits !== null && studentCredits > 0 && studentCredits <= 2 && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="py-4">
              <p className="text-sm font-medium text-yellow-800">
                This student has {studentCredits} credit{studentCredits !== 1 ? 's' : ''} remaining. They may need to purchase more soon.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Essay Content */}
          <div className="lg:col-span-2">
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

          {/* Feedback Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Provide Feedback</CardTitle>
                <CardDescription>
                  Fill out the feedback form below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="summaryFeedback">
                      Summary Feedback <span className="text-red-600">*</span>
                    </Label>
                    <Textarea
                      id="summaryFeedback"
                      value={formData.summaryFeedback}
                      onChange={(e) =>
                        setFormData({ ...formData, summaryFeedback: e.target.value })
                      }
                      placeholder="Provide an overall summary of the essay..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="strengths">Strengths</Label>
                    <Textarea
                      id="strengths"
                      value={formData.strengths}
                      onChange={(e) =>
                        setFormData({ ...formData, strengths: e.target.value })
                      }
                      placeholder="What did the student do well?"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priorityRevisions">Priority Revisions</Label>
                    <Textarea
                      id="priorityRevisions"
                      value={formData.priorityRevisions}
                      onChange={(e) =>
                        setFormData({ ...formData, priorityRevisions: e.target.value })
                      }
                      placeholder="What should the student focus on first?"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="overallGuidance">Overall Guidance</Label>
                    <Textarea
                      id="overallGuidance"
                      value={formData.overallGuidance}
                      onChange={(e) =>
                        setFormData({ ...formData, overallGuidance: e.target.value })
                      }
                      placeholder="Additional guidance for the next draft..."
                      rows={3}
                    />
                  </div>

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
                    disabled={submitting || (studentCredits !== null && studentCredits <= 0)}
                  >
                    {submitting
                      ? 'Submitting...'
                      : studentCredits !== null && studentCredits <= 0
                        ? 'No Credits - Cannot Submit'
                        : 'Submit Feedback'}
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
    </div>
  )
}
