import { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';
import './InstallPrompt.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Store the deferred prompt globally so we can access it even if component unmounts/remounts
export let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

// Export function to check if app is installed
export function isAppInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
}

// Export function to trigger install
export async function triggerInstall(): Promise<boolean> {
  const prompt = globalDeferredPrompt;
  if (!prompt) {
    return false;
  }
  
  prompt.prompt();
  const { outcome } = await prompt.userChoice;
  
  if (outcome === 'accepted') {
    globalDeferredPrompt = null;
    return true;
  }
  
  return false;
}

// Set up listener immediately when module loads (before component mounts)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    // Dispatch a custom event so components can react
    window.dispatchEvent(new CustomEvent('installpromptavailable'));
  });
}

interface InstallPromptProps {
  forceShow?: boolean;
  onForceShowChange?: (show: boolean) => void;
}

export function InstallPrompt({ forceShow: propForceShow = false, onForceShowChange }: InstallPromptProps = {}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [waitingForPrompt, setWaitingForPrompt] = useState(false);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Check if app is already installed
    if (isAppInstalled()) {
      setIsInstalled(true);
      return;
    }

    const devToolsForceShow = storage.getForceInstallPrompt();
    const shouldForceShow = propForceShow || devToolsForceShow;
    
    // Check if we already have a deferred prompt (from global or previous mount)
    if (globalDeferredPrompt && !deferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
    }
    
    // Always listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      globalDeferredPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(globalDeferredPrompt);
      setShowPrompt(true);
      setWaitingForPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check immediately if we should show (only once)
    if (!hasCheckedRef.current) {
      hasCheckedRef.current = true;
      
      // Check if we already have a prompt available
      if (globalDeferredPrompt) {
        setDeferredPrompt(globalDeferredPrompt);
        setWaitingForPrompt(false);
      }
      
      if (shouldForceShow) {
        // If forced, show immediately
        setShowPrompt(true);
        if (!globalDeferredPrompt && !deferredPrompt) {
          setWaitingForPrompt(true);
        } else {
          // We already have the prompt
          setWaitingForPrompt(false);
        }
      } else {
        // Check if user has dismissed the prompt recently
        const dismissedTime = storage.getInstallPromptDismissed();
        const now = Date.now();
        const DAY_IN_MS = 24 * 60 * 60 * 1000;
        
        // Show prompt if not dismissed in the last 7 days and we have a deferred prompt
        // OR if forceShow is true
        if (shouldForceShow || (globalDeferredPrompt && (!dismissedTime || (now - dismissedTime > 7 * DAY_IN_MS)))) {
          setShowPrompt(true);
        }
      }
    }
    
    // Listen for custom event to update when prompt becomes available
    const handleCustomEvent = () => {
      if (globalDeferredPrompt && !deferredPrompt) {
        setDeferredPrompt(globalDeferredPrompt);
        setWaitingForPrompt(false);
      }
    };
    window.addEventListener('installpromptavailable', handleCustomEvent);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('installpromptavailable', handleCustomEvent);
    };
  }, [deferredPrompt]);

  // Separate effect to handle waiting timeout
  useEffect(() => {
    if (waitingForPrompt) {
      const timeout = setTimeout(() => {
        setWaitingForPrompt(false);
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [waitingForPrompt]);

  const handleInstallClick = async () => {
    // Check global prompt if local state doesn't have it
    const promptToUse = deferredPrompt || globalDeferredPrompt;
    
    if (!promptToUse) {
      // No browser prompt available
      // Stop waiting since user clicked (or timeout already cleared it)
      setWaitingForPrompt(false);
      
      const devToolsForceShow = storage.getForceInstallPrompt();
      const shouldForceShow = propForceShow || devToolsForceShow;
      if (shouldForceShow) {
        // Check if Safari (which doesn't support beforeinstallprompt)
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        if (isSafari) {
          alert('Safari doesn\'t support the beforeinstallprompt event.\n\n' +
                'To install on Safari:\n' +
                '1. Tap the Share button\n' +
                '2. Select "Add to Home Screen"\n\n' +
                'For testing, try Chrome or Edge which support PWA installation prompts.');
        } else {
          alert('Browser install prompt not available. This might be because:\n\n' +
                '• The app doesn\'t meet installability criteria (check manifest.json and service worker)\n' +
                '• You need to interact with the page first\n' +
                '• The browser hasn\'t determined the app is installable yet\n\n' +
                'Try:\n' +
                '• Refreshing the page\n' +
                '• Checking browser console for errors\n' +
                '• Ensuring you\'re on HTTPS or localhost\n' +
                '• Verifying manifest.json and service worker are working');
        }
      }
      return;
    }

    // Show the install prompt
    promptToUse.prompt();

    // Wait for the user to respond
    const { outcome } = await promptToUse.userChoice;

    const devToolsForceShow = storage.getForceInstallPrompt();
    const shouldForceShow = propForceShow || devToolsForceShow;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowPrompt(false);
      // Clear force flag if install was successful
      if (shouldForceShow) {
        if (propForceShow && onForceShowChange) {
          onForceShowChange(false);
        }
        if (devToolsForceShow) {
          storage.setForceInstallPrompt(false);
        }
      }
    } else {
      // User dismissed, remember for 7 days
      storage.setInstallPromptDismissed(Date.now());
      setShowPrompt(false);
      // Clear force flag if dismissed
      if (shouldForceShow) {
        if (propForceShow && onForceShowChange) {
          onForceShowChange(false);
        }
        if (devToolsForceShow) {
          storage.setForceInstallPrompt(false);
        }
      }
    }

    globalDeferredPrompt = null;
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    storage.setInstallPromptDismissed(Date.now());
    setShowPrompt(false);
    // Clear force flag if it was forced
    if (propForceShow && onForceShowChange) {
      onForceShowChange(false);
    }
    if (storage.getForceInstallPrompt()) {
      storage.setForceInstallPrompt(false);
    }
  };

    const devToolsForceShow = storage.getForceInstallPrompt();
    const shouldForceShow = propForceShow || devToolsForceShow;
    const disablePrompt = storage.getDisableInstallPrompt();
    
    // Update parent component when force show changes (always call hooks in same order)
    useEffect(() => {
      if (onForceShowChange && propForceShow) {
        onForceShowChange(true);
      }
    }, [propForceShow, onForceShowChange]);
    
    // Don't show if:
    // - App is already installed
    // - User has disabled the prompt (unless forced)
    // - Not showing and not forced
    if (isInstalled || (disablePrompt && !shouldForceShow) || (!showPrompt && !shouldForceShow)) {
      return null;
    }

  return (
    <>
      <div className="install-prompt-backdrop" onClick={handleDismiss}></div>
      <div className="install-prompt">
        <div className="install-prompt-content">
        <div className="install-prompt-icon">
          <img 
            src={`${import.meta.env.BASE_URL}pwa-192x192.png`} 
            alt="VeloKit"
            className="install-prompt-app-icon"
          />
        </div>
        <div className="install-prompt-text">
          <strong>Install VeloKit</strong>
          <p>Add to your home screen for quick access</p>
        </div>
        <div className="install-prompt-actions">
          <button 
            className="btn btn-primary install-prompt-btn"
            onClick={handleInstallClick}
            disabled={waitingForPrompt}
          >
            {waitingForPrompt ? 'Waiting...' : 'Install'}
          </button>
          <button 
            className="btn btn-secondary install-prompt-btn"
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            Not now
          </button>
        </div>
        </div>
      </div>
    </>
  );
}

