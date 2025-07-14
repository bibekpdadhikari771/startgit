import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const allCookies = cookies().getAll();
    const tokenFromHelper = cookies().get('token')?.value;
    
    // Also try to get token from headers
    const cookieHeader = request.headers.get('cookie');
    let tokenFromHeader = undefined;
    if (cookieHeader) {
      const tokenMatch = cookieHeader.match(/token=([^;]+)/);
      tokenFromHeader = tokenMatch ? tokenMatch[1] : undefined;
    }
    
    // Use whichever token is available
    const token = tokenFromHelper || tokenFromHeader;
    
    return NextResponse.json({
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenFromHelper: !!tokenFromHelper,
      tokenFromHeader: !!tokenFromHeader,
      allCookies: allCookies.map(cookie => ({
        name: cookie.name,
        value: cookie.value ? `${cookie.value.substring(0, 10)}...` : 'undefined',
      })),
      nodeEnv: process.env.NODE_ENV,
      hasJwtSecret: !!process.env.JWT_SECRET,
      cookieDomain: process.env.COOKIE_DOMAIN || '.startgit.vercel.app',
      isProduction: process.env.NODE_ENV === 'production',
      cookieHeaderPresent: !!cookieHeader,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 