import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import UserModel from '@/app/models/user/student.model';
import EmployerModel from '@/app/models/user/employer.model';
import AdminModel from '@/app/models/user/admin.model';

export async function GET(request: Request) {
  try {
    // Get token from cookie using Next.js cookies helper
    const token = cookies().get('token')?.value;
    
    // Debug logging for production
    if (process.env.NODE_ENV === 'production') {
      console.log('Session API - NODE_ENV:', process.env.NODE_ENV);
      console.log('Session API - Token present:', !!token);
      console.log('Session API - Token length:', token?.length || 0);
      console.log('Session API - All cookies:', cookies().getAll().map(c => ({ name: c.name, value: c.value ? `${c.value.substring(0, 10)}...` : 'undefined' })));
    }
    
    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Verify token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // Get user data from database based on role
    let user;
    const role = payload.role as string;
    
    switch (role) {
      case 'student':
        user = await UserModel.findById(payload.userId).select('-password');
        break;
      case 'employer':
        user = await EmployerModel.findById(payload.userId).select('-password');
        break;
      case 'admin':
        user = await AdminModel.findById(payload.userId).select('-password');
        break;
      default:
        return NextResponse.json({ user: null }, { status: 200 });
    }
    
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

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