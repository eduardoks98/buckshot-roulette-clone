// ==========================================
// SCRIPT DE MIGRAÇÃO - ELO para LP + MMR
// ==========================================
// Converte o sistema de ELO antigo para o novo sistema de ranking
// Executar: npx ts-node src/server/scripts/migrate-ranking.ts
// ==========================================

import { PrismaClient } from '@prisma/client';
import { migrateFromElo, getDisplayRank, Tier } from '../../shared/utils/rankingCalculator';

const prisma = new PrismaClient();

async function main() {
  console.log('==========================================');
  console.log('MIGRAÇÃO DE RANKING: ELO -> LP + MMR');
  console.log('==========================================\n');

  // Buscar todos os usuários
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      elo_rating: true,
      tier: true,
      division: true,
      lp: true,
      mmr_hidden: true,
    },
  });

  console.log(`Encontrados ${users.length} usuários para migrar.\n`);

  let migrated = 0;
  let skipped = 0;

  for (const user of users) {
    // Verificar se já foi migrado (tier diferente de Bronze ou mmr diferente de 800)
    const alreadyMigrated =
      user.tier !== 'Bronze' ||
      user.division !== 4 ||
      user.lp !== 0 ||
      user.mmr_hidden !== 800;

    if (alreadyMigrated) {
      console.log(`[SKIP] ${user.username}: já migrado (${user.tier} ${user.division ? `${['IV', 'III', 'II', 'I'][4 - user.division]}` : ''} ${user.lp} LP)`);
      skipped++;
      continue;
    }

    // Converter ELO para novo sistema
    const newRanking = migrateFromElo(user.elo_rating);

    // Atualizar usuário
    await prisma.user.update({
      where: { id: user.id },
      data: {
        tier: newRanking.tier,
        division: newRanking.division,
        lp: newRanking.lp,
        mmr_hidden: newRanking.mmr,
        peak_mmr: newRanking.mmr,
        games_since_promo: 0,
      },
    });

    const displayRank = getDisplayRank(newRanking.tier, newRanking.division);
    console.log(`[OK] ${user.username}: ELO ${user.elo_rating} -> ${displayRank} (${newRanking.lp} LP, MMR ${newRanking.mmr})`);
    migrated++;
  }

  console.log('\n==========================================');
  console.log('MIGRAÇÃO CONCLUÍDA');
  console.log('==========================================');
  console.log(`Migrados: ${migrated}`);
  console.log(`Pulados: ${skipped}`);
  console.log(`Total: ${users.length}`);
}

main()
  .catch((e) => {
    console.error('Erro durante migração:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
