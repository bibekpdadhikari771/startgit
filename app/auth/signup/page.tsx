"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Briefcase, Mail, Lock, User, Building2, Chrome, GraduationCap, Wrench, X, Phone } from "lucide-react"
import { signIn } from "next-auth/react"
import { signupSchema, emailSchema, passwordSchema, phoneSchema, urlSchema, type SignupFormData } from "@/utils/validation/signup"
import { ZodError } from "zod"

export default function SignUpPage() {
  const [formData, setFormData] = useState<SignupFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "student",
    companyName: "",
    schoolName: "",
    education: "",
    skills: [],
    experience: "",
    location: "",
    website: "",
    description: "",
    phoneNumber: "",
  })
  const [skillInput, setSkillInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const role = searchParams.get("role")
    if (role && ["student", "employer", "admin"].includes(role)) {
      setFormData((prev) => ({ ...prev, role: role as "student" | "employer" | "admin" }))
    }
  }, [searchParams])

  const validateField = (field: string, value: any) => {
    try {
      switch (field) {
        case "email":
          emailSchema.parse(value)
          break
        case "password":
          passwordSchema.parse(value)
          break
        case "phoneNumber":
          if (value) phoneSchema.parse(value)
          break
        case "website":
          if (value) urlSchema.parse(value)
          break
        default:
          break
      }
      setErrors(prev => ({ ...prev, [field]: "" }))
    } catch (error) {
      if (error instanceof ZodError) {
        setErrors(prev => ({ ...prev, [field]: error.errors[0].message }))
      }
    }
  }

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value } as SignupFormData))

    // Validate field on change if it has been touched
    if (touched[field]) {
      validateField(field, value)
    }
  }

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    validateField(field, formData[field as keyof SignupFormData])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate all fields
    try {
      signupSchema.parse(formData)
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          const field = err.path[0] as string
          fieldErrors[field] = err.message
        })
        setErrors(fieldErrors)
        toast({
          title: "Validation Error",
          description: `${error?.errors[0]?.message}`,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }
    }

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }


    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, name: `${formData.firstName} ${formData.lastName}`, isApproved: 'pending' }),
      })


      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Account created!",
          description:
            formData.role === "student"
              ? "Your account is pending approval from your school admin"
              : "You can now sign in to your account",
        })
        router.push("/auth/signin")
      } else {
        toast({
          title: "Sign up failed",
          description: data.message || "Something went wrong",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    try {
      await signIn("google", { callbackUrl: "/dashboard" })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign up with Google",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleAddSkill = (e?: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e?.key === 'Enter' || !e) && skillInput.trim()) {
      if (e) e.preventDefault()
      const newSkill = skillInput.trim()
      const currentSkills = formData.skills || []
      if (!currentSkills.includes(newSkill)) {
        setFormData(prev => ({
          ...prev,
          skills: [...currentSkills, newSkill]
        } as SignupFormData))
        setSkillInput("")
      }
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    const currentSkills = formData.skills || []
    setFormData(prev => ({
      ...prev,
      skills: currentSkills.filter(skill => skill !== skillToRemove)
    } as SignupFormData))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Briefcase className="h-10 w-10 text-blue-600 animate-pulse" />
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Start.Gig</span>
          </div>
          <CardTitle className="text-2xl font-bold">Create Your Account</CardTitle>
          <CardDescription className="text-base">Join thousands of students and employers on Start.Gig</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">I am a...</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="employer">Employer</SelectItem>
                  <SelectItem value="admin">School Admin</SelectItem>
                </SelectContent>
              </Select>
            </div> */}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    onBlur={() => handleBlur("firstName")}
                    className={`pl-10 h-11 transition-all focus:ring-2 focus:ring-blue-500 ${errors.firstName ? 'border-red-500 focus:ring-red-500' : ''}`}
                    required
                  />
                </div>
                {errors.firstName && (
                  <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  onBlur={() => handleBlur("lastName")}
                  className={`h-11 transition-all focus:ring-2 focus:ring-blue-500 ${errors.lastName ? 'border-red-500 focus:ring-red-500' : ''}`}
                  required
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder={"example@email.com"}
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  className={`pl-10 h-11 transition-all focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                  required
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            {formData.role === "employer" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-sm font-medium">Company Name</Label>
                    <div className="relative group">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      <Input
                        id="companyName"
                        placeholder="Acme Corp"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange("companyName", e.target.value)}
                        onBlur={() => handleBlur("companyName")}
                        className={`pl-10 h-11 transition-all focus:ring-2 focus:ring-blue-500 ${errors.companyName ? 'border-red-500 focus:ring-red-500' : ''}`}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                    <div className="relative group">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      <Input
                        id="location"
                        placeholder="City, State"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        className="pl-10 h-11 transition-all focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="text-sm font-medium">Website (Optional)</Label>
                  <div className="relative group">
                    <Chrome className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://www.example.com"
                      value={formData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      onBlur={() => handleBlur("website")}
                      className={`pl-10 h-11 transition-all focus:ring-2 focus:ring-blue-500 ${errors.website ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Company Description</Label>
                  <div className="relative group">
                    <textarea
                      id="description"
                      placeholder="Tell us about your company, its mission, and what makes it unique..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      onBlur={() => handleBlur("description")}
                      className={`w-full px-3 py-2 min-h-[120px] rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-all resize-none ${errors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      required
                    />
                  </div>
                  {errors.description && (
                    <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Minimum 10 characters required</p>
                </div>
              </div>
            )}

            {formData.role === "admin" && (
              <div className="space-y-2">
                <Label htmlFor="schoolName" className="text-sm font-medium">School Name</Label>
                <div className="relative group">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="schoolName"
                    placeholder="University of School"
                    value={formData.schoolName}
                    onChange={(e) => handleInputChange("schoolName", e.target.value)}
                    onBlur={() => handleBlur("schoolName")}
                    className={`pl-10 h-11 transition-all focus:ring-2 focus:ring-blue-500 ${errors.schoolName ? 'border-red-500 focus:ring-red-500' : ''}`}
                    required
                  />
                </div>
              </div>
            )}

            {formData.role === "student" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="education" className="text-sm font-medium">Education</Label>
                    <div className="relative group">
                      <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      <Input
                        id="education"
                        placeholder="e.g., Bachelor's in Computer Science"
                        value={formData.education}
                        onChange={(e) => handleInputChange("education", e.target.value)}
                        onBlur={() => handleBlur("education")}
                        className={`pl-10 h-11 transition-all focus:ring-2 focus:ring-blue-500 ${errors.education ? 'border-red-500 focus:ring-red-500' : ''}`}
                        required
                      />
                    </div>
                    {errors.education && (
                      <p className="text-sm text-red-600 mt-1">{errors.education}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                    <div className="relative group">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      <Input
                        id="location"
                        placeholder="City, State"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        className="pl-10 h-11 transition-all focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-sm font-medium">Phone Number</Label>
                    <div className="relative group">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                        onBlur={() => handleBlur("phoneNumber")}
                        className={`pl-10 h-11 transition-all focus:ring-2 focus:ring-blue-500 ${errors.phoneNumber ? 'border-red-500 focus:ring-red-500' : ''}`}
                        required
                      />
                    </div>
                    {errors.phoneNumber && (
                      <p className="text-sm text-red-600 mt-1">{errors.phoneNumber}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skills" className="text-sm font-medium">Skills</Label>
                    <div className="relative group flex gap-2">
                      <div className="relative flex-1">
                        <Wrench className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input
                          id="skills"
                          placeholder="Type a skill and press Enter"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={handleAddSkill}
                          className="pl-10 h-11 transition-all focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() => handleAddSkill()}
                        className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Add
                      </Button>
                    </div>
                    {errors.skills && (
                      <p className="text-sm text-red-600 mt-1">{errors.skills}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Press Enter or click Add to add each skill</p>
                  </div>
                </div>

                {(formData.skills || []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(formData.skills || []).map((skill, index) => (
                      <div
                        key={index}
                        className="group flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium transition-all hover:bg-blue-100"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-sm font-medium">Experience (Optional)</Label>
                  <div className="relative group">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <textarea
                      id="experience"
                      placeholder="Describe your work experience, internships, or projects..."
                      value={formData.experience}
                      onChange={(e) => handleInputChange("experience", e.target.value)}
                      className="w-full pl-10 pr-3 py-2 min-h-[100px] rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-all resize-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  onBlur={() => handleBlur("password")}
                  className={`pl-10 h-11 transition-all focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  required
                />
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  onBlur={() => handleBlur("confirmPassword")}
                  className={`pl-10 h-11 transition-all focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                  required
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] focus:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* <Button 
            variant="outline" 
            onClick={handleGoogleSignUp} 
            disabled={isLoading} 
            className="w-full h-11 border-2 hover:bg-gray-50 transition-all duration-200"
          >
            <Chrome className="mr-2 h-5 w-5" />
            Continue with Google
          </Button> */}

          <div className="text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link href={`/auth/signin?role=${searchParams.get("role")}`} className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
