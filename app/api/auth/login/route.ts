import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { User } from '@/lib/types';
import { verifyPassword } from '@/lib/handlers/hashing';
import StudentModel from '@/app/models/user/student.model';
import EmployerModel from '@/app/models/user/employer.model';
import AdminModel from '@/app/models/user/admin.model';
import { connectDb } from '@/lib/db/config/db.config';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    await connectDb()
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);
    // Try to find user in all collections
    const user = await StudentModel.findOne({ email }) ??
      await EmployerModel.findOne({ email }) ??
      await AdminModel.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Ensure JWT_SECRET is available
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const token = await new SignJWT({ 
      userId: user.id, 
      role: user.role,
      isApproved: user.isApproved 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    // Debug logging for production
    if (process.env.NODE_ENV === 'production') {
      console.log('Login API - Setting token cookie');
      console.log('Login API - NODE_ENV:', process.env.NODE_ENV);
      console.log('Login API - User role:', user.role);
    }

    cookies().set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN || '.startgit.vercel.app' : undefined,
    });

    // Return role-specific user data
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        ...(user.role === 'student' ? {
          firstName: user.firstName,
          lastName: user.lastName,
          name: user?.firstName + ' ' + user?.lastName,
          education: user.education,
          skills: user.skills,
        } : user.role === 'employer' ? {
          name: user?.companyName,
          companyName: user.companyName,
          location: user.location,
          website: user.website,
        } : {
          name: user.name,
          image: user.image
        })
      },
      message: 'Login successful'
    }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 