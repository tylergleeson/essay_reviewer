'use client'

import { useEffect, useState, use, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Feedback = {
  id: string
  draftVersionReviewed: number
  summaryFeedback: string
  strengths: string | null
  priorityRevisions: string | null
  overallGuidance: string | null
  inlineComments: InlineComment[] | null
  createdAt: string
  coach: {
    id: string
    name: string | null
    email: string
  }
}

type Essay = {
  id: string
  title: string
  status: string
  application: {
    schoolName: string
  } | null
  drafts: {
    id: string
    content: string
    versionNumber: number
  }[]
  feedback: Feedback[]
}

type InlineComment = {
  id: string
  startIndex: number
  endIndex: number
  comment: string
  createdAt: string
}

export default function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [essay, setEssay] = useState<Essay | null>(null)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchEssay = useCallback(async () => {
    try {
      const response = await fetch(`/api/essays/${id}`)
      if (response.ok) {
        const data = await response.json()
        setEssay(data)
        if (data.feedback.length > 0) {
          setSelectedFeedback(data.feedback[0])
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

  const getReviewedDraft = (versionNumber: number) => {
    return essay?.drafts.find(d => d.versionNumber === versionNumber)
  }

  const renderContentWithComments = (content: string, comments: InlineComment[]) => {
    if (!comments || comments.length === 0) {
      return <div className="whitespace-pre-wrap font-mono text-sm">{content}</div>
    }

    // Sort comments by start index
    const sortedComments = [...comments].sort((a, b) => a.startIndex - b.startIndex)

    const parts: JSX.Element[] = []
    let lastIndex = 0

    sortedComments.forEach((comment, idx) => {
      // Add text before comment
      if (comment.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>
            {content.substring(lastIndex, comment.startIndex)}
          </span>
        )
      }

      // Add highlighted comment
      parts.push(
        <mark
          key={`comment-${idx}`}
          className="bg-yellow-200 cursor-help relative group"
          title={comment.comment}
        >
          {content.substring(comment.startIndex, comment.endIndex)}
          <span className="invisible group-hover:visible absolute bottom-full left-0 bg-gray-900 text-white text-xs rounded p-2 mb-1 w-64 z-10">
            {comment.comment}
          </span>
        </mark>
      )

      lastIndex = comment.endIndex
    })

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key="text-final">{content.substring(lastIndex)}</span>
      )
    }

    return <div className="whitespace-pre-wrap font-mono text-sm">{parts}</div>
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

  if (essay.feedback.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-medium mb-2">No Feedback Yet</h3>
              <p className="text-gray-600 mb-4">
                This essay hasn&apos;t received any feedback from a coach yet.
              </p>
              <Button asChild>
                <Link href={`/dashboard/essays/${id}`}>Back to Editor</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const reviewedDraft = selectedFeedback ? getReviewedDraft(selectedFeedback.draftVersionReviewed) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{essay.title}</h1>
              {essay.application && (
                <p className="text-sm text-gray-600">For: {essay.application.schoolName}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/dashboard/essays/${id}`}>Back to Editor</Link>
              </Button>
              {essay.status === 'NEEDS_REVISION' && (
                <Button asChild>
                  <Link href={`/dashboard/essays/${id}`}>Start Revision</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Feedback Selector */}
          {essay.feedback.length > 1 && (
            <div className="flex gap-2 mb-4">
              {essay.feedback.map((fb, index) => (
                <Button
                  key={fb.id}
                  variant={selectedFeedback?.id === fb.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFeedback(fb)}
                >
                  Feedback {essay.feedback.length - index}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Essay Content with Inline Comments */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>
                    Essay Version {selectedFeedback?.draftVersionReviewed}
                  </CardTitle>
                  <Badge variant="outline">Read-Only</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {reviewedDraft ? (
                  <div className="bg-gray-50 p-4 rounded border min-h-[500px]">
                    {renderContentWithComments(
                      reviewedDraft.content,
                      selectedFeedback?.inlineComments as InlineComment[] || []
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">Draft not found</p>
                )}
                {selectedFeedback?.inlineComments && (
                  <p className="text-sm text-gray-600 mt-4">
                    Hover over highlighted text to see inline comments
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Feedback Panel */}
          <div className="space-y-4">
            {selectedFeedback && (
              <>
                {/* Coach Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Coach</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{selectedFeedback.coach.name || 'Coach'}</p>
                    <p className="text-sm text-gray-600">{selectedFeedback.coach.email}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(selectedFeedback.createdAt).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                {/* Summary Feedback */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Summary Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{selectedFeedback.summaryFeedback}</p>
                  </CardContent>
                </Card>

                {/* Strengths */}
                {selectedFeedback.strengths && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-green-700">
                        Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{selectedFeedback.strengths}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Priority Revisions */}
                {selectedFeedback.priorityRevisions && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-orange-700">
                        Priority Revisions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{selectedFeedback.priorityRevisions}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Overall Guidance */}
                {selectedFeedback.overallGuidance && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">
                        Overall Guidance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{selectedFeedback.overallGuidance}</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
