'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import {
  getPriorityLevel,
  getDeadlineText,
  getWaitTimeText,
  formatDuration,
  getDaysUntilDeadline,
} from '@/lib/prioritization'

type EssayForQueue = {
  id: string
  title: string
  status: string
  wordCount: number
  submittedAt: Date | null
  studentUrgentFlag: boolean
  urgentFlagReason: string | null
  priorityScore: number
  estimatedReviewMinutes: number
  feedbackCount: number
  user: {
    id: string
    name: string | null
    email: string
  }
  application: {
    schoolName: string
    deadline: Date | null
  } | null
}

type Cohort = {
  id: string
  name: string
  color: string | null
  members: { studentId: string }[]
}

type FilterTab = 'all' | 'due_this_week' | 'overdue' | 'first_reviews' | 'revisions'

interface PriorityQueueProps {
  essays: EssayForQueue[]
  totalEstimatedMinutes: number
  cohorts?: Cohort[]
  onCohortChange?: (cohortId: string | null) => void
}

export function PriorityQueue({
  essays,
  totalEstimatedMinutes,
  cohorts = [],
  onCohortChange,
}: PriorityQueueProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null)

  const handleCohortChange = (value: string) => {
    const cohortId = value === 'all' ? null : value
    setSelectedCohort(cohortId)
    onCohortChange?.(cohortId)
  }

  // Filter essays based on active tab
  const filteredEssays = essays.filter(essay => {
    switch (activeFilter) {
      case 'due_this_week':
        const daysLeft = getDaysUntilDeadline(essay.application?.deadline ?? null)
        return daysLeft !== null && daysLeft >= 0 && daysLeft <= 7
      case 'overdue':
        const days = getDaysUntilDeadline(essay.application?.deadline ?? null)
        return days !== null && days < 0
      case 'first_reviews':
        return essay.feedbackCount === 0
      case 'revisions':
        return essay.feedbackCount > 0
      default:
        return true
    }
  })

  // Calculate counts for filter badges
  const counts = {
    all: essays.length,
    due_this_week: essays.filter(e => {
      const days = getDaysUntilDeadline(e.application?.deadline ?? null)
      return days !== null && days >= 0 && days <= 7
    }).length,
    overdue: essays.filter(e => {
      const days = getDaysUntilDeadline(e.application?.deadline ?? null)
      return days !== null && days < 0
    }).length,
    first_reviews: essays.filter(e => e.feedbackCount === 0).length,
    revisions: essays.filter(e => e.feedbackCount > 0).length,
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'due_this_week', label: 'Due This Week' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'first_reviews', label: 'First Reviews' },
    { key: 'revisions', label: 'Revisions' },
  ]

  return (
    <div className="space-y-4">
      {/* Cohort Filter */}
      {cohorts.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600">Filter by cohort:</span>
          <Select value={selectedCohort || 'all'} onValueChange={handleCohortChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All students" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              {cohorts.map(cohort => (
                <SelectItem key={cohort.id} value={cohort.id}>
                  <div className="flex items-center gap-2">
                    {cohort.color && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cohort.color }}
                      />
                    )}
                    {cohort.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCohort && (
            <Badge variant="secondary" className="text-xs">
              Filtered: {cohorts.find(c => c.id === selectedCohort)?.name}
              <button
                onClick={() => handleCohortChange('all')}
                className="ml-1 hover:text-red-500"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <Button
            key={tab.key}
            variant={activeFilter === tab.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter(tab.key)}
            className="relative"
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <Badge
                variant={activeFilter === tab.key ? 'secondary' : 'outline'}
                className="ml-2"
              >
                {counts[tab.key]}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Workload Summary */}
      <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
        <span>
          <strong>{filteredEssays.length}</strong> essays
        </span>
        <span>•</span>
        <span>
          Est. <strong>{formatDuration(totalEstimatedMinutes)}</strong> total
        </span>
      </div>

      {/* Essays Table */}
      {filteredEssays.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium mb-2">No Essays</h3>
            <p className="text-gray-600">
              {activeFilter === 'all'
                ? "You're all caught up! Check back later for new submissions."
                : `No essays match the "${tabs.find(t => t.key === activeFilter)?.label}" filter.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">Priority</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Essay</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Waiting</TableHead>
                  <TableHead>Est. Time</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEssays.map((essay) => (
                  <EssayRow key={essay.id} essay={essay} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function EssayRow({ essay }: { essay: EssayForQueue }) {
  const priorityLevel = getPriorityLevel(essay.priorityScore)

  return (
    <TableRow>
      <TableCell>
        <PriorityIndicator level={priorityLevel} score={essay.priorityScore} />
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium flex items-center gap-2">
            {essay.user.name || 'Student'}
            {essay.studentUrgentFlag && (
              <Badge variant="destructive" className="text-xs">
                Urgent
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-600">{essay.user.email}</div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{essay.title}</div>
          <div className="text-sm text-gray-600">
            {essay.application?.schoolName || 'No application'} • {essay.wordCount} words
            {essay.feedbackCount > 0 && ` • Rev ${essay.feedbackCount + 1}`}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <DeadlineBadge deadline={essay.application?.deadline ?? null} />
      </TableCell>
      <TableCell>
        <span className="text-sm text-gray-600">
          {getWaitTimeText(essay.submittedAt)}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm font-medium">
          ~{formatDuration(essay.estimatedReviewMinutes)}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <Button size="sm" asChild>
          <Link href={`/coach/review/${essay.id}`}>Review</Link>
        </Button>
      </TableCell>
    </TableRow>
  )
}

function PriorityIndicator({ level, score }: { level: string; score: number }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  }

  return (
    <div className="flex items-center gap-2" title={`Priority: ${score}/100`}>
      <div className={`w-3 h-3 rounded-full ${colors[level] || colors.low}`} />
    </div>
  )
}

function DeadlineBadge({ deadline }: { deadline: Date | null }) {
  const days = getDaysUntilDeadline(deadline)
  const text = getDeadlineText(deadline)

  let variant: 'destructive' | 'default' | 'secondary' | 'outline' = 'secondary'

  if (days !== null) {
    if (days < 0) variant = 'destructive'
    else if (days <= 3) variant = 'destructive'
    else if (days <= 7) variant = 'default'
  }

  return <Badge variant={variant}>{text}</Badge>
}
