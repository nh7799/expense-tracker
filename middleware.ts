import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { isSupabaseConfigured } from "@/lib/env";
import { LOCAL_USER_COOKIE } from "@/lib/local/constants";

export async function middleware(req: NextRequest) {
  const isLogin = req.nextUrl.pathname.startsWith("/login");

  if (!isSupabaseConfigured()) {
    const user = req.cookies.get(LOCAL_USER_COOKIE)?.value;
    if (!user && !isLogin) return NextResponse.redirect(new URL("/login", req.url));
    if (user && isLogin) return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.next();
  }

  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list: { name: string; value: string; options?: CookieOptions }[]) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user && !isLogin) return NextResponse.redirect(new URL("/login", req.url));
  if (user && isLogin) return NextResponse.redirect(new URL("/dashboard", req.url));
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
