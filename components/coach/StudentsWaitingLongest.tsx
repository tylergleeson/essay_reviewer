'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { getDaysUntilDeadline } from '@/lib/prioritization'

type WaitingStudent = {
  id: string
  title: string
  daysSinceSubmit: number | null
  feedbackCount: number
  estimatedReviewMinutes: number
  user: {
    name: string | null
    email: string
  }
  application: {
    schoolName: string
    deadline: Date | null
  } | null
}

interface StudentsWaitingLongestProps {
  essays: WaitingStudent[]
}

export function StudentsWaitingLongest({ essays }: StudentsWaitingLongestProps) {
  if (essays.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ClockIcon className="w-4 h-4 text-gray-500" />
          Students Waiting Longest
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {essays.map((essay, index) => {
            const daysUntil = getDaysUntilDeadline(essay.application?.deadline ?? null)
            const isUrgent = daysUntil !== null && daysUntil <= 7

            return (
              <Link
                key={essay.id}
                href={`/coach/review/${essay.id}`}
                className="flex items-center gap-3 p-2 -mx-2 rounded hover:bg-gray-50 transition-colors group"
              >
                {/* Rank indicator */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-red-100 text-red-700' :
                  index === 1 ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {index + 1}
                </div>

                {/* Student info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {essay.user.name || essay.user.email}
                    </span>
                    {essay.feedbackCount === 0 && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        1st review
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {essay.title}
                    {essay.application && ` • ${essay.application.schoolName}`}
                  </p>
                </div>

                {/* Wait time */}
                <div className="text-right shrink-0">
                  <div className={`text-sm font-medium ${
                    (essay.daysSinceSubmit || 0) >= 3 ? 'text-red-600' :
                    (essay.daysSinceSubmit || 0) >= 2 ? 'text-orange-600' :
                    'text-gray-600'
                  }`}>
                    {essay.daysSinceSubmit}d
                  </div>
                  {isUrgent && (
                    <span className="text-xs text-red-500">
                      {daysUntil !== null && daysUntil <= 0 ? 'Overdue!' :
                       daysUntil === 1 ? 'Due tomorrow' :
                       `${daysUntil}d left`}
                    </span>
                  )}
                </div>

                {/* Arrow on hover */}
                <svg
                  className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )
          })}
        </div>

        {essays.length >= 5 && (
          <div className="mt-3 pt-3 border-t">
            <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
              <Link href="/coach/session">View all in queue</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}
