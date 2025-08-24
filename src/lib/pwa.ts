 // PWA utilities for FinBuddy
export class PWAManager {
  private deferredPrompt: any = null;
  private isStandalone = false;
  private currentVersion = '2.5.5'; // Update this with each release
  private updateAvailable = false;

  constructor() {
    this.init();
  }

  private init() {
    // Check if app is running in standalone mode
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;
    
    // Register service worker
    this.registerServiceWorker();
    
    // Listen for install prompt
    this.setupInstallPrompt();
    
    // Setup offline detection
    this.setupOfflineDetection();
    
    // Check for version updates
    this.checkForVersionUpdate();
  }

  // Register service worker
  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          this.handleServiceWorkerUpdate(registration);
        });
        
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    }
  }

  // Handle service worker updates
  private handleServiceWorkerUpdate(registration: ServiceWorkerRegistration) {
    const newWorker = registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New content is available, show update notification
        this.updateAvailable = true;
        this.showUpdateNotification();
      }
    });
  }

  // Check for version updates
  private async checkForVersionUpdate() {
    try {
      // Get stored version
      const storedVersion = localStorage.getItem('finbuddy-app-version');
      
      // If no stored version or version mismatch, force update
      if (!storedVersion || storedVersion !== this.currentVersion) {
        console.log(`🔄 Version update detected: ${storedVersion} → ${this.currentVersion}`);
        
        // Store new version
        localStorage.setItem('finbuddy-app-version', this.currentVersion);
        
        // If this is an update (not first install)
        if (storedVersion && storedVersion !== this.currentVersion) {
          this.forceAppUpdate();
        }
      }
      
      // Check for server-side version updates every hour
      this.scheduleVersionCheck();
    } catch (error) {
      console.error('❌ Version check failed:', error);
    }
  }

  // Force app update
  private async forceAppUpdate() {
    console.log('🔄 Forcing app update...');
    
    try {
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Update service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      }
      
      // Show update notification
      this.showForceUpdateNotification();
      
    } catch (error) {
      console.error('❌ Force update failed:', error);
    }
  }

  // Show force update notification
  private showForceUpdateNotification() {
    const event = new CustomEvent('pwa-force-update-available', {
      detail: { 
        currentVersion: this.currentVersion,
        requiresUpdate: true 
      }
    });
    window.dispatchEvent(event);
  }

  // Schedule periodic version checks
  private scheduleVersionCheck() {
    // Check for updates every hour
    setInterval(() => {
      this.checkForVersionUpdate();
    }, 60 * 60 * 1000);
  }

  // Public method to manually check for updates
  public async checkForUpdates(): Promise<boolean> {
    await this.checkForVersionUpdate();
    return this.updateAvailable;
  }

  // Public method to apply pending updates
  public async applyUpdate(): Promise<void> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.waiting) {
        // Tell waiting service worker to activate
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        // Reload the page to use new version
        window.location.reload();
      }
    }
  }

  // Setup install prompt handling
  private setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      
      // Show custom install button/banner
      this.showInstallBanner();
    });

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('🎉 PWA installed successfully');
      this.hideInstallBanner();
      this.deferredPrompt = null;
      
      // Track installation
      this.trackInstallation();
    });
    
    // For development/testing - simulate install availability after a delay
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      setTimeout(() => {
        if (!this.deferredPrompt && !this.isStandalone) {
          console.log('🔧 Dev mode: Simulating install availability');
          this.showInstallBanner();
        }
      }, 2000);
    }
  }

  // Show install banner
  private showInstallBanner() {
    // Dispatch custom event for the app to show install UI
    const event = new CustomEvent('pwa-install-available', {
      detail: { canInstall: true }
    });
    window.dispatchEvent(event);
  }

  // Hide install banner
  private hideInstallBanner() {
    const event = new CustomEvent('pwa-install-completed');
    window.dispatchEvent(event);
  }

  // Show update notification
  private showUpdateNotification() {
    const event = new CustomEvent('pwa-update-available', {
      detail: { hasUpdate: true }
    });
    window.dispatchEvent(event);
  }

  // Setup offline detection
  private setupOfflineDetection() {
    const updateOnlineStatus = () => {
      const event = new CustomEvent('pwa-connection-change', {
        detail: { 
          isOnline: navigator.onLine,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(event);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initial status
    updateOnlineStatus();
  }

  // Public methods for app to use

  // Trigger install prompt
  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('❌ Install prompt not available - browser may not support PWA installation or criteria not met');
      
      // Dispatch event to show manual instructions
      const event = new CustomEvent('pwa-manual-install-needed', {
        detail: { 
          reason: 'Browser prompt not available',
          instructions: this.getManualInstallInstructions()
        }
      });
      window.dispatchEvent(event);
      
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const result = await this.deferredPrompt.userChoice;
      
      console.log('📱 Install prompt result:', result.outcome);
      
      if (result.outcome === 'accepted') {
        this.trackInstallation();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Install prompt failed:', error);
      return false;
    } finally {
      this.deferredPrompt = null;
    }
  }

  // Get manual installation instructions
  private getManualInstallInstructions() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      return 'Chrome: Look for the install icon in the address bar, or go to Settings → Install FinBuddy';
    } else if (userAgent.includes('firefox')) {
      return 'Firefox: This browser may not support PWA installation. Consider using Chrome or Edge.';
    } else if (userAgent.includes('safari')) {
      return 'Safari: Tap Share button → Add to Home Screen';
    } else if (userAgent.includes('edg')) {
      return 'Edge: Look for the install icon in the address bar, or go to Settings → Apps → Install FinBuddy';
    }
    
    return 'Look for an install option in your browser menu, or add this page to your home screen';
  }

  // Check if app can be installed
  public canInstall(): boolean {
    return !!this.deferredPrompt;
  }

  // Check if app is installed/standalone
  public isInstalled(): boolean {
    return this.isStandalone;
  }

  // Force service worker update
  public async updateApp(): Promise<void> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        window.location.reload();
      }
    }
  }

  // Get installation stats
  public getInstallationInfo() {
    return {
      canInstall: this.canInstall(),
      isInstalled: this.isInstalled(),
      isOnline: navigator.onLine,
      hasServiceWorker: 'serviceWorker' in navigator,
      userAgent: navigator.userAgent
    };
  }

  // Track installation for analytics
  private trackInstallation() {
    // Add to your analytics
    console.log('📊 PWA Installation tracked');
    
    // You can integrate with your analytics here
    // Example: gtag('event', 'pwa_install', { method: 'prompt' });
  }

  // Background sync for offline actions
  public async scheduleBackgroundSync(tag: string) {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register(tag);
        console.log(`🔄 Background sync scheduled: ${tag}`);
      } catch (error) {
        console.error('❌ Background sync failed:', error);
      }
    }
  }

  // Request notification permission
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('🔔 Notification permission:', permission);
      return permission;
    }
    return 'denied';
  }

  // Subscribe to push notifications
  public async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            // Add your VAPID public key here
            'YOUR_VAPID_PUBLIC_KEY'
          )
        });
        
        console.log('📱 Push subscription:', subscription);
        return subscription;
      } catch (error) {
        console.error('❌ Push subscription failed:', error);
        return null;
      }
    }
    return null;
  }

  // VAPID key conversion utility
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Create singleton instance
export const pwaManager = new PWAManager();
