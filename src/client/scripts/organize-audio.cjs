/**
 * Script para organizar arquivos de áudio baixados
 *
 * USO:
 * 1. Baixe todos os arquivos MP3 do Pixabay em uma pasta (ex: Downloads)
 * 2. Renomeie os arquivos conforme a lista abaixo
 * 3. Execute: node organize-audio.js <pasta-origem>
 *
 * Exemplo: node organize-audio.js "C:/Users/SEU_USUARIO/Downloads/audio"
 */

const fs = require('fs');
const path = require('path');

// Mapeamento de arquivos para suas pastas de destino
const FILE_MAPPING = {
  // Sons principais (sfx/)
  'damage.mp3': 'sfx/',
  'heal.mp3': 'sfx/',
  'turn-change.mp3': 'sfx/',
  'round-start.mp3': 'sfx/',
  'round-win.mp3': 'sfx/',
  'game-over-win.mp3': 'sfx/',
  'game-over-lose.mp3': 'sfx/',
  'timer-warning.mp3': 'sfx/',

  // Sons de UI (sfx/ui/)
  'click.mp3': 'sfx/ui/',
  'hover.mp3': 'sfx/ui/',
  'success.mp3': 'sfx/ui/',
  'error.mp3': 'sfx/ui/',
  'join-room.mp3': 'sfx/ui/',
  'leave-room.mp3': 'sfx/ui/',

  // Sons de Itens (sfx/items/)
  'magnifying-glass.mp3': 'sfx/items/',
  'beer.mp3': 'sfx/items/',
  'cigarette.mp3': 'sfx/items/',
  'handcuffs.mp3': 'sfx/items/',
  'handsaw.mp3': 'sfx/items/',
  'phone.mp3': 'sfx/items/',
  'inverter.mp3': 'sfx/items/',
  'adrenaline.mp3': 'sfx/items/',
  'medicine.mp3': 'sfx/items/',
  'turn-reverser.mp3': 'sfx/items/',

  // Músicas (music/)
  'ambient-menu.mp3': 'music/',
  'ambient-game.mp3': 'music/',
};

// Pasta de destino base
const DEST_BASE = path.join(__dirname, '..', 'public', 'audio');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Criada pasta: ${dir}`);
  }
}

function organizeAudio(sourceDir) {
  if (!sourceDir) {
    console.log('❌ Uso: node organize-audio.js <pasta-origem>');
    console.log('   Exemplo: node organize-audio.js "C:/Users/SEU_USUARIO/Downloads/audio"');
    process.exit(1);
  }

  if (!fs.existsSync(sourceDir)) {
    console.log(`❌ Pasta não encontrada: ${sourceDir}`);
    process.exit(1);
  }

  console.log('\n🎵 Organizador de Áudio - Buckshot Roulette\n');
  console.log(`📂 Origem: ${sourceDir}`);
  console.log(`📂 Destino: ${DEST_BASE}\n`);

  // Criar pastas de destino
  ensureDir(path.join(DEST_BASE, 'sfx'));
  ensureDir(path.join(DEST_BASE, 'sfx', 'ui'));
  ensureDir(path.join(DEST_BASE, 'sfx', 'items'));
  ensureDir(path.join(DEST_BASE, 'music'));

  // Listar arquivos na pasta de origem
  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.mp3'));

  let moved = 0;
  let notFound = [];
  let unknown = [];

  // Processar cada arquivo
  for (const file of files) {
    const destFolder = FILE_MAPPING[file];

    if (destFolder) {
      const src = path.join(sourceDir, file);
      const dest = path.join(DEST_BASE, destFolder, file);

      fs.copyFileSync(src, dest);
      console.log(`✅ ${file} → ${destFolder}`);
      moved++;
    } else {
      unknown.push(file);
    }
  }

  // Verificar arquivos faltando
  for (const expectedFile of Object.keys(FILE_MAPPING)) {
    const exists = files.includes(expectedFile);
    if (!exists) {
      notFound.push(expectedFile);
    }
  }

  // Resumo
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMO:\n');
  console.log(`✅ Arquivos copiados: ${moved}`);

  if (notFound.length > 0) {
    console.log(`\n❌ Arquivos FALTANDO (${notFound.length}):`);
    notFound.forEach(f => console.log(`   - ${f}`));
  }

  if (unknown.length > 0) {
    console.log(`\n⚠️  Arquivos não reconhecidos (${unknown.length}):`);
    unknown.forEach(f => console.log(`   - ${f}`));
    console.log('\n   Renomeie esses arquivos conforme a lista e execute novamente.');
  }

  if (notFound.length === 0 && unknown.length === 0) {
    console.log('\n🎉 Todos os arquivos foram organizados com sucesso!');
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n📝 NOMES ESPERADOS DOS ARQUIVOS:\n');

  console.log('Sons principais:');
  console.log('  damage.mp3, heal.mp3, turn-change.mp3, round-start.mp3');
  console.log('  round-win.mp3, game-over-win.mp3, game-over-lose.mp3, timer-warning.mp3\n');

  console.log('Sons de UI:');
  console.log('  click.mp3, hover.mp3, success.mp3, error.mp3, join-room.mp3, leave-room.mp3\n');

  console.log('Sons de Itens:');
  console.log('  magnifying-glass.mp3, beer.mp3, cigarette.mp3, handcuffs.mp3');
  console.log('  handsaw.mp3, phone.mp3, inverter.mp3, adrenaline.mp3, medicine.mp3, turn-reverser.mp3\n');

  console.log('Músicas:');
  console.log('  ambient-menu.mp3, ambient-game.mp3\n');
}

// Executar
const sourceDir = process.argv[2];
organizeAudio(sourceDir);
