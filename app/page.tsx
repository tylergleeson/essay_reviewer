import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <main className="max-w-5xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-4 text-gray-900">
          Welcome to Draftly
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Professional college essay coaching made simple.
          Track applications, manage drafts, and receive expert feedback.
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Demo Section */}
          <Card>
            <CardHeader>
              <CardTitle>View Demo</CardTitle>
              <CardDescription>
                Explore the platform with sample data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full" size="lg">
                <Link href="/demo/dashboard">Student Dashboard Demo</Link>
              </Button>
              <Button asChild variant="outline" className="w-full" size="lg">
                <Link href="/demo/coach">Coach Dashboard Demo</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Real Accounts Section */}
          <Card>
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>
                Create an account to use the real platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full" size="lg" variant="default">
                <Link href="/signup">Sign Up</Link>
              </Button>
              <Button asChild variant="outline" className="w-full" size="lg">
                <Link href="/signin">Sign In</Link>
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Create student or coach accounts with real data storage
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
