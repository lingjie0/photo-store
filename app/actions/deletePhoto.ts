'use server';

import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

function exrtactFilePath(url: string) {
    const parts = url.split('/user_uploads/');
    if (parts.length < 2) {
        console.error('Invalid URL format');
        return '';
    }
    let filePath = parts[1];
    if (filePath.includes('?')) {
        filePath = filePath.split('?')[0];
    }
    return `user_uploads/${filePath}`;
}

export async function deletePhoto(formData) {
    const src  = formData.get('photoPath');
    const filePath = exrtactFilePath(src);

    const cookieStore = await cookies();
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
    const {error} = await supabase.storage.from('photos').remove([filePath]);
    console.log({filePath});
    if (error) {
        return {success: false, error};
    }
    revalidatePath('/photos');
    revalidatePath('/favorites');
    return {success: true};
}