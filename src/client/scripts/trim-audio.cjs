/**
 * TRIM AUDIO SCRIPT
 * Uses FFmpeg to trim audio files to appropriate durations for game sounds
 *
 * Usage: node scripts/trim-audio.cjs
 *
 * Prerequisites: FFmpeg must be installed and available in PATH
 * Download: https://ffmpeg.org/download.html
 * Windows: https://www.gyan.dev/ffmpeg/builds/
 */

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Audio directory
const AUDIO_DIR = path.join(__dirname, '../public/audio');

// Duration configs (in seconds) with optional start time offset
// Format: { duration: number, fadeIn?: number, fadeOut?: number, start?: number, speed?: number }
// speed: 1.0 = normal, 1.5 = 50% faster, 2.0 = double speed
const AUDIO_CONFIGS = {
  // SFX - Main sounds
  'sfx/shot-live.mp3': { duration: 0.4, fadeOut: 0.1 },
  'sfx/shot-blank.mp3': { duration: 0.12, fadeOut: 0.03 }, // CORTAR PELA METADE! Original tem 2 cliques, queremos só 1
  'sfx/revolver-spin.mp3': { duration: 0.3, fadeOut: 0.08, speed: 1.3 }, // Slightly faster spin
  'sfx/revolver-cocking.mp3': { duration: 0.15, fadeOut: 0.03, speed: 1.5 }, // Very short cocking click for each shell (fits 180ms timing)
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

  // Music - longer ambient tracks (don't trim these much, just normalize volume)
  // 'music/ambient-menu.mp3': { duration: 120, fadeIn: 2, fadeOut: 3 },
  // 'music/ambient-game.mp3': { duration: 180, fadeIn: 2, fadeOut: 3 },
};

// Check if FFmpeg is installed
function checkFFmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
  }
}

// Get audio duration using FFprobe
function getAudioDuration(filePath) {
  try {
    const result = execSync(
      `ffprobe -i "${filePath}" -show_entries format=duration -v quiet -of csv="p=0"`,
      { encoding: 'utf-8' }
    );
    return parseFloat(result.trim());
  } catch (e) {
    return null;
  }
}

// Trim audio file using FFmpeg
function trimAudio(inputPath, outputPath, config) {
  const { duration, fadeIn = 0, fadeOut = 0, start = 0, speed = 1.0 } = config;

  // Build filter chain
  const filters = [];

  // Add speed change (atempo only works between 0.5 and 2.0)
  if (speed !== 1.0) {
    // For speeds > 2.0 or < 0.5, chain multiple atempo filters
    let remainingSpeed = speed;
    while (remainingSpeed > 2.0) {
      filters.push('atempo=2.0');
      remainingSpeed /= 2.0;
    }
    while (remainingSpeed < 0.5) {
      filters.push('atempo=0.5');
      remainingSpeed /= 0.5;
    }
    if (remainingSpeed !== 1.0) {
      filters.push(`atempo=${remainingSpeed}`);
    }
  }

  // Add fade in
  if (fadeIn > 0) {
    filters.push(`afade=t=in:st=0:d=${fadeIn}`);
  }

  // Add fade out (adjusted for speed)
  if (fadeOut > 0) {
    const adjustedDuration = duration / speed;
    const fadeOutStart = Math.max(0, adjustedDuration - fadeOut);
    filters.push(`afade=t=out:st=${fadeOutStart}:d=${fadeOut}`);
  }

  const filterArg = filters.length > 0 ? `-af "${filters.join(',')}"` : '';

  // Adjust duration for speed change
  const inputDuration = duration / speed;

  // FFmpeg command
  const cmd = `ffmpeg -y -i "${inputPath}" -ss ${start} -t ${inputDuration} ${filterArg} -acodec libmp3lame -q:a 2 "${outputPath}"`;

  try {
    execSync(cmd, { stdio: 'pipe' });
    return true;
  } catch (e) {
    console.error(`  Error: ${e.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log('='.repeat(50));
  console.log('  AUDIO TRIMMER - Bang Shot');
  console.log('='.repeat(50));
  console.log();

  // Check FFmpeg
  if (!checkFFmpeg()) {
    console.error('ERROR: FFmpeg is not installed or not in PATH');
    console.log();
    console.log('Please install FFmpeg:');
    console.log('  Windows: https://www.gyan.dev/ffmpeg/builds/');
    console.log('  Mac: brew install ffmpeg');
    console.log('  Linux: sudo apt install ffmpeg');
    process.exit(1);
  }

  console.log('FFmpeg found!\n');

  // Create backup directory
  const backupDir = path.join(AUDIO_DIR, '_backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const [relativePath, config] of Object.entries(AUDIO_CONFIGS)) {
    const inputPath = path.join(AUDIO_DIR, relativePath);

    // Check if file exists
    if (!fs.existsSync(inputPath)) {
      console.log(`SKIP: ${relativePath} (file not found)`);
      skipped++;
      continue;
    }

    // Get current duration
    const currentDuration = getAudioDuration(inputPath);
    if (currentDuration === null) {
      console.log(`SKIP: ${relativePath} (couldn't read duration)`);
      skipped++;
      continue;
    }

    // Check if already trimmed (within 0.1s tolerance)
    if (Math.abs(currentDuration - config.duration) < 0.1) {
      console.log(`OK: ${relativePath} (already ${currentDuration.toFixed(2)}s)`);
      skipped++;
      continue;
    }

    console.log(`TRIM: ${relativePath}`);
    console.log(`      ${currentDuration.toFixed(2)}s -> ${config.duration}s`);

    // Create backup
    const backupPath = path.join(backupDir, relativePath.replace(/\//g, '_'));
    const backupDirPath = path.dirname(backupPath);
    if (!fs.existsSync(backupDirPath)) {
      fs.mkdirSync(backupDirPath, { recursive: true });
    }

    // Only backup if not already backed up
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(inputPath, backupPath);
    }

    // Trim to temp file first
    const tempPath = inputPath + '.tmp.mp3';

    if (trimAudio(inputPath, tempPath, config)) {
      // Replace original with trimmed version
      fs.unlinkSync(inputPath);
      fs.renameSync(tempPath, inputPath);
      console.log(`      Done!`);
      processed++;
    } else {
      // Clean up temp file if it exists
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      failed++;
    }

    console.log();
  }

  console.log('='.repeat(50));
  console.log(`  SUMMARY`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Failed: ${failed}`);
  console.log('='.repeat(50));

  if (processed > 0) {
    console.log(`\nBackups saved to: ${backupDir}`);
  }
}

main().catch(console.error);
