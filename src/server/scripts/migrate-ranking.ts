// ==========================================
// SCRIPT DE RESET - Sistema LP + MMR
// ==========================================
// Reseta todos os rankings para Bronze IV (valores padrão)
// Executar: npx ts-node src/server/scripts/migrate-ranking.ts
// ==========================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Valores padrão do novo sistema
const DEFAULT_TIER = 'Bronze';
const DEFAULT_DIVISION = 4;
const DEFAULT_LP = 0;
const DEFAULT_MMR = 800;

async function main() {
  console.log('==========================================');
  console.log('RESET DE RANKING: Todos para Bronze IV');
  console.log('==========================================\n');

  // Buscar todos os usuários
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      tier: true,
      division: true,
      lp: true,
      mmr_hidden: true,
    },
  });

  console.log(`Encontrados ${users.length} usuários para resetar.\n`);

  // Atualizar todos de uma vez
  const result = await prisma.user.updateMany({
    data: {
      tier: DEFAULT_TIER,
      division: DEFAULT_DIVISION,
      lp: DEFAULT_LP,
      mmr_hidden: DEFAULT_MMR,
      peak_mmr: DEFAULT_MMR,
      games_since_promo: 0,
    },
  });

  console.log('==========================================');
  console.log('RESET CONCLUÍDO');
  console.log('==========================================');
  console.log(`Usuários atualizados: ${result.count}`);
  console.log(`Novo rank padrão: ${DEFAULT_TIER} IV`);
  console.log(`LP: ${DEFAULT_LP}`);
  console.log(`MMR: ${DEFAULT_MMR}`);
}

main()
  .catch((e) => {
    console.error('Erro durante reset:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
