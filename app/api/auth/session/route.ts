import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import UserModel from '@/app/models/user/student.model';
import EmployerModel from '@/app/models/user/employer.model';
import AdminModel from '@/app/models/user/admin.model';
import { connectDb } from '@/lib/db/config/db.config';

export async function GET(request: Request) {
  try {
    // Connect to database first
    await connectDb();
    
    // Try to get token from Next.js cookies helper first
    let token = cookies().get('token')?.value;
    
    // If not found, try to get from request headers (fallback for production)
    if (!token) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const tokenMatch = cookieHeader.match(/token=([^;]+)/);
        token = tokenMatch ? tokenMatch[1] : undefined;
      }
    }
    
    // Debug logging for production
    if (process.env.NODE_ENV === 'production') {
      console.log('Session API - NODE_ENV:', process.env.NODE_ENV);
      console.log('Session API - Token from cookies() helper:', !!cookies().get('token')?.value);
      console.log('Session API - Token from headers:', !!token);
      console.log('Session API - Cookie header present:', !!request.headers.get('cookie'));
      console.log('Session API - All cookies from helper:', cookies().getAll().map(c => ({ name: c.name, value: c.value ? `${c.value.substring(0, 10)}...` : 'undefined' })));
    }
    
    if (!token) {
      console.log('Session API - No token found');
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Verify token
    if (!process.env.JWT_SECRET) {
      console.error('Session API - JWT_SECRET is not set');
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    console.log('Session API - Token payload:', { userId: payload.userId, role: payload.role });
    
    // Get user data from database based on role
    let user;
    const role = payload.role as string;
    const userId = payload.userId as string;
    
    switch (role) {
      case 'student':
        user = await UserModel.findById(userId).select('-password');
        console.log('Session API - Student user found:', !!user);
        break;
      case 'employer':
        user = await EmployerModel.findById(userId).select('-password');
        console.log('Session API - Employer user found:', !!user);
        break;
      case 'admin':
        user = await AdminModel.findById(userId).select('-password');
        console.log('Session API - Admin user found:', !!user);
        break;
      default:
        console.log('Session API - Invalid role:', role);
        return NextResponse.json({ user: null }, { status: 200 });
    }
    
    if (!user) {
      console.log('Session API - User not found in database for userId:', userId, 'role:', role);
      return NextResponse.json({ user: null }, { status: 200 });
    }

    console.log('Session API - Returning user data for:', user.email);
    return NextResponse.json({
      user: {
        ...user?._doc 
      },
      expires: payload.exp
    }, { status: 200 });
  } catch (error) {
    // If token is invalid or expired, return null session
    console.error('Session API - Error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
} 