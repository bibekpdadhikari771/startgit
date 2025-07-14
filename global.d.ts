declare namespace App {
  interface User {
    id: string;
    email: string;
    name: string;
    role: 'student' | 'employer' | 'admin';
    createdAt: string;
    updatedAt: string;
    companyName?: string;
  }

  interface Job {
    id: string;
    title: string;
    description: string;
    company: string;
    location: string;
    type: 'full-time' | 'part-time' | 'internship';
    salary?: string;
    requirements: string[];
    employerId: string;
    createdAt: string;
    updatedAt: string;
  }

  interface JobApplication {
    id: string;
    jobId: string;
    studentId: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
    updatedAt: string;
  }
} 