'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatDuration } from '@/lib/prioritization'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'

type AnalyticsData = {
  workload: {
    pendingEssays: number
    totalPendingMinutes: number
    totalPendingHours: number
    criticalCount: number
    overdueCount: number
    firstReviewCount: number
    clearanceDate: string | null
  }
  velocity: {
    weeklyData: { week: string; reviews: number; minutes: number }[]
    totalReviewsLast4Weeks: number
    avgReviewsPerWeek: number
  }
  sessions: {
    sessionsLast4Weeks: number
    avgSessionDuration: number
    avgEssaysPerSession: number
  }
  allTime: {
    totalFeedback: number
    totalReviewMinutes: number
    totalReviewHours: number
    avgMinutesPerReview: number
    avgMinutesPerHundredWords: number
  }
  risk: {
    atRiskCount: number
    criticalRiskCount: number
    highRiskCount: number
    distribution: {
      critical: number
      high: number
      medium: number
      low: number
    }
  }
  tracking: {
    onTrackStatus: 'green' | 'yellow' | 'red'
    studentsWaitingLongest: {
      essayId: string
      essayTitle: string
      studentId: string
      daysWaiting: number | null
      isFirstReview: boolean
      deadline: string | null
      riskScore: number
    }[]
    requiredDailyReviews: number
    requiredDailyHours: number
  }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/coach/analytics')
      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">Loading analytics...</div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p>Failed to load analytics</p>
        </div>
      </div>
    )
  }

  const getOnTrackConfig = (status: 'green' | 'yellow' | 'red') => {
    const configs = {
      green: {
        label: 'On Track',
        description: 'All essays will meet their deadlines at your current pace.',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        iconColor: 'text-green-600',
      },
      yellow: {
        label: 'At Risk',
        description: 'Some essays may miss deadlines. Consider increasing your review pace.',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-600',
      },
      red: {
        label: 'Behind',
        description: 'Critical essays need immediate attention to avoid missed deadlines.',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-600',
      },
    }
    return configs[status]
  }

  const onTrackConfig = getOnTrackConfig(data.tracking?.onTrackStatus || 'green')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-sm text-gray-600">
                Track your workload and productivity
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/coach">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* On Track Status - Hero Card */}
        <Card className={`mb-8 border-2 ${onTrackConfig.borderColor} ${onTrackConfig.bgColor}`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={`mt-1 ${onTrackConfig.iconColor}`}>
                <OnTrackIcon status={data.tracking?.onTrackStatus || 'green'} />
              </div>
              <div className="flex-1">
                <h2 className={`text-2xl font-bold ${onTrackConfig.textColor}`}>
                  {onTrackConfig.label}
                </h2>
                <p className="text-gray-700 mt-1">{onTrackConfig.description}</p>

                {data.tracking && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-sm text-gray-500">Pending Essays</p>
                      <p className="text-xl font-bold">{data.workload.pendingEssays}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">At Risk</p>
                      <p className={`text-xl font-bold ${data.risk?.atRiskCount > 0 ? 'text-orange-600' : ''}`}>
                        {data.risk?.atRiskCount || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Required Daily</p>
                      <p className="text-xl font-bold">{data.tracking.requiredDailyReviews} reviews</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Est. Daily Time</p>
                      <p className="text-xl font-bold">{data.tracking.requiredDailyHours}h</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Distribution and Students Waiting */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Risk Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Deadline Risk Distribution</CardTitle>
              <CardDescription>Essays grouped by deadline risk level</CardDescription>
            </CardHeader>
            <CardContent>
              {data.risk && (
                <div className="space-y-4">
                  <RiskBar label="Critical" count={data.risk.distribution.critical} total={data.workload.pendingEssays} color="bg-red-500" />
                  <RiskBar label="High" count={data.risk.distribution.high} total={data.workload.pendingEssays} color="bg-orange-500" />
                  <RiskBar label="Medium" count={data.risk.distribution.medium} total={data.workload.pendingEssays} color="bg-yellow-500" />
                  <RiskBar label="Low" count={data.risk.distribution.low} total={data.workload.pendingEssays} color="bg-green-500" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Students Waiting Longest */}
          <Card>
            <CardHeader>
              <CardTitle>Students Waiting Longest</CardTitle>
              <CardDescription>Essays that have been in queue the longest</CardDescription>
            </CardHeader>
            <CardContent>
              {data.tracking?.studentsWaitingLongest && data.tracking.studentsWaitingLongest.length > 0 ? (
                <div className="space-y-3">
                  {data.tracking.studentsWaitingLongest.map((essay, index) => (
                    <Link
                      key={essay.essayId}
                      href={`/coach/review/${essay.essayId}`}
                      className="flex items-center gap-3 p-2 -mx-2 rounded hover:bg-gray-50 transition-colors"
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-red-100 text-red-700' :
                        index === 1 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{essay.essayTitle}</p>
                        <p className="text-xs text-gray-500">
                          {essay.isFirstReview ? '1st review' : 'Revision'}
                          {essay.deadline && ` • Due ${formatClearanceDate(essay.deadline)}`}
                        </p>
                      </div>
                      <div className={`text-sm font-medium ${
                        (essay.daysWaiting || 0) >= 3 ? 'text-red-600' :
                        (essay.daysWaiting || 0) >= 2 ? 'text-orange-600' :
                        'text-gray-600'
                      }`}>
                        {essay.daysWaiting}d
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No essays waiting</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Workload Summary */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Current Workload</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Pending Essays
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.workload.pendingEssays}</div>
                <p className="text-sm text-gray-500">
                  Est. {data.workload.totalPendingHours}h total
                </p>
              </CardContent>
            </Card>

            <Card className={data.workload.criticalCount > 0 ? 'border-orange-200 bg-orange-50' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Critical Priority
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${data.workload.criticalCount > 0 ? 'text-orange-600' : ''}`}>
                  {data.workload.criticalCount}
                </div>
                <p className="text-sm text-gray-500">Need immediate attention</p>
              </CardContent>
            </Card>

            <Card className={data.workload.overdueCount > 0 ? 'border-red-200 bg-red-50' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Overdue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${data.workload.overdueCount > 0 ? 'text-red-600' : ''}`}>
                  {data.workload.overdueCount}
                </div>
                <p className="text-sm text-gray-500">Past deadline</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  First Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.workload.firstReviewCount}</div>
                <p className="text-sm text-gray-500">
                  {data.workload.pendingEssays - data.workload.firstReviewCount} revisions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Review Velocity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Review Velocity</CardTitle>
              <CardDescription>Essays reviewed per week (last 4 weeks)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.velocity.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="reviews" fill="#3b82f6" name="Reviews" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-8 mt-4 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold">{data.velocity.totalReviewsLast4Weeks}</p>
                  <p className="text-gray-600">Total reviews</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{data.velocity.avgReviewsPerWeek}</p>
                  <p className="text-gray-600">Avg per week</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Spent Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Time Spent Reviewing</CardTitle>
              <CardDescription>Minutes spent per week (last 4 weeks)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.velocity.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value ?? 0} min`, 'Time']} />
                    <Line
                      type="monotone"
                      dataKey="minutes"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-8 mt-4 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {formatDuration(data.velocity.weeklyData.reduce((sum, w) => sum + w.minutes, 0))}
                  </p>
                  <p className="text-gray-600">Total time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Session Stats */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Session Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Sessions (4 weeks)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.sessions.sessionsLast4Weeks}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Avg Session Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatDuration(data.sessions.avgSessionDuration)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Avg Essays/Session
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.sessions.avgEssaysPerSession}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* All-Time Stats */}
        <div>
          <h2 className="text-lg font-semibold mb-4">All-Time Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.allTime.totalFeedback}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.allTime.totalReviewHours}h</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Avg per Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatDuration(data.allTime.avgMinutesPerReview)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

function OnTrackIcon({ status }: { status: 'green' | 'yellow' | 'red' }) {
  if (status === 'green') {
    return (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
  if (status === 'yellow') {
    return (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )
  }
  return (
    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function RiskBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percentage = total > 0 ? (count / total) * 100 : 0

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-gray-600">{count} essay{count !== 1 ? 's' : ''}</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function formatClearanceDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays <= 7) return `In ${diffDays} days`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
