'use client';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { createOrUpdateUser } from '@/lib/supabase-storage';

export default function UserSyncer() {
    const { user, isLoaded } = useUser();
    const [synced, setSynced] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoaded || !user || synced) return;

        const syncUser = async () => {
            try {
                setError(null);
                // Convert UserResource to the expected User format
                const userForSync = {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    emailAddresses: user.emailAddresses,
                    imageUrl: user.imageUrl,
                };
                await createOrUpdateUser(userForSync as any);
                setSynced(true);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown sync error';
                setError(errorMessage);

                // Retry after 5 seconds on error
                setTimeout(() => {
                    setSynced(false);
                    setError(null);
                }, 5000);
            }
        };

        syncUser();
    }, [isLoaded, user, synced]);

    // Show error notification only in development
    if (process.env.NODE_ENV === 'development' && error) {
        return (
            <div className="fixed bottom-4 right-4 bg-red-500/90 text-white p-3 rounded-lg text-sm max-w-xs z-50">
                <strong>Sync Error:</strong> {error}
            </div>
        );
    }

    return null;
}
