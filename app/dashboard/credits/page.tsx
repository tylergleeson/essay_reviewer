'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { toast } from 'sonner'

type CreditBalance = {
  coachId: string
  coachUserId: string
  coachName: string
  creditsRemaining: number
  packageName: string | null
}

type CoachPackage = {
  id: string
  coachId: string
  name: string
  reviewCredits: number
  priceInCents: number
  isActive: boolean
  coachName?: string
}

export default function CreditsPage() {
  const [balances, setBalances] = useState<CreditBalance[]>([])
  const [packages, setPackages] = useState<CoachPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [balancesRes, packagesRes] = await Promise.all([
        fetch('/api/credits/balance'),
        fetch('/api/credits/packages'),
      ])

      if (balancesRes.ok) {
        setBalances(await balancesRes.json())
      }

      if (packagesRes.ok) {
        setPackages(await packagesRes.json())
      }
    } catch (error) {
      console.error('Error fetching credit data:', error)
      toast.error('Failed to load credit data')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (packageId: string) => {
    setPurchasing(packageId)
    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Purchased ${data.creditsAdded} credits from ${data.packageName}!`)
        fetchData()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to purchase credits')
      }
    } catch (error) {
      console.error('Error purchasing credits:', error)
      toast.error('An error occurred')
    } finally {
      setPurchasing(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    )
  }

  // Group packages by coach
  const packagesByCoach = packages.reduce<Record<string, CoachPackage[]>>((acc, pkg) => {
    const key = pkg.coachId
    if (!acc[key]) acc[key] = []
    acc[key].push(pkg)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Credits & Packages</h1>
            <p className="text-sm text-gray-600">
              Purchase review credits from coaches
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>

        {/* Current Balances */}
        {balances.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Your Credit Balances</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {balances.map((balance) => (
                <Card key={balance.coachId}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {balance.coachName}
                    </CardTitle>
                    {balance.packageName && (
                      <CardDescription>{balance.packageName}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">
                        {balance.creditsRemaining}
                      </span>
                      <span className="text-sm text-gray-600">
                        {balance.creditsRemaining === 1 ? 'credit' : 'credits'} remaining
                      </span>
                    </div>
                    {balance.creditsRemaining === 0 && (
                      <Badge variant="destructive" className="mt-2">
                        No credits - purchase more below
                      </Badge>
                    )}
                    {balance.creditsRemaining > 0 && balance.creditsRemaining <= 2 && (
                      <Badge variant="secondary" className="mt-2">
                        Running low
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Packages */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Available Packages</h2>
          {packages.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <h3 className="text-lg font-medium mb-2">No Packages Available</h3>
                <p className="text-gray-600">
                  There are no coaching packages available at this time.
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(packagesByCoach).map(([coachId, coachPackages]) => (
              <div key={coachId} className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3">
                  Coach: {coachPackages[0].coachName}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {coachPackages.map((pkg) => (
                    <Card key={pkg.id} className="relative">
                      <CardHeader>
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                        <CardDescription>
                          {pkg.reviewCredits} essay {pkg.reviewCredits === 1 ? 'review' : 'reviews'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <span className="text-3xl font-bold">
                            ${(pkg.priceInCents / 100).toFixed(2)}
                          </span>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1 mb-6">
                          <li>{pkg.reviewCredits} review credit{pkg.reviewCredits !== 1 ? 's' : ''}</li>
                          <li>${(pkg.priceInCents / 100 / pkg.reviewCredits).toFixed(2)} per review</li>
                        </ul>
                        <Button
                          className="w-full"
                          onClick={() => handlePurchase(pkg.id)}
                          disabled={purchasing === pkg.id}
                        >
                          {purchasing === pkg.id ? 'Processing...' : 'Purchase'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
