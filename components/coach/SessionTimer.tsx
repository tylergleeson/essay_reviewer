'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { formatDuration } from '@/lib/prioritization'

interface SessionTimerProps {
  sessionId: string
  plannedMinutes: number
  onEnd: () => void
  initialElapsed?: number
}

export function SessionTimer({
  sessionId,
  plannedMinutes,
  onEnd,
  initialElapsed = 0,
}: SessionTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(initialElapsed * 60)
  const [isPaused, setIsPaused] = useState(false)

  const plannedSeconds = plannedMinutes * 60
  const progress = Math.min((elapsedSeconds / plannedSeconds) * 100, 100)
  const isOvertime = elapsedSeconds > plannedSeconds

  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isPaused])

  const handleEndSession = useCallback(async () => {
    try {
      await fetch(`/api/coach/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elapsedMinutes: Math.floor(elapsedSeconds / 60) }),
      })
    } catch (error) {
      console.error('Error ending session:', error)
    }
    onEnd()
  }, [sessionId, elapsedSeconds, onEnd])

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const remainingSeconds = Math.max(0, plannedSeconds - elapsedSeconds)
  const elapsedMinutes = Math.floor(elapsedSeconds / 60)

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border p-4 w-72 z-50">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-sm">Work Session</h3>
          <p className="text-xs text-gray-500">
            Planned: {formatDuration(plannedMinutes)}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsPaused(!isPaused)}>
          {isPaused ? (
            <PlayIcon className="h-4 w-4" />
          ) : (
            <PauseIcon className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Timer Display */}
      <div className={`text-3xl font-mono text-center mb-3 ${isOvertime ? 'text-orange-600' : 'text-gray-900'}`}>
        {isOvertime && '+'}
        {formatTime(isOvertime ? elapsedSeconds - plannedSeconds : elapsedSeconds)}
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-200 rounded-full mb-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isOvertime ? 'bg-orange-500' : progress > 80 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Time Info */}
      <div className="flex justify-between text-xs text-gray-600 mb-3">
        <span>{formatDuration(elapsedMinutes)} elapsed</span>
        {!isOvertime && <span>{formatDuration(Math.floor(remainingSeconds / 60))} left</span>}
        {isOvertime && <span className="text-orange-600">Overtime</span>}
      </div>

      {/* End Session Button */}
      <Button
        variant={isOvertime ? 'default' : 'outline'}
        className="w-full"
        onClick={handleEndSession}
      >
        End Session
      </Button>
    </div>
  )
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
    </svg>
  )
}
