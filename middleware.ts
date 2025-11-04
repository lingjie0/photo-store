import {NextResponse, NextRequest} from 'next/server';
import {createServerClient} from '@supabase/ssr';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  as string,
        {
            cookies: {
                get: (name) => req.cookies.get(name)?.value,
                set: (name, value, options) => {
                    req.cookies.set({
                        name, value, ...options
                    });
                    const response = NextResponse.next({
                        request: {
                            headers: req.headers
                        }
                    });
                    response.cookies.set({
                        name, value, ...options
                    });
                },
                remove: (name, options) => {
                    req.cookies.set({
                        name, value: '', ...options
                    });
                    const response = NextResponse.next({
                        request: {
                            headers: req.headers
                        }
                    });
                    response.cookies.set({
                        name, value: '', ...options
                    });
                } 
            }
        }
    );
    const {data: {user}} = await supabase.auth.getUser(); 
    console.log({user, nextUrl: req.nextUrl.pathname});
    
    if (user && req.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/photos', req.url));
    }
    if (!user && req.nextUrl.pathname !== '/') {
        return NextResponse.redirect(new URL('/', req.url));
    }

    return res;
}

export const config = {
    matcher: ['/', '/photos']
};