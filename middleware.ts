import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000 // 2 hours
const LAST_ACTIVITY_COOKIE = 'last_activity'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const lastActivityCookie = request.cookies.get(LAST_ACTIVITY_COOKIE)
  const isAuthPage = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register'

  if (user && !isAuthPage && lastActivityCookie) {
    const lastActivity = parseInt(lastActivityCookie.value, 10)
    const now = Date.now()
    if (!isNaN(lastActivity) && lastActivity > 0 && now - lastActivity > INACTIVITY_TIMEOUT_MS) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('reason', 'timeout')
      const redirectResponse = NextResponse.redirect(url)
      response.cookies.getAll().forEach(({ name, value, ...options }) => {
        redirectResponse.cookies.set(name, value, options)
      })
      redirectResponse.cookies.delete(LAST_ACTIVITY_COOKIE)
      return redirectResponse
    }
  }

  if (user && !isAuthPage) {
    response.cookies.set(LAST_ACTIVITY_COOKIE, Date.now().toString(), {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  }

  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search)
    const redirectResponse = NextResponse.redirect(url)
    response.cookies.getAll().forEach(({ name, value, ...options }) => {
      redirectResponse.cookies.set(name, value, options)
    })
    return redirectResponse
  }

  if (user && isAuthPage) {
    const redirectResponse = NextResponse.redirect(new URL('/', request.url))
    response.cookies.getAll().forEach(({ name, value, ...options }) => {
      redirectResponse.cookies.set(name, value, options)
    })
    return redirectResponse
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)).*)',
  ],
}