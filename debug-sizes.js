// Cole este script no console do navegador (F12 > Console)
// para ver os tamanhos atuais dos elementos do jogo

(function() {
  console.log('=== DIAGNÓSTICO DE TAMANHOS DO JOGO ===\n');

  // Tamanho da janela
  console.log('📐 VIEWPORT:');
  console.log('  Largura: ' + window.innerWidth + 'px');
  console.log('  Altura: ' + window.innerHeight + 'px');
  console.log('  Ratio: ' + (window.innerWidth / window.innerHeight).toFixed(2));

  // Elementos principais
  var elements = [
    { selector: '.game-board', name: 'Game Board (container principal)' },
    { selector: '.game-header', name: 'Header do jogo' },
    { selector: '.player-card', name: 'Cards dos jogadores' },
    { selector: '.revolver-cylinder', name: 'Cilindro do revólver' },
    { selector: '.cylinder-container', name: 'Container do cilindro' },
    { selector: '.item-grid', name: 'Grid de itens' },
    { selector: '.item-slot', name: 'Slots de itens' },
    { selector: '.action-buttons', name: 'Botões de ação' },
    { selector: '.shoot-btn', name: 'Botão de atirar' },
    { selector: '.player-health', name: 'Corações de vida' },
    { selector: '.turn-timer', name: 'Timer' },
    { selector: '.players-area', name: 'Área dos jogadores' },
    { selector: '.game-area', name: 'Área do jogo (centro)' },
    { selector: '.player-area', name: 'Área do jogador atual' },
  ];

  console.log('\n📦 ELEMENTOS:');
  elements.forEach(function(item) {
    var el = document.querySelector(item.selector);
    if (el) {
      var rect = el.getBoundingClientRect();
      var styles = window.getComputedStyle(el);
      console.log('\n  ' + item.name + ' (' + item.selector + '):');
      console.log('    Tamanho: ' + Math.round(rect.width) + 'px x ' + Math.round(rect.height) + 'px');
      console.log('    Posição: top=' + Math.round(rect.top) + 'px, left=' + Math.round(rect.left) + 'px');
      console.log('    Padding: ' + styles.padding);
      console.log('    Margin: ' + styles.margin);
      console.log('    Font-size: ' + styles.fontSize);
      console.log('    Gap: ' + styles.gap);

      // Verificar se está fora da tela
      if (rect.bottom > window.innerHeight) {
        console.log('    ⚠️ OVERFLOW VERTICAL: ' + Math.round(rect.bottom - window.innerHeight) + 'px abaixo da tela');
      }
      if (rect.right > window.innerWidth) {
        console.log('    ⚠️ OVERFLOW HORIZONTAL: ' + Math.round(rect.right - window.innerWidth) + 'px à direita');
      }
    } else {
      console.log('\n  ' + item.name + ' (' + item.selector + '): NÃO ENCONTRADO');
    }
  });

  // Múltiplos elementos (todos os cards de jogadores)
  console.log('\n👥 TODOS OS PLAYER CARDS:');
  document.querySelectorAll('.player-card').forEach(function(el, i) {
    var rect = el.getBoundingClientRect();
    var nameEl = el.querySelector('.player-name');
    var name = nameEl ? nameEl.textContent : 'Player ' + (i+1);
    console.log('  ' + name + ': ' + Math.round(rect.width) + 'px x ' + Math.round(rect.height) + 'px (top: ' + Math.round(rect.top) + 'px)');
  });

  // Todos os itens
  console.log('\n🎒 ITEM SLOTS:');
  var itemSlots = document.querySelectorAll('.item-slot');
  if (itemSlots.length > 0) {
    var firstSlot = itemSlots[0].getBoundingClientRect();
    console.log('  Total: ' + itemSlots.length + ' slots');
    console.log('  Tamanho cada: ' + Math.round(firstSlot.width) + 'px x ' + Math.round(firstSlot.height) + 'px');
  }

  // Corações
  console.log('\n❤️ CORAÇÕES:');
  var hearts = document.querySelectorAll('.heart-icon, .health-heart');
  if (hearts.length > 0) {
    var firstHeart = hearts[0].getBoundingClientRect();
    console.log('  Total: ' + hearts.length + ' corações');
    console.log('  Tamanho cada: ' + Math.round(firstHeart.width) + 'px x ' + Math.round(firstHeart.height) + 'px');
  }

  // Espaço usado vs disponível
  console.log('\n📊 USO DO ESPAÇO:');
  var gameBoard = document.querySelector('.game-board');
  if (gameBoard) {
    var rect = gameBoard.getBoundingClientRect();
    var usedHeight = rect.height;
    var availableHeight = window.innerHeight;
    var usedWidth = rect.width;
    var availableWidth = window.innerWidth;

    console.log('  Altura usada: ' + Math.round(usedHeight) + 'px de ' + availableHeight + 'px (' + Math.round(usedHeight/availableHeight*100) + '%)');
    console.log('  Largura usada: ' + Math.round(usedWidth) + 'px de ' + availableWidth + 'px (' + Math.round(usedWidth/availableWidth*100) + '%)');

    if (usedHeight > availableHeight) {
      console.log('  ⚠️ PRECISA SCROLL VERTICAL: ' + Math.round(usedHeight - availableHeight) + 'px');
    }
    if (usedWidth > availableWidth) {
      console.log('  ⚠️ PRECISA SCROLL HORIZONTAL: ' + Math.round(usedWidth - availableWidth) + 'px');
    }
  }

  // Detectar breakpoint atual
  console.log('\n🖥️ BREAKPOINT DETECTADO:');
  var w = window.innerWidth;
  if (w >= 1400) console.log('  Desktop XL (>= 1400px)');
  else if (w >= 1200) console.log('  Desktop LG (1200-1399px)');
  else if (w >= 992) console.log('  Desktop MD (992-1199px)');
  else if (w >= 768) console.log('  Tablet (768-991px)');
  else if (w >= 576) console.log('  Mobile LG (576-767px)');
  else console.log('  Mobile SM (< 576px)');

  var h = window.innerHeight;
  if (h < 700) console.log('  ⚠️ Altura muito baixa! Precisa layout compacto');
  else if (h < 800) console.log('  ⚠️ Altura limitada. Considere reduzir elementos');
  else if (h < 900) console.log('  Altura OK mas pode precisar ajustes');
  else console.log('  Altura confortável');

  // Sugestões
  console.log('\n💡 SUGESTÕES BASEADAS NA SUA TELA:');
  if (h < 800) {
    console.log('  1. Reduzir padding do .game-board de 1.5rem para 0.75rem');
    console.log('  2. Reduzir gap entre elementos de 1rem para 0.5rem');
    console.log('  3. Diminuir tamanho do cilindro em 20%');
    console.log('  4. Compactar cards dos jogadores');
    console.log('  5. Reduzir tamanho dos itens');
  }
  if (w < 1200) {
    console.log('  - Considere layout de 2 colunas para jogadores');
  }

  console.log('\n=== FIM DO DIAGNÓSTICO ===');
  console.log('Cole os resultados aqui para eu analisar e ajustar o CSS!');
})();
