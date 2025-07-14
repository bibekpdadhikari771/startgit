"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Plus, Briefcase, Users, Eye, Edit, Trash2, User, Bell, BarChart3 } from "lucide-react"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"

interface SessionUser {
  companyName: string
  _id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

interface Job {
  id: string
  title: string
  location: string
  type: 'full-time' | 'part-time' | 'internship'
  salary?: string
  description: string
  requirements: string[]
  postedAt: string
  deadline: string
  status: "active" | "closed" | "draft"
  applicants: number
  employerId: string
  company: string
  createdAt: string
  updatedAt: string
}

interface Application {
  id?: string
  _id?: string
  jobId: {
    _id: string
    title: string
    company: string
  }
  studentId: {
    _id: string
    firstName: string
    lastName: string
    email: string
    education: string
    skills: string[]
    experience?: string
  }
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  updatedAt: string
}

export default function EmployerDashboard() {
  const { user } = useSelector((state: RootState) => state.auth)

  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("jobs")
  const { toast } = useToast()

  const fetchJobs = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/employer/jobs')
      const data = await response.json()
      setJobs(data)
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchApplications = async () => {
    try {
      setIsLoading(true)
      const url = selectedJobId
        ? `/api/employer/applications?jobId=${selectedJobId}`
        : `/api/employer/applications`

      const response = await fetch(url)
      const data = await response.json()
      setApplications(data)
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchJobs()
    }
  }, [user])

  useEffect(() => {
    if (user && activeTab === "applications") {
      fetchApplications()
    }
  }, [user, activeTab])

  const handleDeleteJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/employer/jobs/${jobId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(response.statusText)
      }

      toast({
        title: "Job deleted",
        description: "Job posting has been removed",
      })
      setJobs((prev) => prev.filter((job) => job.id !== jobId))
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete job",
        variant: "destructive",
      })
    }
  }

  const handleUpdateApplicationStatus = async (applicationId: string, newStatus: 'accepted' | 'rejected') => {

    if (!applicationId) {
      toast({
        title: "Error",
        description: "Invalid application ID",
        variant: "destructive",
      })
      return
    }

    try {
      const url = `/api/employer/applications/${applicationId}`
      console.log('Making request to:', url)
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        }),
      })
      console.log(response)

      // Only show success toast and update state if the request was successful
      toast({
        title: "Status updated",
        description: `Application has been ${newStatus}`,
      })

      // Update local state
      setApplications((prev) =>
        prev.map((app) =>
          (app.id === applicationId || app?._id === applicationId) ? { ...app, status: newStatus } : app
        )
      )
    } catch (error) {
      console.error('Error updating application status:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update application status",
        variant: "destructive",
      })
    }
  }

  const handleViewApplications = (jobId: string) => {
    setSelectedJobId(jobId)
    setActiveTab("applications")
    // Fetch applications for this specific job
    fetchApplications()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-red-100 text-red-800"
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Add a function to fetch applications when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  console.log(applications, 'applications')
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
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Employer
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Link href="/employer/dashboard/profile">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/' })}
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.companyName}!</h1>
          <p className="text-gray-600">Manage your job postings and applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {jobs?.filter((job) => job.status === "active").length}
                  </p>
                </div>
                <Briefcase className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-3xl font-bold text-green-600">
                    {jobs?.reduce((sum, job) => sum + job.applicants, 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          {/* <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Draft Jobs</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {jobs.filter((job) => job.status === "draft").length}
                  </p>
                </div>
                <Edit className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card> */}
          {/* <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Views</p>
                  <p className="text-3xl font-bold text-purple-600">1,234</p>
                </div>
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card> */}
        </div>

        <Tabs defaultValue="jobs" className="space-y-6" onValueChange={handleTabChange}>
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="jobs" type="button">All Jobs</TabsTrigger> 
              {/* <TabsTrigger value="analytics" type="button">Analytics</TabsTrigger> */}
            </TabsList>
            <div className="flex space-x-2">
              <Link href="/employer/dashboard/applications">
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  View All Applications
                </Button>
              </Link>
              <Link href="/employer/dashboard/add">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Post New Job
                </Button>
              </Link>
            </div>
          </div>

          <TabsContent value="jobs" className="space-y-4">
            {jobs?.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                        <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <span>{job.location}</span>
                        <span>{job.type}</span>
                        <span>{job.salary}</span>
                      </div>
                      <p className="text-gray-600 mb-4">{job.description}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.requirements.slice(0, 3).map((req, index) => (
                          <Badge key={index} variant="secondary">
                            {req}
                          </Badge>
                        ))}
                        {job.requirements.length > 3 && (
                          <Badge variant="secondary">+{job.requirements.length - 3} more</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2 ml-4">
                      <Link href={`/employer/dashboard/applications?jobId=${job.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View ({job.applicants})
                        </Button>
                      </Link>
                      {/* <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button> */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteJob(job.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Posted {job.postedAt}</span>
                    <span>Deadline: {job?.deadline}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>
                      {selectedJobId
                        ? `Applications for ${jobs.find(j => j.id === selectedJobId)?.title}`
                        : 'All Applications'
                      }
                    </CardTitle>
                    <CardDescription>
                      {selectedJobId
                        ? 'Review applications for this specific job'
                        : 'Review and manage all job applications'
                      }
                    </CardDescription>
                  </div>
                  {selectedJobId && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedJobId(null)
                        fetchApplications()
                      }}
                    >
                      View All Applications
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {applications?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      {selectedJobId
                        ? 'No applications for this job yet.'
                        : 'No applications yet. Post jobs to start receiving applications!'
                      }
                    </p>
                    {!selectedJobId && (
                      <Link href="/employer/dashboard/add">
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Post New Job
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications?.map((application) => (
                      <Card key={application._id || application.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-xl font-semibold text-gray-900">
                                  {application.studentId.firstName} {application.studentId.lastName}
                                </h3>
                                <Badge className={getStatusColor(application.status)}>
                                  {application.status}
                                </Badge>
                              </div>
                              <div className="space-y-2 text-sm text-gray-600">
                                <p><span className="font-medium">Email:</span> {application.studentId.email}</p>
                                <p><span className="font-medium">Education:</span> {application.studentId.education}</p>
                                {!selectedJobId && (
                                  <>
                                    <p><span className="font-medium">Applied for:</span> {application.jobId.title}</p>
                                    <p><span className="font-medium">Company:</span> {application.jobId.company}</p>
                                  </>
                                )}
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {application.studentId.skills.map((skill, index) => (
                                    <Badge key={index} variant="secondary">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                                {application.studentId.experience && (
                                  <p className="mt-2">
                                    <span className="font-medium">Experience:</span> {application.studentId.experience}
                                  </p>
                                )}
                              </div>
                            </div>
                            {application.status === 'pending' && (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleUpdateApplicationStatus(application._id as string, 'accepted')}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleUpdateApplicationStatus(application._id || application.id || '', 'rejected')}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>Applied {new Date(application.createdAt).toLocaleDateString()}</span>
                            <span>Last updated {new Date(application.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
      </div>
    </div>
  )
}
