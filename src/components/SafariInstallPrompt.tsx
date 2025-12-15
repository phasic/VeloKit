import './InstallPrompt.css';

interface SafariInstallPromptProps {
  onDismiss: () => void;
}

export function SafariInstallPrompt({ onDismiss }: SafariInstallPromptProps) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isMacOS = /Macintosh/.test(navigator.userAgent);

  return (
    <>
      <div className="install-prompt-backdrop" onClick={onDismiss}></div>
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
            <p>
              {isIOS ? (
                <>
                  To install on iOS:<br />
                  1. Tap the Share button (square with arrow)<br />
                  2. Scroll down and tap "Add to Home Screen"<br />
                  3. Tap "Add" to confirm
                </>
              ) : isMacOS ? (
                <>
                  To install on macOS Safari:<br />
                  1. Click the Share button in the Safari toolbar<br />
                  2. Select "Add to Dock" or "Add to Home Screen"<br />
                  3. The app will be available from your Dock or Launchpad
                </>
              ) : (
                <>
                  To install on Safari:<br />
                  1. Click the Share button<br />
                  2. Select "Add to Home Screen"<br />
                  3. Confirm the installation
                </>
              )}
            </p>
          </div>
          <div className="install-prompt-actions">
            <button 
              className="btn btn-primary install-prompt-btn"
              onClick={onDismiss}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </>
  );
}



