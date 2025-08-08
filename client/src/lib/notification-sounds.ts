// Notification sound system for trading platform
export class NotificationSounds {
  private static instance: NotificationSounds;
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    // Initialize AudioContext when first used to avoid autoplay restrictions
    this.initAudioContext();
  }

  static getInstance(): NotificationSounds {
    if (!NotificationSounds.instance) {
      NotificationSounds.instance = new NotificationSounds();
    }
    return NotificationSounds.instance;
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported', error);
    }
  }

  // Generate notification tones using Web Audio API
  private createTone(frequency: number, duration: number, type: OscillatorType = 'sine'): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audioContext || !this.isEnabled) {
        resolve();
        return;
      }

      try {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;

        // Envelope for smooth sound
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);

        oscillator.onended = () => resolve();
      } catch (error) {
        console.warn('Error playing notification sound', error);
        resolve();
      }
    });
  }

  // Play order filled notification
  async playOrderFilled() {
    if (!this.isEnabled) return;
    
    // Success tone: ascending notes
    await this.createTone(523.25, 0.15); // C5
    await this.createTone(659.25, 0.15); // E5
    await this.createTone(783.99, 0.2);  // G5
  }

  // Play order alert notification
  async playOrderAlert() {
    if (!this.isEnabled) return;
    
    // Alert tone: double beep
    await this.createTone(800, 0.1);
    await new Promise(resolve => setTimeout(resolve, 50));
    await this.createTone(800, 0.1);
  }

  // Play price alert notification
  async playPriceAlert() {
    if (!this.isEnabled) return;
    
    // Price alert: rising tone
    await this.createTone(440, 0.1);  // A4
    await this.createTone(554.37, 0.15); // C#5
    await this.createTone(659.25, 0.2);  // E5
  }

  // Play error notification
  async playError() {
    if (!this.isEnabled) return;
    
    // Error tone: descending notes
    await this.createTone(523.25, 0.15); // C5
    await this.createTone(415.30, 0.15); // G#4
    await this.createTone(349.23, 0.2);  // F4
  }

  // Play new message notification
  async playMessage() {
    if (!this.isEnabled) return;
    
    // Message tone: simple beep
    await this.createTone(800, 0.15);
  }

  // Play trading bot started notification
  async playBotStarted() {
    if (!this.isEnabled) return;
    
    // Bot started: quick ascending sequence
    await this.createTone(440, 0.08);   // A4
    await this.createTone(554.37, 0.08); // C#5
    await this.createTone(659.25, 0.12);  // E5
  }

  // Play trading bot stopped notification
  async playBotStopped() {
    if (!this.isEnabled) return;
    
    // Bot stopped: quick descending sequence
    await this.createTone(659.25, 0.08);  // E5
    await this.createTone(554.37, 0.08); // C#5
    await this.createTone(440, 0.12);   // A4
  }

  // Play profit notification
  async playProfit() {
    if (!this.isEnabled) return;
    
    // Profit sound: celebration tone
    await this.createTone(523.25, 0.1); // C5
    await this.createTone(659.25, 0.1); // E5
    await this.createTone(783.99, 0.1); // G5
    await this.createTone(1046.50, 0.15); // C6
  }

  // Play loss notification
  async playLoss() {
    if (!this.isEnabled) return;
    
    // Loss sound: somber tone
    await this.createTone(349.23, 0.2);  // F4
    await this.createTone(293.66, 0.25); // D4
  }

  // Enable/disable sounds
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    localStorage.setItem('thronix_sounds_enabled', enabled.toString());
  }

  // Get current sound state
  isEnabledState(): boolean {
    return this.isEnabled;
  }

  // Initialize from localStorage
  loadSettings() {
    const savedState = localStorage.getItem('thronix_sounds_enabled');
    if (savedState !== null) {
      this.isEnabled = savedState === 'true';
    }
  }

  // Resume audio context (required for user interaction)
  async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('Failed to resume audio context', error);
      }
    }
  }
}

// Export singleton instance
export const notificationSounds = NotificationSounds.getInstance();