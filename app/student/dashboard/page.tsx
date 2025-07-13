"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Search, MapPin, Clock, DollarSign, Briefcase, User, Bell, Heart, X } from "lucide-react"

interface Job {
  _id: string
  title: string
  company: string
  location: string
  type: string
  salary: string
  description: string
  requirements: string[]
  createdAt: string
  deadline: string
  applied?: boolean
  saved?: boolean
  applicationId?: string
}

export default function StudentDashboard() {
  const { data: session } = useSession() as { data: { user: { firstName: string, email: string } } | null }
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("browse")
  const { toast } = useToast()
  const [isApplying, setIsApplying] = useState<string | null>(null)
  const [isWithdrawing, setIsWithdrawing] = useState<string | null>(null)
  const [uniqueLocations, setUniqueLocations] = useState<string[]>([])
  console.log(typeFilter)
  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs")
      if (!response.ok) {
        throw new Error('Failed to fetch jobs')
      }
      const data = await response.json()

      // Fetch applications and saved jobs to update job status
      const [applicationsResponse, savedJobsResponse] = await Promise.all([
        fetch("/api/applications"),
        fetch("/api/saved-jobs")
      ])

      const applications = applicationsResponse.ok ? await applicationsResponse.json() : []
      const savedJobs = savedJobsResponse.ok ? await savedJobsResponse.json() : []

      // Update job status based on applications and saved jobs
      const jobsWithStatus = data.map((job: Job) => {
        const application = applications.find((app: any) => app.jobId._id === job._id)
        return {
          ...job,
          applied: !!application,
          saved: savedJobs.some((saved: any) => saved.jobId._id === job._id),
          applicationId: application?._id
        }
      })

      setJobs(jobsWithStatus)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch jobs",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterJobs = useCallback(() => {
    let filtered = [...jobs]

    // Filter out jobs that have already been applied to
    filtered = filtered.filter(job => !job.applied)

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (locationFilter && locationFilter !== "all") {
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(locationFilter.toLowerCase())
      )
    }

    if (typeFilter && typeFilter !== "all") {
      filtered = filtered.filter(job => job.type?.toLowerCase() === typeFilter.toLowerCase())
    }

    setFilteredJobs(filtered)
  }, [jobs, searchTerm, locationFilter, typeFilter])



  useEffect(() => {
    fetchJobs()
  }, [])

  useEffect(() => {
    filterJobs()
  }, [jobs, searchTerm, locationFilter, typeFilter])

  useEffect(() => {
    // Extract unique locations from jobs
    const locations = Array.from(new Set(jobs.map(job => job.location)))
    setUniqueLocations(locations)
  }, [jobs])

  const handleApply = async (jobId: string) => {
    try {
      setIsApplying(jobId)
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit application')
      }

      toast({
        title: "Application submitted!",
        description: "Your application has been sent to the employer",
      })

      setJobs((prev) => prev.map((job) => (job._id === jobId ? { ...job, applied: true } : job)))
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit application",
        variant: "destructive",
      })
    } finally {
      setIsApplying(null)
    }
  }

  const handleSaveJob = async (jobId: string) => {
    try {
      const response = await fetch("/api/saved-jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save job')
      }

      toast({
        title: "Job saved!",
        description: "Job added to your saved list",
      })

      setJobs((prev) => prev.map((job) => (job._id === jobId ? { ...job, saved: true } : job)))
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save job",
        variant: "destructive",
      })
    }
  }

  const handleUnsaveJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/saved-jobs?jobId=${jobId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error('Failed to remove job from saved list')
      }

      toast({
        title: "Job removed",
        description: "Job removed from your saved list",
      })

      setJobs((prev) => prev.map((job) => (job._id === jobId ? { ...job, saved: false } : job)))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove job from saved list",
        variant: "destructive",
      })
    }
  }

  const handleWithdrawApplication = async (jobId: string, applicationId: string) => {
    // Show confirmation dialog
    const isConfirmed = window.confirm(
      "Are you sure you want to withdraw your application? This action cannot be undone."
    )

    if (!isConfirmed) {
      return
    }

    try {
      setIsWithdrawing(jobId)
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to withdraw application')
      }

      toast({
        title: "Application withdrawn",
        description: "Your application has been successfully withdrawn",
      })

      setJobs((prev) => prev.map((job) =>
        job._id === jobId
          ? { ...job, applied: false, applicationId: undefined }
          : job
      ))
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to withdraw application",
        variant: "destructive",
      })
    } finally {
      setIsWithdrawing(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold">Start.Gig</span>
              </div>
              <Badge variant="secondary">Student</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Link href="/student/profile">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {

                  await fetch("/api/auth/signout", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email: session?.user?.email }),
                  })
                  await signOut({ callbackUrl: '/' })
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {session?.user?.firstName}!</h1>
          <p className="text-gray-600">Find your next opportunity</p>
        </div>

        <Tabs defaultValue="browse" className="space-y-6" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="browse">Browse Jobs</TabsTrigger>
            <TabsTrigger value="applied">Applied Jobs</TabsTrigger>
            <TabsTrigger value="saved">Saved Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Find Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Search jobs or companies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {uniqueLocations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Job Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Internship">Internship</SelectItem>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Job Listings */}
            <div className="space-y-4">
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <Card key={job._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <Link href={`/student/jobs/${job._id}`}>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors cursor-pointer">{job.title}</h3>
                          </Link>
                          <p className="text-lg text-gray-700 mb-2">{job.company}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {job.location}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {job.type}
                            </div>
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {job.salary}
                            </div>
                          </div>
                          <p className="text-gray-600 mb-4">{job.description}</p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {job.requirements.map((req, index) => (
                              <Badge key={index} variant="secondary">
                                {req}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2 ml-4">
                          <Link href={`/student/jobs/${job._id}`}>
                            <Button size="sm" variant="outline" className="w-full">
                              View Details
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            onClick={() => job.saved ? handleUnsaveJob(job._id) : handleSaveJob(job._id)}
                            variant="outline"
                          >
                            <Heart className={`h-4 w-4 mr-1 ${job.saved ? "fill-current text-red-500" : ""}`} />
                            {job.saved ? "Saved" : "Save"}
                          </Button>
                          {/* <Button
                            size="sm"
                            onClick={() => handleApply(job._id)}
                            disabled={job.applied || isApplying === job._id}
                          >
                            {isApplying === job._id ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Applying...
                              </div>
                            ) : job.applied ? (
                              "Applied"
                            ) : (
                              "Apply Now"
                            )}
                          </Button> */}
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                        <span>
                          Deadline: {
                            job?.deadline
                              ? job.deadline
                              : new Date(new Date(job.createdAt).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString()
                          }
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="rounded-full bg-gray-100 p-4 mb-4">
                      <Briefcase className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
                    <p className="text-gray-500 text-center max-w-md mb-4">
                      {searchTerm || locationFilter || typeFilter
                        ? "Try adjusting your search filters to find more opportunities"
                        : "There are currently no job listings available. Check back later for new opportunities."}
                    </p>
                    {(searchTerm || locationFilter || typeFilter) && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm("")
                          setLocationFilter("")
                          setTypeFilter("")
                        }}
                      >
                        Clear all filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="applied">
            <Card>
              <CardHeader>
                <CardTitle>Applied Jobs</CardTitle>
                <CardDescription>Track your job applications</CardDescription>
              </CardHeader>
              <CardContent>
                {jobs?.filter(job => job.applied).length > 0 ? (
                  <div className="space-y-4">
                    {jobs?.filter(job => job?.applied).map((job) => (
                      <Card key={job._id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <Link href={`/student/jobs/${job._id}`}>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors cursor-pointer">{job.title}</h3>
                              </Link>
                              <p className="text-lg text-gray-700 mb-2">{job.company}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {job.location}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {job.type}
                                </div>
                                <div className="flex items-center">
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  {job.salary}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  Application Submitted
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  Applied {new Date(job.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col space-y-2 ml-4">
                              <Link href={`/student/jobs/${job._id}`}>
                                <Button size="sm" variant="outline" className="w-full">
                                  View Details
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => job.applicationId && handleWithdrawApplication(job._id, job.applicationId)}
                                disabled={isWithdrawing === job._id}
                                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                              >
                                {isWithdrawing === job._id ? (
                                  <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                                    Withdrawing...
                                  </div>
                                ) : (
                                  <>
                                    <X className="h-4 w-4 mr-1" />
                                    Withdraw
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Don&apos;t have any applications yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saved">
            <Card>
              <CardHeader>
                <CardTitle>Saved Jobs</CardTitle>
                <CardDescription>Jobs you&apos;ve saved for later</CardDescription>
              </CardHeader>
              <CardContent>
                {jobs?.filter(job => job?.saved).length > 0 ? (
                  <div className="space-y-4">
                    {jobs?.filter(job => job?.saved).map((job) => (
                      <Card key={job._id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                              <p className="text-lg text-gray-700 mb-2">{job.company}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {job.location}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {job.type}
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnsaveJob(job._id)}
                              >
                                <Heart className="h-4 w-4 mr-1 fill-current text-red-500" />
                                Remove
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApply(job._id)}
                                disabled={job.applied}
                              >
                                {job.applied ? "Applied" : "Apply Now"}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No saved jobs yet. Save jobs you&apos;re interested in!</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
