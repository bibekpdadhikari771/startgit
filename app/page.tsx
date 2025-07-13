import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Users, Building2, GraduationCap, Briefcase, Star, ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Briefcase className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Start.Gig</span>
          </div>
          <div className="flex space-x-4">
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link className="sm:flex hidden" href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Connect Students with
            <span className="text-blue-600"> Dream Opportunities</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The premier platform connecting talented students with employers offering part-time jobs, internships, and
            entry-level positions.
          </p>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200">
              <CardHeader className="text-center">
                <GraduationCap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>I&apos;m a Student</CardTitle>
                <CardDescription>Find part-time jobs and internships that fit your schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/auth/signup?role=student">
                  <Button className="w-full">
                    Find Jobs <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-200">
              <CardHeader className="text-center">
                <Building2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>I&apos;m an Employer</CardTitle>
                <CardDescription>Hire talented students for your organization</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/auth/signup?role=employer">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Post Jobs <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-200">
              <CardHeader className="text-center">
                <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>School Admin</CardTitle>
                <CardDescription>Manage your institution&apos;s job board and students</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/auth/signup?role=admin">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    Admin Panel <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card> */}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Start.Gig?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Star className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Verified Opportunities</h3>
              <p className="text-gray-600">All job postings are verified by school administrators</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Student-Focused</h3>
              <p className="text-gray-600">Designed specifically for student schedules and needs</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Quality Employers</h3>
              <p className="text-gray-600">Connect with reputable companies and organizations</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <GraduationCap className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">Career Growth</h3>
              <p className="text-gray-600">Build experience and professional networks</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">10,000+</div>
              <div className="text-gray-600">Active Students</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">500+</div>
              <div className="text-gray-600">Partner Employers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">50+</div>
              <div className="text-gray-600">Universities</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <Briefcase className="h-8 w-8" />
            <span className="text-2xl font-bold">Start.Gig</span>
          </div>
          <div className="text-center text-gray-400">
            <p>&copy; 2024 Start.Gig. All rights reserved.</p>
            <p className="mt-2">Connecting students with opportunities since 2024</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
