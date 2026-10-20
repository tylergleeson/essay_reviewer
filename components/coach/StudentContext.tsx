'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import Link from 'next/link'
import { toast } from 'sonner'

type StudentOtherEssay = {
  id: string
  title: string
  status: string
  application: {
    schoolName: string
  } | null
}

type Cohort = {
  id: string
  name: string
  color: string | null
}

interface StudentContextProps {
  studentId: string
  studentName: string
  studentEmail: string
  coachNotes: string | null
  creditsRemaining: number | null
  packageName: string | null
  totalCredits: number | null
  studentOtherEssays: StudentOtherEssay[]
  cohorts: Cohort[]
}

export function StudentContext({
  studentId,
  studentName,
  studentEmail,
  coachNotes: initialNotes,
  creditsRemaining,
  packageName,
  totalCredits,
  studentOtherEssays,
  cohorts,
}: StudentContextProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [notes, setNotes] = useState(initialNotes || '')
  const [saving, setSaving] = useState(false)

  const saveNotes = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/coach/students/${studentId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })

      if (response.ok) {
        toast.success('Notes saved')
        setIsEditing(false)
      } else {
        toast.error('Failed to save notes')
      }
    } catch (error) {
      console.error('Error saving notes:', error)
      toast.error('Failed to save notes')
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'default'
      case 'SUBMITTED':
      case 'IN_REVIEW':
        return 'secondary'
      case 'NEEDS_REVISION':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-gray-500" />
                Student Context
              </CardTitle>
              <ChevronIcon expanded={isExpanded} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Student Info */}
            <div>
              <p className="font-medium">{studentName || 'Student'}</p>
              <p className="text-sm text-gray-500">{studentEmail}</p>
              {cohorts.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {cohorts.map(cohort => (
                    <Badge
                      key={cohort.id}
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: cohort.color || undefined,
                        color: cohort.color || undefined,
                      }}
                    >
                      {cohort.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Credits */}
            {packageName && (
              <div className="bg-gray-50 rounded p-2">
                <p className="text-xs font-medium text-gray-600">Package</p>
                <p className="text-sm font-medium">{packageName}</p>
                {creditsRemaining !== null && totalCredits !== null && (
                  <p className="text-xs text-gray-500">
                    {creditsRemaining} / {totalCredits} credits remaining
                  </p>
                )}
              </div>
            )}

            {/* Coach Notes */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-medium text-gray-600">Your Notes</p>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setIsEditing(true)}
                  >
                    {notes ? 'Edit' : 'Add'}
                  </Button>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this student..."
                    rows={3}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={saveNotes}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNotes(initialNotes || '')
                        setIsEditing(false)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : notes ? (
                <p className="text-sm text-gray-700 bg-yellow-50 border border-yellow-100 rounded p-2">
                  {notes}
                </p>
              ) : (
                <p className="text-xs text-gray-400 italic">No notes yet</p>
              )}
            </div>

            {/* Other Essays */}
            {studentOtherEssays.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">
                  Other Essays ({studentOtherEssays.length})
                </p>
                <div className="space-y-2">
                  {studentOtherEssays.map(essay => (
                    <Link
                      key={essay.id}
                      href={`/coach/review/${essay.id}`}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{essay.title}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {essay.application?.schoolName || 'No school'}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(essay.status)} className="ml-2 text-xs shrink-0">
                        {essay.status.replace('_', ' ')}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
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
