import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {NextResponse, type NextRequest} from 'next/server';

export const GET = async (request: NextRequest) => {
    const {searchParams} = new URL(request.url);
    const token_hash = searchParams.get('token_hash');
    const next = searchParams.get('next');
    const type = searchParams.get('type');
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
                    cookieStore.set({name, value: '', ...options})
                }
            }
        }
    );
    if (token_hash && type) {
        const {error} = await supabase.auth.verifyOtp({type: type as any, token_hash});
        if (!error) {
            return NextResponse.redirect(next ?? '/');
        }
    }
    return NextResponse.redirect('/error');
}
