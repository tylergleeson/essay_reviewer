'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { formatDuration } from '@/lib/prioritization'

type InProgressReview = {
  id: string
  essayId: string
  essayTitle: string
  studentName: string
  studentEmail: string
  schoolName: string | null
  startedAt: Date
  lastSavedAt: Date | null
  draftFeedback: string | null
  timeSpentMinutes: number
}

interface QuickResumeCardProps {
  review: InProgressReview
}

export function QuickResumeCard({ review }: QuickResumeCardProps) {
  // Parse draft feedback for preview
  let feedbackPreview = ''
  if (review.draftFeedback) {
    try {
      const parsed = JSON.parse(review.draftFeedback)
      feedbackPreview = parsed.summaryFeedback?.slice(0, 100) || ''
    } catch {
      feedbackPreview = ''
    }
  }

  const timeAgo = getTimeAgo(review.lastSavedAt || review.startedAt)

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Continue Where You Left Off
              <Badge variant="secondary">In Progress</Badge>
            </CardTitle>
            <CardDescription>
              Last worked on {timeAgo}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-gray-900">{review.essayTitle}</h4>
            <p className="text-sm text-gray-600">
              {review.studentName || review.studentEmail}
              {review.schoolName && ` • ${review.schoolName}`}
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              {formatDuration(review.timeSpentMinutes)} spent
            </span>
            {review.lastSavedAt && (
              <span className="flex items-center gap-1">
                <SaveIcon className="h-4 w-4" />
                Draft saved
              </span>
            )}
          </div>

          {feedbackPreview && (
            <div className="bg-white rounded p-3 border">
              <p className="text-sm text-gray-600 italic">
                &quot;{feedbackPreview}{feedbackPreview.length >= 100 ? '...' : ''}&quot;
              </p>
            </div>
          )}

          <Button asChild className="w-full">
            <Link href={`/coach/review/${review.essayId}`}>
              Continue Review
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 60) return `${minutes} minutes ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <path strokeWidth="2" strokeLinecap="round" d="M12 6v6l4 2" />
    </svg>
  )
}

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  )
}
