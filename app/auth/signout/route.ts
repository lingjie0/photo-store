import {createServerClient} from "@supabase/ssr";
import {cookies} from 'next/headers';
import { NextResponse, NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
        {
            cookies: {
                get: (name) => cookieStore.get(name)?.value,
                set: (name, value, options) => {
                    cookieStore.set({name, value, ...options});
                },
                remove: (name, options) => {
                    cookieStore.set({name, value: '', ...options});
                }
            }
        }
    );

    const {data: {session}} = await supabase.auth.getSession();
    if (session) {
        await supabase.auth.signOut();
    }

    return NextResponse.redirect(new URL('/', req.url), {status: 302});
}