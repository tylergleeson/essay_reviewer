'use client'

import { useEffect, useState, use } from 'react'
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
  inlineComments: any | null
  rubricScores: string | null
  isAI: boolean
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

type RubricScores = {
  clarity: number
  structure: number
  voice: number
  impact: number
}

function RubricBar({ label, score }: { label: string; score: number }) {
  const percentage = (score / 10) * 100
  const color =
    score >= 8 ? 'bg-green-500' :
    score >= 6 ? 'bg-blue-500' :
    score >= 4 ? 'bg-yellow-500' :
    'bg-red-500'

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="capitalize font-medium">{label}</span>
        <span className="text-gray-600">{score}/10</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [essay, setEssay] = useState<Essay | null>(null)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiReviewLoading, setAiReviewLoading] = useState(false)

  useEffect(() => {
    fetchEssay()
  }, [id])

  const fetchEssay = async () => {
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
  }

  const requestAiReview = async () => {
    setAiReviewLoading(true)
    try {
      const response = await fetch('/api/ai-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ essayId: id }),
      })
      if (response.ok) {
        // Refresh essay data to show new feedback
        await fetchEssay()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to get AI review')
      }
    } catch (error) {
      console.error('Error requesting AI review:', error)
      alert('Failed to get AI review. Please try again.')
    } finally {
      setAiReviewLoading(false)
    }
  }

  const getReviewedDraft = (versionNumber: number) => {
    return essay?.drafts.find(d => d.versionNumber === versionNumber)
  }

  const parseRubricScores = (scores: string | null): RubricScores | null => {
    if (!scores) return null
    try {
      return JSON.parse(scores)
    } catch {
      return null
    }
  }

  const renderContentWithComments = (content: string, comments: InlineComment[]) => {
    if (!comments || comments.length === 0) {
      return <div className="whitespace-pre-wrap font-mono text-sm">{content}</div>
    }

    const sortedComments = [...comments].sort((a, b) => a.startIndex - b.startIndex)
    const parts: JSX.Element[] = []
    let lastIndex = 0

    sortedComments.forEach((comment, idx) => {
      if (comment.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>
            {content.substring(lastIndex, comment.startIndex)}
          </span>
        )
      }
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

  const hasDrafts = essay.drafts.length > 0
  const reviewedDraft = selectedFeedback ? getReviewedDraft(selectedFeedback.draftVersionReviewed) : null
  const rubricScores = selectedFeedback ? parseRubricScores(selectedFeedback.rubricScores) : null

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
              {hasDrafts && (
                <Button
                  onClick={requestAiReview}
                  disabled={aiReviewLoading}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
                >
                  {aiReviewLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      AI Reviewing…
                    </>
                  ) : (
                    <>✨ Get AI Review</>
                  )}
                </Button>
              )}
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
            <div className="flex gap-2 mb-4 flex-wrap">
              {essay.feedback.map((fb, index) => (
                <Button
                  key={fb.id}
                  variant={selectedFeedback?.id === fb.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFeedback(fb)}
                  className={selectedFeedback?.id === fb.id && fb.isAI ? 'bg-violet-600 hover:bg-violet-700' : ''}
                >
                  {fb.isAI ? '✨ AI Review' : `Feedback ${essay.feedback.length - index}`}
                  {fb.isAI && <Badge className="ml-2 bg-violet-100 text-violet-800 text-xs">AI</Badge>}
                </Button>
              ))}
            </div>
          )}
        </div>

        {essay.feedback.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-medium mb-2">No Feedback Yet</h3>
              <p className="text-gray-600 mb-4">
                This essay hasn&apos;t received any feedback yet. Try getting an AI review!
              </p>
              {hasDrafts && (
                <Button
                  onClick={requestAiReview}
                  disabled={aiReviewLoading}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
                >
                  {aiReviewLoading ? 'AI Reviewing…' : '✨ Get AI Review'}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Essay Content with Inline Comments */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      Essay Version {selectedFeedback?.draftVersionReviewed}
                    </CardTitle>
                    <div className="flex gap-2 items-center">
                      {selectedFeedback?.isAI && (
                        <Badge className="bg-violet-100 text-violet-800 border-violet-200">
                          ✨ AI Review
                        </Badge>
                      )}
                      <Badge variant="outline">Read-Only</Badge>
                    </div>
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
                  {/* AI or Coach Badge */}
                  <Card className={selectedFeedback.isAI ? 'border-violet-200 bg-violet-50/50' : ''}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        {selectedFeedback.isAI ? '✨ AI Coach' : 'Coach'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedFeedback.isAI ? (
                        <div>
                          <p className="font-medium text-violet-700">Draftly AI</p>
                          <p className="text-sm text-violet-600">Powered by Claude</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium">{selectedFeedback.coach.name || 'Coach'}</p>
                          <p className="text-sm text-gray-600">{selectedFeedback.coach.email}</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(selectedFeedback.createdAt).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Rubric Scores */}
                  {rubricScores && (
                    <Card className={selectedFeedback.isAI ? 'border-violet-200' : ''}>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">
                          {selectedFeedback.isAI ? '📊 AI Rubric Scores' : '📊 Rubric Scores'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <RubricBar label="clarity" score={rubricScores.clarity} />
                        <RubricBar label="structure" score={rubricScores.structure} />
                        <RubricBar label="voice" score={rubricScores.voice} />
                        <RubricBar label="impact" score={rubricScores.impact} />
                        <div className="pt-2 border-t">
                          <div className="flex justify-between text-sm font-medium">
                            <span>Overall</span>
                            <span>
                              {((rubricScores.clarity + rubricScores.structure + rubricScores.voice + rubricScores.impact) / 4).toFixed(1)}/10
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Summary Feedback */}
                  <Card className={selectedFeedback.isAI ? 'border-violet-200' : ''}>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Summary Feedback</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{selectedFeedback.summaryFeedback}</p>
                    </CardContent>
                  </Card>

                  {/* Strengths */}
                  {selectedFeedback.strengths && (
                    <Card className={selectedFeedback.isAI ? 'border-green-200 bg-green-50/30' : ''}>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium text-green-700">
                          💪 Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{selectedFeedback.strengths}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Priority Revisions */}
                  {selectedFeedback.priorityRevisions && (
                    <Card className={selectedFeedback.isAI ? 'border-orange-200 bg-orange-50/30' : ''}>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium text-orange-700">
                          🎯 Priority Revisions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{selectedFeedback.priorityRevisions}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Overall Guidance */}
                  {selectedFeedback.overallGuidance && (
                    <Card className={selectedFeedback.isAI ? 'border-blue-200 bg-blue-50/30' : ''}>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium text-blue-700">
                          🧭 Overall Guidance
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
        )}
      </div>
    </div>
  )
}
