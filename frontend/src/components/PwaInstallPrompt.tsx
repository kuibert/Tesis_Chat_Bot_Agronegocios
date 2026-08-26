import React, { useEffect, useState } from "react";
import { Download, WifiOff, CheckCircle2 } from "lucide-react";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar si ya está instalado en modo standalone
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      {isOffline && (
        <div className="badge badge-error gap-1.5 text-xs font-semibold py-3 px-3 shadow-sm animate-pulse text-white">
          <WifiOff className="size-3.5" />
          Modo Offline (PWA)
        </div>
      )}

      {isInstalled && !isOffline && (
        <div className="badge badge-success badge-outline gap-1 text-[11px] font-medium py-2 px-2.5 shadow-sm" title="AgroBot está funcionando como app nativa PWA">
          <CheckCircle2 className="size-3" />
          <span className="hidden md:inline">App PWA Activa</span>
        </div>
      )}

      {!isInstalled && (
        <button
          onClick={async () => {
            if (deferredPrompt) {
              deferredPrompt.prompt();
              const { outcome } = await deferredPrompt.userChoice;
              if (outcome === "accepted") {
                setIsInstalled(true);
                setDeferredPrompt(null);
              }
            } else {
              alert(
                "📲 Para instalar AgroBot como App:\n\n1. En Chrome/Edge (PC): Haz clic en el ícono de monitor/descarga 🖥️⬇️ o (+) en el extremo derecho de tu barra de direcciones URL arriba.\n\n2. En Android (Chrome): Toca el menú (⋮) y selecciona 'Instalar aplicación' o 'Agregar a la pantalla principal'.\n\n3. En iPhone (Safari): Toca el botón Compartir (cuadro con flecha) y elige 'Agregar a inicio'."
              );
            }
          }}
          className="btn btn-xs sm:btn-sm btn-success text-white font-semibold gap-1.5 shadow-md hover:scale-105 transition-all duration-200 cursor-pointer"
          title="Instalar AgroBot en tu celular o computadora para acceso offline"
        >
          <Download className="size-3.5" />
          <span className="hidden sm:inline">Instalar App</span>
        </button>
      )}
    </div>
  );
}
