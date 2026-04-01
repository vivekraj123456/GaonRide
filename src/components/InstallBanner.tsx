import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const InstallBanner: React.FC = () => {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem('gaonride-install-dismissed');
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Also show for mobile browsers that don't fire beforeinstallprompt (Safari)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && !isStandalone && !dismissed) {
      setTimeout(() => setShow(true), 3000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
    setShow(false);
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('gaonride-install-dismissed', '1');
  };

  if (!show) return null;

  return (
    <div className="install-banner">
      <div className="install-banner-content">
        <Download size={20} />
        <span>📲 Add <strong>GaonRide</strong> to your home screen for quick access!</span>
      </div>
      <div className="install-banner-actions">
        <button className="btn btn-sm btn-accent" onClick={handleInstall}>Install</button>
        <button className="install-banner-close" onClick={dismiss} aria-label="Dismiss">
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default InstallBanner;
