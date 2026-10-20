'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { toast } from 'sonner'
import { SessionTimer } from '@/components/coach/SessionTimer'
import {
  formatDuration,
  getPriorityLevel,
  getDeadlineText,
} from '@/lib/prioritization'

type EssayForSession = {
  id: string
  title: string
  wordCount: number
  studentName: string
  schoolName: string | null
  priorityScore: number
  estimatedMinutes: number
  deadline: Date | null
  feedbackCount: number
}

type TimePreset = {
  label: string
  minutes: number
}

const TIME_PRESETS: TimePreset[] = [
  { label: '30 min', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: '3 hours', minutes: 180 },
]

export default function WorkSessionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [essays, setEssays] = useState<EssayForSession[]>([])
  const [selectedMinutes, setSelectedMinutes] = useState(60)
  const [customMinutes, setCustomMinutes] = useState('')
  const [activeSession, setActiveSession] = useState<{
    id: string
    startedAt: Date
    plannedDurationMinutes: number
    essaysCompleted: number
  } | null>(null)
  const [sessionStarted, setSessionStarted] = useState(false)

  // Fetch essays and check for active session
  useEffect(() => {
    Promise.all([fetchEssays(), checkActiveSession()])
      .finally(() => setLoading(false))
  }, [])

  const fetchEssays = async () => {
    try {
      const response = await fetch('/api/coach/queue')
      if (response.ok) {
        const data = await response.json()
        setEssays(data)
      }
    } catch (error) {
      console.error('Error fetching essays:', error)
    }
  }

  const checkActiveSession = async () => {
    try {
      const response = await fetch('/api/coach/sessions?active=true')
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setActiveSession({
            id: data.id,
            startedAt: new Date(data.startedAt),
            plannedDurationMinutes: data.plannedDurationMinutes,
            essaysCompleted: data.essaysCompleted,
          })
          setSessionStarted(true)
        }
      }
    } catch (error) {
      console.error('Error checking active session:', error)
    }
  }

  // Calculate curated queue based on available time
  const effectiveMinutes = customMinutes ? parseInt(customMinutes) : selectedMinutes
  const curatedQueue = getCuratedQueue(essays, effectiveMinutes)
  const totalEstimatedTime = curatedQueue.reduce((sum, e) => sum + e.estimatedMinutes, 0)

  const handleStartSession = async () => {
    try {
      const response = await fetch('/api/coach/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plannedDurationMinutes: effectiveMinutes }),
      })

      if (response.ok) {
        const session = await response.json()
        setActiveSession({
          id: session.id,
          startedAt: new Date(session.startedAt),
          plannedDurationMinutes: session.plannedDurationMinutes,
          essaysCompleted: 0,
        })
        setSessionStarted(true)
        toast.success('Work session started!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to start session')
      }
    } catch (error) {
      console.error('Error starting session:', error)
      toast.error('Failed to start session')
    }
  }

  const handleEndSession = () => {
    setSessionStarted(false)
    setActiveSession(null)
    toast.success('Session completed!')
    router.push('/coach')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {sessionStarted ? 'Work Session Active' : 'Plan Work Session'}
              </h1>
              <p className="text-sm text-gray-600">
                {sessionStarted
                  ? 'Your curated queue is ready'
                  : 'Tell us how much time you have'}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/coach">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!sessionStarted ? (
          <>
            {/* Time Selection */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  I have time to work
                </CardTitle>
                <CardDescription>
                  Select how much time you have available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 mb-4">
                  {TIME_PRESETS.map((preset) => (
                    <Button
                      key={preset.minutes}
                      variant={selectedMinutes === preset.minutes && !customMinutes ? 'default' : 'outline'}
                      onClick={() => {
                        setSelectedMinutes(preset.minutes)
                        setCustomMinutes('')
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Custom"
                      className="w-24 px-3 py-2 border rounded-md text-sm"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      min="15"
                      max="480"
                    />
                    <span className="text-sm text-gray-600">min</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {curatedQueue.length} essay{curatedQueue.length !== 1 ? 's' : ''} fit in {formatDuration(effectiveMinutes)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Estimated time: {formatDuration(totalEstimatedTime)}
                      </p>
                    </div>
                    <Button
                      onClick={handleStartSession}
                      disabled={curatedQueue.length === 0}
                      size="lg"
                    >
                      Start Session
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Curated Queue Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Your Queue</CardTitle>
                <CardDescription>
                  Essays selected based on priority that fit in your time window
                </CardDescription>
              </CardHeader>
              <CardContent>
                {curatedQueue.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <p>No essays in queue</p>
                    <p className="text-sm">Check back later for new submissions</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {curatedQueue.map((essay, index) => (
                      <EssayQueueItem key={essay.id} essay={essay} index={index + 1} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Essays that didn't fit */}
            {essays.length > curatedQueue.length && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-600 mb-3">
                  {essays.length - curatedQueue.length} more essay{essays.length - curatedQueue.length !== 1 ? 's' : ''} in queue (won&apos;t fit in this session)
                </h3>
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {essays
                        .filter((e) => !curatedQueue.find((q) => q.id === e.id))
                        .slice(0, 3)
                        .map((essay) => (
                          <div key={essay.id} className="flex justify-between items-center text-sm text-gray-600">
                            <span>{essay.title}</span>
                            <span>~{formatDuration(essay.estimatedMinutes)}</span>
                          </div>
                        ))}
                      {essays.length - curatedQueue.length > 3 && (
                        <p className="text-sm text-gray-500">
                          And {essays.length - curatedQueue.length - 3} more...
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Active Session View */}
            <Card className="mb-6 border-green-200 bg-green-50">
              <CardContent className="py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-green-800">Session in Progress</p>
                    <p className="text-sm text-green-600">
                      Started at {new Date(activeSession!.startedAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-800">
                      {activeSession?.essaysCompleted || 0} / {curatedQueue.length}
                    </p>
                    <p className="text-sm text-green-600">essays completed</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-4 h-2 bg-green-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 transition-all"
                    style={{
                      width: `${curatedQueue.length > 0 ? ((activeSession?.essaysCompleted || 0) / curatedQueue.length) * 100 : 0}%`
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Active Session Queue */}
            <Card>
              <CardHeader>
                <CardTitle>Session Queue</CardTitle>
                <CardDescription>
                  Click to start reviewing an essay
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {curatedQueue.map((essay, index) => (
                    <Link
                      key={essay.id}
                      href={`/coach/review/${essay.id}?session=${activeSession?.id}`}
                      className="block"
                    >
                      <EssayQueueItem essay={essay} index={index + 1} clickable />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Floating Timer */}
      {sessionStarted && activeSession && (
        <SessionTimer
          sessionId={activeSession.id}
          plannedMinutes={activeSession.plannedDurationMinutes}
          onEnd={handleEndSession}
        />
      )}
    </div>
  )
}

function EssayQueueItem({
  essay,
  index,
  clickable = false,
}: {
  essay: EssayForSession
  index: number
  clickable?: boolean
}) {
  const priorityLevel = getPriorityLevel(essay.priorityScore)

  const priorityColors: Record<string, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  }

  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-lg border bg-white ${
        clickable ? 'hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors' : ''
      }`}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-medium text-sm">
        {index}
      </div>
      <div className={`w-3 h-3 rounded-full ${priorityColors[priorityLevel]}`} title={`Priority: ${essay.priorityScore}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{essay.title}</p>
          {essay.feedbackCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              Rev {essay.feedbackCount + 1}
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-600 truncate">
          {essay.studentName} • {essay.schoolName || 'No school'} • {essay.wordCount} words
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-medium">~{formatDuration(essay.estimatedMinutes)}</p>
        <p className="text-xs text-gray-500">{getDeadlineText(essay.deadline)}</p>
      </div>
    </div>
  )
}

function getCuratedQueue(essays: EssayForSession[], availableMinutes: number): EssayForSession[] {
  // Sort by priority (highest first)
  const sorted = [...essays].sort((a, b) => b.priorityScore - a.priorityScore)

  const selected: EssayForSession[] = []
  let remainingMinutes = availableMinutes

  for (const essay of sorted) {
    if (essay.estimatedMinutes <= remainingMinutes) {
      selected.push(essay)
      remainingMinutes -= essay.estimatedMinutes
    }
  }

  return selected
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <path strokeWidth="2" strokeLinecap="round" d="M12 6v6l4 2" />
    </svg>
  )
}
