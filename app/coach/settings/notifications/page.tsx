'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import Link from 'next/link'
import { toast } from 'sonner'

type NotificationPreferences = {
  id: string
  dailyDigestEnabled: boolean
  dailyDigestTime: string | null
  deadlineWarning3Days: boolean
  deadlineWarning1Day: boolean
  inactivityReminderDays: number | null
  quietHoursEnabled: boolean
  quietHoursStart: string | null
  quietHoursEnd: string | null
  vacationModeEnabled: boolean
  vacationModeUntil: string | null
}

export default function NotificationsSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [, setSaving] = useState(false)

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/coach/notifications')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data)
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePreference = async (updates: Partial<NotificationPreferences>) => {
    if (!preferences) return

    setSaving(true)
    try {
      const response = await fetch('/api/coach/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        const updated = await response.json()
        setPreferences(updated)
        toast.success('Settings saved')
      } else {
        toast.error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="animate-pulse">Loading settings...</div>
        </div>
      </div>
    )
  }

  if (!preferences) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <p>Failed to load settings</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
              <p className="text-sm text-gray-600">
                Configure how and when you receive notifications
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/coach">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Vacation Mode - Most prominent */}
        <Card className={preferences.vacationModeEnabled ? 'border-amber-200 bg-amber-50' : ''}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Vacation Mode</CardTitle>
                <CardDescription>
                  Pause all notifications while you&apos;re away
                </CardDescription>
              </div>
              <Switch
                checked={preferences.vacationModeEnabled}
                onCheckedChange={(checked) => updatePreference({ vacationModeEnabled: checked })}
              />
            </div>
          </CardHeader>
          {preferences.vacationModeEnabled && (
            <CardContent>
              <div className="space-y-2">
                <Label>Return Date (optional)</Label>
                <Input
                  type="date"
                  value={preferences.vacationModeUntil?.split('T')[0] || ''}
                  onChange={(e) => updatePreference({
                    vacationModeUntil: e.target.value || null
                  })}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500">
                  Vacation mode will auto-disable on this date
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Daily Digest */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Daily Digest</CardTitle>
                <CardDescription>
                  Receive a summary of pending essays each morning
                </CardDescription>
              </div>
              <Switch
                checked={preferences.dailyDigestEnabled}
                onCheckedChange={(checked) => updatePreference({ dailyDigestEnabled: checked })}
              />
            </div>
          </CardHeader>
          {preferences.dailyDigestEnabled && (
            <CardContent>
              <div className="space-y-2">
                <Label>Send Time</Label>
                <Input
                  type="time"
                  value={preferences.dailyDigestTime || '09:00'}
                  onChange={(e) => updatePreference({ dailyDigestTime: e.target.value })}
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Deadline Warnings */}
        <Card>
          <CardHeader>
            <CardTitle>Deadline Warnings</CardTitle>
            <CardDescription>
              Get notified before student deadlines approach
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>3-Day Warning</Label>
                <p className="text-sm text-gray-500">
                  Alert when a deadline is 3 days away
                </p>
              </div>
              <Switch
                checked={preferences.deadlineWarning3Days}
                onCheckedChange={(checked) => updatePreference({ deadlineWarning3Days: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>1-Day Warning</Label>
                <p className="text-sm text-gray-500">
                  Alert when a deadline is tomorrow
                </p>
              </div>
              <Switch
                checked={preferences.deadlineWarning1Day}
                onCheckedChange={(checked) => updatePreference({ deadlineWarning1Day: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Inactivity Reminder */}
        <Card>
          <CardHeader>
            <CardTitle>Inactivity Reminder</CardTitle>
            <CardDescription>
              Get a gentle nudge if you haven&apos;t logged in recently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label>Remind After</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    className="w-20"
                    value={preferences.inactivityReminderDays || ''}
                    onChange={(e) => updatePreference({
                      inactivityReminderDays: e.target.value ? parseInt(e.target.value) : null
                    })}
                    placeholder="5"
                  />
                  <span className="text-sm text-gray-600">days of inactivity</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updatePreference({ inactivityReminderDays: null })}
              >
                Disable
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Quiet Hours</CardTitle>
                <CardDescription>
                  Don&apos;t send notifications during these hours
                </CardDescription>
              </div>
              <Switch
                checked={preferences.quietHoursEnabled}
                onCheckedChange={(checked) => updatePreference({ quietHoursEnabled: checked })}
              />
            </div>
          </CardHeader>
          {preferences.quietHoursEnabled && (
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={preferences.quietHoursStart || '22:00'}
                    onChange={(e) => updatePreference({ quietHoursStart: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={preferences.quietHoursEnd || '08:00'}
                    onChange={(e) => updatePreference({ quietHoursEnd: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Note about email */}
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 text-center">
              Email notifications require additional setup.
              Notifications will be shown in-app until email is configured.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
