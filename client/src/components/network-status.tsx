import { useEffect, useState } from "react";
import { useMutationState } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff, Wifi, Loader2 } from "lucide-react";

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [showReconnectedMessage, setShowReconnectedMessage] = useState(false);
  
  const allMutations = useMutationState();
  const pausedMutations = allMutations.filter(m => m.state.isPaused);
  const pendingMutations = allMutations.filter(m => m.state.status === 'pending');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowReconnectedMessage(true);
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  useEffect(() => {
    if (showReconnectedMessage && pendingMutations.length === 0 && pausedMutations.length === 0) {
      const timer = setTimeout(() => setShowReconnectedMessage(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showReconnectedMessage, pendingMutations.length, pausedMutations.length]);

  if (isOnline && !showReconnectedMessage && pendingMutations.length === 0 && pausedMutations.length === 0) {
    return null;
  }

  const totalQueuedMutations = pausedMutations.length + pendingMutations.length;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md" data-testid="network-status-indicator">
      {!isOnline && (
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800" data-testid="alert-offline">
          <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            You're offline. Changes will sync when connection is restored.
            {pausedMutations.length > 0 && (
              <span className="block mt-1 text-xs">
                {pausedMutations.length} change{pausedMutations.length !== 1 ? 's' : ''} queued
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isOnline && totalQueuedMutations > 0 && (
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800" data-testid="alert-syncing">
          <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            Syncing {totalQueuedMutations} change{totalQueuedMutations !== 1 ? 's' : ''}...
          </AlertDescription>
        </Alert>
      )}

      {isOnline && showReconnectedMessage && totalQueuedMutations === 0 && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" data-testid="alert-synced">
          <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Back online! All changes synced.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
