import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Download, X, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { pwaManager } from '../lib/pwa';

interface PWAPromptProps {
  className?: string;
}

export const PWAInstallPrompt: React.FC<PWAPromptProps> = ({ className }) => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isStandalone);
    
    // Check if user has dismissed the prompt in this session
    const hasUserDismissed = sessionStorage.getItem('pwa-install-dismissed') === 'true';
    
    // Only show install prompt if not installed and user hasn't dismissed it
    if (!isStandalone && !hasUserDismissed) {
      // Check if PWA is installable (Chrome)
      if ('serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window) {
        setCanInstall(true);
        setShowPrompt(true);
      } else {
        // For other browsers, show manual install guide
        setShowPrompt(true);
      }
    }

    // Listen for PWA events
    const handleInstallAvailable = () => {
      if (!hasUserDismissed) {
        setCanInstall(true);
        setShowPrompt(true);
      }
    };

    const handleInstallCompleted = () => {
      setCanInstall(false);
      setIsInstalled(true);
      setShowPrompt(false);
      sessionStorage.removeItem('pwa-install-dismissed');
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-install-completed', handleInstallCompleted);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-install-completed', handleInstallCompleted);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await pwaManager.promptInstall();
      if (success) {
        setShowPrompt(false);
      } else {
        // Open the installation guide page
        window.open('/install-guide.html', '_blank');
      }
    } catch (error) {
      console.error('Install failed:', error);
      // Open the installation guide page
      window.open('/install-guide.html', '_blank');
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal in session storage so it doesn't show again this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || isInstalled) {
    return null;
  }

  return (
    <Card className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 shadow-lg ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Install FinBuddy
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Install FinBuddy for quick access and offline functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <ul className="space-y-1">
              <li>• Works offline</li>
              <li>• Quick access from home screen</li>
              <li>• Native app experience</li>
            </ul>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleInstall} 
              disabled={isInstalling}
              className="flex-1"
            >
              {isInstalling ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Install
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleDismiss}>
              Later
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const PWAUpdatePrompt: React.FC<PWAPromptProps> = ({ className }) => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handleUpdateAvailable = () => {
      setHasUpdate(true);
      setShowPrompt(true);
    };

    window.addEventListener('pwa-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await pwaManager.updateApp();
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt || !hasUpdate) {
    return null;
  }

  return (
    <Card className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 shadow-lg bg-card border-border ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <RefreshCw className="h-5 w-5 text-primary" />
            Update Available
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-muted-foreground">
          A new version of FinBuddy is available
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button 
            onClick={handleUpdate} 
            disabled={isUpdating}
            className="flex-1"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Update Now
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleDismiss}>
            Later
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const PWAConnectionStatus: React.FC<PWAPromptProps> = ({ className }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleConnectionChange = (event: CustomEvent) => {
      const { isOnline: online } = event.detail;
      setIsOnline(online);
      setShowStatus(true);
      
      // Hide status after 3 seconds if online
      if (online) {
        setTimeout(() => setShowStatus(false), 3000);
      }
    };

    window.addEventListener('pwa-connection-change', handleConnectionChange as EventListener);

    return () => {
      window.removeEventListener('pwa-connection-change', handleConnectionChange as EventListener);
    };
  }, []);

  if (!showStatus) {
    return null;
  }

  return (
    <Card className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 shadow-lg bg-card border-border ${className}`}>
      <CardContent className="p-3">
        <div className={`flex items-center gap-2 text-sm font-medium ${
          isOnline ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
        }`}>
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4" />
              Back online
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              You're offline
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
