import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Download, X, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { pwaManager } from '../lib/pwa';

interface PWAPromptProps {
  className?: string;
  user?: any; // User object from AuthContext
}

export const PWAInstallPrompt: React.FC<PWAPromptProps> = ({ className, user }) => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isStandalone);
    
    // Only proceed if user is logged in
    if (!user) {
      setShowPrompt(false);
      return;
    }
    
    // Check if user has already been shown the install prompt or dismissed it
    const hasSeenInstallPrompt = localStorage.getItem('finbuddy-pwa-install-prompt-shown') === 'true';
    const hasDismissedPrompt = localStorage.getItem('finbuddy-pwa-install-dismissed') === 'true';
    const hasCompletedInstall = localStorage.getItem('finbuddy-pwa-install-completed') === 'true';
    
    // Debug logging
    console.log('PWA Prompt Check:', {
      isStandalone,
      hasUser: !!user,
      hasSeenInstallPrompt,
      hasDismissedPrompt,
      hasCompletedInstall
    });
    
    // Only show install prompt if:
    // 1. Not running as PWA
    // 2. User is logged in
    // 3. User hasn't seen the prompt before
    // 4. User hasn't dismissed the prompt before
    // 5. User hasn't completed installation before
    const shouldShowPrompt = !isStandalone && user && !hasSeenInstallPrompt && !hasDismissedPrompt && !hasCompletedInstall;
    
    if (shouldShowPrompt) {
      setShowPrompt(true);
      // Mark that we've shown the prompt to this user
      localStorage.setItem('finbuddy-pwa-install-prompt-shown', 'true');
      localStorage.setItem('finbuddy-pwa-install-prompt-date', new Date().toISOString());
      console.log('PWA prompt shown and marked in localStorage');
    } else {
      setShowPrompt(false);
      console.log('PWA prompt not shown due to conditions');
    }

    // Listen for PWA events
    const handleInstallAvailable = () => {
      setCanInstall(true);
      // Re-check conditions when install becomes available
      const currentHasSeenPrompt = localStorage.getItem('finbuddy-pwa-install-prompt-shown') === 'true';
      const currentHasDismissed = localStorage.getItem('finbuddy-pwa-install-dismissed') === 'true';
      const currentHasCompleted = localStorage.getItem('finbuddy-pwa-install-completed') === 'true';
      
      // Only show if user is logged in and hasn't seen/dismissed prompt before
      if (user && !currentHasSeenPrompt && !currentHasDismissed && !currentHasCompleted) {
        setShowPrompt(true);
        localStorage.setItem('finbuddy-pwa-install-prompt-shown', 'true');
        localStorage.setItem('finbuddy-pwa-install-prompt-date', new Date().toISOString());
        console.log('PWA prompt shown on install available event');
      }
    };

    const handleInstallCompleted = () => {
      setCanInstall(false);
      setIsInstalled(true);
      setShowPrompt(false);
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-install-completed', handleInstallCompleted);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-install-completed', handleInstallCompleted);
    };
  }, [user]); // Add user to dependency array

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await pwaManager.promptInstall();
      if (success) {
        setShowPrompt(false);
        // Mark as installed so it doesn't show again
        localStorage.setItem('finbuddy-pwa-install-completed', 'true');
        localStorage.setItem('finbuddy-pwa-install-completed-date', new Date().toISOString());
        console.log('PWA installation completed and marked in localStorage');
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
    // Mark that user has dismissed the prompt, so it won't show again
    localStorage.setItem('finbuddy-pwa-install-dismissed', 'true');
    localStorage.setItem('finbuddy-pwa-install-dismissed-date', new Date().toISOString());
    console.log('PWA prompt dismissed and marked in localStorage');
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
          isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
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
