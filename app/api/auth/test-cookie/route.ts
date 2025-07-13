import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const allCookies = cookies().getAll();
    const token = cookies().get('token');
    
    return NextResponse.json({
      hasToken: !!token,
      tokenLength: token?.value?.length || 0,
      allCookies: allCookies.map(cookie => ({
        name: cookie.name,
        value: cookie.value ? `${cookie.value.substring(0, 10)}...` : 'undefined',
      })),
      nodeEnv: process.env.NODE_ENV,
      hasJwtSecret: !!process.env.JWT_SECRET,
      requestHeaders: {
        // This will help debug if cookies are being sent
        cookie: 'cookie-header-not-available-in-server-component'
      }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 