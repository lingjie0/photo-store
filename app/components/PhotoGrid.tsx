import { createServerClient } from "@supabase/ssr";
import Photo from "./Photo";
import { cookies } from "next/headers";
type SupabaseServer = ReturnType<typeof createServerClient>;
type SupabaseUser = { id: string } | null;

async function fetchUserPhotos(user: SupabaseUser, supabaseServer: SupabaseServer) {
    if (!user) return;
    const folderPath = `user_uploads/${user.id}`;
    const { data, error } = await supabaseServer.storage.from('photos').list(folderPath);

    if (error) {
        console.error('Error fetching photos', error);
        return;
    }
    return data;
}

async function getPhotoUrls(photos: { name: string }[] = [], user: SupabaseUser, supabaseServer: SupabaseServer) {
    if (!user) return [];
    return Promise.all(photos.map(async (photo) => {
        const { data, error } = await supabaseServer.storage.from('photos')
            .createSignedUrl(`user_uploads/${user.id}/${photo.name}`, 60 * 60);
        if (error) {
            console.log('Error generating signed url', error);
            return null;
        }
        return { url: data.signedUrl, photoName: photo.name };
    }));
}

async function fetchFavoritePhotos(user: SupabaseUser, supabaseServer: SupabaseServer) {
    if (!user) return [];
    const { data, error } = await supabaseServer
        .from('favorites')
        .select('photo_name')
        .eq('user_id', user.id);
    if (error) {
        console.error('Error fetching favorites', error);
        return [];
    }
    return (data || []).map((favorite: any) => favorite.photo_name);
};
export default async function PhotoGrid({favorites = false}) {
    const cookieStore = await cookies();
    const supabaseServer = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL as string,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  as string,
            {
                cookies: {
                    get: (name) => cookieStore.get(name)?.value,
    
                }
            }
        );
    const {data: {user}} = await supabaseServer.auth?.getUser();
    const photos = await fetchUserPhotos(user, supabaseServer);
    const photoObjects = await getPhotoUrls(photos, user, supabaseServer);
    const favoritePhotoNames = await fetchFavoritePhotos(user, supabaseServer);
    const photoWithFavorites = photoObjects.map((photo) => ({
        ...photo,
        isFavorited: favoritePhotoNames.includes(photo?.photoName)
    }));
    const displayedPhotos = favorites ? photoWithFavorites.filter(photo => photo.isFavorited) : photoWithFavorites;

    return (
        <div className="flex flex-wrap justify-center gap-4">
            {displayedPhotos.map((photo) => 
                <Photo 
                    key={photo.photoName}
                    src={photo.url}
                    alt={`Photo ${photo.photoName}`}
                    width={200}
                    height={200}
                    photoName={photo.photoName as string}
                    isFavorited={photo.isFavorited}
                />
            )}
        </div>
    );
}