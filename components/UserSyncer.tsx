'use client';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { createOrUpdateUser } from '@/lib/supabase-storage';

export default function UserSyncer() {
    const { user, isLoaded } = useUser();
    const [synced, setSynced] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        if (!isLoaded || !user || synced) return;

        const syncUser = async () => {
            try {
                setError(null);
                console.log('Syncing user:', user.id);

                // Ensure we have required user data before syncing
                if (!user.emailAddresses?.[0]?.emailAddress) {
                    throw new Error('User email not available yet');
                }

                await createOrUpdateUser(user as any);
                setSynced(true);
                setRetryCount(0);
                console.log('User synced successfully');
            } catch (err) {
                // Better error logging and serialization
                const errorMessage = err instanceof Error ? err.message : 'Unknown sync error';
                const errorStack = err instanceof Error ? err.stack : undefined;
                const errorDetails = {
                    message: errorMessage,
                    stack: errorStack,
                    userId: user?.id,
                    userEmail: user?.emailAddresses?.[0]?.emailAddress,
                    timestamp: new Date().toISOString()
                };

                console.error('Sync error details:', errorDetails);
                console.error('Original error object:', err);

                setError(errorMessage);

                // Retry with exponential backoff, max 3 retries
                if (retryCount < 3) {
                    const retryDelay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
                    console.log(`Retrying user sync in ${retryDelay}ms (attempt ${retryCount + 1}/3)`);
                    setTimeout(() => {
                        setRetryCount(prev => prev + 1);
                        setSynced(false);
                        setError(null);
                    }, retryDelay);
                } else {
                    console.error('Max retry attempts reached for user sync');
                }
            }
        };

        syncUser();
    }, [isLoaded, user, synced, retryCount]);

    // Show error notification only in development
    if (process.env.NODE_ENV === 'development' && error) {
        return (
            <div className="fixed bottom-4 right-4 bg-red-500/90 text-white p-3 rounded-lg text-sm max-w-xs z-50">
                <strong>Sync Error ({retryCount}/3):</strong> {error}
                {retryCount >= 3 && (
                    <div className="mt-1 text-xs opacity-80">
                        Max retries reached. Check console for details.
                    </div>
                )}
            </div>
        );
    }

    return null;
}
