'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

type AtRiskEssay = {
  id: string
  title: string
  riskScore: number
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  daysSinceSubmit: number | null
  feedbackCount: number
  user: {
    name: string | null
    email: string
  }
  application: {
    schoolName: string
    deadline: Date | null
  } | null
}

interface RiskAlertBannerProps {
  atRiskEssays: AtRiskEssay[]
  overdueCount: number
}

export function RiskAlertBanner({ atRiskEssays, overdueCount }: RiskAlertBannerProps) {
  const criticalCount = atRiskEssays.filter(e => e.riskLevel === 'critical').length
  const highCount = atRiskEssays.filter(e => e.riskLevel === 'high').length

  // Don't show banner if nothing is at risk
  if (atRiskEssays.length === 0 && overdueCount === 0) {
    return null
  }

  const getBannerStyle = () => {
    if (criticalCount > 0 || overdueCount > 0) {
      return 'bg-red-50 border-red-200'
    }
    if (highCount > 0) {
      return 'bg-orange-50 border-orange-200'
    }
    return 'bg-yellow-50 border-yellow-200'
  }

  const getIconColor = () => {
    if (criticalCount > 0 || overdueCount > 0) return 'text-red-600'
    if (highCount > 0) return 'text-orange-600'
    return 'text-yellow-600'
  }

  return (
    <Card className={`mb-6 border-2 ${getBannerStyle()}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`mt-0.5 ${getIconColor()}`}>
            <AlertIcon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              {overdueCount > 0
                ? `${overdueCount} essay${overdueCount > 1 ? 's' : ''} past deadline`
                : `${atRiskEssays.length} essay${atRiskEssays.length > 1 ? 's' : ''} at risk of missing deadlines`}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              {criticalCount > 0 && (
                <span className="text-red-600 font-medium">{criticalCount} critical</span>
              )}
              {criticalCount > 0 && highCount > 0 && ', '}
              {highCount > 0 && (
                <span className="text-orange-600 font-medium">{highCount} high risk</span>
              )}
              {(criticalCount > 0 || highCount > 0) && ' - '}
              These need immediate attention to avoid missed deadlines.
            </p>

            {/* Top at-risk essays */}
            <div className="space-y-2 mb-3">
              {atRiskEssays.slice(0, 3).map(essay => (
                <Link
                  key={essay.id}
                  href={`/coach/review/${essay.id}`}
                  className="flex items-center justify-between p-2 bg-white rounded border hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <RiskBadge level={essay.riskLevel} />
                    <div>
                      <span className="font-medium text-sm">{essay.title}</span>
                      <span className="text-gray-500 text-xs block">
                        {essay.user.name || essay.user.email}
                        {essay.application && ` • ${essay.application.schoolName}`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    {essay.daysSinceSubmit !== null && essay.daysSinceSubmit > 0 && (
                      <span>Waiting {essay.daysSinceSubmit}d</span>
                    )}
                    {essay.feedbackCount === 0 && (
                      <Badge variant="outline" className="ml-2 text-xs">First review</Badge>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex gap-2">
              <Button size="sm" asChild>
                <Link href="/coach/session">Start Review Session</Link>
              </Button>
              {atRiskEssays.length > 3 && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/coach/analytics">
                    View all {atRiskEssays.length} at-risk essays
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RiskBadge({ level }: { level: 'critical' | 'high' | 'medium' | 'low' }) {
  const styles = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  }

  return (
    <Badge variant="outline" className={`text-xs ${styles[level]}`}>
      {level}
    </Badge>
  )
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  )
}
