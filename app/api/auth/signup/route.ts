import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { validateUserData } from '@/app/schemas/user.schema';
import StudentModel from '@/app/models/user/student.model';
import EmployerModel from '@/app/models/user/employer.model';
import AdminModel from '@/app/models/user/admin.model';
import { hashPassword } from '@/lib/handlers/hashing';
import { connectDb } from '@/lib/db/config/db.config';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    // Connect to MongoDB first
    await connectDb();
    
    const body = await request.json();
    const validationResult = validateUserData(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    console.log('signup route', data);

    // Select the appropriate model based on role
    let UserModel;
    switch (data.role) {
      case 'student':
        UserModel = StudentModel;
        break;
      case 'employer':
        UserModel = EmployerModel;
        break;
      case 'admin':
        UserModel = AdminModel;
        break;
      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if user exists in the appropriate collection
    const isUserExists = await UserModel?.findOne({ email: data.email });
    if (isUserExists) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Create user with role-specific data
    const user = await UserModel.create({
      _id: new mongoose.Types.ObjectId(),
      ...data,
      password: await hashPassword(data.password),
      isApproved: data.role === 'employer' ? 'pending' : 'approved', // Set initial approval status
    });

    if (!user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    const token = await new SignJWT({ 
      userId: user.id, 
      role: user.role,
      isApproved: user.isApproved 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    // Set HTTP-only cookie
    cookies().set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN || '.startgit.vercel.app' : undefined,
    });

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
      message: 'Signup successful' 
    }, { status: 201 });

  } catch (error) {
    console.log('signup route error', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Signup failed'
    }, { status: 500 });
  }
}
