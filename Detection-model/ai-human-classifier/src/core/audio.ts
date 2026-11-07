/**
 * Web Audio API synthesizer for mechanical thermal printer roller and stamp sounds.
 * Generates tactile audio without any external audio asset dependencies.
 */

class PrinterAudio {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Sound of stepper motor roller stepping paper forward (click-whir-click)
   */
  public playRollerFeed(durationMs: number = 800) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const count = Math.floor(durationMs / 45);

      for (let i = 0; i < count; i++) {
        const stepTime = now + (i * 0.045);
        
        // High frequency mechanical tooth click
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320 + (i % 3) * 60, stepTime);
        osc.frequency.exponentialRampToValueAtTime(80, stepTime + 0.025);
        
        gain.gain.setValueAtTime(0.08, stepTime);
        gain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.025);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(stepTime);
        osc.stop(stepTime + 0.03);
      }

      // Low frequency motor resonance hum
      const humOsc = this.ctx.createOscillator();
      const humGain = this.ctx.createGain();
      humOsc.type = 'sawtooth';
      humOsc.frequency.setValueAtTime(110, now);
      
      humGain.gain.setValueAtTime(0.03, now);
      humGain.gain.linearRampToValueAtTime(0.05, now + 0.1);
      humGain.gain.linearRampToValueAtTime(0.001, now + (durationMs / 1000));
      
      humOsc.connect(humGain);
      humGain.connect(this.ctx.destination);
      
      humOsc.start(now);
      humOsc.stop(now + (durationMs / 1000));
    } catch {
      // Audio autoplay policy or unavailable
    }
  }

  /**
   * Heavy mechanical stamp impact when the [ HUMAN WRITTEN ] or [ AI GENERATED ] ink hits paper
   */
  public playStampThump() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      
      // Low punchy thump
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.14);
      
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.16);

      // Spring snap / metallic clack
      const clack = this.ctx.createOscillator();
      const clackGain = this.ctx.createGain();
      clack.type = 'square';
      clack.frequency.setValueAtTime(880, now);
      clack.frequency.exponentialRampToValueAtTime(220, now + 0.04);
      
      clackGain.gain.setValueAtTime(0.12, now);
      clackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      
      clack.connect(clackGain);
      clackGain.connect(this.ctx.destination);
      
      clack.start(now);
      clack.stop(now + 0.05);
    } catch {
      // Audio autoplay policy
    }
  }

  /**
   * Paper tear sound effect for detaching the perforated slip
   */
  public playPaperTear() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const bufferSize = this.ctx.sampleRate * 0.18;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch {
      // Audio policy
    }
  }

  /**
   * Rotary switch click sound when changing .pth checkpoint
   */
  public playSwitchClick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.02);
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.03);
    } catch {
      // Audio policy
    }
  }
}

export const printerAudio = new PrinterAudio();

