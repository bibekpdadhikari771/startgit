"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"
import { addJob } from "@/lib/slices/jobSlice"
import { toast } from "react-hot-toast"
import { Briefcase, Building2, MapPin, Clock, DollarSign, FileText, ListChecks, Plus, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface JobFormData {
  title: string
  description: string
  company: string
  location: string
  type: "full-time" | "part-time" | "internship"
  salary: string
  deadline: string
  requirements: string[]
}

export default function PostJobPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [requirement, setRequirement] = useState("")
  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    description: "",
    company: "",
    location: "",
    type: "full-time",
    salary: "",
    deadline: "",
    requirements: [],
  })

  
  useEffect(() => {
    const fetchEmployerProfile = async () => {
      try {
        const response = await fetch("/api/employer/profile")
        if (!response.ok) {
          throw new Error("Failed to fetch employer profile")
        }
        const data = await response.json()
        setFormData((prev) => ({
          ...prev,
          company: data.companyName,
          location: data.location,
        }))
      } catch (error) {
        console.error("Error fetching employer profile:", error)
        toast.error("Failed to load employer profile")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmployerProfile()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (value: string, name: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddRequirement = () => {
    if (requirement.trim()) {
      setFormData((prev) => ({
        ...prev,
        requirements: [...prev.requirements, requirement.trim()],
      }))
      setRequirement("")
    }
  }

  const handleRemoveRequirement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/employer/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create job")
      }

      const newJob = await response.json()
      dispatch(addJob(newJob))
      toast.success("Job posted successfully!")
      router.push("/employer/dashboard")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post job. Please try again.")
      console.error("Error posting job:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <Briefcase className="h-6 w-6" />
              <CardTitle className="text-2xl font-bold">Post a New Job</CardTitle>
            </div>
            <CardDescription className="text-slate-200">
              Create a compelling job listing to attract the best candidates
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-slate-500" />
                      <label htmlFor="title" className="text-sm font-medium text-slate-700">
                        Job Title
                      </label>
                    </div>
                    <Input
                      id="title"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g. Senior Software Engineer"
                      className="transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-500" />
                      <label htmlFor="company" className="text-sm font-medium text-slate-700">
                        Company Name
                      </label>
                    </div>
                    <Input
                      id="company"
                      name="company"
                      required
                      value={formData.company}
                      onChange={handleInputChange}
                      className="bg-slate-50 transition-all duration-200"
                      readOnly
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      <label htmlFor="location" className="text-sm font-medium text-slate-700">
                        Location
                      </label>
                    </div>
                    <Input
                      id="location"
                      name="location"
                      required
                      value={formData.location}
                      onChange={handleInputChange}
                      className="bg-slate-50 transition-all duration-200"
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <label htmlFor="type" className="text-sm font-medium text-slate-700">
                        Job Type
                      </label>
                    </div>
                    <Select value={formData.type} onValueChange={(value) => handleSelectChange(value, "type")}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full Time</SelectItem>
                        <SelectItem value="part-time">Part Time</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-slate-500" />
                      <label htmlFor="salary" className="text-sm font-medium text-slate-700">
                        Salary (Optional)
                      </label>
                    </div>
                    <Input
                      id="salary"
                      name="salary"
                      value={formData.salary}
                      onChange={handleInputChange}
                      placeholder="e.g. $80,000 - $100,000"
                      className="transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <label htmlFor="deadline" className="text-sm font-medium text-slate-700">
                        Application Deadline
                      </label>
                    </div>
                    <Input
                      id="deadline"
                      name="deadline"
                      type="date"
                      required
                      value={formData.deadline}
                      onChange={handleInputChange}
                      min={new Date().toISOString()}
                      className="transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  <label htmlFor="description" className="text-sm font-medium text-slate-700">
                    Job Description
                  </label>
                </div>
                <Textarea
                  id="description"
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  placeholder="Provide a detailed description of the job responsibilities, qualifications, and benefits..."
                  className="resize-none transition-all duration-200"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-slate-500" />
                  <label className="text-sm font-medium text-slate-700">Requirements</label>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={requirement}
                    onChange={(e) => setRequirement(e.target.value)}
                    placeholder="Add a requirement"
                    className="transition-all duration-200"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddRequirement()
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddRequirement} size="icon" className="shrink-0">
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Add requirement</span>
                  </Button>
                </div>

                {formData.requirements.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Added Requirements:</h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.requirements.map((req, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="pl-3 pr-2 py-1.5 flex items-center gap-1 bg-white border"
                        >
                          <span className="text-sm">{req}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 rounded-full hover:bg-slate-200"
                            onClick={() => handleRemoveRequirement(index)}
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t">
                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={() => router.back()} className="px-6">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="px-8">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      "Post Job"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
