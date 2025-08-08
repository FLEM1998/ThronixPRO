import { useEffect, useState } from "react";
import { notificationSounds } from "@/lib/notification-sounds";

export function useNotificationSounds() {
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    // Load settings from localStorage
    notificationSounds.loadSettings();
    setIsEnabled(notificationSounds.isEnabledState());

    // Resume audio context on user interaction
    const handleUserInteraction = () => {
      notificationSounds.resumeAudioContext();
      // Remove listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  const toggleSounds = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    notificationSounds.setEnabled(newState);
  };

  return {
    isEnabled,
    toggleSounds,
    playOrderFilled: () => notificationSounds.playOrderFilled(),
    playOrderAlert: () => notificationSounds.playOrderAlert(),
    playPriceAlert: () => notificationSounds.playPriceAlert(),
    playError: () => notificationSounds.playError(),
    playMessage: () => notificationSounds.playMessage(),
    playBotStarted: () => notificationSounds.playBotStarted(),
    playBotStopped: () => notificationSounds.playBotStopped(),
    playProfit: () => notificationSounds.playProfit(),
    playLoss: () => notificationSounds.playLoss(),
  };
}