"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
// import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Users, Building2, Briefcase, CheckCircle, XCircle, User, Bell, Settings, Palette, Shield } from "lucide-react"
import Link from "next/link"

interface PendingUser {
  _id: string
  email: string
  role: 'student' | 'employer'
  isApproved: 'pending' | 'approved' | 'rejected'
  createdAt: string
  // Student specific fields
  firstName?: string
  lastName?: string
  education?: string
  skills?: string[]
  // Employer specific fields
  companyName?: string
  location?: string
}

interface SchoolSettings {
  name: string
  logo: string
  primaryColor: string
  secondaryColor: string
  domain: string
}

interface DashboardStats {
  activeStudents: number
  partnerEmployers: number
  activeJobs: number
  totalJobs: number
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    activeStudents: 0,
    partnerEmployers: 0,
    activeJobs: 0,
    totalJobs: 0
  })
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
    name: "University of Example",
    logo: "",
    primaryColor: "#3B82F6",
    secondaryColor: "#1E40AF",
    domain: "example.edu",
  })
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchPendingUsers = async () => {
    try {
      const response = await fetch("/api/admin/pending-users")
      const data = await response.json()
      console.log(data)
      setPendingUsers(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch pending users",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSchoolSettings = async () => {
    try {
      const response = await fetch("/api/admin/school-settings")
      const data = await response.json()
      if (data) {
        setSchoolSettings(data)
      }
    } catch (error) {
      console.error("Failed to fetch school settings:", error)
    }
  }

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard-stats")
      const data = await response.json()
      setDashboardStats(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch dashboard statistics",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchDashboardStats()
    fetchPendingUsers()
  }, [])

  const handleUserApproval = async (userId: string, approved: boolean) => {
    try {
      const response = await fetch("/api/admin/approve-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, approved }),
      })

      if (response.ok) {
        toast({
          title: approved ? "User approved" : "User rejected",
          description: approved ? "User can now access the platform" : "User registration has been rejected",
        })
        setPendingUsers((prev) => prev.filter((user) => user._id !== userId))
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process user approval",
        variant: "destructive",
      })
    }
  }

  const handleSettingsUpdate = async () => {
    try {
      const response = await fetch("/api/admin/school-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(schoolSettings),
      })

      if (response.ok) {
        toast({
          title: "Settings updated",
          description: "School settings have been saved successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      })
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
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                Admin
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              {/* <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button> */}
              <Link href="/admin/profile" className="text-sm  flex items-center font-medium text-gray-600 hover:text-blue-600">
                <User className="size-5 mr-2" />
           
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your school&apos;s job board platform</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                  <p className="text-3xl font-bold text-orange-600">{pendingUsers.length}</p>
                </div>
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Students</p>
                  <p className="text-3xl font-bold text-blue-600">{dashboardStats.activeStudents}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Partner Employers</p>
                  <p className="text-3xl font-bold text-green-600">{dashboardStats.partnerEmployers}</p>
                </div>
                <Building2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          {/* <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-3xl font-bold text-purple-600">{dashboardStats.activeJobs}</p>
                </div>
                <Briefcase className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card> */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-3xl font-bold text-indigo-600">{dashboardStats.totalJobs}</p>
                </div>
                <Briefcase className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="approvals" className="space-y-6">
          <TabsList>
            <TabsTrigger value="approvals">User Approvals</TabsTrigger>
            {/* <TabsTrigger value="settings">School Settings</TabsTrigger> */}
            {/* <TabsTrigger value="analytics">Analytics</TabsTrigger> */}
          </TabsList>

          <TabsContent value="approvals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending User Approvals</CardTitle>
                <CardDescription>Review and approve student registrations with .edu email addresses</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="p-4 bg-gray-50 rounded-full">
                      <CheckCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-900">No Pending Approvals</p>
                    <p className="text-sm text-gray-500">All user registrations have been processed</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingUsers.map((user) => (
                      <div key={user._id} className="flex items-center justify-between p-6 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-semibold text-lg">
                              {user.role === 'student' 
                                ? `${user.firstName} ${user.lastName}`
                                : user.companyName}
                            </h4>
                            <Badge variant={user.role === 'student' ? 'secondary' : 'default'}>
                              {user.role === 'student' ? 'Student' : 'Employer'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                          {user.role === 'student' ? (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">{user.education}</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {user.skills?.map((skill, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2">
                
                              <p className="text-sm text-gray-600">{user.location}</p>
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            Applied {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleUserApproval(user._id, true)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUserApproval(user._id, false)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  School Settings
                </CardTitle>
                <CardDescription>Customize your school&apos;s job board appearance and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">School Name</label>
                      <Input
                        value={schoolSettings.name}
                        onChange={(e) => setSchoolSettings((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="University of School"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">School Domain</label>
                      <Input
                        value={schoolSettings.domain}
                        onChange={(e) => setSchoolSettings((prev) => ({ ...prev, domain: e.target.value }))}
                        placeholder="example.edu"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Primary Color</label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="color"
                          value={schoolSettings.primaryColor}
                          onChange={(e) => setSchoolSettings((prev) => ({ ...prev, primaryColor: e.target.value }))}
                          className="w-16 h-10"
                        />
                        <Input
                          value={schoolSettings.primaryColor}
                          onChange={(e) => setSchoolSettings((prev) => ({ ...prev, primaryColor: e.target.value }))}
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Secondary Color</label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="color"
                          value={schoolSettings.secondaryColor}
                          onChange={(e) => setSchoolSettings((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                          className="w-16 h-10"
                        />
                        <Input
                          value={schoolSettings.secondaryColor}
                          onChange={(e) => setSchoolSettings((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                          placeholder="#1E40AF"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <Button onClick={handleSettingsUpdate}>
                  <Palette className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
                <CardDescription>Overview of platform usage and metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Analytics dashboard coming soon!</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
