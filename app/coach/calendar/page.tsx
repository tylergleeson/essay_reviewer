'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction'
import { EventClickArg } from '@fullcalendar/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Link from 'next/link'
import { formatDuration, getPriorityLevel } from '@/lib/prioritization'

type CalendarEssay = {
  id: string
  title: string
  studentName: string
  schoolName: string | null
  admissionRound: string | null
  status: string
  wordCount: number
  estimatedMinutes: number
  priorityScore: number
}

type CalendarEvent = {
  id: string
  title: string
  start: string
  allDay: boolean
  extendedProps: {
    type: 'deadline' | 'blackout'
    essayCount?: number
    totalMinutes?: number
    roundCounts?: Record<string, number>
    dominantRound?: string
    essays?: CalendarEssay[]
  }
  backgroundColor: string
  borderColor: string
  textColor?: string
}

type RoundFilter = 'all' | 'ED' | 'EA' | 'RD' | 'ROLLING'

const ROUND_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  ED1: { bg: '#dc2626', border: '#b91c1c', label: 'ED1' },
  ED2: { bg: '#ea580c', border: '#c2410c', label: 'ED2' },
  EA: { bg: '#ca8a04', border: '#a16207', label: 'EA' },
  REA: { bg: '#9333ea', border: '#7e22ce', label: 'REA' },
  RD: { bg: '#2563eb', border: '#1d4ed8', label: 'RD' },
  ROLLING: { bg: '#16a34a', border: '#15803d', label: 'Rolling' },
}

export default function CalendarPage() {
  const router = useRouter()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedEssays, setSelectedEssays] = useState<CalendarEssay[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [roundFilter, setRoundFilter] = useState<RoundFilter>('all')
  const [roundSummary, setRoundSummary] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchCalendarData()
  }, [roundFilter])

  const fetchCalendarData = async () => {
    try {
      const params = new URLSearchParams()
      if (roundFilter !== 'all') {
        params.set('round', roundFilter)
      }
      const response = await fetch(`/api/coach/calendar?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events)
        setRoundSummary(data.roundSummary || {})
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate round totals for summary card
  const edCount = (roundSummary['ED1'] || 0) + (roundSummary['ED2'] || 0)
  const eaCount = (roundSummary['EA'] || 0) + (roundSummary['REA'] || 0)
  const rdCount = roundSummary['RD'] || 0
  const rollingCount = roundSummary['ROLLING'] || 0

  const handleEventClick = (info: EventClickArg) => {
    const extendedProps = info.event.extendedProps as CalendarEvent['extendedProps']
    const startStr = info.event.startStr
    if (extendedProps.type === 'deadline' && extendedProps.essays) {
      setSelectedDate(startStr)
      setSelectedEssays(extendedProps.essays)
      setDialogOpen(true)
    }
  }

  const handleDateClick = (info: DateClickArg) => {
    // Find essays due on this date
    const event = events.find(e =>
      e.extendedProps.type === 'deadline' && e.start === info.dateStr
    )
    if (event?.extendedProps.essays) {
      setSelectedDate(info.dateStr)
      setSelectedEssays(event.extendedProps.essays)
      setDialogOpen(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">Loading calendar...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
              <p className="text-sm text-gray-600">
                View deadlines by admission round
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/coach/settings/availability">Manage Availability</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/coach">Back to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Round Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={roundFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRoundFilter('all')}
          >
            All Rounds
          </Button>
          <Button
            variant={roundFilter === 'ED' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRoundFilter('ED')}
            className={roundFilter === 'ED' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            Early Decision {edCount > 0 && <Badge variant="secondary" className="ml-2">{edCount}</Badge>}
          </Button>
          <Button
            variant={roundFilter === 'EA' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRoundFilter('EA')}
            className={roundFilter === 'EA' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
          >
            Early Action {eaCount > 0 && <Badge variant="secondary" className="ml-2">{eaCount}</Badge>}
          </Button>
          <Button
            variant={roundFilter === 'RD' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRoundFilter('RD')}
            className={roundFilter === 'RD' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            Regular Decision {rdCount > 0 && <Badge variant="secondary" className="ml-2">{rdCount}</Badge>}
          </Button>
          <Button
            variant={roundFilter === 'ROLLING' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRoundFilter('ROLLING')}
            className={roundFilter === 'ROLLING' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            Rolling {rollingCount > 0 && <Badge variant="secondary" className="ml-2">{rollingCount}</Badge>}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-4">
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  events={events}
                  eventClick={handleEventClick}
                  dateClick={handleDateClick}
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,dayGridWeek',
                  }}
                  height="auto"
                  eventDisplay="block"
                  dayMaxEvents={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Legend and Summary */}
          <div className="space-y-6">
            {/* Round Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Round Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: ROUND_COLORS.ED1.bg }} />
                    <span className="text-sm">Early Decision</span>
                  </div>
                  <span className="font-medium">{edCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: ROUND_COLORS.EA.bg }} />
                    <span className="text-sm">Early Action</span>
                  </div>
                  <span className="font-medium">{eaCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: ROUND_COLORS.RD.bg }} />
                    <span className="text-sm">Regular Decision</span>
                  </div>
                  <span className="font-medium">{rdCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: ROUND_COLORS.ROLLING.bg }} />
                    <span className="text-sm">Rolling</span>
                  </div>
                  <span className="font-medium">{rollingCount}</span>
                </div>
                <div className="pt-2 border-t mt-2">
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-sm">Total</span>
                    <span>{edCount + eaCount + rdCount + rollingCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: ROUND_COLORS.ED1.bg }} />
                  <span className="text-sm">ED1 (Nov 1-15)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: ROUND_COLORS.ED2.bg }} />
                  <span className="text-sm">ED2 (Jan 1-15)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: ROUND_COLORS.EA.bg }} />
                  <span className="text-sm">EA (Nov 1-15)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: ROUND_COLORS.REA.bg }} />
                  <span className="text-sm">REA (Nov 1)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: ROUND_COLORS.RD.bg }} />
                  <span className="text-sm">RD (Jan 1-15)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: ROUND_COLORS.ROLLING.bg }} />
                  <span className="text-sm">Rolling</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-300" />
                  <span className="text-sm">Unavailable</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Upcoming Deadlines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events
                    .filter(e => e.extendedProps.type === 'deadline')
                    .filter(e => new Date(e.start) >= new Date())
                    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                    .slice(0, 5)
                    .map(event => (
                      <div
                        key={event.id}
                        className="flex justify-between items-center text-sm cursor-pointer hover:bg-gray-50 p-2 rounded -mx-2"
                        onClick={() => {
                          if (event.extendedProps.essays) {
                            setSelectedDate(event.start)
                            setSelectedEssays(event.extendedProps.essays)
                            setDialogOpen(true)
                          }
                        }}
                      >
                        <div>
                          <p className="font-medium">
                            {formatDate(event.start)}
                          </p>
                          <p className="text-gray-600">
                            {event.extendedProps.essayCount} essay{event.extendedProps.essayCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Badge
                          style={{ backgroundColor: event.backgroundColor }}
                          className="text-white"
                        >
                          ~{formatDuration(event.extendedProps.totalMinutes || 0)}
                        </Badge>
                      </div>
                    ))}
                  {events.filter(e =>
                    e.extendedProps.type === 'deadline' && new Date(e.start) >= new Date()
                  ).length === 0 && (
                    <p className="text-sm text-gray-600">No upcoming deadlines</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Essay Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Essays Due {selectedDate && formatDate(selectedDate)}</DialogTitle>
            <DialogDescription>
              {selectedEssays.length} essay{selectedEssays.length !== 1 ? 's' : ''} •
              Est. {formatDuration(selectedEssays.reduce((sum, e) => sum + e.estimatedMinutes, 0))} total
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {selectedEssays
              .sort((a, b) => b.priorityScore - a.priorityScore)
              .map(essay => (
                <div
                  key={essay.id}
                  className="flex items-center gap-4 p-3 rounded-lg border bg-white hover:border-blue-300 cursor-pointer"
                  onClick={() => router.push(`/coach/review/${essay.id}`)}
                >
                  <PriorityDot score={essay.priorityScore} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{essay.title}</p>
                      {essay.admissionRound && (
                        <RoundBadge round={essay.admissionRound} />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {essay.studentName} • {essay.schoolName || 'No school'} • {essay.wordCount} words
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-medium">~{formatDuration(essay.estimatedMinutes)}</p>
                    <Badge variant={essay.status === 'SUBMITTED' ? 'default' : 'secondary'}>
                      {essay.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
            <Button asChild>
              <Link href="/coach/session">Start Work Session</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PriorityDot({ score }: { score: number }) {
  const level = getPriorityLevel(score)
  const colors: Record<string, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  }

  return (
    <div className={`w-3 h-3 rounded-full ${colors[level]}`} title={`Priority: ${score}`} />
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function RoundBadge({ round }: { round: string }) {
  const color = ROUND_COLORS[round]
  if (!color) return null

  return (
    <span
      className="px-1.5 py-0.5 rounded text-xs font-medium text-white shrink-0"
      style={{ backgroundColor: color.bg }}
    >
      {color.label}
    </span>
  )
}
