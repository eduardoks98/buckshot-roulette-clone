// ==========================================
// AUDIO TRIMMER - Web Audio API based trimming
// Works in browser, no external dependencies!
// ==========================================

export interface TrimConfig {
  duration: number;      // Final duration in seconds
  fadeIn?: number;       // Fade in duration in seconds
  fadeOut?: number;      // Fade out duration in seconds
  start?: number;        // Start offset in seconds
  speed?: number;        // Playback speed (1.0 = normal, 1.5 = 50% faster)
}

export interface TrimResult {
  originalDuration: number;
  trimmedDuration: number;
  buffer: AudioBuffer;
  blob: Blob;
  url: string;
}

// Audio configs for all sound files
export const AUDIO_TRIM_CONFIGS: Record<string, TrimConfig> = {
  // SFX - Main sounds
  'sfx/shot-live.mp3': { duration: 0.4, fadeOut: 0.1 },
  'sfx/shot-blank.mp3': { duration: 0.12, fadeOut: 0.03 }, // Cut in half - original has 2 clicks
  'sfx/revolver-spin.mp3': { duration: 0.3, fadeOut: 0.08, speed: 1.3 },
  'sfx/revolver-cocking.mp3': { duration: 0.15, fadeOut: 0.03, speed: 1.5 },
  'sfx/damage.mp3': { duration: 0.4, fadeOut: 0.1 },
  'sfx/heal.mp3': { duration: 0.6, fadeIn: 0.05, fadeOut: 0.15 },
  'sfx/reload.mp3': { duration: 1.0, fadeIn: 0.05, fadeOut: 0.2 },
  'sfx/round-start.mp3': { duration: 1.2, fadeIn: 0.1, fadeOut: 0.3 },
  'sfx/round-win.mp3': { duration: 1.8, fadeIn: 0.1, fadeOut: 0.3 },
  'sfx/game-over-win.mp3': { duration: 2.5, fadeIn: 0.1, fadeOut: 0.4 },
  'sfx/game-over-lose.mp3': { duration: 2.5, fadeIn: 0.1, fadeOut: 0.4 },
  'sfx/turn-change.mp3': { duration: 0.6, fadeOut: 0.15 },
  'sfx/timer-warning.mp3': { duration: 0.4, fadeOut: 0.1 },

  // SFX - UI sounds
  'sfx/ui/click.mp3': { duration: 0.15, fadeOut: 0.05 },
  'sfx/ui/hover.mp3': { duration: 0.1, fadeOut: 0.03 },
  'sfx/ui/success.mp3': { duration: 0.5, fadeOut: 0.1 },
  'sfx/ui/error.mp3': { duration: 0.4, fadeOut: 0.1 },
  'sfx/ui/join-room.mp3': { duration: 0.5, fadeOut: 0.1 },
  'sfx/ui/leave-room.mp3': { duration: 0.4, fadeOut: 0.1 },

  // SFX - Items
  'sfx/items/magnifying-glass.mp3': { duration: 0.6, fadeOut: 0.15 },
  'sfx/items/cigarette.mp3': { duration: 0.8, fadeOut: 0.2 },
  'sfx/items/beer.mp3': { duration: 0.7, fadeOut: 0.15 },
  'sfx/items/handsaw.mp3': { duration: 0.5, fadeOut: 0.1 },
  'sfx/items/handcuffs.mp3': { duration: 0.6, fadeOut: 0.15 },
  'sfx/items/adrenaline.mp3': { duration: 0.6, fadeOut: 0.15 },
  'sfx/items/medicine.mp3': { duration: 0.7, fadeOut: 0.15 },
  'sfx/items/inverter.mp3': { duration: 0.5, fadeOut: 0.1 },
  'sfx/items/phone.mp3': { duration: 0.6, fadeOut: 0.15 },
  'sfx/items/turn-reverser.mp3': { duration: 0.5, fadeOut: 0.1 },
};

class AudioTrimmer {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private reverbBuffer: AudioBuffer | null = null;
  private reverbAmount: number = 0; // 0 = dry, 1 = full wet

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  /**
   * Generate impulse response for reverb effect
   * Creates a synthetic room reverb
   */
  private generateReverbImpulse(duration: number = 2, decay: number = 2): AudioBuffer {
    const ctx = this.getAudioContext();
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Exponential decay with random noise
        const t = i / sampleRate;
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - t / duration, decay);
      }
    }

    return impulse;
  }

  /**
   * Set reverb amount (0 = no reverb, 1 = full reverb)
   */
  setReverbAmount(amount: number): void {
    this.reverbAmount = Math.max(0, Math.min(1, amount));
  }

  /**
   * Get current reverb amount
   */
  getReverbAmount(): number {
    return this.reverbAmount;
  }

  /**
   * Load an audio file and return its AudioBuffer
   */
  async loadAudio(url: string): Promise<AudioBuffer> {
    const ctx = this.getAudioContext();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return ctx.decodeAudioData(arrayBuffer);
  }

  /**
   * Trim an audio buffer according to config
   */
  async trimAudio(audioBuffer: AudioBuffer, config: TrimConfig): Promise<AudioBuffer> {
    const ctx = this.getAudioContext();
    const { duration, fadeIn = 0, fadeOut = 0, start = 0, speed = 1.0 } = config;

    const sampleRate = audioBuffer.sampleRate;
    const numChannels = audioBuffer.numberOfChannels;

    // Calculate source duration considering speed
    const startSample = Math.floor(start * sampleRate);

    // Output samples (at original sample rate, but shorter if sped up)
    const outputSamples = Math.floor(duration * sampleRate);

    // Create output buffer
    const outputBuffer = ctx.createBuffer(numChannels, outputSamples, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);

      for (let i = 0; i < outputSamples; i++) {
        // Calculate source sample index with speed adjustment
        const sourceIndex = startSample + Math.floor(i * speed);

        // Get sample value (or 0 if out of bounds)
        let sample = sourceIndex < inputData.length ? inputData[sourceIndex] : 0;

        // Apply fade in
        const timeInSeconds = i / sampleRate;
        if (fadeIn > 0 && timeInSeconds < fadeIn) {
          sample *= timeInSeconds / fadeIn;
        }

        // Apply fade out
        const timeFromEnd = duration - timeInSeconds;
        if (fadeOut > 0 && timeFromEnd < fadeOut) {
          sample *= timeFromEnd / fadeOut;
        }

        outputData[i] = sample;
      }
    }

    return outputBuffer;
  }

  /**
   * Convert AudioBuffer to WAV Blob
   */
  audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const samples = buffer.length;
    const dataSize = samples * blockAlign;
    const bufferSize = 44 + dataSize;

    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    // WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write audio data
    let offset = 44;
    for (let i = 0; i < samples; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = buffer.getChannelData(channel)[i];
        const clampedSample = Math.max(-1, Math.min(1, sample));
        const intSample = clampedSample < 0
          ? clampedSample * 0x8000
          : clampedSample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Convert AudioBuffer to MP3 Blob using MediaRecorder
   * Note: This requires browser support for MP3 encoding
   * Falls back to WAV if MP3 not supported
   */
  async audioBufferToMp3(buffer: AudioBuffer): Promise<Blob> {
    // Check if MediaRecorder supports MP3
    const mimeType = MediaRecorder.isTypeSupported('audio/mpeg')
      ? 'audio/mpeg'
      : MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : null;

    if (!mimeType) {
      // Fall back to WAV
      console.warn('MP3/WebM encoding not supported, falling back to WAV');
      return this.audioBufferToWav(buffer);
    }

    const ctx = this.getAudioContext();
    const dest = ctx.createMediaStreamDestination();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(dest);

    const recorder = new MediaRecorder(dest.stream, { mimeType });
    const chunks: Blob[] = [];

    return new Promise((resolve) => {
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: mimeType }));
      };

      source.start(0);
      recorder.start();

      setTimeout(() => {
        recorder.stop();
        source.stop();
      }, buffer.duration * 1000 + 100);
    });
  }

  private writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  /**
   * Full trim process: load, trim, convert to blob
   */
  async processAudio(url: string, config: TrimConfig): Promise<TrimResult> {
    const originalBuffer = await this.loadAudio(url);
    const trimmedBuffer = await this.trimAudio(originalBuffer, config);
    const blob = this.audioBufferToWav(trimmedBuffer);
    const blobUrl = URL.createObjectURL(blob);

    return {
      originalDuration: originalBuffer.duration,
      trimmedDuration: trimmedBuffer.duration,
      buffer: trimmedBuffer,
      blob,
      url: blobUrl,
    };
  }

  /**
   * Play an AudioBuffer for preview with optional reverb
   */
  playBuffer(buffer: AudioBuffer): void {
    // Stop any currently playing audio
    this.stopPlayback();

    const ctx = this.getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Apply reverb if amount > 0
    if (this.reverbAmount > 0) {
      // Generate reverb impulse if not cached
      if (!this.reverbBuffer) {
        this.reverbBuffer = this.generateReverbImpulse(1.5, 2.5);
      }

      // Create convolver for reverb
      const convolver = ctx.createConvolver();
      convolver.buffer = this.reverbBuffer;

      // Create gain nodes for dry/wet mix
      const dryGain = ctx.createGain();
      const wetGain = ctx.createGain();

      // Set dry/wet levels
      dryGain.gain.value = 1 - (this.reverbAmount * 0.5); // Keep some dry signal
      wetGain.gain.value = this.reverbAmount * 0.7; // Reverb level

      // Connect: source -> dryGain -> destination
      //          source -> convolver -> wetGain -> destination
      source.connect(dryGain);
      dryGain.connect(ctx.destination);

      source.connect(convolver);
      convolver.connect(wetGain);
      wetGain.connect(ctx.destination);
    } else {
      source.connect(ctx.destination);
    }

    source.onended = () => {
      this.currentSource = null;
    };
    this.currentSource = source;
    source.start(0);
  }

  /**
   * Stop currently playing audio
   */
  stopPlayback(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // Ignore if already stopped
      }
      this.currentSource = null;
    }
  }

  /**
   * Check if audio is currently playing
   */
  isPlaying(): boolean {
    return this.currentSource !== null;
  }

  /**
   * Download a blob as a file
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const audioTrimmer = new AudioTrimmer();
