"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Building,
  Calendar,
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  ExternalLink,
  Heart,
  Share2,
  X
} from "lucide-react"
import Link from "next/link"

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
}

export default function JobDetailsPage() {
  const { data: session } = useSession() as { data: { user: { firstName: string, email: string } } | null }
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isApplying, setIsApplying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [showApplyDialog, setShowApplyDialog] = useState(false)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [coverLetter, setCoverLetter] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [applicationId, setApplicationId] = useState<string | null>(null)

  const jobId = params.id as string

  useEffect(() => {
    fetchJobDetails()
  }, [jobId])

  const fetchJobDetails = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/jobs/${jobId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch job details')
      }
      const data = await response.json()

      // Check if user has applied or saved this job
      const [applicationsResponse, savedJobsResponse] = await Promise.all([
        fetch("/api/applications"),
        fetch("/api/saved-jobs")
      ])

      const applications = applicationsResponse.ok ? await applicationsResponse.json() : []
      const savedJobs = savedJobsResponse.ok ? await savedJobsResponse.json() : []

      const application = applications.find((app: any) => app.jobId._id === data._id)
      setJob({
        ...data,
        applied: !!application,
        saved: savedJobs.some((saved: any) => saved.jobId._id === data._id)
      })
      setApplicationId(application?._id || null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch job details",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        })
        return
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        })
        return
      }
      setCvFile(file)
    }
  }

  const uploadPDFToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'xmatoImage') // Your unsigned preset

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Cloudinary upload error:', data)
      throw new Error(data.error?.message || 'Upload failed')
    }

    return data.secure_url
  }


  const handleApply = async () => {
    if (!cvFile) {
      toast({
        title: "CV Required",
        description: "Please upload your CV to apply",
        variant: "destructive",
      })
      return
    }

    try {
      setIsApplying(true)
      setUploadProgress(0)

      // Upload CV to Cloudinary
      const cvUrl = await uploadPDFToCloudinary(cvFile)
      setUploadProgress(50)

      // Submit application with CV URL
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          cvUrl,
          coverLetter: coverLetter.trim() || undefined
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit application')
      }

      setUploadProgress(100)
      toast({
        title: "Application submitted!",
        description: "Your application has been sent to the employer",
      })

      setJob(prev => prev ? { ...prev, applied: true } : null)
      setShowApplyDialog(false)
      setCvFile(null)
      setCoverLetter("")
      setUploadProgress(0)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit application",
        variant: "destructive",
      })
    } finally {
      setIsApplying(false)
    }
  }

  const handleSaveJob = async () => {
    try {
      setIsSaving(true)
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

      setJob(prev => prev ? { ...prev, saved: true } : null)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save job",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUnsaveJob = async () => {
    try {
      setIsSaving(true)
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

      setJob(prev => prev ? { ...prev, saved: false } : null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove job from saved list",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleWithdrawApplication = async () => {
    if (!applicationId) {
      toast({
        title: "Error",
        description: "Application ID not found",
        variant: "destructive",
      })
      return
    }

    // Show confirmation dialog
    const isConfirmed = window.confirm(
      "Are you sure you want to withdraw your application? This action cannot be undone."
    )

    if (!isConfirmed) {
      return
    }

    try {
      setIsWithdrawing(true)
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

      setJob(prev => prev ? { ...prev, applied: false } : null)
      setApplicationId(null)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to withdraw application",
        variant: "destructive",
      })
    } finally {
      setIsWithdrawing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDaysUntilDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline)
    const today = new Date()
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job not found</h2>
          <p className="text-gray-600 mb-4">The job you're looking for doesn't exist or has been removed.</p>
          <Link href="/student/dashboard">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const deadlineDate = job?.deadline ? new Date(job.deadline) : new Date(new Date(job.createdAt).getTime() + 15 * 24 * 60 * 60 * 1000);
  const daysUntilDeadline = getDaysUntilDeadline(deadlineDate.toISOString());

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/student/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Jobs
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Briefcase className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold">Start.Gig</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={job.saved ? handleUnsaveJob : handleSaveJob}
                disabled={isSaving}
              >
                <Heart className={`h-4 w-4 ${job.saved ? "fill-current text-red-500" : ""}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                    <div className="flex items-center space-x-2 mb-4">
                      <Building className="h-5 w-5 text-gray-500" />
                      <span className="text-xl text-gray-700">{job.company}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
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
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Posted {formatDate(job.createdAt)}
                      </div>
                    </div>
                    {daysUntilDeadline > 0 ? (
                      <Badge variant="secondary" className="mb-4">
                        {daysUntilDeadline} days left to apply
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="mb-4">
                        Application deadline passed
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Description */}
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {job.requirements.map((requirement, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{requirement}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Section */}
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Apply for this position</CardTitle>
                <CardDescription>
                  Submit your application to be considered for this role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {job.applied ? (
                  <div className="text-center py-4 space-y-4">
                    <div>
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                      <h3 className="font-semibold text-green-700 mb-1">Application Submitted</h3>
                      <p className="text-sm text-gray-600">Your application has been sent to the employer</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleWithdrawApplication}
                      disabled={isWithdrawing}
                      className="w-full text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    >
                      {isWithdrawing ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                          Withdrawing...
                        </div>
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-1" />
                          Withdraw Application
                        </>
                      )}
                    </Button>
                  </div>
                ) : daysUntilDeadline <= 0 ? (
                  <div className="text-center py-4">
                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                    <h3 className="font-semibold text-red-700 mb-1">Applications Closed</h3>
                    <p className="text-sm text-gray-600">The deadline for this position has passed</p>
                  </div>
                ) : (
                  <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full" size="lg">
                        Apply Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Submit Application</DialogTitle>
                        <DialogDescription>
                          Upload your CV and optionally add a cover letter
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="cv">CV/Resume (PDF)</Label>
                          <div className="mt-1">
                            <Input
                              id="cv"
                              type="file"
                              accept=".pdf"
                              onChange={handleFileChange}
                              className="cursor-pointer"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Maximum file size: 5MB
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
                          <Textarea
                            id="coverLetter"
                            placeholder="Tell us why you're interested in this position..."
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            rows={4}
                          />
                        </div>
                        {uploadProgress > 0 && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        )}
                        <div className="flex space-x-2">
                          <Button
                            onClick={handleApply}
                            disabled={!cvFile || isApplying}
                            className="flex-1"
                          >
                            {isApplying ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Submitting...
                              </>
                            ) : (
                              "Submit Application"
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowApplyDialog(false)}
                            disabled={isApplying}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>

            {/* Job Details */}
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Company</span>
                  <span className="font-medium">{job.company}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Location</span>
                  <span className="font-medium">{job.location}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Job Type</span>
                  <span className="font-medium">{job.type}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Salary</span>
                  <span className="font-medium">{job.salary}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Posted</span>
                  <span className="font-medium">{formatDate(job.createdAt)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Deadline</span>
                  <span className="font-medium">
                    {formatDate(
                      new Date(
                        new Date(job.createdAt).getTime() + 15 * 24 * 60 * 60 * 1000
                      ).toISOString()
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 