// ==========================================
// SOUND MANAGER - Singleton para gerenciar audio
// Usa Web Audio API para trim em tempo real
// ==========================================

export type SoundName =
  | 'shot-live' | 'shot-blank' | 'revolver-spin' | 'revolver-cocking' | 'damage' | 'heal' | 'reload'
  | 'turn-change' | 'round-start' | 'round-win' | 'game-over-win' | 'game-over-lose'
  | 'timer-warning'
  | 'item-magnifying-glass' | 'item-beer' | 'item-cigarette' | 'item-handcuffs'
  | 'item-handsaw' | 'item-phone' | 'item-inverter' | 'item-adrenaline'
  | 'item-medicine' | 'item-turn-reverser'
  // UI Sounds
  | 'ui-click' | 'ui-hover' | 'ui-success' | 'ui-error' | 'ui-join-room' | 'ui-leave-room';

export type MusicName = 'ambient-menu' | 'ambient-game';

interface SoundConfig {
  volume?: number;  // 0-1
  loop?: boolean;
}

// Configurações de trim para sons específicos
interface TrimConfig {
  duration: number;
  fadeIn?: number;
  fadeOut?: number;
  start?: number;
  speed?: number;
}

// Sons que precisam de trim em tempo real
const TRIM_CONFIGS: Partial<Record<SoundName, TrimConfig>> = {
  'revolver-spin': { duration: 0.3, fadeOut: 0.08, speed: 1.3 },
  'revolver-cocking': { duration: 0.5, fadeOut: 0.03, speed: 1.5 },
  'shot-blank': { duration: 0.12, fadeOut: 0.03 },
};

class SoundManager {
  private static instance: SoundManager;
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private music: Map<string, HTMLAudioElement> = new Map();
  private currentMusic: HTMLAudioElement | null = null;
  private currentMusicName: MusicName | null = null;
  private enabled: boolean = true;
  private musicEnabled: boolean = true;
  private volume: number = 0.7;
  private musicVolume: number = 0.3;

  // Web Audio API para sons com trim
  private audioContext: AudioContext | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private trimmedBuffers: Map<string, AudioBuffer> = new Map();

  private constructor() {
    this.loadSettings();
    this.preloadSounds();
    this.preloadMusic();
    this.preloadTrimmedSounds();
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  private async preloadTrimmedSounds(): Promise<void> {
    const soundsToTrim = Object.keys(TRIM_CONFIGS) as SoundName[];

    for (const soundName of soundsToTrim) {
      const soundPath = this.getSoundPath(soundName);
      if (!soundPath) continue;

      try {
        const response = await fetch(soundPath);
        const arrayBuffer = await response.arrayBuffer();
        const ctx = this.getAudioContext();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

        // Armazena buffer original
        this.audioBuffers.set(soundName, audioBuffer);

        // Aplica trim e armazena
        const config = TRIM_CONFIGS[soundName];
        if (config) {
          const trimmedBuffer = this.applyTrim(audioBuffer, config);
          this.trimmedBuffers.set(soundName, trimmedBuffer);
          console.debug(`[SoundManager] Trimmed: ${soundName} (${audioBuffer.duration.toFixed(2)}s -> ${trimmedBuffer.duration.toFixed(2)}s)`);
        }
      } catch (err) {
        console.debug(`[SoundManager] Failed to preload trimmed sound: ${soundName}`, err);
      }
    }
  }

  private getSoundPath(name: SoundName): string | null {
    const soundFiles: Record<SoundName, string> = {
      'shot-live': '/audio/sfx/shot-live.mp3',
      'shot-blank': '/audio/sfx/shot-blank.mp3',
      'revolver-spin': '/audio/sfx/revolver-spin.mp3',
      'revolver-cocking': '/audio/sfx/revolver-cocking.mp3',
      'damage': '/audio/sfx/damage.mp3',
      'heal': '/audio/sfx/heal.mp3',
      'reload': '/audio/sfx/reload.mp3',
      'turn-change': '/audio/sfx/turn-change.mp3',
      'round-start': '/audio/sfx/round-start.mp3',
      'round-win': '/audio/sfx/round-win.mp3',
      'game-over-win': '/audio/sfx/game-over-win.mp3',
      'game-over-lose': '/audio/sfx/game-over-lose.mp3',
      'timer-warning': '/audio/sfx/timer-warning.mp3',
      'item-magnifying-glass': '/audio/sfx/items/magnifying-glass.mp3',
      'item-beer': '/audio/sfx/items/beer.mp3',
      'item-cigarette': '/audio/sfx/items/cigarette.mp3',
      'item-handcuffs': '/audio/sfx/items/handcuffs.mp3',
      'item-handsaw': '/audio/sfx/items/handsaw.mp3',
      'item-phone': '/audio/sfx/items/phone.mp3',
      'item-inverter': '/audio/sfx/items/inverter.mp3',
      'item-adrenaline': '/audio/sfx/items/adrenaline.mp3',
      'item-medicine': '/audio/sfx/items/medicine.mp3',
      'item-turn-reverser': '/audio/sfx/items/turn-reverser.mp3',
      'ui-click': '/audio/sfx/ui/click.mp3',
      'ui-hover': '/audio/sfx/ui/hover.mp3',
      'ui-success': '/audio/sfx/ui/success.mp3',
      'ui-error': '/audio/sfx/ui/error.mp3',
      'ui-join-room': '/audio/sfx/ui/join-room.mp3',
      'ui-leave-room': '/audio/sfx/ui/leave-room.mp3',
    };
    return soundFiles[name] || null;
  }

  private applyTrim(audioBuffer: AudioBuffer, config: TrimConfig): AudioBuffer {
    const ctx = this.getAudioContext();
    const { duration, fadeIn = 0, fadeOut = 0, start = 0, speed = 1.0 } = config;

    const sampleRate = audioBuffer.sampleRate;
    const numChannels = audioBuffer.numberOfChannels;
    const startSample = Math.floor(start * sampleRate);
    const outputSamples = Math.floor(duration * sampleRate);

    const outputBuffer = ctx.createBuffer(numChannels, outputSamples, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);

      for (let i = 0; i < outputSamples; i++) {
        const sourceIndex = startSample + Math.floor(i * speed);
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

  private playBuffer(buffer: AudioBuffer, volume: number = 1): void {
    const ctx = this.getAudioContext();

    // Resume context if suspended (autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();

    source.buffer = buffer;
    gainNode.gain.value = volume * this.volume;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(0);
  }

  private preloadSounds(): void {
    const soundFiles: Record<SoundName, string> = {
      'shot-live': '/audio/sfx/shot-live.mp3',
      'shot-blank': '/audio/sfx/shot-blank.mp3',
      'revolver-spin': '/audio/sfx/revolver-spin.mp3',
      'revolver-cocking': '/audio/sfx/revolver-cocking.mp3',
      'damage': '/audio/sfx/damage.mp3',
      'heal': '/audio/sfx/heal.mp3',
      'reload': '/audio/sfx/reload.mp3',
      'turn-change': '/audio/sfx/turn-change.mp3',
      'round-start': '/audio/sfx/round-start.mp3',
      'round-win': '/audio/sfx/round-win.mp3',
      'game-over-win': '/audio/sfx/game-over-win.mp3',
      'game-over-lose': '/audio/sfx/game-over-lose.mp3',
      'timer-warning': '/audio/sfx/timer-warning.mp3',
      'item-magnifying-glass': '/audio/sfx/items/magnifying-glass.mp3',
      'item-beer': '/audio/sfx/items/beer.mp3',
      'item-cigarette': '/audio/sfx/items/cigarette.mp3',
      'item-handcuffs': '/audio/sfx/items/handcuffs.mp3',
      'item-handsaw': '/audio/sfx/items/handsaw.mp3',
      'item-phone': '/audio/sfx/items/phone.mp3',
      'item-inverter': '/audio/sfx/items/inverter.mp3',
      'item-adrenaline': '/audio/sfx/items/adrenaline.mp3',
      'item-medicine': '/audio/sfx/items/medicine.mp3',
      'item-turn-reverser': '/audio/sfx/items/turn-reverser.mp3',
      'ui-click': '/audio/sfx/ui/click.mp3',
      'ui-hover': '/audio/sfx/ui/hover.mp3',
      'ui-success': '/audio/sfx/ui/success.mp3',
      'ui-error': '/audio/sfx/ui/error.mp3',
      'ui-join-room': '/audio/sfx/ui/join-room.mp3',
      'ui-leave-room': '/audio/sfx/ui/leave-room.mp3',
    };

    Object.entries(soundFiles).forEach(([name, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      this.sounds.set(name, audio);
    });
  }

  private preloadMusic(): void {
    const musicFiles: Record<MusicName, string> = {
      'ambient-menu': '/audio/music/ambient-menu.mp3',
      'ambient-game': '/audio/music/ambient-game.mp3',
    };

    Object.entries(musicFiles).forEach(([name, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.loop = true;
      this.music.set(name, audio);
    });
  }

  play(name: SoundName, config?: SoundConfig): void {
    if (!this.enabled) return;

    // Verificar se tem versão trimada
    const trimmedBuffer = this.trimmedBuffers.get(name);
    if (trimmedBuffer) {
      this.playBuffer(trimmedBuffer, config?.volume ?? 1);
      return;
    }

    // Fallback para HTMLAudioElement
    const sound = this.sounds.get(name);
    if (!sound) {
      console.debug(`[SoundManager] Som nao encontrado: ${name}`);
      return;
    }

    const clone = sound.cloneNode() as HTMLAudioElement;
    clone.volume = (config?.volume ?? 1) * this.volume;
    clone.loop = config?.loop ?? false;

    clone.play().catch(err => {
      console.debug('[SoundManager] Audio play prevented:', err.message);
    });
  }

  playItem(itemId: string): void {
    const itemSoundMap: Record<string, SoundName> = {
      'magnifying_glass': 'item-magnifying-glass',
      'beer': 'item-beer',
      'cigarette': 'item-cigarette',
      'handcuffs': 'item-handcuffs',
      'handsaw': 'item-handsaw',
      'phone': 'item-phone',
      'inverter': 'item-inverter',
      'adrenaline': 'item-adrenaline',
      'medicine': 'item-medicine',
      'expired_medicine': 'item-medicine',
      'turn_reverser': 'item-turn-reverser',
    };

    const soundName = itemSoundMap[itemId];
    if (soundName) {
      this.play(soundName);
    }
  }

  // ==========================================
  // SHOT SEQUENCES (spin + shot)
  // ==========================================

  playShotSequence(isLive: boolean, isSawed: boolean = false): void {
    if (!this.enabled) return;

    // 1. Play spin first
    this.play('revolver-spin');

    // 2. After spin delay, play shot(s)
    setTimeout(() => {
      if (isLive) {
        this.play('shot-live');
        if (isSawed) {
          setTimeout(() => {
            this.play('shot-live');
          }, 100);
        }
      } else {
        // Blank = teck teck (2 cliques)
        this.play('shot-blank');
        setTimeout(() => {
          this.play('shot-blank');
        }, 80);
      }
    }, 300);
  }

  playReloadSequence(): void {
    if (!this.enabled) return;

    this.play('revolver-spin');
    setTimeout(() => {
      this.play('reload');
    }, 300);
  }

  playCockingSequence(shellCount: number, delayBetween: number = 200): void {
    if (!this.enabled) return;

    for (let i = 0; i < shellCount; i++) {
      setTimeout(() => {
        this.play('revolver-cocking');
      }, i * delayBetween);
    }
  }

  playRoundStartSequence(shellCount: number): void {
    if (!this.enabled) return;

    this.play('revolver-spin');

    const cockingDelay = 300;
    const delayBetween = 180;

    for (let i = 0; i < shellCount; i++) {
      setTimeout(() => {
        this.play('revolver-cocking');
      }, cockingDelay + (i * delayBetween));
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    localStorage.setItem('bangshot_sound_enabled', String(enabled));
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('bangshot_sound_volume', String(this.volume));
  }

  getVolume(): number {
    return this.volume;
  }

  loadSettings(): void {
    const enabled = localStorage.getItem('bangshot_sound_enabled');
    const volume = localStorage.getItem('bangshot_sound_volume');
    const musicEnabled = localStorage.getItem('bangshot_music_enabled');
    const musicVolume = localStorage.getItem('bangshot_music_volume');

    if (enabled !== null) this.enabled = enabled === 'true';
    if (volume !== null) this.volume = parseFloat(volume);
    if (musicEnabled !== null) this.musicEnabled = musicEnabled === 'true';
    if (musicVolume !== null) this.musicVolume = parseFloat(musicVolume);
  }

  // ==========================================
  // MUSIC METHODS
  // ==========================================

  playMusic(name: MusicName): void {
    if (!this.musicEnabled) return;

    if (this.currentMusicName === name && this.currentMusic && !this.currentMusic.paused) {
      return;
    }

    this.stopMusic(true);

    const music = this.music.get(name);
    if (!music) {
      console.debug(`[SoundManager] Música não encontrada: ${name}`);
      return;
    }

    this.currentMusic = music;
    this.currentMusicName = name;
    music.volume = 0;
    music.currentTime = 0;

    music.play().then(() => {
      this.fadeIn(music, this.musicVolume, 2000);
    }).catch(err => {
      console.debug('[SoundManager] Music play prevented:', err.message);
    });
  }

  stopMusic(fadeOut: boolean = true): void {
    if (!this.currentMusic) return;

    if (fadeOut) {
      this.fadeOut(this.currentMusic, 1000, () => {
        this.currentMusic?.pause();
        if (this.currentMusic) this.currentMusic.currentTime = 0;
        this.currentMusic = null;
        this.currentMusicName = null;
      });
    } else {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
      this.currentMusicName = null;
    }
  }

  private fadeIn(audio: HTMLAudioElement, targetVolume: number, duration: number): void {
    const steps = 20;
    const stepTime = duration / steps;
    const volumeStep = targetVolume / steps;
    let currentStep = 0;

    const fade = setInterval(() => {
      currentStep++;
      audio.volume = Math.min(volumeStep * currentStep, targetVolume);
      if (currentStep >= steps) {
        clearInterval(fade);
      }
    }, stepTime);
  }

  private fadeOut(audio: HTMLAudioElement, duration: number, callback?: () => void): void {
    const steps = 20;
    const stepTime = duration / steps;
    const initialVolume = audio.volume;
    const volumeStep = initialVolume / steps;
    let currentStep = 0;

    const fade = setInterval(() => {
      currentStep++;
      audio.volume = Math.max(initialVolume - (volumeStep * currentStep), 0);
      if (currentStep >= steps) {
        clearInterval(fade);
        callback?.();
      }
    }, stepTime);
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    localStorage.setItem('bangshot_music_enabled', String(enabled));

    if (!enabled) {
      this.stopMusic(true);
    }
  }

  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('bangshot_music_volume', String(this.musicVolume));

    if (this.currentMusic) {
      this.currentMusic.volume = this.musicVolume;
    }
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  // ==========================================
  // UI SOUND SHORTCUTS
  // ==========================================

  playClick(): void {
    this.play('ui-click', { volume: 0.5 });
  }

  playHover(): void {
    this.play('ui-hover', { volume: 0.3 });
  }

  playSuccess(): void {
    this.play('ui-success', { volume: 0.6 });
  }

  playError(): void {
    this.play('ui-error', { volume: 0.6 });
  }

  playJoinRoom(): void {
    this.play('ui-join-room', { volume: 0.7 });
  }

  playLeaveRoom(): void {
    this.play('ui-leave-room', { volume: 0.5 });
  }
}

export const soundManager = SoundManager.getInstance();
