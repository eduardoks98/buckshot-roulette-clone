// ==========================================
// SOUND MANAGER - Singleton para gerenciar audio
// ==========================================

export type SoundName =
  | 'shot-live' | 'shot-blank' | 'damage' | 'heal' | 'reload'
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

class SoundManager {
  private static instance: SoundManager;
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private music: Map<string, HTMLAudioElement> = new Map();
  private currentMusic: HTMLAudioElement | null = null;
  private currentMusicName: MusicName | null = null;
  private enabled: boolean = true;
  private musicEnabled: boolean = true;
  private volume: number = 0.7;
  private musicVolume: number = 0.3; // Música mais baixa por padrão

  private constructor() {
    this.loadSettings();
    this.preloadSounds();
    this.preloadMusic();
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private preloadSounds(): void {
    const soundFiles: Record<SoundName, string> = {
      'shot-live': '/audio/sfx/shot-live.mp3',
      'shot-blank': '/audio/sfx/shot-blank.mp3',
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
      // UI Sounds
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

    const sound = this.sounds.get(name);
    if (!sound) {
      console.debug(`[SoundManager] Som nao encontrado: ${name}`);
      return;
    }

    // Clone para permitir multiplas reproducoes simultaneas
    const clone = sound.cloneNode() as HTMLAudioElement;
    clone.volume = (config?.volume ?? 1) * this.volume;
    clone.loop = config?.loop ?? false;

    clone.play().catch(err => {
      // Silenciar erros de autoplay bloqueado
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

    // Se já está tocando a mesma música, não fazer nada
    if (this.currentMusicName === name && this.currentMusic && !this.currentMusic.paused) {
      return;
    }

    // Parar música atual com fade out
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
      // Fade in suave
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

    // Atualizar volume da música atual
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
