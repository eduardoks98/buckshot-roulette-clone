/**
 * Script para corrigir partidas de treino que deram XP incorretamente
 *
 * Problema: Quando o jogador abandona uma partida de treino contra bots,
 * o bot "ganha" por WO (walkover) e o jogo é salvo como COMPLETED,
 * dando XP ao jogador que abandonou.
 *
 * Correção: Encontrar essas partidas e:
 * 1. Mudar position para null (não foi vitória)
 * 2. Zerar xp_earned do participant
 * 3. Subtrair o XP do total_xp do usuário
 *
 * Uso: npx ts-node scripts/fix-training-xp.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Correção de XP de Partidas de Treino ===\n');

  // =========================================
  // PARTE 1: Limpar partidas órfãs de treino
  // Partidas em WAITING ou IN_PROGRESS que nunca foram finalizadas
  // =========================================
  console.log('--- Limpando partidas órfãs de treino ---\n');

  const orphanGames = await prisma.game.findMany({
    where: {
      is_ranked: false,
      status: {
        in: ['WAITING', 'IN_PROGRESS'],
      },
      game_participants: {
        some: {
          guest_name: {
            contains: '[BOT]',
          },
        },
      },
    },
    select: {
      id: true,
      room_code: true,
      status: true,
      created_at: true,
    },
  });

  if (orphanGames.length > 0) {
    console.log(`Encontradas ${orphanGames.length} partidas órfãs de treino:\n`);
    for (const game of orphanGames) {
      console.log(`  - ${game.room_code} (${game.status}) - ${game.created_at.toISOString()}`);
    }

    // Deletar partidas órfãs
    const deleteResult = await prisma.game.deleteMany({
      where: {
        id: {
          in: orphanGames.map(g => g.id),
        },
      },
    });

    console.log(`\n>> Deletadas ${deleteResult.count} partidas órfãs\n`);
  } else {
    console.log('Nenhuma partida órfã encontrada.\n');
  }

  // =========================================
  // PARTE 2: Corrigir XP incorreto
  // =========================================
  console.log('--- Corrigindo XP incorreto ---\n');

  // Encontrar partidas de treino com bots onde o humano tem position=1 e ganhou XP
  // Isso indica que o humano "venceu" mas provavelmente foi WO do bot
  const problematicGames = await prisma.game.findMany({
    where: {
      is_ranked: false,
      game_participants: {
        some: {
          guest_name: {
            contains: '[BOT]',
          },
        },
      },
    },
    include: {
      game_participants: {
        include: {
          user: {
            select: {
              id: true,
              display_name: true,
              total_xp: true,
            },
          },
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  console.log(`Encontradas ${problematicGames.length} partidas de treino com bots.\n`);

  let fixedCount = 0;
  let totalXpRemoved = 0;

  for (const game of problematicGames) {
    // Encontrar o participante humano (com user_id)
    const humanParticipant = game.game_participants.find(p => p.user_id !== null);
    // Encontrar o bot
    const botParticipant = game.game_participants.find(p => p.guest_name?.includes('[BOT]'));

    if (!humanParticipant || !botParticipant) {
      continue;
    }

    // Verificar se o humano foi marcado como vencedor (position=1) mas o jogo deveria ter sido abandonado
    // Indicadores de abandono: humano com position=1 quando bot também existe
    // E o humano ganhou XP
    const xpEarned = humanParticipant.xp_earned || 0;

    if (humanParticipant.position === 1 && xpEarned > 0) {
      // Verificar se é um caso de WO do bot (humano abandonou, bot foi o único restante)
      // Se o bot tem position null ou não é 1, provavelmente foi WO ao contrário
      // Mas se o humano tem position=1 em jogo não-ranked com bot, é suspeito

      console.log(`\n--- Partida: ${game.room_code} (${game.created_at.toISOString()}) ---`);
      console.log(`  Status: ${game.status}`);
      console.log(`  Humano: ${humanParticipant.user?.display_name} (position=${humanParticipant.position}, xp=${xpEarned})`);
      console.log(`  Bot: ${botParticipant.guest_name} (position=${botParticipant.position})`);

      // Casos problemáticos:
      // 1. Bot com position=1 E humano com position=1 (ambos vencedores - impossível)
      // 2. Bot com position null (não definido) e humano com position=1
      // 3. Qualquer partida de treino onde humano ganhou XP mas o jogo foi abandonado

      // Verificar se é um caso que precisa correção:
      // - Se ambos têm position=1 (dados inconsistentes)
      // - Se bot não tem position=1 mas humano tem (provável abandono)
      const needsFix = botParticipant.position === 1 || botParticipant.position !== 1;

      // Na verdade, em partidas de TREINO, se o humano ganhou XP e o jogo foi vs bot,
      // e o bot tem qualquer position (1 ou null), algo está errado se foi abandonado
      // Vamos corrigir quando AMBOS têm position=1 (claramente um bug)
      // OU quando o bot NÃO tem position=1 (humano não deveria ter vencido)
      const bothWinners = botParticipant.position === 1 && humanParticipant.position === 1;
      const humanWonAlone = humanParticipant.position === 1 && botParticipant.position !== 1;

      if (bothWinners || humanWonAlone) {
        const reason = bothWinners
          ? 'Ambos marcados como vencedores (bug)'
          : 'Humano marcado como vencedor mas bot não perdeu';
        console.log(`  >> PROBLEMA DETECTADO: ${reason}`);
        console.log(`  >> Ação: Remover XP (${xpEarned}) e corrigir position`);

        // CORREÇÃO
        // 1. Atualizar participant: position=null, xp_earned=0
        await prisma.gameParticipant.update({
          where: { id: humanParticipant.id },
          data: {
            position: null,
            xp_earned: 0,
          },
        });

        // 2. Subtrair XP do total do usuário
        if (humanParticipant.user_id) {
          await prisma.user.update({
            where: { id: humanParticipant.user_id },
            data: {
              total_xp: {
                decrement: xpEarned,
              },
            },
          });
        }

        fixedCount++;
        totalXpRemoved += xpEarned;
        console.log(`  >> CORRIGIDO!`);
      }
    }
  }

  console.log(`\n=== Resumo ===`);
  console.log(`Partidas corrigidas: ${fixedCount}`);
  console.log(`XP total removido: ${totalXpRemoved}`);
}

main()
  .catch(e => {
    console.error('Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
