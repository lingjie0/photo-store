import {createServerClient} from "@supabase/ssr";
import {cookies} from 'next/headers';
import { NextResponse } from "next/server";

export const POST = async(req) => {
    const cookieStore = await cookies();
    
    console.log({cookieStore});
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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