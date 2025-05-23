// Константы и переменные состояния
const BAT_HIT_DURATION = 750;
let isBlackoutActive = false;
let batHitCount = 0;
let hasAngryEyebrows = false;
let isEyeRed = false;
let isEvaporating = false;
let evaporationProgress = 0;
let isWorldUpsideDown = false;
let batSpeedMultiplier = 1.0;
let lastBatSpeedIncrease = 0;
let language = 'ru';
let totalScore = 0;
let inHell = false;
let inYellowReverse = false;
let shakeAnimationId = null;
let animationFrameId = null;
let catchNoticeTimeout = null;

// DOM элементы
const gameTitle = document.getElementById('gameTitle');
const startControls = document.getElementById('startControls');
const gameStartButton = document.getElementById('gameStartButton');
const menuMusic = document.getElementById('menuMusic');
const bgMusic = document.getElementById('bgMusic');
const blackWorldMusic = document.getElementById('blackWorldMusic');
const settingsButton = document.getElementById('settingsButton');
const pauseMenu = document.getElementById('pauseMenu');
const volumeSlider = document.getElementById('volumeSlider');
const resumeButton = document.getElementById('resumeButton');
const volumeLabel = document.getElementById('volumeLabel');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Игровые переменные
let gameStarted = false;
let isPaused = false;
let score = 0;
let lives = 3;
let gameOverTriggered = false;
let difficulty = 1;
let lastSpawnX = null;
let clearRobuxesNextFrame = false;
let darkWorldInterval = null;
let hellInterval = null;

// Игрок
const player = {
  x: canvas ? canvas.width / 2 : 0,
  y: canvas ? canvas.height - 100 : 0,
  radius: 40,
  speed: 7,
  color: 'yellow'
};

let robuxes = [];
let moveLeft = false;
let moveRight = false;

// Инициализация при загрузке
window.addEventListener('load', () => {
  language = localStorage.getItem('language') || 'ru';
  totalScore = parseInt(localStorage.getItem('totalScore')) || 0;
  
  const totalScoreText = document.getElementById('totalScoreText');
  if (totalScoreText) {
    totalScoreText.textContent = language === 'ru'
      ? `Общий счёт: ${totalScore}`
      : `Total Score: ${totalScore}`;
  }
  
  if (volumeSlider) {
    const initialVolume = 0.5;
    volumeSlider.value = initialVolume;
    setAudioVolume(initialVolume);
  }

  // Начать воспроизведение музыки меню
  if (menuMusic) {
    menuMusic.volume = 0.5;
    menuMusic.play().catch(e => console.error("Menu music play error:", e));
  }
});

// Очистка ресурсов перед выгрузкой страницы
window.addEventListener('beforeunload', () => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (shakeAnimationId) cancelAnimationFrame(shakeAnimationId);
  
  [bgMusic, menuMusic, blackWorldMusic, hellMusic, yellowReverseMusic].forEach(audio => {
    if (audio) {
      audio.pause();
      audio.src = '';
    }
  });
});

// Установка громкости для всех аудио элементов
function setAudioVolume(volumeValue) {
  const audioElements = [
    bgMusic, menuMusic, blackWorldMusic, hellMusic,
    document.getElementById('yellowReverseMusic'),
    document.getElementById('flipSound'),
    document.getElementById('blackoutSound'),
    document.getElementById('meowSound'),
    document.getElementById('grayRobuxSound'),
    document.getElementById('deathSound'),
    document.getElementById('batHitSound')
  ];
  
  audioElements.forEach(audio => {
    if (audio) {
      try {
        audio.volume = audio === document.getElementById('batHitSound') 
          ? Math.min(volumeValue * 1.5, 1) 
          : volumeValue;
      } catch (e) {
        console.error("Error setting volume:", e);
      }
    }
  });
}

// Обработчики выбора языка
document.getElementById('languageRu')?.addEventListener('click', () => {
  language = 'ru';
  localStorage.setItem('language', 'ru');
  setLanguage();
});

document.getElementById('languageEn')?.addEventListener('click', () => {
  language = 'en';
  localStorage.setItem('language', 'en');
  setLanguage();
});

function setLanguage() {
  const languageSelection = document.getElementById('languageSelection');
  if (languageSelection) languageSelection.style.display = 'none';
  
  if (gameTitle) {
    gameTitle.textContent = language === 'ru' ? 'ЭВИЛ КЕШ РЕЙН' : 'EVIL CASH RAIN';
    gameTitle.style.display = 'block';
  }
  
  if (gameStartButton) {
    gameStartButton.textContent = language === 'ru' ? 'Начать игру' : 'Start Game';
  }
  
  if (resumeButton) {
    resumeButton.textContent = language === 'ru' ? 'Продолжить' : 'Resume';
  }
  
  if (volumeLabel) {
    volumeLabel.textContent = language === 'ru' ? 'Громкость' : 'Volume';
  }
  
  const menuButton = document.getElementById('menuButton');
  if (menuButton) {
    menuButton.textContent = language === 'ru' ? 'Меню' : 'Menu';
  }
  
  if (startControls) {
    startControls.style.display = 'flex';
  }
}

// Обработчики управления для мобильных устройств
document.getElementById('leftButton')?.addEventListener('touchstart', (e) => { 
  e.preventDefault(); 
  moveLeft = true; 
}, {passive: false});

document.getElementById('leftButton')?.addEventListener('touchend', () => moveLeft = false);

document.getElementById('rightButton')?.addEventListener('touchstart', (e) => { 
  e.preventDefault(); 
  moveRight = true; 
}, {passive: false});

document.getElementById('rightButton')?.addEventListener('touchend', () => moveRight = false);

// Обработчики кнопок
gameStartButton?.addEventListener('click', () => {
  if (startControls) startControls.style.display = 'none';
  if (gameTitle) {
    gameTitle.style.opacity = '0';
    gameTitle.style.transform = 'scale(0)';
  }
  if (settingsButton) settingsButton.style.display = 'block';
  if (menuMusic) menuMusic.pause();
  if (bgMusic) {
    bgMusic.currentTime = 0;
    bgMusic.play().catch(e => console.error("BG music play error:", e));
  }
  if (document.getElementById('controls')) {
    document.getElementById('controls').style.display = 'flex';
  }
  gameStarted = true;
  isPaused = false;
  gameLoop();
});

settingsButton?.addEventListener('click', () => {
  isPaused = true;
  if (pauseMenu) pauseMenu.style.display = 'flex';
  
  // Остановка всех интервалов создания врагов
  if (hellInterval) {
    clearInterval(hellInterval);
    hellInterval = null;
  }
  if (darkWorldInterval) {
    clearInterval(darkWorldInterval);
    darkWorldInterval = null;
  }
  
  // Пауза музыки в зависимости от текущего мира
  if (inHell && hellMusic) {
    hellMusic.pause();
  } else if (document.getElementById('blackRobuxWorld') && 
            document.getElementById('blackRobuxWorld').style.display === 'block' && 
            blackWorldMusic) {
    blackWorldMusic.pause();
  } else if (inYellowReverse && document.getElementById('yellowReverseMusic')) {
    document.getElementById('yellowReverseMusic').pause();
  } else if (bgMusic) {
    bgMusic.pause();
  }
});

resumeButton?.addEventListener('click', () => {
  isPaused = false;
  if (pauseMenu) pauseMenu.style.display = 'none';
  
  // Возобновление интервалов создания врагов
  if (inHell && hellMusic) {
    hellMusic.play().catch(e => console.error("Hell music play error:", e));
    hellInterval = setInterval(() => {
      if (inHell && !isPaused) {
        const speedMultiplier = getSpeedMultiplier();
        robuxes.push({
          x: Math.random() * (canvas.width - 60),
          y: 0,
          radius: 30,
          speed: (3 + Math.random()) * speedMultiplier,
          color: 'darkred',
          type: 'red'
        });
      }
    }, 800);
  } else if (document.getElementById('blackRobuxWorld') && 
            document.getElementById('blackRobuxWorld').style.display === 'block' && 
            blackWorldMusic) {
    blackWorldMusic.play().catch(e => console.error("Black world music play error:", e));
    darkWorldInterval = setInterval(() => {
      if (!isPaused) {
        const speedMultiplier = getSpeedMultiplier();
        robuxes.push({
          x: Math.random() * (canvas.width - 60),
          y: 0,
          radius: 30,
          speed: (2 + Math.random() * 2) * speedMultiplier,
          color: 'black',
          type: 'dark'
        });
      }
    }, 1000);
  } else if (inYellowReverse && document.getElementById('yellowReverseMusic')) {
    document.getElementById('yellowReverseMusic').play().catch(e => console.error("Yellow reverse music play error:", e));
    darkWorldInterval = setInterval(() => {
      if (!isPaused) {
        const speedMultiplier = getSpeedMultiplier() * batSpeedMultiplier;
        let yPos = isWorldUpsideDown ? canvas.height : 0;
        let speed = (2 + Math.random()) * speedMultiplier * (isWorldUpsideDown ? -1 : 1);
        
        // После переворота добавляем новых врагов - вампиров
        let type = 'bat';
        if (isWorldUpsideDown && Math.random() < 0.3) {
          type = 'vampire';
        }
        
        robuxes.push({
          x: Math.random() * (canvas.width - 60),
          y: yPos,
          radius: 30,
          speed: speed,
          type: type
        });
      }
    }, 1000);
  } else if (bgMusic) {
    bgMusic.play().catch(e => console.error("BG music play error:", e));
  }
});

volumeSlider?.addEventListener('input', () => {
  const volumeValue = volumeSlider.value;
  setAudioVolume(volumeValue);
});

// Игровая логика
function resizeCanvas() {
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function updatePlayer() {
  if (!canvas) return;
  
  if (moveLeft && player.x > player.radius) player.x -= player.speed;
  if (moveRight && player.x < canvas.width - player.radius) player.x += player.speed;
  
  // Ограничение по Y в перевернутом мире
  if (isWorldUpsideDown) {
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
  } else {
    player.y = Math.max(canvas.height - 100, Math.min(canvas.height - player.radius, player.y));
  }
}

function getSpeedMultiplier() {
  if (score < 300) {
    return 1 + (score / 300);
  } else {
    return 2 + Math.min((score - 300) / 700, 1);
  }
}

function createRobux() {
  if (!canvas || inYellowReverse || isPaused) return;
  
  if (!inHell && !(document.getElementById('blackRobuxWorld') && 
      document.getElementById('blackRobuxWorld').style.display.includes('block')) && 
      robuxes.length === 0) {
    const speedMultiplier = getSpeedMultiplier();
    const x1 = Math.random() * (canvas.width - 60);
    const isFast1 = Math.random() < 0.5;
    const speed1 = isFast1 ? 3 * speedMultiplier : 1.5 * speedMultiplier;
    const color1 = isFast1 ? 'red' : 'green';
    robuxes.push({ x: x1, y: 0, radius: 30, speed: speed1, color: color1, type: isFast1 ? 'red' : 'green' });
    
    setTimeout(() => {
      if (gameStarted && !isPaused && robuxes.length <= 1) {
        const x2 = Math.random() * (canvas.width - 60);
        const isFast2 = Math.random() < 0.5;
        const speed2 = isFast2 ? 3 * speedMultiplier : 1.5 * speedMultiplier;
        const color2 = isFast2 ? 'red' : 'green';
        robuxes.push({ x: x2, y: 0, radius: 30, speed: speed2, color: color2, type: isFast2 ? 'red' : 'green' });
      }
    }, 1000);
    return;
  }

  if (Math.random() < 0.004 * difficulty && !isPaused) {
    let x;
    do {
      x = Math.random() * (canvas.width - 60);
    } while (lastSpawnX !== null && Math.abs(x - lastSpawnX) < 150);
    lastSpawnX = x;

    let robux;
    const speedMultiplier = getSpeedMultiplier();

    const rand = Math.random();
    if (rand < 0.005) {
      robux = { x, y: 0, radius: 30, speed: 2 * speedMultiplier, color: 'yellow', type: 'invertedPlayer' };
    } else if (rand < 0.015 && !inHell) {
      robux = { 
        x, y: 0, radius: 30, speed: 2 * speedMultiplier, 
        color: 'white', 
        type: 'whiteRainbow', 
        direction: Math.random() < 0.5 ? -1 : 1 
      };
    } else if (rand < 0.035) {
      robux = { x, y: 0, radius: 30, speed: 4 * speedMultiplier, color: 'gold', type: 'gold' };
      showCatchNotice();
    } else if (rand < 0.055) {
      robux = { x, y: 0, radius: 30, speed: 2 * speedMultiplier, color: 'black', type: 'black' };
    } else if (rand < 0.205) {
      robux = { x, y: 0, radius: 30, speed: 2.5 * speedMultiplier, color: 'pink', type: 'pink' };
    } else if (score >= 50 && Math.random() < 0.3) {
      robux = { x, y: 0, radius: 35, speed: 1 * speedMultiplier, color: 'blue', type: 'blue' };
    } else {
      const isFast = Math.random() < 0.2;
      const speed = isFast ? 3 * speedMultiplier : 1.5 * speedMultiplier;
      const color = isFast ? 'red' : 'green';
      robux = { x, y: 0, radius: 30, speed, color, type: isFast ? 'red' : 'green' };
    }
    robuxes.push(robux);
  }
}

function updateRobuxes() {
  if (!canvas) return;
  
  const now = Date.now();
  if (inYellowReverse && now - lastBatSpeedIncrease > 1000) {
    batSpeedMultiplier *= 1.005;
    lastBatSpeedIncrease = now;
  }

  for (let i = robuxes.length - 1; i >= 0; i--) {
      const r = robuxes[i];
      if (!r) continue;
      
      r.y += r.speed * (r.type === 'bat' || r.type === 'vampire' ? batSpeedMultiplier : 1);
      if (r.type === 'whiteRainbow') {
          r.x += 2 * r.direction;
          if (r.x < r.radius || r.x > canvas.width - r.radius) {
              r.direction *= -1;
          }
      }

      const dx = player.x - r.x;
      const dy = player.y - r.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < player.radius + r.radius) {
          robuxes.splice(i, 1);
          if (r.type === 'gold') {
              score += 5;
          } else if (r.type === 'black') {
              activateBlackRobuxEffect();
          } else if (r.type === 'pink') {
              activateFlamingoEffect();
          } else if (r.type === 'whiteRainbow') {
              enterHellWorld();
          } else if (r.type === 'invertedPlayer') {
              enterYellowReverseWorld();
          } else if (r.type === 'bat' || r.type === 'vampire') {
              if (!isBlackoutActive) {
                  lives--;
                  batHitCount++;
                  applyBatDamageEffects();
                  showBatHitEffect();
                  if (lives <= 0) {
                      endGame();
                      return;
                  }
              }
          } else if (r.type === 'grayFinal') {
              showGrayRobuxEffect();
          } else {
              if (!isBlackoutActive) {
                  lives--;
                  if (lives <= 0) {
                      endGame();
                      return;
                  }
              }
          }
      }

      if (r && ((!isWorldUpsideDown && r.y > canvas.height) || (isWorldUpsideDown && r.y < 0))) {
          robuxes.splice(i, 1);
          if (r.type === 'gold') {
              shakeScreen();
              if (score > 0) score--;
          } else if (r.type === 'grayFinal') {
              showGrayRobuxEffect();
          } else {
              score++;
              if (score % 10 === 0) difficulty += 0.03;
          }
      }
  }
}

function applyBatDamageEffects() {
  if (batHitCount === 1) {
    hasAngryEyebrows = true;
  } else if (batHitCount === 2) {
    isEyeRed = true;
  } else if (batHitCount >= 3) {
    if (!isEvaporating) {
      isEvaporating = true;
      evaporationProgress = 0;
      startEvaporation();
    }
  }
}

function startEvaporation() {
  const evaporationInterval = setInterval(() => {
    if (!isPaused && isEvaporating) {
      evaporationProgress += 0.01;
      if (evaporationProgress >= 1) {
        clearInterval(evaporationInterval);
        lives = 0;
        endGame();
      }
    } else if (!isEvaporating) {
      clearInterval(evaporationInterval);
    }
  }, 100);
}

function showBatHitEffect() {
  const effect = document.getElementById('batHitEffect');
  const sound = document.getElementById('batHitSound');
  
  if (effect) effect.style.display = 'flex';
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(e => console.error("Bat hit sound play error:", e));
  }
  
  setTimeout(() => {
    if (effect) effect.style.display = 'none';
  }, BAT_HIT_DURATION);
}

function drawPlayer() {
  if (!ctx || !canvas) return;
  
  if (isEvaporating) {
    ctx.globalAlpha = 1 - evaporationProgress;
  }
  
  ctx.fillStyle = player.color || 'yellow';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius * (1 - evaporationProgress * 0.5), 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'black';
  if (isEyeRed) {
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(player.x - 10, player.y - 10, 5 * (1 - evaporationProgress * 0.5), 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'red';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(player.x + 10, player.y - 10, 5 * (1 - evaporationProgress * 0.5), 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(player.x - 10, player.y - 10, 5 * (1 - evaporationProgress * 0.5), 0, Math.PI * 2);
    ctx.arc(player.x + 10, player.y - 10, 5 * (1 - evaporationProgress * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(player.x, player.y + 5, 15 * (1 - evaporationProgress * 0.5), 0, Math.PI);
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2 * (1 - evaporationProgress * 0.5);
  ctx.stroke();

  if (hasAngryEyebrows) {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3 * (1 - evaporationProgress * 0.5);
    
    ctx.beginPath();
    ctx.moveTo(player.x - 20, player.y - 20);
    ctx.lineTo(player.x - 5, player.y - 15);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(player.x + 20, player.y - 20);
    ctx.lineTo(player.x + 5, player.y - 15);
    ctx.stroke();
  }
  
  ctx.globalAlpha = 1;
}

function drawRobux(robux) {
  if (!ctx || !robux) return;

  if (robux.type === 'vampire') {
    drawVampire(robux);
    return;
  }

  ctx.fillStyle = robux.color;
  ctx.beginPath();
  ctx.arc(robux.x, robux.y, robux.radius, 0, Math.PI * 2);
  ctx.fill();

  if (robux.type === 'gold') {
    const pulse = 1 + 0.1 * Math.sin(Date.now() / 100);
    ctx.save();
    ctx.translate(robux.x, robux.y);
    ctx.scale(pulse, pulse);
    ctx.translate(-robux.x, -robux.y);

    ctx.fillStyle = 'gold';
    ctx.beginPath();
    ctx.arc(robux.x, robux.y, robux.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'black';
    ctx.font = `${robux.radius * 1.2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('G', robux.x, robux.y);

    const r = robux.radius;
    const x = robux.x;
    const y = robux.y - r;

    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.9, r * 0.25, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#222';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x - r * 0.6, y);
    ctx.lineTo(x - r * 0.6, y - r * 1);
    ctx.quadraticCurveTo(x, y - r * 1.2, x + r * 0.6, y - r * 1);
    ctx.lineTo(x + r * 0.6, y);
    ctx.closePath();
    ctx.fillStyle = '#333';
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.9, r * 0.25, 0, 0, Math.PI);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fill();

    ctx.restore();
    return;
  }
  
  if (robux.type === 'black') {
    ctx.fillStyle = 'white';
    ctx.font = `${robux.radius * 1.2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', robux.x, robux.y);
    return;
  }
  
  if (robux.type === 'pink') {
    const r = robux.radius;
    const x = robux.x;
    const y = robux.y;
    
    const wingOffset = Math.sin(Date.now() / 200) * r * 0.1;

    ctx.fillStyle = 'lightpink';
    ctx.strokeStyle = 'deeppink';
    ctx.lineWidth = 2;

    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(x - r * 1.2 - wingOffset, y - r * 0.2 + i * r * 0.4, r * 0.4, r * 0.15, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(x + r * 1.2 + wingOffset, y - r * 0.2 + i * r * 0.4, r * 0.4, r * 0.15, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = 'deeppink';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.font = `${r * 1.2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('F', x, y);

    return;
  }
  
  if (robux.type === 'whiteRainbow') {
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(robux.x, robux.y, robux.radius, 0, Math.PI * 2);
    ctx.fill();

    const eyeColors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
    for (let i = 0; i < 2; i++) {
      const color = eyeColors[Math.floor(Date.now() / 100 + i * 3) % eyeColors.length];
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(robux.x - 10 + i * 20, robux.y - 10, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    return;
  }
  
  if (robux.type === 'red' || robux.type === 'green') {
    ctx.fillStyle = 'black';
    ctx.font = `${robux.radius * 1.2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', robux.x, robux.y);
  }

  if (robux.type === 'red') {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(robux.x - 15, robux.y - 15);
    ctx.lineTo(robux.x - 25, robux.y - 30);
    ctx.lineTo(robux.x - 10, robux.y - 20);
    ctx.moveTo(robux.x + 15, robux.y - 15);
    ctx.lineTo(robux.x + 25, robux.y - 30);
    ctx.lineTo(robux.x + 10, robux.y - 20);
    ctx.stroke();
  } else if (robux.type === 'blue') {
    const lensWidth = 18;
    const lensHeight = 12;
    const lensSpacing = 6;
    const topY = robux.y - 12;

    ctx.fillStyle = 'black';
    ctx.fillRect(robux.x - lensSpacing - lensWidth, topY, lensWidth, lensHeight);
    ctx.fillRect(robux.x + lensSpacing, topY, lensWidth, lensHeight);
    ctx.fillRect(robux.x - 2, topY + 3, 4, 2);

    ctx.beginPath();
    ctx.moveTo(robux.x - lensSpacing - lensWidth, topY + 2);
    ctx.lineTo(robux.x - lensSpacing - lensWidth - 6, topY + 2);
    ctx.moveTo(robux.x + lensSpacing + lensWidth, topY + 2);
    ctx.lineTo(robux.x + lensSpacing + lensWidth + 6, topY + 2);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    const smileRadius = robux.radius * 0.4;
    ctx.arc(robux.x, robux.y + 8, smileRadius, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.lineWidth = 2;
    ctx.stroke();
  } 
  
  if (robux.type === 'dark') {
    const img = new Image();
    img.onerror = () => {
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(robux.x, robux.y, robux.radius, 0, Math.PI * 2);
      ctx.fill();
    };
    img.src = 'my_face.png';
    ctx.drawImage(img, robux.x - robux.radius, robux.y - robux.radius, robux.radius * 2, robux.radius * 2);
    return;
  } 
  
  if (robux.type === 'invertedPlayer') {
    ctx.save();
    ctx.translate(robux.x, robux.y);
    ctx.scale(1, -1);
    ctx.translate(-robux.x, -robux.y);

    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(robux.x, robux.y, robux.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(robux.x - 10, robux.y - 10, 5, 0, Math.PI * 2);
    ctx.arc(robux.x + 10, robux.y - 10, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(robux.x, robux.y + 5, 15, 0, Math.PI);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'black';
    const hatWidth = robux.radius * 1.8;
    const hatHeight = robux.radius * 0.6;
    const hatY = robux.y - robux.radius * 0.8;
    
    ctx.beginPath();
    ctx.ellipse(robux.x, hatY, hatWidth * 0.5, hatHeight * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(robux.x, hatY - hatHeight * 0.3, hatWidth * 0.4, hatHeight * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.ellipse(robux.x, hatY - hatHeight * 0.3, hatWidth * 0.3, hatHeight * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    return;
  } 
  
  if (robux.type === 'grayFinal') {
    ctx.fillStyle = 'lightgray';
    ctx.beginPath();
    ctx.arc(robux.x, robux.y, robux.radius, 0, Math.PI * 2);
    ctx.fill();

    const earSize = robux.radius * 0.4;
    ctx.beginPath();
    ctx.moveTo(robux.x - earSize, robux.y - robux.radius);
    ctx.lineTo(robux.x - earSize / 2, robux.y - robux.radius - earSize);
    ctx.lineTo(robux.x, robux.y - robux.radius);
    ctx.fillStyle = 'black';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(robux.x + earSize, robux.y - robux.radius);
    ctx.lineTo(robux.x + earSize / 2, robux.y - robux.radius - earSize);
    ctx.lineTo(robux.x, robux.y - robux.radius);
    ctx.fill();

    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(robux.x - 10, robux.y - 5, 4, 0, Math.PI * 2);
    ctx.arc(robux.x + 10, robux.y - 5, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(robux.x, robux.y + 8, 10, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();

    return;
  }
  
  if (robux.type === 'bat') {
    const x = robux.x;
    const y = robux.y;
    const r = robux.radius || 30;
    const flap = Math.sin(Date.now() / 150) * 8;

    ctx.save();
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 25;
    ctx.fillStyle = 'black';

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - r * 1.5, y - r * 0.5 + flap);
    ctx.lineTo(x - r * 1.8, y + r * 0.2 + flap);
    ctx.lineTo(x - r * 1.5, y + r * 1.0 + flap);
    ctx.lineTo(x - r * 0.8, y + r * 0.8 + flap);
    ctx.quadraticCurveTo(x - r, y + r * 0.2, x, y);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + r * 1.5, y - r * 0.5 - flap);
    ctx.lineTo(x + r * 1.8, y + r * 0.2 - flap);
    ctx.lineTo(x + r * 1.5, y + r * 1.0 - flap);
    ctx.lineTo(x + r * 0.8, y + r * 0.8 - flap);
    ctx.quadraticCurveTo(x + r, y + r * 0.2, x, y);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.6, r, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(x - r * 0.2, y - r * 0.3, r * 0.12, 0, Math.PI * 2);
    ctx.arc(x + r * 0.2, y - r * 0.3, r * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    return;
  }
}

function drawVampire(robux) {
  if (!ctx) return;
  
  const x = robux.x;
  const y = robux.y;
  const r = robux.radius || 30;

  ctx.save();
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 15;
  ctx.fillStyle = 'white';

  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.7, r, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(x, y - r * 0.8, r * 0.5, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.arc(x - r * 0.2, y - r * 0.9, r * 0.1, 0, Math.PI * 2);
  ctx.arc(x + r * 0.2, y - r * 0.9, r * 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.15, y - r * 0.7);
  ctx.lineTo(x - r * 0.1, y - r * 0.6);
  ctx.lineTo(x - r * 0.2, y - r * 0.6);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + r * 0.15, y - r * 0.7);
  ctx.lineTo(x + r * 0.1, y - r * 0.6);
  ctx.lineTo(x + r * 0.2, y - r * 0.6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(200, 0, 0, 0.7)';
  ctx.beginPath();
  ctx.moveTo(x - r * 1.2, y - r * 0.5);
  ctx.quadraticCurveTo(x, y - r * 1.5, x + r * 1.2, y - r * 0.5);
  ctx.quadraticCurveTo(x, y + r * 1.5, x - r * 1.2, y - r * 0.5);
  ctx.fill();

  ctx.restore();
}

function updateTotalScore(newScore) {
  totalScore += newScore;
  localStorage.setItem('totalScore', totalScore);
}

function drawUI() {
  if (!ctx || !gameStarted) return;

  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(language === 'ru' ? `Счет: ${score}` : `Score: ${score}`, 10, 30);
  ctx.fillText(language === 'ru' ? `Жизни: ${lives}` : `Lives: ${lives}`, 10, 60);
}

function playDeathAnimation(callback) {
  const deathSound = document.getElementById('deathSound');
  if (deathSound) {
    deathSound.currentTime = 0;
    deathSound.play().catch(e => console.error("Death sound play error:", e));
  }

  const startY = player.y;
  const jumpHeight = 100;
  const endY = canvas.height + player.radius * 2;
  const duration = deathSound ? deathSound.duration * 1000 : 2000;
  const startTime = performance.now();

  function animateDeath(time) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);

    if (progress < 0.5) {
      const jumpProgress = progress * 2;
      player.y = startY - jumpHeight * Math.sin(jumpProgress * Math.PI);
    } else {
      const fallProgress = (progress - 0.5) * 2;
      player.y = startY + endY * fallProgress;
    }

    if (batHitCount >= 3) {
      evaporationProgress = progress;
    }

    draw();

    if (progress < 1) {
      requestAnimationFrame(animateDeath);
    } else {
      if (callback) callback();
    }
  }

  requestAnimationFrame(animateDeath);
}

function draw() {
  if (!ctx || !canvas) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (isWorldUpsideDown) {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(1, -1);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
  }

  if (gameStarted) {
    drawPlayer();
  }

  robuxes.forEach(drawRobux);

  if (isWorldUpsideDown) {
    ctx.restore();
  }

  drawUI();
}

function gameLoop() {
  if (gameStarted && !isPaused) {
    updatePlayer();

    if (clearRobuxesNextFrame) {
      robuxes.length = 0;
      clearRobuxesNextFrame = false;
    }

    if (!inHell && !(document.getElementById('blackRobuxWorld') && 
        document.getElementById('blackRobuxWorld').style.display.includes('block'))) {
      createRobux();
    }

    updateRobuxes();
    draw();
  }

  animationFrameId = requestAnimationFrame(gameLoop);
}

function shakeScreen() {
  if (!canvas) return;
  
  const duration = 400;
  const strength = 10;
  const start = Date.now();

  if (shakeAnimationId) cancelAnimationFrame(shakeAnimationId);

  function shake() {
    const elapsed = Date.now() - start;
    if (elapsed < duration) {
      const dx = (Math.random() - 0.5) * strength;
      const dy = (Math.random() - 0.5) * strength;
      canvas.style.transform = `translate(${dx}px, ${dy}px)`;
      shakeAnimationId = requestAnimationFrame(shake);
    } else {
      canvas.style.transform = 'translate(0, 0)';
      shakeAnimationId = null;
    }
  }
  shake();
}

function triggerBlackout() {
  isBlackoutActive = true;
  const blackout = document.getElementById('blackout');
  const horrorElements = document.getElementById('horrorElements');
  const blackoutSound = document.getElementById('blackoutSound');

  if (bgMusic) bgMusic.pause();
  if (blackout) blackout.style.opacity = '1';
  if (horrorElements) horrorElements.style.opacity = '1';
  if (blackoutSound) {
    blackoutSound.currentTime = 0;
    blackoutSound.play().catch(e => console.error("Blackout sound play error:", e));
  }

  setTimeout(() => {
    if (blackout) blackout.style.opacity = '0';
    if (horrorElements) horrorElements.style.opacity = '0';
    if (blackoutSound) {
      blackoutSound.pause();
      blackoutSound.currentTime = 0;
    }
    enterBlackRobuxWorld();
    isBlackoutActive = false;
  }, 4000);
}

function activateBlackRobuxEffect() {
  const effect = Math.floor(Math.random() * 4);

  if (effect === 0) {
    if (lives < 3) lives++;
  } else if (effect === 1) {
    const originalSpeeds = robuxes.map(r => r.speed);
    robuxes.forEach(r => r.speed *= 0.4);
    setTimeout(() => {
      robuxes.forEach((r, i) => r.speed = originalSpeeds[i]);
    }, 2000);
  } else if (effect === 2) {
    if (lives > 0 && !isBlackoutActive) lives--;
    if (lives <= 0) endGame();
  } else if (effect === 3) {
    triggerBlackout();
  }
}

function activateFlamingoEffect() {
  if (!gameStarted) return;
  
  const originalColor = player.color || 'yellow';
  const originalRadius = player.radius;
  player.color = 'pink';
  player.radius = 50;

  setTimeout(() => {
    if (gameStarted) {
      player.color = originalColor;
      player.radius = originalRadius;
    }
  }, 4000);
}

function enterHellWorld() {
  if (inHell) return;
  inHell = true;
  hellEntryScore = score;

  const overlay = document.getElementById('hellOverlay');
  if (overlay) overlay.style.opacity = '1';

  if (bgMusic) bgMusic.pause();
  const hellMusic = document.getElementById('hellMusic');
  if (hellMusic) {
    hellMusic.currentTime = 0;
    hellMusic.loop = true;
    hellMusic.play().catch(e => console.error("Hell music play error:", e));
  }

  clearRobuxesNextFrame = true;

  hellInterval = setInterval(() => {
    if (inHell && !isPaused) {
      const speedMultiplier = getSpeedMultiplier();
      robuxes.push({
        x: Math.random() * (canvas.width - 60),
        y: 0,
        radius: 30,
        speed: (3 + Math.random()) * speedMultiplier,
        color: 'darkred',
        type: 'red'
      });
    }
  }, 800);

  const checkHellExit = setInterval(() => {
    if (inHell && score - hellEntryScore >= 50) {
      exitHellWorld();
      clearInterval(checkHellExit);
    }
  }, 500);
}

function exitHellWorld() {
  inHell = false;
  if (hellInterval) clearInterval(hellInterval);

  const hellMusic = document.getElementById('hellMusic');
  if (hellMusic) {
    hellMusic.pause();
    hellMusic.currentTime = 0;
  }
  
  if (bgMusic) {
    bgMusic.currentTime = 0;
    bgMusic.play().catch(e => console.error("BG music play error:", e));
  }

  const overlay = document.getElementById('hellOverlay');
  if (overlay) overlay.style.opacity = '0';
}

function enterBlackRobuxWorld() {
  const blackRobuxWorld = document.getElementById('blackRobuxWorld');
  if (blackRobuxWorld) blackRobuxWorld.style.display = 'block';

  if (bgMusic) bgMusic.pause();

  if (blackWorldMusic && blackWorldMusic.paused) {
    blackWorldMusic.currentTime = 0;
    blackWorldMusic.play().catch(e => console.error("Black world music play error:", e));
  }

  clearRobuxesNextFrame = true;

  darkWorldInterval = setInterval(() => {
    if (!isPaused) {
      const speedMultiplier = getSpeedMultiplier();
      robuxes.push({
        x: Math.random() * (canvas.width - 60),
        y: 0,
        radius: 30,
        speed: (2 + Math.random() * 2) * speedMultiplier,
        color: 'black',
        type: 'dark'
      });
    }
  }, 1000);

  if (blackWorldMusic) {
    blackWorldMusic.onended = () => {
      if (darkWorldInterval) {
          clearInterval(darkWorldInterval);
          darkWorldInterval = null;
      }

      setTimeout(() => {
          const meow = document.getElementById('meowSound');
          if (meow) {
            meow.currentTime = 0;
            meow.play().catch(e => console.error("Meow sound play error:", e));
          }

          robuxes.push({
              x: Math.random() * (canvas.width - 60),
              y: 0,
              radius: 30,
              speed: 2 * getSpeedMultiplier(),
              color: 'gray',
              type: 'grayFinal'
          });
      }, 5000);
    }
  }
}

function enterYellowReverseWorld() {
  const yellowReverseTransition = document.getElementById('yellowReverseTransition');
  if (yellowReverseTransition) yellowReverseTransition.style.opacity = '1';

  setTimeout(() => {
    const yellowReverseWorld = document.getElementById('yellowReverseWorld');
    if (yellowReverseWorld) {
      yellowReverseWorld.style.display = 'block';
      yellowReverseWorld.style.opacity = '1';
    }

    if (bgMusic) bgMusic.pause();
    const yellowReverseMusic = document.getElementById('yellowReverseMusic');
    if (yellowReverseMusic) {
      yellowReverseMusic.currentTime = 0;
      yellowReverseMusic.play().catch(e => console.error("Yellow reverse music play error:", e));

      yellowReverseMusic.onended = exitYellowReverseWorld;

      yellowReverseMusic.addEventListener('timeupdate', () => {
        if (!isWorldUpsideDown && yellowReverseMusic.currentTime > 96) {
          flipWorld();
        }
      });
    }

    inYellowReverse = true;
    isWorldUpsideDown = false;
    clearRobuxesNextFrame = true;
    batSpeedMultiplier = 1.0;
    lastBatSpeedIncrease = Date.now();

    player.y = 100;

    darkWorldInterval = setInterval(() => {
      if (!isPaused) {
        const speedMultiplier = getSpeedMultiplier() * batSpeedMultiplier;
        let yPos = isWorldUpsideDown ? canvas.height : 0;
        let speed = (2 + Math.random()) * speedMultiplier * (isWorldUpsideDown ? -1 : 1);
        
        let type = 'bat';
        if (isWorldUpsideDown && Math.random() < 0.3) {
          type = 'vampire';
        }
        
        robuxes.push({
          x: Math.random() * (canvas.width - 60),
          y: yPos,
          radius: 30,
          speed: speed,
          type: type
        });
      }
    }, 1000);

    if (yellowReverseTransition) yellowReverseTransition.style.opacity = '0';
  }, 1000);
}

function flipWorld() {
  isWorldUpsideDown = true;
  player.y = 100;
  
  robuxes = [];
  
  const flipEffect = document.getElementById('flipEffect');
  const flipSound = document.getElementById('flipSound');
  if (flipEffect) flipEffect.style.display = 'flex';
  if (flipSound) {
    flipSound.currentTime = 0;
    flipSound.play().catch(e => console.error("Flip sound play error:", e));
  }
  
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
  overlay.style.zIndex = '999';
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.5s';
  document.body.appendChild(overlay);
  
  setTimeout(() => {
    overlay.style.opacity = '1';
  }, 10);
  
  setTimeout(() => {
    if (flipEffect) flipEffect.style.display = 'none';
    overlay.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(overlay);
    }, 500);
  }, 1000);
}

function exitYellowReverseWorld() {
  const yellowReverseTransition = document.getElementById('yellowReverseTransition');
  if (yellowReverseTransition) yellowReverseTransition.style.opacity = '1';

  setTimeout(() => {
    inYellowReverse = false;
    isWorldUpsideDown = false;
    if (darkWorldInterval) clearInterval(darkWorldInterval);

    const yellowReverseMusic = document.getElementById('yellowReverseMusic');
    if (yellowReverseMusic) {
      yellowReverseMusic.pause();
      yellowReverseMusic.currentTime = 0;
    }

    const yellowReverseWorld = document.getElementById('yellowReverseWorld');
    if (yellowReverseWorld) {
      yellowReverseWorld.style.display = 'none';
      yellowReverseWorld.style.opacity = '0';
    }

    player.y = canvas.height - 100;

    if (bgMusic) {
      bgMusic.currentTime = 0;
      bgMusic.play().catch(e => console.error("BG music play error:", e));
    }

    clearRobuxesNextFrame = true;
    batSpeedMultiplier = 1.0;

    if (yellowReverseTransition) yellowReverseTransition.style.opacity = '0';
  }, 1000);
}

function showGrayRobuxEffect() {
  const effectElement = document.getElementById('grayRobuxEffect');
  const sound = document.getElementById('grayRobuxSound');
  
  if (effectElement) effectElement.style.display = 'flex';
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(e => console.error("Gray robux sound play error:", e));
  }
  
  setTimeout(() => {
      if (effectElement) effectElement.style.display = 'none';
      if (sound) {
        sound.pause();
        sound.currentTime = 0;
      }
      
      const blackRobuxWorld = document.getElementById('blackRobuxWorld');
      if (blackRobuxWorld) blackRobuxWorld.style.display = 'none';
      
      if (blackWorldMusic) {
        blackWorldMusic.pause();
        blackWorldMusic.currentTime = 0;
      }
      
      if (bgMusic) {
        bgMusic.currentTime = 0;
        bgMusic.play().catch(e => console.error("BG music play error:", e));
      }
      
      if (darkWorldInterval) {
          clearInterval(darkWorldInterval);
          darkWorldInterval = null;
      }
      
      clearRobuxesNextFrame = true;
  }, 5000);
}

function showCatchNotice() {
  const notice = document.getElementById('catchNotice');
  if (!notice) return;
  
  notice.textContent = language === 'ru' ? 'ЛОВИ!!' : 'CATCH!!';
  notice.style.opacity = '1';

  if (catchNoticeTimeout) clearTimeout(catchNoticeTimeout);

  catchNoticeTimeout = setTimeout(() => {
    notice.style.opacity = '0';
  }, 2000);
}

function endGame() {
  if (gameOverTriggered) return;
  gameOverTriggered = true;
  playDeathAnimation(() => {
    player.color = 'yellow';
    player.radius = 40;
    
    const elementsToReset = [
      'hellOverlay', 'blackRobuxWorld', 'grayRobuxEffect', 
      'blackout', 'horrorElements', 'batHitEffect', 
      'yellowReverseWorld'
    ];
    
    elementsToReset.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (id === 'blackout' || id === 'horrorElements') {
          el.style.opacity = '0';
        } else {
          el.style.display = 'none';
        }
      }
    });

    gameStarted = false;
    if (bgMusic) {
      bgMusic.pause();
      bgMusic.currentTime = 0;
    }
    
    const controls = document.getElementById('controls');
    if (controls) controls.style.display = 'none';
    
    if (settingsButton) settingsButton.style.display = 'none';
    
    const audioElements = ['hellMusic', 'blackWorldMusic', 'yellowReverseMusic'];
    audioElements.forEach(id => {
      const audio = document.getElementById(id);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    if (hellInterval) clearInterval(hellInterval);
    if (darkWorldInterval) clearInterval(darkWorldInterval);
    inHell = false;
    inYellowReverse = false;
    isWorldUpsideDown = false;
    batSpeedMultiplier = 1.0;

    const gameOverScreen = document.getElementById('gameOverScreen');
    const gameOverText = document.getElementById('gameOverText');
    const restartButton = document.getElementById('restartButton');

    robuxes = [];
    clearCanvas();
    
    updateTotalScore(score);

    const totalScoreText = document.getElementById('totalScoreText');
    if (totalScoreText) {
      totalScoreText.textContent = language === 'ru'
        ? `Общий счёт: ${totalScore}`
        : `Total Score: ${totalScore}`;
    }
    
    if (gameOverText) {
      gameOverText.textContent = language === 'ru' 
        ? `Игра окончена! Счет: ${score}` 
        : `Game Over! Score: ${score}`;
    }
    
    if (restartButton) {
      restartButton.textContent = language === 'ru' ? 'Играть снова' : 'Play Again';
    }

    if (gameOverScreen) {
      gameOverScreen.style.display = 'flex';
      setTimeout(() => {
        gameOverScreen.style.opacity = '1';
      }, 50);
    }

    if (restartButton) {
      restartButton.onclick = () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }

        batHitCount = 0;
        hasAngryEyebrows = false;
        isEyeRed = false;
        isEvaporating = false;
        evaporationProgress = 0;

        player.color = 'yellow';
        player.radius = 40;
        player.y = canvas.height - 100;
        
        const elementsToReset = [
          'hellOverlay', 'blackRobuxWorld', 'grayRobuxEffect', 
          'blackout', 'horrorElements', 'batHitEffect', 
          'yellowReverseWorld'
        ];
        
        elementsToReset.forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            if (id === 'hellOverlay' || id === 'blackout' || id === 'horrorElements') {
              el.style.opacity = '0';
            } else {
              el.style.display = 'none';
            }
          }
        });

        if (gameOverScreen) {
          gameOverScreen.style.opacity = '0';
          gameOverScreen.style.display = 'none';
        }
        
        score = 0;
        gameOverTriggered = false;
        lives = 3;
        difficulty = 1;
        
        if (settingsButton) settingsButton.style.display = 'block';
        
        robuxes = [];
        player.x = canvas.width / 2;
        player.y = canvas.height - 100;
        
        if (bgMusic) {
          bgMusic.currentTime = 0;
          bgMusic.play().catch(e => console.error("BG music play error:", e));
        }
        
        const controls = document.getElementById('controls');
        if (controls) controls.style.display = 'flex';
        
        gameStarted = true;
        gameLoop();
      };
    }
    
    const menuButton = document.getElementById('menuButton');
    if (menuButton) {
      menuButton.onclick = () => {
        location.reload();
      };
    }
  });
}

function clearCanvas() {
  if (ctx && canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}