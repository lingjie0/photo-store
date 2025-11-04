'use server';

import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

interface ActionResult {
    success: boolean;
    error?: string | unknown | null;
}

interface CookieStore {
    get(name: string): { value: string } | undefined;
    set(cookie: { name: string; value: string } & Record<string, any>): void;
}

export async function addOrRemoveFromFavorites(formData: FormData): Promise<ActionResult> {
    const photoName = formData.get('photoName') as string | null;
    const isFavorited = formData.get('isFavorited') as string | null;

    const cookieStore: CookieStore = await cookies();
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
    ) as ReturnType<typeof createServerClient>;

    const {data: {user}} = await supabase.auth.getUser();
    if (!user) {
        return {success: false, error: 'User is not authenticated'};
    }
    if (isFavorited === 'true') {
        const {error} = await supabase
            .from('favorites')
            .delete()
            .match({user_id: user.id, photo_name: photoName});
        if (error) {
            return {success: false, error}
        } 
    } else {
        const {error} = await supabase  
            .from('favorites')
            .insert([{user_id: user.id, photo_name: photoName}]);
        if (error) {
            return {success: false, error}
        } 
    }
    revalidatePath('/photos');
    revalidatePath('/favorites');

    return {success: true};
}