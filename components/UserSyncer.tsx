'use client';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function UserSyncer() {
    const { user, isLoaded } = useUser();
    const [synced, setSynced] = useState(false);

    useEffect(() => {
        if (!isLoaded || !user || synced) return;

        (async () => {
            const email = user.emailAddresses[0]?.emailAddress || '';
            const bucketPrefix = `user-${user.id}`;
            
            const { error } = await supabase
                .from('users')
                .upsert({
                    clerk_id: user.id,
                    email,
                    first_name: user.firstName || '',
                    last_name: user.lastName || '',
                    image_url: user.imageUrl || '',
                    bucket_prefix: bucketPrefix,
                    storage_quota: 5 * 1024 * 1024 * 1024, // 5GB
                    storage_used: 0,
                });
            
            if (!error) {
                setSynced(true);
                console.log('User synced to Supabase successfully');
            } else {
                console.error('Supabase sync error:', error);
            }
        })();
    }, [isLoaded, user, synced]);

    return null;
}
