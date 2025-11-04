'use client';

import { useState, type ChangeEvent } from "react";
import { supabase } from "../supabase-utils/supabaseClient";
import { useRouter } from "next/navigation";

export default function PhotoUploader() {
    const [uploading, setUploading] = useState(false);
    const router = useRouter();

    interface RevalidateBody { path: string; }
    interface SupabaseUser { id: string; }
    interface SupabaseAuthResponse { data: { user: SupabaseUser | null }; }

    async function handleFileUpload(event: ChangeEvent<HTMLInputElement>): Promise<void> {
        try {
            setUploading(true);
            const file: File | undefined = event.target.files?.[0];

            if (!file) {
                throw new Error('No file selected for upload');
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const {data: {user}} = await supabase.auth.getUser() as SupabaseAuthResponse;

            if (!user)  {
                throw new Error('user not authenticated for photo upload');
            }
            const filePath: string = `user_uploads/${user.id}/${fileName}`;
            const {error} = await supabase.storage.from('photos').upload(filePath, file) as { error: Error | null };

            if (error) {
                throw error;
            }

            await fetch('/api/revalidate', {
                method: "POST",
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({path: '/photos'} as RevalidateBody)
            });
            router.refresh();

        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    }

    return (
        <label 
        htmlFor="photo-upload"
        className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg m-4"
        >
        {uploading ? 'Uploading' : 'Upload Photo'}
        <input 
            type="file"
            id="photo-upload"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            />
        </label>
    );
}