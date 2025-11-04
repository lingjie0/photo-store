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

export interface DeletePhotoResult {
    success: boolean;
    error?: unknown;
}

export interface CookieHandlers {
    get(name: string): string | undefined;
    set(name: string, value: string, options?: Record<string, unknown>): void;
    remove(name: string, options?: Record<string, unknown>): void;
}

export async function deletePhoto(formData: FormData): Promise<DeletePhotoResult> {
    const src = formData.get('photoPath') as string | null;
    const filePath = exrtactFilePath(src ?? '');

    const cookieStore = await cookies();

    // Validate env vars at runtime so we pass definite strings to createServerClient
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables', { supabaseUrl, supabaseAnonKey });
        return { success: false, error: new Error('Missing Supabase environment variables') };
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                get: (name: string) => cookieStore.get(name)?.value,
                set: (name: string, value: string, options?: Record<string, unknown>) => {
                    cookieStore.set({ name, value, ...options });
                },
                remove: (name: string, options?: Record<string, unknown>) => {
                    cookieStore.set({ name, value: '', ...options });
                }
            } as CookieHandlers
        }
    );
    const { error } = await supabase.storage.from('photos').remove([filePath]);
    console.log({ filePath });
    if (error) {
        return { success: false, error };
    }
    revalidatePath('/photos');
    revalidatePath('/favorites');
    return { success: true };
}