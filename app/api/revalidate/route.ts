import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const path = body.path;
        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL as string,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
            {
                cookies: {
                    get: (name) => cookieStore.get(name)?.value,
                    set: (name, value, options) => {
                        cookieStore.set({name, value, ...options})
                    },
                    remove: (name, options) => {
                        cookieStore.set({name, value: '', ...options})
                    }
                }
            }
        );
        const {data: {user}} = await supabase.auth.getUser();
        if (!user) {
            return new Response(JSON.stringify({message: 'Unauthorized'}), {
                status: 401,
                headers: {'Content-Type': 'application/json'}
            })
        }
        if (path) {
            revalidatePath(path);
            return new Response(JSON.stringify({message: `Revalidated ${path}`}), {
                status: 200,
                headers: {'Content-Type': 'application/json'}
            })
        } else {
            return new Response(JSON.stringify({message: 'No Path'}), {
                status: 400,
                headers: {'Content-Type': 'application/json'}
            })
        }
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({message: 'Error revalidating path'}), {
                status: 500,
                headers: {'Content-Type': 'application/json'}
            })
    }
}