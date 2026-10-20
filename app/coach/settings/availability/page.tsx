'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import Link from 'next/link'
import { toast } from 'sonner'

type RecurringSlot = {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isBlackout: boolean
}

type BlackoutDate = {
  id: string
  specificDate: string
  isBlackout: true
}

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export default function AvailabilityPage() {
  const [recurring, setRecurring] = useState<RecurringSlot[]>([])
  const [blackouts, setBlackouts] = useState<BlackoutDate[]>([])
  const [loading, setLoading] = useState(true)
  const [addingRecurring, setAddingRecurring] = useState(false)
  const [addingBlackout, setAddingBlackout] = useState(false)

  // Form state for new recurring slot
  const [newRecurring, setNewRecurring] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
  })

  // Form state for new blackout
  const [newBlackout, setNewBlackout] = useState('')

  useEffect(() => {
    fetchAvailability()
  }, [])

  const fetchAvailability = async () => {
    try {
      const response = await fetch('/api/coach/availability')
      if (response.ok) {
        const data = await response.json()
        setRecurring(data.recurring)
        setBlackouts(data.blackouts)
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
    } finally {
      setLoading(false)
    }
  }

  const addRecurringSlot = async () => {
    try {
      const response = await fetch('/api/coach/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecurring),
      })

      if (response.ok) {
        const slot = await response.json()
        setRecurring(prev => {
          const filtered = prev.filter(s => s.dayOfWeek !== slot.dayOfWeek)
          return [...filtered, slot].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
        })
        setAddingRecurring(false)
        toast.success('Availability added')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add availability')
      }
    } catch (error) {
      console.error('Error adding availability:', error)
      toast.error('Failed to add availability')
    }
  }

  const addBlackoutDate = async () => {
    if (!newBlackout) return

    try {
      const response = await fetch('/api/coach/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specificDate: newBlackout,
          isBlackout: true,
        }),
      })

      if (response.ok) {
        const blackout = await response.json()
        setBlackouts(prev => [...prev, blackout])
        setNewBlackout('')
        setAddingBlackout(false)
        toast.success('Vacation day added')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add vacation day')
      }
    } catch (error) {
      console.error('Error adding blackout:', error)
      toast.error('Failed to add vacation day')
    }
  }

  const deleteSlot = async (id: string, type: 'recurring' | 'blackout') => {
    try {
      const response = await fetch(`/api/coach/availability?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        if (type === 'recurring') {
          setRecurring(prev => prev.filter(s => s.id !== id))
        } else {
          setBlackouts(prev => prev.filter(b => b.id !== id))
        }
        toast.success('Removed')
      } else {
        toast.error('Failed to remove')
      }
    } catch (error) {
      console.error('Error deleting slot:', error)
      toast.error('Failed to remove')
    }
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
              <h1 className="text-2xl font-bold text-gray-900">Availability Manager</h1>
              <p className="text-sm text-gray-600">
                Set your working hours and vacation days
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/coach/calendar">Back to Calendar</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weekly Schedule */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Weekly Schedule</CardTitle>
                  <CardDescription>
                    Set your regular working hours
                  </CardDescription>
                </div>
                <Dialog open={addingRecurring} onOpenChange={setAddingRecurring}>
                  <DialogTrigger asChild>
                    <Button size="sm">Add Hours</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Working Hours</DialogTitle>
                      <DialogDescription>
                        Set your availability for a day of the week
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Day</Label>
                        <Select
                          value={newRecurring.dayOfWeek.toString()}
                          onValueChange={(v) => setNewRecurring(prev => ({ ...prev, dayOfWeek: parseInt(v) }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS_OF_WEEK.map((day, index) => (
                              <SelectItem key={day} value={index.toString()}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Time</Label>
                          <Input
                            type="time"
                            value={newRecurring.startTime}
                            onChange={(e) => setNewRecurring(prev => ({ ...prev, startTime: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>End Time</Label>
                          <Input
                            type="time"
                            value={newRecurring.endTime}
                            onChange={(e) => setNewRecurring(prev => ({ ...prev, endTime: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setAddingRecurring(false)}>
                          Cancel
                        </Button>
                        <Button onClick={addRecurringSlot}>
                          Add
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {recurring.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-4">
                  No working hours set. Add your availability above.
                </p>
              ) : (
                <div className="space-y-2">
                  {DAYS_OF_WEEK.map((day, index) => {
                    const slot = recurring.find(s => s.dayOfWeek === index)
                    return (
                      <div
                        key={day}
                        className={`flex justify-between items-center p-3 rounded-lg ${
                          slot ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                        }`}
                      >
                        <div>
                          <p className="font-medium">{day}</p>
                          {slot ? (
                            <p className="text-sm text-green-700">
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500">Not available</p>
                          )}
                        </div>
                        {slot && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSlot(slot.id, 'recurring')}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vacation Days */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Vacation Days</CardTitle>
                  <CardDescription>
                    Block out dates when you&apos;re unavailable
                  </CardDescription>
                </div>
                <Dialog open={addingBlackout} onOpenChange={setAddingBlackout}>
                  <DialogTrigger asChild>
                    <Button size="sm">Add Date</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Vacation Day</DialogTitle>
                      <DialogDescription>
                        Select a date when you won&apos;t be available
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={newBlackout}
                          onChange={(e) => setNewBlackout(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setAddingBlackout(false)}>
                          Cancel
                        </Button>
                        <Button onClick={addBlackoutDate} disabled={!newBlackout}>
                          Add
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {blackouts.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-4">
                  No vacation days set.
                </p>
              ) : (
                <div className="space-y-2">
                  {blackouts
                    .sort((a, b) => new Date(a.specificDate).getTime() - new Date(b.specificDate).getTime())
                    .map((blackout) => (
                      <div
                        key={blackout.id}
                        className="flex justify-between items-center p-3 rounded-lg bg-gray-100"
                      >
                        <p className="font-medium">
                          {formatDate(blackout.specificDate)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSlot(blackout.id, 'blackout')}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Weekly Summary */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Weekly Summary</CardTitle>
            <CardDescription>
              Your total available hours per week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-4xl font-bold">
                {calculateWeeklyHours(recurring)}
              </p>
              <p className="text-sm text-gray-600">hours per week</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function calculateWeeklyHours(slots: RecurringSlot[]): number {
  return slots.reduce((total, slot) => {
    const [startH, startM] = slot.startTime.split(':').map(Number)
    const [endH, endM] = slot.endTime.split(':').map(Number)
    const hours = (endH * 60 + endM - startH * 60 - startM) / 60
    return total + hours
  }, 0)
}
