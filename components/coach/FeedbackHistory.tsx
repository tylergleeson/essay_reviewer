'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type InlineComment = {
  id: string
  startIndex: number
  endIndex: number
  comment: string
}

type FeedbackRound = {
  id: string
  draftVersionReviewed: number
  summaryFeedback: string
  strengths: string | null
  priorityRevisions: string | null
  overallGuidance: string | null
  inlineComments: string | null
  rubricScores: string | null
  createdAt: string
  coach: {
    id: string
    name: string | null
    email: string
  }
}

interface FeedbackHistoryProps {
  essayId: string
  currentDraftVersion: number
}

export function FeedbackHistory({ essayId, currentDraftVersion }: FeedbackHistoryProps) {
  const [feedbackRounds, setFeedbackRounds] = useState<FeedbackRound[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchFeedbackHistory()
  }, [essayId])

  const fetchFeedbackHistory = async () => {
    try {
      const response = await fetch(`/api/feedback?essayId=${essayId}`)
      if (response.ok) {
        const data = await response.json()
        setFeedbackRounds(data)
      }
    } catch (error) {
      console.error('Error fetching feedback history:', error)
    } finally {
      setLoading(false)
    }
  }

  const parseInlineComments = (commentsJson: string | null): InlineComment[] => {
    if (!commentsJson) return []
    try {
      return JSON.parse(commentsJson)
    } catch {
      return []
    }
  }

  const parseRubricScores = (scoresJson: string | null): Record<string, number> | null => {
    if (!scoresJson) return null
    try {
      return JSON.parse(scoresJson)
    } catch {
      return null
    }
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Feedback History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (feedbackRounds.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Feedback History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">
            No previous feedback on this essay.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex justify-between items-center">
          Feedback History
          <Badge variant="outline">{feedbackRounds.length} round{feedbackRounds.length !== 1 ? 's' : ''}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto divide-y">
          {feedbackRounds.map((feedback, index) => (
            <div key={feedback.id} className="p-3">
              {/* Header - Always visible */}
              <button
                onClick={() => setExpandedId(expandedId === feedback.id ? null : feedback.id)}
                className="w-full text-left"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        Round {feedbackRounds.length - index}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        v{feedback.draftVersionReviewed}
                      </Badge>
                      {feedback.draftVersionReviewed === currentDraftVersion - 1 && (
                        <Badge className="text-xs bg-blue-100 text-blue-800">Previous</Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {feedback.coach.name || feedback.coach.email} • {formatDate(feedback.createdAt)}
                    </div>
                  </div>
                  <ChevronIcon expanded={expandedId === feedback.id} />
                </div>

                {/* Summary Preview - Always visible */}
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {feedback.summaryFeedback}
                </p>
              </button>

              {/* Expanded Content */}
              {expandedId === feedback.id && (
                <div className="mt-4 space-y-4 pl-2 border-l-2 border-gray-200">
                  {/* Summary */}
                  <FeedbackSection title="Summary" content={feedback.summaryFeedback} />

                  {/* Strengths */}
                  {feedback.strengths && (
                    <FeedbackSection title="Strengths" content={feedback.strengths} />
                  )}

                  {/* Priority Revisions */}
                  {feedback.priorityRevisions && (
                    <FeedbackSection title="Priority Revisions" content={feedback.priorityRevisions} />
                  )}

                  {/* Overall Guidance */}
                  {feedback.overallGuidance && (
                    <FeedbackSection title="Overall Guidance" content={feedback.overallGuidance} />
                  )}

                  {/* Rubric Scores */}
                  {feedback.rubricScores && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Rubric Scores</h4>
                      <RubricDisplay scores={parseRubricScores(feedback.rubricScores)} />
                    </div>
                  )}

                  {/* Inline Comments */}
                  {feedback.inlineComments && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        Inline Comments ({parseInlineComments(feedback.inlineComments).length})
                      </h4>
                      <div className="space-y-2">
                        {parseInlineComments(feedback.inlineComments).map((comment, i) => (
                          <div
                            key={comment.id || i}
                            className="text-xs bg-yellow-50 border border-yellow-200 rounded p-2"
                          >
                            <p className="font-medium text-yellow-800 mb-1">
                              Position: {comment.startIndex}-{comment.endIndex}
                            </p>
                            <p className="text-gray-700">{comment.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function FeedbackSection({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">{title}</h4>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>
    </div>
  )
}

function RubricDisplay({ scores }: { scores: Record<string, number> | null }) {
  if (!scores) return null

  const rubricLabels: Record<string, string> = {
    authenticity: 'Authenticity & Voice',
    structure: 'Narrative Structure',
    clarity: 'Clarity & Concision',
    promptResponse: 'Prompt Response',
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {Object.entries(scores).map(([key, value]) => (
        <div key={key} className="flex items-center gap-2">
          <span className="text-xs text-gray-600">{rubricLabels[key] || key}:</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(n => (
              <div
                key={n}
                className={`w-2 h-2 rounded-full ${
                  n <= value ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
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
