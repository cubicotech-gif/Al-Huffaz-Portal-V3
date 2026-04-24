import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { ROLE_HOME, type UserRole } from '@/lib/types';

const PROTECTED_PREFIXES = ['/admin', '/sponsor', '/pending-approval'] as const;
const AUTH_ONLY_PATHS = ['/login', '/register'] as const;

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAuthOnly = AUTH_ONLY_PATHS.some((p) => pathname === p);

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (user && (isAuthOnly || isProtected)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.is_active) {
      if (isProtected) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }
    } else {
      const role = profile.role as UserRole;
      const home = ROLE_HOME[role];

      if (isAuthOnly) {
        const url = request.nextUrl.clone();
        url.pathname = home;
        return NextResponse.redirect(url);
      }

      const roleMatches =
        (role === 'admin' && pathname.startsWith('/admin')) ||
        (role === 'staff' && pathname.startsWith('/admin')) ||
        (role === 'sponsor' && pathname.startsWith('/sponsor')) ||
        (role === 'pending_sponsor' && pathname.startsWith('/pending-approval'));

      if (isProtected && !roleMatches) {
        const url = request.nextUrl.clone();
        url.pathname = home;
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}
