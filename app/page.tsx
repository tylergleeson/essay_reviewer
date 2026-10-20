import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, ArrowRight, Users, FileText } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12">
        <main className="max-w-6xl mx-auto w-full">
          {/* Hero Section */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
              Professional Essay Coaching Platform
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground tracking-tight">
              Transform Your <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">College Essays</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Professional coaching platform for students and coaches. Track applications, manage drafts, and deliver expert feedback.
            </p>

            {/* Feature highlights */}
            <div className="flex flex-wrap justify-center gap-6 mb-12 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Rich Text Editor</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Track Changes</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Expert Feedback</span>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Test Accounts Section */}
            <Card className="stagger-item hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Test Accounts</CardTitle>
                <CardDescription>
                  Try the platform with pre-seeded data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Coach Account</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">coach@draftly.com</p>
                  <p className="text-xs text-muted-foreground font-mono">password123</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Student Account</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">student@draftly.com</p>
                  <p className="text-xs text-muted-foreground font-mono">password123</p>
                </div>
                <Button asChild className="w-full" size="lg" variant="default">
                  <Link href="/signin">
                    Sign In to Test
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Get Started Section */}
            <Card className="stagger-item hover:shadow-lg transition-shadow border-primary/20">
              <CardHeader>
                <CardTitle>Get Started</CardTitle>
                <CardDescription>
                  Create your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full" size="lg" variant="default">
                  <Link href="/signup">
                    Sign Up
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full" size="lg">
                  <Link href="/signin">Sign In</Link>
                </Button>
                <p className="text-xs text-muted-foreground pt-2">
                  Student or coach accounts with secure data storage
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
