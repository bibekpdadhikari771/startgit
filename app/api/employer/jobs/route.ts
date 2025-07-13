import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import JobModel from "@/app/models/job/job.model"
import JobApplicationModel from "@/app/models/jobApplication/jobApplication.model"
import { connectDb } from "@/lib/db/config/db.config"
import { z } from 'zod'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const jobSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  company: z.string().min(2),
  location: z.string().min(2),
  type: z.enum(['full-time', 'part-time', 'internship']),
  salary: z.string().optional(),
  requirements: z.array(z.string()),
  deadline: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    await connectDb()
    const token = cookies().get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    
    if (payload.role !== 'employer') {
      return NextResponse.json(
        { error: 'Only employers can access this endpoint' },
        { status: 403 }
      )
    }

    const employerId = payload.userId

    // Fetch jobs for the current employer
    const jobs = await JobModel.find({ employerId: employerId })
    console.log(jobs, 'jobs')
    // Get application counts for each job
    const jobsWithApplications = await Promise.all(
      jobs.map(async (job) => {
        const applicationCount = await JobApplicationModel.countDocuments({ jobId: job._id })
        return {
          id: job._id.toString(),
          title: job.title,
          location: job.location,
          type: job.type,
          salary: job.salary,
          description: job.description,
          requirements: job.requirements,
          postedAt: new Date(job.createdAt).toLocaleDateString(),
          deadline: job?.deadline
            ? new Date(job.deadline).toLocaleDateString()
            : new Date(new Date(job.createdAt).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: job.status || "active",
          applicants: applicationCount,
          employerId: job.employerId,
          company: job.company,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt
        }
      })
    )

    return NextResponse.json(jobsWithApplications)
  } catch (error) {
    console.error("Error fetching employer jobs:", error)
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await connectDb()
    const token = cookies().get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    
    if (payload.role !== 'employer') {
      return NextResponse.json(
        { error: 'Only employers can create jobs' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const jobData = jobSchema.parse(body)
    
    const newJob = await JobModel.create({
      ...jobData,
      employerId: payload.userId,
      status: 'active'
    })
    
    return NextResponse.json(newJob, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.format() },
        { status: 400 }
      )
    }
    console.error('Error creating job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
