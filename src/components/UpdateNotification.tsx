import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { RefreshCw, Download, X, AlertTriangle } from 'lucide-react';
import { pwaManager } from '../lib/pwa';
import { toast } from 'sonner';

interface UpdateNotificationProps {
  className?: string;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({ className }) => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [showForceUpdate, setShowForceUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{
    currentVersion?: string;
    requiresUpdate?: boolean;
  }>({});

  useEffect(() => {
    // Listen for regular update notifications
    const handleUpdateAvailable = () => {
      setShowUpdate(true);
    };

    // Listen for force update notifications
    const handleForceUpdateAvailable = (event: CustomEvent) => {
      setUpdateInfo(event.detail);
      setShowForceUpdate(true);
    };

    window.addEventListener('pwa-update-available', handleUpdateAvailable);
    window.addEventListener('pwa-force-update-available', handleForceUpdateAvailable as EventListener);

    return () => {
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
      window.removeEventListener('pwa-force-update-available', handleForceUpdateAvailable as EventListener);
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await pwaManager.applyUpdate();
      toast.success('Update applied successfully!');
    } catch (error) {
      console.error('Update failed:', error);
      toast.error('Update failed. Please refresh the page manually.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleForceUpdate = () => {
    // Clear cache and reload
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      }).finally(() => {
        (window as any).location.reload();
      });
    } else {
      (window as any).location.reload();
    }
  };

  const handleDismissUpdate = () => {
    setShowUpdate(false);
  };

  // Force update notification (cannot be dismissed)
  if (showForceUpdate) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-2xl border-orange-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              <div>
                <CardTitle className="text-lg text-orange-800">
                  Update Required
                </CardTitle>
                <CardDescription className="text-orange-600">
                  Version {updateInfo.currentVersion} is now available
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              <p className="mb-3">
                A new version of FinBuddy is available with important updates and security improvements.
              </p>
              <ul className="text-xs text-gray-500 space-y-1 mb-4">
                <li>• Enhanced security features</li>
                <li>• Performance improvements</li>
                <li>• Bug fixes and stability updates</li>
                <li>• New features and enhancements</li>
              </ul>
              <p className="text-orange-600 font-medium">
                The app will update automatically when you click "Update Now".
              </p>
            </div>
            <Button 
              onClick={handleForceUpdate}
              className="w-full"
              size="lg"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Update Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Regular update notification (can be dismissed)
  if (showUpdate) {
    return (
      <Card className={`fixed bottom-4 right-4 w-80 z-[60] shadow-lg border-blue-200 ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Update Available</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismissUpdate}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            A new version of FinBuddy is ready to install
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-600">
            <p className="mb-2">Get the latest features and improvements:</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Performance enhancements</li>
              <li>• Bug fixes</li>
              <li>• New features</li>
            </ul>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex-1"
              size="sm"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Update
                </>
              )}
            </Button>
            <Button 
              onClick={handleDismissUpdate}
              variant="outline"
              size="sm"
            >
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default UpdateNotification;
