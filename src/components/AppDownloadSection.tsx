import { Download, Smartphone, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import zenkaLogo from "@/assets/zenka-logo.png";

const AppDownloadSection = () => {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();

  const handleInstallClick = async () => {
    if (isInstallable) {
      await installApp();
    }
  };

  return (
    <div className="w-full bg-card rounded-2xl shadow-card p-6 md:p-8 mt-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">Download App & Apply for a Loan</h3>
            <p className="text-muted-foreground text-sm">Install our app for quick access anytime</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {isInstalled ? (
            <Button 
              variant="outline" 
              className="bg-green-500/10 border-green-500/30 text-green-600 hover:bg-green-500/20 cursor-default"
              disabled
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              App Installed
            </Button>
          ) : isInstallable ? (
            <Button 
              onClick={handleInstallClick}
              className="bg-foreground text-background hover:bg-foreground/90 rounded-xl px-6 py-3 h-auto"
            >
              <Download className="w-5 h-5 mr-2" />
              <div className="text-left">
                <div className="text-xs opacity-80">Install now</div>
                <div className="font-bold">Zenka</div>
              </div>
            </Button>
          ) : (
            <>
              {/* Android Download Button */}
              <Button 
                onClick={handleInstallClick}
                className="bg-foreground text-background hover:bg-foreground/90 rounded-xl px-5 py-3 h-auto"
              >
                <img src={zenkaLogo} alt="Zenka" className="w-6 h-6 mr-2" />
                <div className="text-left">
                  <div className="text-xs opacity-80">Download app</div>
                  <div className="font-bold">for Android</div>
                </div>
              </Button>

              {/* iOS Download Button */}
              <Button 
                onClick={handleInstallClick}
                className="bg-foreground text-background hover:bg-foreground/90 rounded-xl px-5 py-3 h-auto"
              >
                <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs opacity-80">Download on the</div>
                  <div className="font-bold">App Store</div>
                </div>
              </Button>
            </>
          )}
        </div>
      </div>

      {!isInstalled && !isInstallable && (
        <p className="text-center text-muted-foreground text-xs mt-4">
          Use Chrome, Edge, or Safari on mobile to install. Add to home screen for the best experience.
        </p>
      )}
    </div>
  );
};

export default AppDownloadSection;
