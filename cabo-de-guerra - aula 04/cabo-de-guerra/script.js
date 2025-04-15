// Variáveis globais
const userTeam = [];
let cpuTeam = [];
let isSelecting = true;
let lastScrollTime = 0;
const scrollThrottleTime = 50;

// Elementos da UI
const selectionControls = document.querySelector('.selection-controls');
const selectedCountDisplay = document.querySelector('.selected-characters h3');
const selectedList = document.querySelector('.selected-list');
const confirmButton = document.getElementById('confirm-selection');
const battleView = document.querySelector('.battle-view');
const userTeamDisplay = document.querySelector('.user-team .team-members');
const cpuTeamDisplay = document.querySelector('.cpu-team .team-members');


// Carregar time salvo ao iniciar
document.addEventListener('DOMContentLoaded', () => {
  loadTeam();
  
  // Verificar suporte a animações baseadas em scroll
  if (!CSS.supports('animation-timeline', 'scroll()')) {
    document.querySelector('aside').style.display = 'block';
    setupScrollFallback();
  }
});

// Função para controlar o scroll
function f(k) {
  if(Math.abs(k) > .5) {
    scrollTo(0, .5*(k - Math.sign(k) + 1)*(
      document.documentElement.offsetHeight - window.innerHeight
    ))
  }
}

// Inicializa com valor -1
f(-1);

// Evento de scroll com throttling
addEventListener('scroll', () => {
  const now = Date.now();
  if (now - lastScrollTime >= scrollThrottleTime) {
    f(+getComputedStyle(document.body).getPropertyValue('--k'));
    lastScrollTime = now;
  }
});

// Fallback para navegadores sem suporte a scroll-driven animations
function setupScrollFallback() {
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollY / maxScroll;
    document.querySelector('.assembly').style.transform = 
      `rotateY(${progress * 360}deg)`;
  });
}

// Seleção de personagens
document.querySelectorAll('article').forEach(character => {
  character.addEventListener('click', () => {
    if (!isSelecting) return;
    
    const img = character.querySelector('img');
    const name = character.querySelector('h2').textContent;
    const anime = character.querySelector('em').textContent;
    
    // Verificar se já foi selecionado
    if (userTeam.some(char => char.name === name)) {
      // Feedback visual
      character.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-5px)' },
        { transform: 'translateX(5px)' },
        { transform: 'translateX(0)' }
      ], {
        duration: 300,
        iterations: 2
      });
      return;
    }
    
    // Limitar a 3 personagens
    if (userTeam.length >= 3) {
      // Feedback visual
      character.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.1)' },
        { transform: 'scale(1)' }
      ], {
        duration: 300,
        iterations: 2
      });
      return;
    }
    
    // Adicionar ao time
    userTeam.push({
      imgSrc: img.src,
      name,
      anime,
      element: character
    });
    
    // Salvar no localStorage
    saveTeam();
    
    // Atualizar UI
    updateSelectionUI();
    
    // Ativar botão quando tiver 3 personagens
    if (userTeam.length === 3) {
      confirmButton.disabled = false;
    }
  });
});

// Atualizar a UI de seleção
function updateSelectionUI() {
  selectedCountDisplay.textContent = `Seu Time (${userTeam.length}/3)`;
  selectedList.innerHTML = '';
  
  userTeam.forEach((char, index) => {
    const container = document.createElement('div');
    container.className = 'selected-character-container';
    
    const img = document.createElement('img');
    img.src = char.imgSrc;
    img.alt = char.name;
    img.title = `${char.name}\n${char.anime}`;
    
    // Botão para remover personagem
    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '&times;';
    removeBtn.className = 'remove-character';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeCharacter(index);
    });
    
    container.appendChild(img);
    container.appendChild(removeBtn);
    selectedList.appendChild(container);
  });
}

// Remover personagem do time
function removeCharacter(index) {
  // Resetar estilo do elemento
  userTeam[index].element.style.transform = '';
  userTeam[index].element.style.boxShadow = '';
  
  // Remover do array
  userTeam.splice(index, 1);
  
  // Salvar alterações
  saveTeam();
  
  // Atualizar UI
  updateSelectionUI();
  
  // Desativar botão de confirmação se tiver menos de 3
  if (userTeam.length < 3) {
    confirmButton.disabled = true;
  }
}

// Salvar time no localStorage
function saveTeam() {
  const teamToSave = userTeam.map(char => ({
    imgSrc: char.imgSrc,
    name: char.name,
    anime: char.anime
  }));
  localStorage.setItem('userTeam', JSON.stringify(teamToSave));
}

// Carregar time do localStorage
function loadTeam() {
  const saved = localStorage.getItem('userTeam');
  if (saved) {
    const savedTeam = JSON.parse(saved);
    
    savedTeam.forEach(savedChar => {
      const characterElement = [...document.querySelectorAll('article')].find(el => {
        return el.querySelector('h2').textContent === savedChar.name;
      });
      
      if (characterElement && userTeam.length < 3) {
        userTeam.push({
          imgSrc: savedChar.imgSrc,
          name: savedChar.name,
          anime: savedChar.anime,
          element: characterElement
        });
        
        // Destacar personagem selecionado
        characterElement.style.transform = 'scale(1.1)';
        characterElement.style.boxShadow = '0 0 15px #4CAF50';
      }
    });
    
    updateSelectionUI();
    if (userTeam.length === 3) {
      confirmButton.disabled = false;
    }
  }
}

// Confirmar seleção
confirmButton.addEventListener('click', () => {
  isSelecting = false;
  selectionControls.classList.add('hidden');
  battleView.classList.add('active');
  
  // Gerar time da CPU
  cpuTeam = generateCPUTeam();
  
  // Mostrar times
  displayTeams();
  
  // Simular batalha após um delay
  setTimeout(simulateBattle, 1500);
});

// Gerar time da CPU
function generateCPUTeam() {
  const allCharacters = Array.from(document.querySelectorAll('article'));
  const availableCharacters = allCharacters.filter(char => {
    const name = char.querySelector('h2').textContent;
    return !userTeam.some(uChar => uChar.name === name);
  });
  
  // Embaralhar e pegar 3
  const shuffled = [...availableCharacters].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3).map(char => ({
    imgSrc: char.querySelector('img').src,
    name: char.querySelector('h2').textContent,
    anime: char.querySelector('em').textContent,
    element: char
  }));
}

// Mostrar times na batalha
function displayTeams() {
  userTeamDisplay.innerHTML = '';
  cpuTeamDisplay.innerHTML = '';
  
  // Mostrar time do usuário
  userTeam.forEach(char => {
    const charElement = createCharacterCard(char, 'user');
    userTeamDisplay.appendChild(charElement);
  });
  
  // Mostrar time da CPU
  cpuTeam.forEach(char => {
    const charElement = createCharacterCard(char, 'cpu');
    cpuTeamDisplay.appendChild(charElement);
  });
}

// Criar card de personagem para a batalha
function createCharacterCard(char, team) {
  const charElement = document.createElement('div');
  charElement.className = 'team-character';
  charElement.innerHTML = `
    <img src="${char.imgSrc}" alt="${char.name}">
    <h4>${char.name}</h4>
    <p>${char.anime}</p>
    <div class="power-level">?</div>
  `;
  charElement.dataset.name = char.name;
  return charElement;
}

// Simular batalha
function simulateBattle() {
  // Calcular poder para cada personagem
  const userPowers = userTeam.map(char => calculatePower(char));
  const cpuPowers = cpuTeam.map(char => calculatePower(char));
  
  // Mostrar poderes
  showPowerLevels(userPowers, cpuPowers);
  
  // Determinar vencedores de cada batalha
  setTimeout(() => {
    const battleResults = [];
    for (let i = 0; i < 3; i++) {
      const userChar = userTeam[i];
      const cpuChar = cpuTeam[i];
      const userPower = userPowers[i];
      const cpuPower = cpuPowers[i];
      
      const winner = userPower > cpuPower ? 'user' : 'cpu';
      battleResults.push({
        winner,
        userChar,
        cpuChar,
        userPower,
        cpuPower
      });
    }
    
    // Mostrar resultados
    showBattleResults(battleResults);
  }, 2000);
}

// Calcular poder de um personagem (lógica simples de exemplo)
function calculatePower(char) {
  // Fatores: tamanho do nome, tamanho do anime e randomização
  const namePower = char.name.length * 5;
  const animePower = char.anime.length * 2;
  const randomFactor = Math.random() * 30;
  
  return Math.round(namePower + animePower + randomFactor);
}

// Mostrar níveis de poder
function showPowerLevels(userPowers, cpuPowers) {
  const userCharacters = userTeamDisplay.querySelectorAll('.team-character');
  const cpuCharacters = cpuTeamDisplay.querySelectorAll('.team-character');
  
  userCharacters.forEach((charEl, i) => {
    const powerEl = charEl.querySelector('.power-level');
    powerEl.textContent = userPowers[i];
    powerEl.style.color = '#4CAF50';
    powerEl.style.fontWeight = 'bold';
  });
  
  cpuCharacters.forEach((charEl, i) => {
    const powerEl = charEl.querySelector('.power-level');
    powerEl.textContent = cpuPowers[i];
    powerEl.style.color = '#F44336';
    powerEl.style.fontWeight = 'bold';
  });
}
// Mostrar resultados da batalha
function showBattleResults(results, userWins) {
  // Garantir que qualquer resultado anterior seja removido
  const existingResult = document.querySelector('.battle-result');
  if (existingResult) existingResult.remove();

  const userCharacters = userTeamDisplay.querySelectorAll('.team-character');
  const cpuCharacters = cpuTeamDisplay.querySelectorAll('.team-character');
  
  // Adicionar classes de vitória/derrota
  results.forEach((result, i) => {
    userCharacters[i].classList.add(result.winner === 'user' ? 'winner' : 'loser');
    cpuCharacters[i].classList.add(result.winner === 'cpu' ? 'winner' : 'loser');
  });
  
  // Criar elemento de resultado
  const resultEl = document.createElement('div');
  resultEl.className = 'battle-result';
  resultEl.innerHTML = `
    <h3>${getResultMessage(userWins)}</h3>
    <div class="battle-actions">
      <button id="rematch-button" class="button">Revanche</button>
      <button id="new-team-button" class="button">Novo Time</button>
    </div>
  `;
  
  battleView.appendChild(resultEl);
  
  // Configurar botões de revanche e novo time
  document.getElementById('rematch-button').addEventListener('click', () => {
    resetBattle();
    resultEl.remove(); // Remover resultado atual antes de iniciar a revanche
  });
  
  document.getElementById('new-team-button').addEventListener('click', () => {
    resetGame();
    resultEl.remove(); // Remover resultado ao iniciar novo time
  });
}

// Resetar batalha
function resetBattle() {
  // Remover classes de resultado
  document.querySelectorAll('.winner, .loser').forEach(el => el.classList.remove('winner', 'loser'));
  
  // Resetar power levels
  document.querySelectorAll('.power-level').forEach(el => {
    el.textContent = '?';
    el.style.color = '';
    el.style.fontWeight = '';
  });
  
  // Simular nova batalha após um pequeno delay
  setTimeout(simulateBattle, 500);
}

// Resetar o jogo
function resetGame() {
  battleView.classList.remove('active');
  selectionControls.classList.remove('hidden');
  isSelecting = true;
  userTeam.length = 0;
  updateSelectionUI();
  confirmButton.disabled = true;
  
  // Limpar localStorage
  localStorage.removeItem('userTeam');
}


// Função para criar efeito de confete
function createConfetti() {
  const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];
  
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);
  
  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = `${Math.random() * 3}s`;
    confetti.style.width = `${Math.random() * 8 + 4}px`;
    confetti.style.height = confetti.style.width;
    container.appendChild(confetti);
  }
  
  setTimeout(() => {
    container.remove();
  }, 3000);
}

// Função para mostrar animação de batalha
function showBattleAnimation() {
  const battleView = document.querySelector('.battle-view');
  const progressBar = document.createElement('div');
  progressBar.className = 'battle-progress';
  progressBar.innerHTML = '<div class="progress-bar"></div>';
  battleView.insertBefore(progressBar, battleView.querySelector('.teams-container'));
  
  // Animação da barra de progresso
  setTimeout(() => {
    const bar = document.querySelector('.progress-bar');
    bar.style.width = '100%';
  }, 100);
  
  // Efeito de pulsação nos personagens
  const characters = document.querySelectorAll('.team-character');
  characters.forEach(char => {
    char.style.animation = 'pulse 0.5s ease infinite alternate';
  });
  
  // Remover animações após 2 segundos
  setTimeout(() => {
    characters.forEach(char => {
      char.style.animation = '';
    });
  }, 2000);
}

// Modificar a função simulateBattle para incluir as animações
function simulateBattle() {
  showBattleAnimation();
  
  // Calcular poder para cada personagem após a animação
  setTimeout(() => {
    const userPowers = userTeam.map(char => calculatePower(char));
    const cpuPowers = cpuTeam.map(char => calculatePower(char));
    
    // Mostrar poderes
    showPowerLevels(userPowers, cpuPowers);
    
    // Determinar vencedores de cada batalha
    setTimeout(() => {
      const battleResults = [];
      let userWins = 0;
      
      for (let i = 0; i < 3; i++) {
        const userChar = userTeam[i];
        const cpuChar = cpuTeam[i];
        const userPower = userPowers[i];
        const cpuPower = cpuPowers[i];
        
        const winner = userPower > cpuPower ? 'user' : 'cpu';
        if (winner === 'user') userWins++;
        
        battleResults.push({
          winner,
          userChar,
          cpuChar,
          userPower,
          cpuPower
        });
      }
      
      // Mostrar resultados
      showBattleResults(battleResults, userWins);
      
      // Efeito de confete se o usuário vencer
      if (userWins >= 2) {
        createConfetti();
      }
    }, 1000);
  }, 2000);
}

// Função melhorada para mostrar resultados
function showBattleResults(results, userWins) {
  const userCharacters = userTeamDisplay.querySelectorAll('.team-character');
  const cpuCharacters = cpuTeamDisplay.querySelectorAll('.team-character');
  
  // Adicionar classes de vitória/derrota
  results.forEach((result, i) => {
    if (result.winner === 'user') {
      userCharacters[i].classList.add('winner');
      cpuCharacters[i].classList.add('loser');
    } else {
      cpuCharacters[i].classList.add('winner');
      userCharacters[i].classList.add('loser');
    }
  });
  
  // Criar elemento de resultado
  const resultEl = document.createElement('div');
  resultEl.className = 'battle-result';
  
  // Mensagem baseada no resultado
  let resultMessage = '';
  if (userWins === 3) {
    resultMessage = `Vitória esmagadora! ${userWins} a ${3 - userWins}`;
  } else if (userWins === 2) {
    resultMessage = `Você venceu! ${userWins} a ${3 - userWins}`;
  } else if (userWins === 1) {
    resultMessage = `Você perdeu... ${userWins} a ${3 - userWins}`;
  } else {
    resultMessage = `Derrota total! ${userWins} a ${3 - userWins}`;
  }
  
  resultEl.innerHTML = `
    <h3>${resultMessage}</h3>
    <div class="battle-actions">
      <button id="rematch-button" class="button">Revanche</button>
      <button id="new-team-button" class="button">Novo Time</button>
    </div>
  `;
  
 
  // Adicionar ao DOM
  const progressBar = document.querySelector('.battle-progress');
  if (progressBar) progressBar.remove();
  
  battleView.appendChild(resultEl);
  
  // Configurar botões
  document.getElementById('rematch-button').addEventListener('click', () => {
    resultEl.remove();
    resetBattle();
  });
  
  document.getElementById('new-team-button').addEventListener('click', () => {
    battleView.classList.remove('active');
    selectionControls.classList.remove('hidden');
    isSelecting = true;
    
    
    
    // Resetar seleção
    userTeam.forEach(char => {
      char.element.style.transform = '';
      char.element.style.boxShadow = '';
    });
    
    userTeam.length = 0;
    updateSelectionUI();
    confirmButton.disabled = true;
    
    // Limpar localStorage
    localStorage.removeItem('userTeam');
    
    // Remover resultado
    resultEl.remove();
  });
}

// Função para resetar a batalha
function resetBattle() {
  // Remover classes de resultado
  document.querySelectorAll('.winner, .loser').forEach(el => {
    el.classList.remove('winner', 'loser');
  });
  
  // Resetar power levels
  document.querySelectorAll('.power-level').forEach(el => {
    el.textContent = '?';
    el.style.color = '';
    el.style.fontWeight = '';
  });
  
  // Gerar novo time da CPU
  cpuTeam = generateCPUTeam();
  
  // Atualizar exibição
  displayTeams();
  
  // Simular nova batalha após um delay
  setTimeout(simulateBattle, 1000);
}

// Atualizar a função updateSelectionUI para incluir hover nos personagens selecionados
function updateSelectionUI() {
  selectedCountDisplay.textContent = `Seu Time (${userTeam.length}/3)`;
  selectedList.innerHTML = '';
  
  userTeam.forEach((char, index) => {
    const container = document.createElement('div');
    container.className = 'selected-character-container';
    
    const img = document.createElement('img');
    img.src = char.imgSrc;
    img.alt = char.name;
    img.title = `${char.name}\n${char.anime}`;
    
    // Botão para remover personagem
    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '&times;';
    removeBtn.className = 'remove-character';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeCharacter(index);
    });
    
    // Tooltip para o personagem
    const tooltip = document.createElement('div');
    tooltip.className = 'character-tooltip';
    tooltip.textContent = char.name;
    
    container.appendChild(img);
    container.appendChild(removeBtn);
    container.appendChild(tooltip);
    selectedList.appendChild(container);
  });
}