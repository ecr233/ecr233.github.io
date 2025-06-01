// Константа длительности гифки (0.75 секунды - половина от 1.5 секунд)
const BAT_HIT_DURATION = 750;
let isBlackoutActive = false; // Флаг для отслеживания состояния анимации черного экрана
let batHitCount = 0; // Счетчик ударов летучих мышей
let hasAngryEyebrows = false; // Флаг злых бровей
let isEyeRed = false; // Флаг красного глаза
let batSpeedMultiplier = 1.0; // Множитель скорости летучих мышей
let lastBatSpeedUpdate = 0; // Время последнего обновления скорости летучих мышей
let language = 'ru'; // Язык по умолчанию

// Переменные для магазина
let shopItems = {
  greenSkin: {
    name: { ru: 'Зеленый скин', en: 'Green skin' },
    description: { ru: 'Защита от потери последней жизни от зеленых врагов', en: 'Protection from losing last life to green enemies' },
    price: 100,
    purchased: false,
    applyEffect: function() {
      // Эффект уже применяется в логике проверки столкновений
    }
  }
};

// Переменные для квестов
let quests = {
  hellWorldCompleted: { completed: false, reward: Math.floor(Math.random() * 11) + 30 }, // 30-40
  pinkDoubleTouch: { completed: false, reward: Math.floor(Math.random() * 31) + 20 }, // 20-50
  blackBallDeath: { completed: false, reward: 51 }, // Всегда 51
  lastCompletedDate: null
};

let exclusiveQuests = {
  castleWorld: { completed: false, reward: '???' }
};

let mainQuest = {
  reach100: { completed: false, reward: 'passive' }
};

// Пассивные способности
let passiveAbilities = {
  monster: { chanceToAvoidDamage: 0.2 },
  hero: { lastLifeShield: false, shieldTimer: 0, shieldCooldown: 120000 }, // 2 минуты в миллисекундах
  wanderer: { doubleQuestRewards: false }
};

let pinkTouched = false; // Флаг касания розового врага
let lastPinkTouchTime = 0; // Время последнего касания розового врага

// Система аккаунтов
let currentAccount = 1;
let accounts = {
  1: { 
    totalScore: 0, 
    quests: JSON.parse(JSON.stringify(quests)), 
    exclusiveQuests: JSON.parse(JSON.stringify(exclusiveQuests)), 
    mainQuest: JSON.parse(JSON.stringify(mainQuest)), 
    path: null,
    shopItems: JSON.parse(JSON.stringify(shopItems)),
    skin: 'default'
  },
  2: { 
    totalScore: 0, 
    quests: JSON.parse(JSON.stringify(quests)), 
    exclusiveQuests: JSON.parse(JSON.stringify(exclusiveQuests)), 
    mainQuest: JSON.parse(JSON.stringify(mainQuest)), 
    path: null,
    shopItems: JSON.parse(JSON.stringify(shopItems)),
    skin: 'default'
  },
  3: { 
    totalScore: 0, 
    quests: JSON.parse(JSON.stringify(quests)), 
    exclusiveQuests: JSON.parse(JSON.stringify(exclusiveQuests)), 
    mainQuest: JSON.parse(JSON.stringify(mainQuest)), 
    path: null,
    shopItems: JSON.parse(JSON.stringify(shopItems)),
    skin: 'default'
  }
};

// Загрузка данных аккаунтов из localStorage
function loadAccounts() {
  const savedAccounts = localStorage.getItem('evilCashRainAccounts');
  if (savedAccounts) {
    const parsedAccounts = JSON.parse(savedAccounts);
    // Объединяем сохраненные аккаунты с дефолтными, чтобы сохранить структуру
    for (let i = 1; i <= 3; i++) {
      if (parsedAccounts[i]) {
        accounts[i] = {
          totalScore: parsedAccounts[i].totalScore || 0,
          quests: parsedAccounts[i].quests || JSON.parse(JSON.stringify(quests)),
          exclusiveQuests: parsedAccounts[i].exclusiveQuests || JSON.parse(JSON.stringify(exclusiveQuests)),
          mainQuest: parsedAccounts[i].mainQuest || JSON.parse(JSON.stringify(mainQuest)),
          path: parsedAccounts[i].path || null,
          shopItems: parsedAccounts[i].shopItems || JSON.parse(JSON.stringify(shopItems)),
          skin: parsedAccounts[i].skin || 'default'
        };
      }
    }
  } else {
    // Инициализация аккаунтов при первом запуске
    saveAccounts();
  }
}

// Сохранение данных аккаунтов в localStorage
function saveAccounts() {
  localStorage.setItem('evilCashRainAccounts', JSON.stringify(accounts));
}

// Переключение аккаунта
function switchAccount(accountNumber) {
  currentAccount = accountNumber;
  totalScore = accounts[accountNumber].totalScore || 0;
  
  // Копируем данные из аккаунта
  quests = accounts[accountNumber].quests ? JSON.parse(JSON.stringify(accounts[accountNumber].quests)) : {
    hellWorldCompleted: { completed: false, reward: Math.floor(Math.random() * 11) + 30 },
    pinkDoubleTouch: { completed: false, reward: Math.floor(Math.random() * 31) + 20 },
    blackBallDeath: { completed: false, reward: 51 },
    lastCompletedDate: accounts[accountNumber].quests?.lastCompletedDate || null
  };
  
  exclusiveQuests = accounts[accountNumber].exclusiveQuests ? JSON.parse(JSON.stringify(accounts[accountNumber].exclusiveQuests)) : {
    castleWorld: { completed: false, reward: '???' }
  };
  
  mainQuest = accounts[accountNumber].mainQuest ? JSON.parse(JSON.stringify(accounts[accountNumber].mainQuest)) : {
    reach100: { completed: false, reward: 'passive' }
  };
  
  shopItems = accounts[accountNumber].shopItems ? JSON.parse(JSON.stringify(accounts[accountNumber].shopItems)) : JSON.parse(JSON.stringify(shopItems));
  
  // Проверяем, нужно ли сбросить квесты (если прошло больше дня)
  const today = new Date().toDateString();
  if (quests.lastCompletedDate !== today) {
    // Сбрасываем квесты
    quests = {
      hellWorldCompleted: { completed: false, reward: Math.floor(Math.random() * 11) + 30 },
      pinkDoubleTouch: { completed: false, reward: Math.floor(Math.random() * 31) + 20 },
      blackBallDeath: { completed: false, reward: 51 },
      lastCompletedDate: today
    };
    accounts[currentAccount].quests = quests;
    saveAccounts();
  }
  
  // Обновляем отображение счета
  const totalScoreText = document.getElementById('totalScoreText');
  totalScoreText.textContent = language === 'ru'
    ? `Общий счёт: ${totalScore}`
    : `Total Score: ${totalScore}`;
  
  // Подсветка активного аккаунта
  document.querySelectorAll('.account-button').forEach(btn => {
    btn.style.backgroundColor = btn.id === `account${currentAccount}` 
      ? 'rgba(255,215,0,0.7)' 
      : 'rgba(255,255,255,0.6)';
  });
  
  // Обновляем магазин
  updateShopContent();
}

// Инициализация аккаунтов при загрузке
window.addEventListener('load', () => {
  loadAccounts();
  language = localStorage.getItem('language') || 'ru';
  switchAccount(1); // По умолчанию аккаунт 1
  
  const initialVolume = 0.5;
  volumeSlider.value = initialVolume;
  [bgMusic, menuMusic, blackWorldMusic, hellMusic, yellowReverseMusic].forEach(audio => audio.volume = initialVolume);
  document.getElementById('blackoutSound').volume = initialVolume;
  document.getElementById('meowSound').volume = initialVolume;
  document.getElementById('grayRobuxSound').volume = initialVolume;
  document.getElementById('batHitSound').volume = 1.0; // Громче музыки по умолчанию
  document.getElementById('deathSound').volume = initialVolume;
  document.getElementById('questCompleteSound').volume = initialVolume;
});

let catchNoticeTimeout;
let animationFrameId = null;
const gameTitle = document.getElementById('gameTitle');
const startControls = document.getElementById('startControls');
const gameStartButton = document.getElementById('gameStartButton');
const shopButton = document.getElementById('shopButton');
const questsButton = document.getElementById('questsButton');
const questsMenu = document.getElementById('questsMenu');
const questsTitle = document.getElementById('questsTitle');
const questsList = document.getElementById('questsList');
const closeQuestsButton = document.getElementById('closeQuestsButton');
const exclusiveQuestsButton = document.getElementById('exclusiveQuestsButton');
const exclusiveQuestsMenu = document.getElementById('exclusiveQuestsMenu');
const exclusiveQuestsTitle = document.getElementById('exclusiveQuestsTitle');
const exclusiveQuestsList = document.getElementById('exclusiveQuestsList');
const closeExclusiveQuestsButton = document.getElementById('closeExclusiveQuestsButton');
const questCompleted = document.getElementById('questCompleted');
const menuMusic = document.getElementById('menuMusic');
const bgMusic = document.getElementById('bgMusic');
const blackWorldMusic = document.getElementById('blackWorldMusic');
const settingsButton = document.getElementById('settingsButton');
const accountMenu = document.getElementById('accountMenu');
const account1Button = document.getElementById('account1');
const account2Button = document.getElementById('account2');
const account3Button = document.getElementById('account3');
const pauseMenu = document.getElementById('pauseMenu');
const volumeSlider = document.getElementById('volumeSlider');
const resumeButton = document.getElementById('resumeButton');
const volumeLabel = document.getElementById('volumeLabel');
const shopMenu = document.getElementById('shopMenu');
const shopTitle = document.getElementById('shopTitle');
const shopContent = document.getElementById('shopContent');
const totalScoreDisplay = document.getElementById('totalScoreDisplay');
const closeShopButton = document.getElementById('closeShopButton');
const timeRewindEffect = document.getElementById('timeRewindEffect');
const pathSelectionMenu = document.getElementById('pathSelectionMenu');
const pathTitle = document.getElementById('pathTitle');
const path1Button = document.getElementById('path1Button');
const path2Button = document.getElementById('path2Button');
const path3Button = document.getElementById('path3Button');

// Функция обновления содержимого магазина
function updateShopContent() {
  shopContent.innerHTML = '';
  
  // Добавляем зелёный скин
  const greenSkinItem = document.createElement('div');
  greenSkinItem.className = 'shop-item';
  
  const greenSkinTitle = document.createElement('h3');
  greenSkinTitle.textContent = shopItems.greenSkin.name[language];
  
  const greenSkinDesc = document.createElement('p');
  greenSkinDesc.textContent = shopItems.greenSkin.description[language];
  
  const greenSkinPrice = document.createElement('div');
  greenSkinPrice.textContent = language === 'ru' ? `Цена: ${shopItems.greenSkin.price}` : `Price: ${shopItems.greenSkin.price}`;
  greenSkinPrice.style.color = 'gold';
  greenSkinPrice.style.fontWeight = 'bold';
  
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'shop-buttons';
  
  const greenSkinButton = document.createElement('div');
  greenSkinButton.className = 'shop-button';
  
  if (accounts[currentAccount].shopItems.greenSkin.purchased) {
    if (accounts[currentAccount].skin === 'green') {
      greenSkinButton.textContent = language === 'ru' ? 'Снять' : 'Unequip';
      greenSkinButton.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
      greenSkinButton.onclick = () => unequipGreenSkin();
    } else {
      greenSkinButton.textContent = language === 'ru' ? 'Экипировать' : 'Equip';
      greenSkinButton.style.backgroundColor = 'rgba(0, 200, 0, 0.7)';
      greenSkinButton.onclick = () => equipGreenSkin();
    }
  } else if (totalScore >= shopItems.greenSkin.price) {
    greenSkinButton.textContent = language === 'ru' ? 'Купить' : 'Buy';
    greenSkinButton.style.backgroundColor = 'rgba(255, 215, 0, 0.7)';
    greenSkinButton.onclick = () => buyGreenSkin();
  } else {
    greenSkinButton.textContent = language === 'ru' ? 'Недостаточно' : 'Not enough';
    greenSkinButton.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
    greenSkinButton.style.cursor = 'default';
  }
  
  buttonsContainer.appendChild(greenSkinButton);
  
  greenSkinItem.appendChild(greenSkinTitle);
  greenSkinItem.appendChild(greenSkinDesc);
  greenSkinItem.appendChild(greenSkinPrice);
  greenSkinItem.appendChild(buttonsContainer);
  
  shopContent.appendChild(greenSkinItem);
  
  // Обновляем отображение общего счета в магазине
  totalScoreDisplay.textContent = language === 'ru' 
    ? `Общий счёт: ${totalScore}` 
    : `Total Score: ${totalScore}`;
  totalScoreDisplay.style.color = 'gold';
  totalScoreDisplay.style.fontWeight = 'bold';
  totalScoreDisplay.style.marginTop = '20px';
}

// Функция покупки зелёного скина
function buyGreenSkin() {
  if (accounts[currentAccount].shopItems.greenSkin.purchased) return;
  if (totalScore < shopItems.greenSkin.price) return;
  
  // Вычитаем цену из общего счета
  totalScore -= shopItems.greenSkin.price;
  accounts[currentAccount].totalScore = totalScore;
  
  // Отмечаем скин как купленный
  accounts[currentAccount].shopItems.greenSkin.purchased = true;
  accounts[currentAccount].skin = 'green';
  
  // Сохраняем изменения
  saveAccounts();
  
  // Обновляем интерфейс
  updateShopContent();
  
  // Показываем сообщение об успешной покупке
  showPurchaseNotice(language === 'ru' ? 'Покупка успешна!' : 'Purchase successful!');
}

// Функция экипировки зеленого скина
function equipGreenSkin() {
  accounts[currentAccount].skin = 'green';
  saveAccounts();
  updateShopContent();
  showPurchaseNotice(language === 'ru' ? 'Скин экипирован!' : 'Skin equipped!');
}

// Функция снятия зеленого скина
function unequipGreenSkin() {
  accounts[currentAccount].skin = 'default';
  saveAccounts();
  updateShopContent();
  showPurchaseNotice(language === 'ru' ? 'Скин снят!' : 'Skin unequipped!');
}

// Функция показа уведомления о покупке/экипировке
function showPurchaseNotice(message) {
  const purchaseNotice = document.createElement('div');
  purchaseNotice.textContent = message;
  purchaseNotice.style.position = 'fixed';
  purchaseNotice.style.top = '50%';
  purchaseNotice.style.left = '50%';
  purchaseNotice.style.transform = 'translate(-50%, -50%)';
  purchaseNotice.style.backgroundColor = 'rgba(0, 200, 0, 0.8)';
  purchaseNotice.style.color = 'white';
  purchaseNotice.style.padding = '15px';
  purchaseNotice.style.borderRadius = '10px';
  purchaseNotice.style.zIndex = '1000';
  document.body.appendChild(purchaseNotice);
  
  setTimeout(() => {
    document.body.removeChild(purchaseNotice);
  }, 2000);
}

// Обработчики кнопок аккаунтов
account1Button.addEventListener('click', () => {
  if (gameStarted) return;
  switchAccount(1);
});

account2Button.addEventListener('click', () => {
  if (gameStarted) return;
  switchAccount(2);
});

account3Button.addEventListener('click', () => {
  if (gameStarted) return;
  switchAccount(3);
});

// Start playing menu music when page loads
menuMusic.volume = 0.5;
menuMusic.play();

document.getElementById('languageRu').addEventListener('click', () => {
  language = 'ru';
  localStorage.setItem('language', 'ru');
  setLanguage();
});

document.getElementById('languageEn').addEventListener('click', () => {
  language = 'en';
  localStorage.setItem('language', 'en');
  setLanguage();
});

function setLanguage() {
  document.getElementById('languageSelection').style.display = 'none';
  gameTitle.textContent = language === 'ru' ? 'ЭВИЛ КЕШ РЕЙН' : 'EVIL CASH RAIN';
  gameTitle.style.display = 'block';
  gameStartButton.textContent = language === 'ru' ? 'Начать игру' : 'Start Game';
  shopButton.textContent = language === 'ru' ? 'Магазин' : 'Shop';
  questsButton.textContent = language === 'ru' ? 'Квесты' : 'Quests';
  resumeButton.textContent = language === 'ru' ? 'Продолжить' : 'Resume';
  volumeLabel.textContent = language === 'ru' ? 'Громкость' : 'Volume';
  document.getElementById('menuButton').textContent = language === 'ru' ? 'Меню' : 'Menu';
  closeQuestsButton.textContent = language === 'ru' ? 'Закрыть' : 'Close';
  exclusiveQuestsButton.textContent = language === 'ru' ? 'Эксклюзивные' : 'Exclusive';
  closeExclusiveQuestsButton.textContent = language === 'ru' ? 'Закрыть' : 'Close';
  closeShopButton.textContent = language === 'ru' ? 'Закрыть' : 'Close';
  questsTitle.textContent = language === 'ru' ? 'Ежедневные квесты' : 'Daily Quests';
  exclusiveQuestsTitle.textContent = language === 'ru' ? 'Эксклюзивные квесты' : 'Exclusive Quests';
  shopTitle.textContent = language === 'ru' ? 'Магазин' : 'Shop';
  pathTitle.textContent = language === 'ru' ? 'Выбери свой путь' : 'Choose your path';
  path1Button.textContent = language === 'ru' ? '1. Монстр' : '1. Monster';
  path2Button.textContent = language === 'ru' ? '2. Герой' : '2. Hero';
  path3Button.textContent = language === 'ru' ? '3. Странник' : '3. Wanderer';
  startControls.style.display = 'flex';
  accountMenu.style.display = 'flex';
  updateQuestsList();
  updateExclusiveQuestsList();
  updateShopContent();
}

function updateQuestsList() {
  questsList.innerHTML = '';
  
  // Основной квест: Дойти до 100 очков
  if (!mainQuest.reach100.completed) {
    const mainQuestElement = document.createElement('div');
    mainQuestElement.style.margin = '20px 0';
    mainQuestElement.style.padding = '15px';
    mainQuestElement.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
    mainQuestElement.style.border = '2px solid gold';
    mainQuestElement.style.borderRadius = '10px';
    mainQuestElement.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px; color: gold;">
        ${language === 'ru' ? '★ Основной квест: Достичь 100 очков' : '★ Main Quest: Reach 100 points'}
      </div>
      <div style="font-size: 14px; margin-bottom: 5px;">
        ${language === 'ru' ? 'Наберите 100 очков в одной игре' : 'Score 100 points in a single game'}
      </div>
      <div style="color: gold; margin-top: 5px; font-weight: bold;">
        ${language === 'ru' ? 'Награда: Пассивная способность' : 'Reward: Passive ability'}
      </div>
      <div style="font-size: 12px; margin-top: 5px; color: #aaa;">
        ${language === 'ru' ? 
          (accounts[currentAccount].path === 'monster' ? 'Монстр: 20% шанс избежать потери жизни' : 
           accounts[currentAccount].path === 'hero' ? 'Герой: Щит на последней жизни каждые 2 минуты' : 
           'Странник: Двойные награды за квесты') : 
          (accounts[currentAccount].path === 'monster' ? 'Monster: 20% chance to avoid life loss' : 
           accounts[currentAccount].path === 'hero' ? 'Hero: Shield on last life every 2 minutes' : 
           'Wanderer: Double quest rewards')}
      </div>
    `;
    questsList.appendChild(mainQuestElement);
  }
  
  // Квест 1: Пройти адский мир
  const quest1 = document.createElement('div');
  quest1.style.margin = '10px 0';
  quest1.style.padding = '10px';
  quest1.style.backgroundColor = quests.hellWorldCompleted.completed ? 'rgba(0, 200, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)';
  quest1.style.borderRadius = '5px';
  quest1.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 5px;">
      ${language === 'ru' ? '1. Пройти адский мир' : '1. Complete hell world'}
      ${quests.hellWorldCompleted.completed ? '✓' : ''}
    </div>
    <div style="font-size: 14px;">
      ${language === 'ru' ? 'Засчитывается если до конца пройти мир белого врага с разноцветными глазами' : 'Counts if you complete the world of the white enemy with rainbow eyes'}
    </div>
    <div style="color: gold; margin-top: 5px;">
      ${language === 'ru' ? 'Награда:' : 'Reward:'} ${quests.hellWorldCompleted.reward}
      ${mainQuest.reach100.completed && accounts[currentAccount].path === 'wanderer' ? ` → ${quests.hellWorldCompleted.reward * 2}` : ''}
    </div>
  `;
  questsList.appendChild(quest1);
  
  // Квест 2: Мистер Фламинго
  const quest2 = document.createElement('div');
  quest2.style.margin = '10px 0';
  quest2.style.padding = '10px';
  quest2.style.backgroundColor = quests.pinkDoubleTouch.completed ? 'rgba(0, 200, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)';
  quest2.style.borderRadius = '5px';
  quest2.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 5px;">
      ${language === 'ru' ? '2. Мистер Фламинго' : '2. Mister Flamingo'}
      ${quests.pinkDoubleTouch.completed ? '✓' : ''}
    </div>
    <div style="font-size: 14px;">
      ${language === 'ru' ? 'Коснуться розового шара, стать розовым и коснуться еще одного розового шара' : 'Touch a pink ball, become pink and touch another pink ball'}
    </div>
    <div style="color: gold; margin-top: 5px;">
      ${language === 'ru' ? 'Награда:' : 'Reward:'} ${quests.pinkDoubleTouch.reward}
      ${mainQuest.reach100.completed && accounts[currentAccount].path === 'wanderer' ? ` → ${quests.pinkDoubleTouch.reward * 2}` : ''}
    </div>
  `;
  questsList.appendChild(quest2);
  
  // Квест 3: Смерть от черного шара
  const quest3 = document.createElement('div');
  quest3.style.margin = '10px 0';
  quest3.style.padding = '10px';
  quest3.style.backgroundColor = quests.blackBallDeath.completed ? 'rgba(0, 200, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)';
  quest3.style.borderRadius = '5px';
  quest3.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 5px;">
      ${language === 'ru' ? '3. Смерть от черного шара' : '3. Death by black ball'}
      ${quests.blackBallDeath.completed ? '✓' : ''}
    </div>
    <div style="font-size: 14px;">
      ${language === 'ru' ? 'Умереть от черного шара с вопросом (должен отнять последнюю жизнь)' : 'Die from the black ball with a question (must take last life)'}
    </div>
    <div style="color: gold; margin-top: 5px;">
      ${language === 'ru' ? 'Награда:' : 'Reward:'} ${quests.blackBallDeath.reward}
      ${mainQuest.reach100.completed && accounts[currentAccount].path === 'wanderer' ? ` → ${quests.blackBallDeath.reward * 2}` : ''}
    </div>
  `;
  questsList.appendChild(quest3);
}

function updateExclusiveQuestsList() {
  exclusiveQuestsList.innerHTML = '';
  
  // Эксклюзивный квест: Пройти мир с замком
  const quest1 = document.createElement('div');
  quest1.style.margin = '10px 0';
  quest1.style.padding = '10px';
  quest1.style.backgroundColor = exclusiveQuests.castleWorld.completed ? 'rgba(0, 200, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)';
  quest1.style.borderRadius = '5px';
  quest1.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 5px;">
      ${language === 'ru' ? '1. Пройти мир с замком' : '1. Complete castle world'}
      ${exclusiveQuests.castleWorld.completed ? '✓' : ''}
    </div>
    <div style="font-size: 14px;">
      ${language === 'ru' ? 'Найти и пройти скрытый мир с замком' : 'Find and complete hidden castle world'}
    </div>
    <div style="color: gold; margin-top: 5px;">
      ${language === 'ru' ? 'Награда:' : 'Reward:'} ${exclusiveQuests.castleWorld.reward}
    </div>
  `;
  exclusiveQuestsList.appendChild(quest1);
}

function showQuestCompleted(questName, reward) {
  const actualReward = mainQuest.reach100.completed && accounts[currentAccount].path === 'wanderer' ? reward * 2 : reward;
  questCompleted.textContent = language === 'ru' 
    ? `Квест выполнен: ${questName} (+${actualReward})` 
    : `Quest completed: ${questName} (+${actualReward})`;
  questCompleted.style.display = 'block';
  document.getElementById('questCompleteSound').currentTime = 0;
  document.getElementById('questCompleteSound').play();
  
  setTimeout(() => {
    questCompleted.style.display = 'none';
  }, 3000);
}

function checkMainQuestCompletion() {
  if (!mainQuest.reach100.completed && score >= 100) {
    mainQuest.reach100.completed = true;
    accounts[currentAccount].mainQuest = mainQuest;
    saveAccounts();
    
    // Активируем пассивную способность в зависимости от пути
    const path = accounts[currentAccount].path;
    if (path === 'monster') {
      passiveAbilities.monster.chanceToAvoidDamage = 0.2;
    } else if (path === 'hero') {
      passiveAbilities.hero.lastLifeShield = false;
      passiveAbilities.hero.shieldTimer = 0;
    } else if (path === 'wanderer') {
      passiveAbilities.wanderer.doubleQuestRewards = true;
    }
    
    showQuestCompleted(
      language === 'ru' ? 'Основной квест: Достичь 100 очков' : 'Main Quest: Reach 100 points',
      language === 'ru' ? 'Пассивная способность' : 'Passive ability'
    );
  }
}

function updateHeroShield() {
  if (!mainQuest.reach100.completed || accounts[currentAccount].path !== 'hero') return;
  
  const now = Date.now();
  
  // Если у нас последняя жизнь и нет щита
  if (lives === 1 && !passiveAbilities.hero.lastLifeShield) {
    // Если таймер не установлен, устанавливаем его
    if (passiveAbilities.hero.shieldTimer === 0) {
      passiveAbilities.hero.shieldTimer = now + passiveAbilities.hero.shieldCooldown;
    }
    // Проверяем, истек ли таймер
    else if (now >= passiveAbilities.hero.shieldTimer) {
      passiveAbilities.hero.lastLifeShield = true;
      passiveAbilities.hero.shieldTimer = 0;
      
      // Показываем уведомление о получении щита
      const shieldNotice = document.createElement('div');
      shieldNotice.textContent = language === 'ru' ? 'ЩИТ АКТИВИРОВАН!' : 'SHIELD ACTIVATED!';
      shieldNotice.style.position = 'fixed';
      shieldNotice.style.top = '20%';
      shieldNotice.style.left = '50%';
      shieldNotice.style.transform = 'translateX(-50%)';
      shieldNotice.style.color = '#00ffff';
      shieldNotice.style.fontSize = '36px';
      shieldNotice.style.fontWeight = 'bold';
      shieldNotice.style.textShadow = '0 0 10px #00ffff';
      shieldNotice.style.zIndex = '1000';
      shieldNotice.style.opacity = '0';
      shieldNotice.style.transition = 'opacity 0.5s';
      document.body.appendChild(shieldNotice);
      
      setTimeout(() => {
        shieldNotice.style.opacity = '1';
        setTimeout(() => {
          shieldNotice.style.opacity = '0';
          setTimeout(() => {
            document.body.removeChild(shieldNotice);
          }, 500);
        }, 2000);
      }, 10);
    }
  }
  // Если щит активен и мы потеряли жизнь (щит сработал)
  else if (passiveAbilities.hero.lastLifeShield && lives < 1) {
    lives = 1; // Восстанавливаем последнюю жизнь
    passiveAbilities.hero.lastLifeShield = false;
    passiveAbilities.hero.shieldTimer = now + passiveAbilities.hero.shieldCooldown;
    
    // Показываем уведомление о срабатывании щита
    const shieldNotice = document.createElement('div');
    shieldNotice.textContent = language === 'ru' ? 'ЩИТ СОХРАНИЛ ВАС!' : 'SHIELD SAVED YOU!';
    shieldNotice.style.position = 'fixed';
    shieldNotice.style.top = '20%';
    shieldNotice.style.left = '50%';
    shieldNotice.style.transform = 'translateX(-50%)';
    shieldNotice.style.color = '#00ffff';
    shieldNotice.style.fontSize = '36px';
    shieldNotice.style.fontWeight = 'bold';
    shieldNotice.style.textShadow = '0 0 10px #00ffff';
    shieldNotice.style.zIndex = '1000';
    shieldNotice.style.opacity = '0';
    shieldNotice.style.transition = 'opacity 0.5s';
    document.body.appendChild(shieldNotice);
    
    setTimeout(() => {
      shieldNotice.style.opacity = '1';
      setTimeout(() => {
        shieldNotice.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(shieldNotice);
        }, 500);
      }, 2000);
    }, 10);
  }
}

gameStartButton.addEventListener('click', () => {
  startControls.style.display = 'none';
  gameTitle.style.display = 'none';
  accountMenu.style.display = 'none';
  
  // Проверяем, выбран ли уже путь для этого аккаунта
  if (!accounts[currentAccount].path) {
    // Если путь не выбран, показываем меню выбора пути
    pathSelectionMenu.style.display = 'flex';
  } else {
    // Если путь уже выбран, начинаем игру
    startGame();
  }
});

// Обработчики выбора пути
path1Button.addEventListener('click', () => {
  accounts[currentAccount].path = 'monster';
  saveAccounts();
  pathSelectionMenu.style.display = 'none';
  startGame();
});

path2Button.addEventListener('click', () => {
  accounts[currentAccount].path = 'hero';
  saveAccounts();
  pathSelectionMenu.style.display = 'none';
  startGame();
});

path3Button.addEventListener('click', () => {
  accounts[currentAccount].path = 'wanderer';
  saveAccounts();
  pathSelectionMenu.style.display = 'none';
  startGame();
});

function startGame() {
  gameTitle.style.opacity = 0;
  gameTitle.style.transform = 'scale(0)';
  settingsButton.style.display = 'block';
  menuMusic.pause();
  bgMusic.play();
  document.getElementById('controls').style.display = 'flex';
  gameStarted = true;
  isPaused = false;
  
  // Устанавливаем цвет игрока в зависимости от выбранного скина
  player.color = accounts[currentAccount].skin === 'green' ? 'green' : 'yellow';
  
  gameLoop();
}

shopButton.addEventListener('click', () => {
  startControls.style.display = 'none';
  gameTitle.style.display = 'none';
  accountMenu.style.display = 'none';
  shopMenu.style.display = 'flex';
  updateShopContent();
});

closeShopButton.addEventListener('click', () => {
  shopMenu.style.display = 'none';
  startControls.style.display = 'flex';
  gameTitle.style.display = 'block';
  accountMenu.style.display = 'flex';
});

questsButton.addEventListener('click', () => {
  startControls.style.display = 'none';
  gameTitle.style.display = 'none';
  accountMenu.style.display = 'none';
  questsMenu.style.display = 'flex';
  updateQuestsList();
});

closeQuestsButton.addEventListener('click', () => {
  questsMenu.style.display = 'none';
  startControls.style.display = 'flex';
  gameTitle.style.display = 'block';
  accountMenu.style.display = 'flex';
});

exclusiveQuestsButton.addEventListener('click', () => {
  questsMenu.style.display = 'none';
  exclusiveQuestsMenu.style.display = 'flex';
  updateExclusiveQuestsList();
});

closeExclusiveQuestsButton.addEventListener('click', () => {
  exclusiveQuestsMenu.style.display = 'none';
  questsMenu.style.display = 'flex';
});

settingsButton.addEventListener('click', () => {
  isPaused = true;
  pauseMenu.style.display = 'flex';
  
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
  if (inHell) {
    hellMusic.pause();
  } else if (document.getElementById('blackRobuxWorld').style.display === 'block') {
    blackWorldMusic.pause();
  } else if (inYellowReverse) {
    yellowReverseMusic.pause();
  } else {
    bgMusic.pause();
  }
});

resumeButton.addEventListener('click', () => {
  isPaused = false;
  pauseMenu.style.display = 'none';
  
  // Возобновление интервалов создания врагов
  if (inHell) {
    hellMusic.play();
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
  } else if (document.getElementById('blackRobuxWorld').style.display === 'block') {
    blackWorldMusic.play();
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
  } else if (inYellowReverse) {
    yellowReverseMusic.play();
    darkWorldInterval = setInterval(() => {
      if (!isPaused) {
        const speedMultiplier = getSpeedMultiplier() * batSpeedMultiplier;
        const currentTime = yellowReverseMusic.currentTime;
        
        // Добавляем летучих мышей
        robuxes.push({
          x: Math.random() * (canvas.width - 60),
          y: 0,
          radius: 30,
          speed: (2 + Math.random()) * speedMultiplier,
          type: 'bat'
        });
        
        // Добавляем демонов после 50 секунды музыки
        if (currentTime > 50) {
          robuxes.push({
            x: Math.random() * (canvas.width - 60),
            y: 0,
            radius: 35,
            speed: (4 + Math.random()) * speedMultiplier, // В 2 раза быстрее летучих мышей
            type: 'demon'
          });
        }
      }
    }, 1000);
  } else {
    bgMusic.play();
  }
});

volumeSlider.addEventListener('input', () => {
  const volumeValue = volumeSlider.value;
  // Основные аудио
  bgMusic.volume = volumeValue;
  menuMusic.volume = volumeValue;
  blackWorldMusic.volume = volumeValue;
  hellMusic.volume = volumeValue;
  yellowReverseMusic.volume = volumeValue;
  
  // Звуковые эффекты
  document.getElementById('blackoutSound').volume = volumeValue;
  document.getElementById('meowSound').volume = volumeValue;
  document.getElementById('grayRobuxSound').volume = volumeValue;
  document.getElementById('deathSound').volume = volumeValue;
  document.getElementById('questCompleteSound').volume = volumeValue;
  
  // Звук удара летучей мыши - громче остальных (в 1.5 раза)
  document.getElementById('batHitSound').volume = Math.min(volumeValue * 1.5, 1);
});

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let gameStarted = false;
let isPaused = false;
let score = 0;
let lives = 3;
let gameOverTriggered = false;
let difficulty = 1;
let totalScore = parseInt(localStorage.getItem('totalScore')) || 0;
let lastSpawnX = null;
let clearRobuxesNextFrame = false;
let darkWorldInterval = null;
let inYellowReverse = false;

const player = {
  x: canvas.width / 2,
  y: canvas.height - 100,
  radius: 40,
  speed: 7,
  color: 'yellow'
};

let robuxes = [];
let moveLeft = false;
let moveRight = false;

document.getElementById('leftButton').addEventListener('touchstart', (e) => { e.preventDefault(); moveLeft = true; });
document.getElementById('leftButton').addEventListener('touchend', () => moveLeft = false);
document.getElementById('rightButton').addEventListener('touchstart', (e) => { e.preventDefault(); moveRight = true; });
document.getElementById('rightButton').addEventListener('touchend', () => moveRight = false);

function updatePlayer() {
  if (moveLeft && player.x > player.radius) player.x -= player.speed;
  if (moveRight && player.x < canvas.width - player.radius) player.x += player.speed;
}

function getSpeedMultiplier() {
  if (score < 300) {
    // От 1 до 300 очков: ускоряем с 1x до 2x
    return 1 + (score / 300);
  } else {
    // От 300 до 1000 очков: ускоряем с 2x до 3x
    return 2 + Math.min((score - 300) / 700, 1);
  }
}

function updateBatSpeeds() {
  const now = Date.now();
  if (now - lastBatSpeedUpdate > 1000) { // Обновляем каждую секунду
    batSpeedMultiplier *= 1.008; // Увеличиваем скорость на 0.4%
    lastBatSpeedUpdate = now;
    
    // Обновляем скорость существующих летучих мышей
    robuxes.forEach(r => {
      if (r.type === 'bat' || r.type === 'demon') {
        r.speed = (r.type === 'bat' ? 2 : 4 + Math.random()) * getSpeedMultiplier() * batSpeedMultiplier;
      }
    });
  }
}

function createRobux() {
  if (inYellowReverse || isPaused) return;
  
  // Если нет робуксов на карте, создаем двух с задержкой
  if (!inHell && !document.getElementById('blackRobuxWorld').style.display.includes('block') && robuxes.length === 0) {
    const speedMultiplier = getSpeedMultiplier();
    const x1 = Math.random() * (canvas.width - 60);
    const isFast1 = Math.random() < 0.5;
    const speed1 = isFast1 ? 3 * speedMultiplier : 1.5 * speedMultiplier;
    const color1 = isFast1 ? 'red' : 'green';
    robuxes.push({ x: x1, y: 0, radius: 30, speed: speed1, color: color1, type: isFast1 ? 'red' : 'green' });
    
    // Второй робукс через секунду
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
  if (inYellowReverse) {
    updateBatSpeeds(); // Обновляем скорость летучих мышей и демонов в мире реверса
  }
  
  for (let i = robuxes.length - 1; i >= 0; i--) {
      const r = robuxes[i];
      r.y += r.speed;
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
          // Проверяем пассивную способность монстра (20% шанс избежать потери жизни)
          if (mainQuest.reach100.completed && accounts[currentAccount].path === 'monster' && 
              r.type !== 'gold' && r.type !== 'pink' && r.type !== 'whiteRainbow' && r.type !== 'invertedPlayer' &&
              Math.random() < passiveAbilities.monster.chanceToAvoidDamage) {
              // Игрок избежал потери жизни
              robuxes.splice(i, 1);
              continue;
          }
          
          // Проверяем щит героя на последней жизни
          if (lives === 1 && passiveAbilities.hero.lastLifeShield && 
              mainQuest.reach100.completed && accounts[currentAccount].path === 'hero') {
              passiveAbilities.hero.lastLifeShield = false;
              passiveAbilities.hero.shieldTimer = Date.now() + passiveAbilities.hero.shieldCooldown;
              robuxes.splice(i, 1);
              continue;
          }

          // Проверяем защиту зеленого скина от обычных зеленых врагов
          if (lives === 1 && accounts[currentAccount].skin === 'green' && r.type === 'green') {
              robuxes.splice(i, 1);
              continue;
          }

          robuxes.splice(i, 1);
          if (r.type === 'gold') {
              score += 5;
          } else if (r.type === 'black') {
              // Активируем эффект черного шара и проверяем, был ли это эффект потери жизни
              const effectType = activateBlackRobuxEffect();
              
              // Проверяем квест смерти от черного шара (только если это последняя жизнь и эффект был "потеря жизни")
              if (lives === 1 && effectType === 'lifeLost' && !quests.blackBallDeath.completed) {
                quests.blackBallDeath.completed = true;
                const reward = mainQuest.reach100.completed && accounts[currentAccount].path === 'wanderer' ? 
                  quests.blackBallDeath.reward * 2 : quests.blackBallDeath.reward;
                updateTotalScore(reward);
                accounts[currentAccount].quests = quests;
                saveAccounts();
                showQuestCompleted(
                  language === 'ru' ? 'Смерть от черного шара' : 'Death by black ball',
                  reward
                );
              }
          } else if (r.type === 'pink') {
              // Проверяем квест "Мистер Фламинго"
              if (player.color === 'pink') {
                if (!quests.pinkDoubleTouch.completed) {
                  quests.pinkDoubleTouch.completed = true;
                  const reward = mainQuest.reach100.completed && accounts[currentAccount].path === 'wanderer' ? 
                    quests.pinkDoubleTouch.reward * 2 : quests.pinkDoubleTouch.reward;
                  updateTotalScore(reward);
                  accounts[currentAccount].quests = quests;
                  saveAccounts();
                  showQuestCompleted(
                    language === 'ru' ? 'Мистер Фламинго' : 'Mister Flamingo',
                    reward
                  );
                }
              }
              activateFlamingoEffect();
          } else if (r.type === 'whiteRainbow') {
              enterHellWorld();
          } else if (r.type === 'invertedPlayer') {
              enterYellowReverseWorld();
          } else if (r.type === 'bat') {
              if (!isBlackoutActive) { // Не теряем жизни во время анимации черного экрана
                  lives--;
                  batHitCount++;
                  applyBatDamageEffects();
                  showBatHitEffect();
                  if (lives <= 0) {
                      endGame();
                      return;
                  }
              }
          } else if (r.type === 'demon') {
              // Демон отматывает музыку на 5 секунд назад
              const yellowReverseMusic = document.getElementById('yellowReverseMusic');
              yellowReverseMusic.currentTime = Math.max(0, yellowReverseMusic.currentTime - 5);
              showTimeRewindEffect();
          } else if (r.type === 'grayFinal') {
              showGrayRobuxEffect();
          } else {
              if (!isBlackoutActive) { // Не теряем жизни во время анимации черного экрана
                  lives--;
                  if (lives <= 0) {
                      endGame();
                      return;
                  }
              }
          }
      }

      if (r && r.y > canvas.height) {
          robuxes.splice(i, 1);
          if (r.type === 'gold') {
              shakeScreen();
              if (score > 0) score--;
          } else if (r.type === 'grayFinal') {
              showGrayRobuxEffect();
          } else {
              score += 1;
              checkMainQuestCompletion(); // Проверяем выполнение основного квеста
              if (score % 10 === 0) difficulty += 0.03;
          }
      }
  }
  
  // Обновляем щит героя
  updateHeroShield();
}

function showTimeRewindEffect() {
  timeRewindEffect.style.display = 'flex';
  document.getElementById('timeRewindText').textContent = language === 'ru' ? '-5 СЕКУНД' : '-5 SECONDS';
  
  setTimeout(() => {
    timeRewindEffect.style.display = 'none';
  }, 1000);
}

function applyBatDamageEffects() {
  if (batHitCount === 1) {
    // Первый удар - злые брови
    hasAngryEyebrows = true;
  } else if (batHitCount === 2) {
    // Второй удар - красный глаз
    isEyeRed = true;
  }
}

function showBatHitEffect() {
  const effect = document.getElementById('batHitEffect');
  const sound = document.getElementById('batHitSound');
  
  effect.style.display = 'flex';
  sound.currentTime = 0;
  sound.play();
  
  setTimeout(() => {
    effect.style.display = 'none';
  }, BAT_HIT_DURATION);
}

function drawPlayer() {
  // Основной цвет игрока
  ctx.fillStyle = player.color || (accounts[currentAccount].skin === 'green' ? 'green' : 'yellow');
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  // Глаза
  ctx.fillStyle = 'black';
  if (isEyeRed) {
    // Левый глаз - красный и светящийся
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(player.x - 10, player.y - 10, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'red';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Правый глаз остается черным
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(player.x + 10, player.y - 10, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Обычные глаза
    ctx.beginPath();
    ctx.arc(player.x - 10, player.y - 10, 5, 0, Math.PI * 2);
    ctx.arc(player.x + 10, player.y - 10, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Рот
  ctx.beginPath();
  ctx.arc(player.x, player.y + 5, 15, 0, Math.PI);
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Злые брови (если есть)
  if (hasAngryEyebrows) {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    
    // Левая бровь
    ctx.beginPath();
    ctx.moveTo(player.x - 20, player.y - 20);
    ctx.lineTo(player.x - 5, player.y - 15);
    ctx.stroke();
    
    // Правая бровь
    ctx.beginPath();
    ctx.moveTo(player.x + 20, player.y - 20);
    ctx.lineTo(player.x + 5, player.y - 15);
    ctx.stroke();
  }
  
  // Рисуем щит героя, если он активен
  if (mainQuest.reach100.completed && accounts[currentAccount].path === 'hero' && passiveAbilities.hero.lastLifeShield) {
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 10, 0, Math.PI * 2);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}

function drawRobux(robux) {
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
    img.src = 'my_face.png';
    img.onload = () => {
      ctx.drawImage(img, robux.x - robux.radius, robux.y - robux.radius, robux.radius * 2, robux.radius * 2);
    };
    return;
  } 
  if (robux.type === 'invertedPlayer') {
    ctx.save();
    ctx.translate(robux.x, robux.y);
    ctx.scale(1, -1);
    ctx.translate(-robux.x, -robux.y);

    // Рисуем перевернутого персонажа
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

    // Добавляем шляпу (федору) сверху, так как персонаж перевернут
    ctx.fillStyle = 'black';
    const hatWidth = robux.radius * 1.8;
    const hatHeight = robux.radius * 0.6;
    const hatY = robux.y - robux.radius * 0.8;
    
    // Основание шляпы
    ctx.beginPath();
    ctx.ellipse(robux.x, hatY, hatWidth * 0.5, hatHeight * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Верхняя часть шляпы
    ctx.beginPath();
    ctx.ellipse(robux.x, hatY - hatHeight * 0.3, hatWidth * 0.4, hatHeight * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Вмятина на шляпе
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
  if (robux.type === 'demon') {
    const x = robux.x;
    const y = robux.y;
    const r = robux.radius || 35;
    const flap = Math.sin(Date.now() / 150) * 8;

    ctx.save();
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 25;
    ctx.fillStyle = 'black';

    // Овальное тело демона (как у летучей мыши)
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

    // Голова
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.6, r, 0, 0, Math.PI * 2);
    ctx.fill();

    // Глазы
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(x - r * 0.2, y - r * 0.3, r * 0.12, 0, Math.PI * 2);
    ctx.arc(x + r * 0.2, y - r * 0.3, r * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Рот с клыками
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.3, y + r * 0.1);
    ctx.lineTo(x - r * 0.2, y + r * 0.3);
    ctx.lineTo(x, y + r * 0.2);
    ctx.lineTo(x + r * 0.2, y + r * 0.3);
    ctx.lineTo(x + r * 0.3, y + r * 0.1);
    ctx.fill();

    ctx.restore();
    return;
  }
}

function updateTotalScore(newScore) {
  totalScore += newScore;
  accounts[currentAccount].totalScore = totalScore;
  saveAccounts();
  const totalScoreText = document.getElementById('totalScoreText');
  totalScoreText.textContent = language === 'ru'
    ? `Общий счёт: ${totalScore}`
    : `Total Score: ${totalScore}`;
}

function drawUI() {
  if (!gameStarted) return;

  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(language === 'ru' ? `Счет: ${score}` : `Score: ${score}`, 10, 30);
  ctx.fillText(language === 'ru' ? `Жизни: ${lives}` : `Lives: ${lives}`, 10, 60);
  
  // Отображаем выбранный путь
  if (accounts[currentAccount].path) {
    let pathText = '';
    if (language === 'ru') {
      if (accounts[currentAccount].path === 'monster') pathText = 'Путь: Монстр';
      else if (accounts[currentAccount].path === 'hero') pathText = 'Путь: Герой';
      else if (accounts[currentAccount].path === 'wanderer') pathText = 'Путь: Странник';
    } else {
      if (accounts[currentAccount].path === 'monster') pathText = 'Path: Monster';
      else if (accounts[currentAccount].path === 'hero') pathText = 'Path: Hero';
      else if (accounts[currentAccount].path === 'wanderer') pathText = 'Path: Wanderer';
    }
    ctx.fillText(pathText, 10, 90);
  }
  
  // Отображаем статус щита героя
  if (mainQuest.reach100.completed && accounts[currentAccount].path === 'hero' && lives === 1) {
    const shieldText = passiveAbilities.hero.lastLifeShield 
      ? (language === 'ru' ? 'Щит активен' : 'Shield active') 
      : (language === 'ru' ? `Щит через: ${Math.max(0, Math.ceil((passiveAbilities.hero.shieldTimer - Date.now()) / 1000))}с` : `Shield in: ${Math.max(0, Math.ceil((passiveAbilities.hero.shieldTimer - Date.now()) / 1000))}s`);
    ctx.fillText(shieldText, 10, 120);
  }
  
  // Отображаем активный зеленый скин
  if (accounts[currentAccount].skin === 'green') {
    const skinText = language === 'ru' 
      ? 'Защита от зеленых врагов' 
      : 'Protection from green enemies';
    ctx.fillText(skinText, 10, 150);
  }
}

function playDeathAnimation(callback) {
  const startY = player.y;
  const jumpHeight = 50;
  const peakY = startY - jumpHeight;
  const endY = canvas.height + player.radius * 2;
  const totalDuration = 2000;
  const jumpDuration = 500;
  const fallDuration = totalDuration - jumpDuration;
  const startTime = performance.now();

  const sound = document.getElementById('deathSound');
  sound.currentTime = 0;
  sound.play();

  function animate(time) {
    const elapsed = time - startTime;

    if (elapsed < jumpDuration) {
      const progress = elapsed / jumpDuration;
      player.y = startY - Math.sin(progress * Math.PI) * jumpHeight;
    } else {
      const fallProgress = Math.min((elapsed - jumpDuration) / fallDuration, 1);
      player.y = peakY + (endY - peakY) * easeIn(fallProgress);
    }

    draw();

    if (elapsed < totalDuration) {
      requestAnimationFrame(animate);
    } else {
      if (callback) callback();
    }
  }

  requestAnimationFrame(animate);

  function easeIn(t) {
    return t * t;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameStarted) {
    drawPlayer();
  }

  robuxes.forEach(drawRobux);
  drawUI();
}

function gameLoop() {
  if (gameStarted && !isPaused) {
    updatePlayer();

    if (clearRobuxesNextFrame) {
      robuxes.length = 0;
      clearRobuxesNextFrame = false;
    }

    if (!inHell && !document.getElementById('blackRobuxWorld').style.display.includes('block')) {
      createRobux();
    }

    updateRobuxes();
    draw();
  }

  animationFrameId = requestAnimationFrame(gameLoop);
}

function shakeScreen() {
  const duration = 400;
  const strength = 10;
  const start = Date.now();

  function shake() {
    const elapsed = Date.now() - start;
    if (elapsed < duration) {
      const dx = (Math.random() - 0.5) * strength;
      const dy = (Math.random() - 0.5) * strength;
      canvas.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(shake);
    } else {
      canvas.style.transform = 'translate(0, 0)';
    }
  }
  shake();
}

function drawScaryHandsAndEye() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const eyeRadius = 50;
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, eyeRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(centerX, centerY, eyeRadius / 2, 0, Math.PI * 2);
  ctx.fillStyle = 'black';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(centerX - 150, centerY + 50);
  ctx.quadraticCurveTo(centerX - 200, centerY + 20, centerX - 160, centerY + 100);
  ctx.quadraticCurveTo(centerX - 180, centerY + 150, centerX - 120, centerY + 140);
  ctx.fillStyle = 'white';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(centerX + 150, centerY + 50);
  ctx.quadraticCurveTo(centerX + 200, centerY + 20, centerX + 160, centerY + 100);
  ctx.quadraticCurveTo(centerX + 180, centerY + 150, centerX + 120, centerY + 140);
  ctx.fillStyle = 'white';
  ctx.fill();
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function triggerBlackout() {
  isBlackoutActive = true; // Устанавливаем флаг, что анимация черного экрана активна
  const blackout = document.getElementById('blackout');
  const horrorElements = document.getElementById('horrorElements');
  const blackoutSound = document.getElementById('blackoutSound');

  bgMusic.pause();
  blackout.style.opacity = '1';
  horrorElements.style.opacity = '1';
  blackoutSound.currentTime = 0;
  blackoutSound.play();

  setTimeout(() => {
    blackout.style.opacity = '0';
    horrorElements.style.opacity = '0';
    blackoutSound.pause();
    blackoutSound.currentTime = 0;
    enterBlackRobuxWorld();
    isBlackoutActive = false; // Сбрасываем флаг после завершения анимации
  }, 4000);
}

function activateBlackRobuxEffect() {
  const effect = Math.floor(Math.random() * 4);
  let effectType = 'other'; // По умолчанию - другой эффект

  if (effect === 0) {
    if (lives < 3) {
      lives++;
      effectType = 'lifeGained';
    }
  } else if (effect === 1) {
    const originalSpeeds = robuxes.map(r => r.speed);
    robuxes.forEach(r => r.speed *= 0.4);
    setTimeout(() => {
      robuxes.forEach((r, i) => r.speed = originalSpeeds[i]);
    }, 2000);
    effectType = 'slowDown';
  } else if (effect === 2) {
    if (lives > 0 && !isBlackoutActive) {
      lives--;
      effectType = 'lifeLost';
    }
    if (lives <= 0) endGame();
  } else if (effect === 3) {
    triggerBlackout();
    effectType = 'blackout';
  }
  
  return effectType; // Возвращаем тип эффекта для проверки в квесте
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

function endGame() {
  if (gameOverTriggered) return;
  gameOverTriggered = true;
  playDeathAnimation(() => {
    player.color = accounts[currentAccount].skin === 'green' ? 'green' : 'yellow';
    player.radius = 40;
    document.getElementById('hellOverlay').style.opacity = '0';
    document.getElementById('blackRobuxWorld').style.display = 'none';
    document.getElementById('grayRobuxEffect').style.display = 'none';
    document.getElementById('blackout').style.opacity = '0';
    document.getElementById('horrorElements').style.opacity = '0';
    document.getElementById('batHitEffect').style.display = 'none';
    document.getElementById('yellowReverseWorld').style.display = 'none';

    gameStarted = false;
    bgMusic.pause();
    bgMusic.currentTime = 0;
    document.getElementById('controls').style.display = 'none';
    settingsButton.style.display = 'none';
    document.getElementById('hellMusic').pause();
    document.getElementById('blackWorldMusic').pause();
    document.getElementById('yellowReverseMusic').pause();

    if (hellInterval) clearInterval(hellInterval);
    if (darkWorldInterval) clearInterval(darkWorldInterval);
    inHell = false;
    inYellowReverse = false;

    const gameOverScreen = document.getElementById('gameOverScreen');
    const gameOverText = document.getElementById('gameOverText');
    const restartButton = document.getElementById('restartButton');

    robuxes = [];
    clearCanvas();
    
    // Обновляем общий счет (без множителя, так как он применяется только к игровому счету)
    updateTotalScore(score);

    const totalScoreText = document.getElementById('totalScoreText');
    totalScoreText.textContent = language === 'ru'
      ? `Общий счёт: ${totalScore}`
      : `Total Score: ${totalScore}`;
    
    gameOverText.textContent = language === 'ru' ? `Игра окончена! Счет: ${score}` : `Game Over! Score: ${score}`;
    restartButton.textContent = language === 'ru' ? 'Играть снова' : 'Play Again';

    gameOverScreen.style.display = 'flex';
    setTimeout(() => {
      gameOverScreen.style.opacity = '1';
    }, 50);

    restartButton.onclick = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      // Сброс эффектов от летучих мышей
      batHitCount = 0;
      hasAngryEyebrows = false;
      isEyeRed = false;
      batSpeedMultiplier = 1.0; // Сброс скорости летучих мышей
      
      // Сброс щита героя
      passiveAbilities.hero.lastLifeShield = false;
      passiveAbilities.hero.shieldTimer = 0;

      player.color = accounts[currentAccount].skin === 'green' ? 'green' : 'yellow';
      player.radius = 40;
      document.getElementById('hellOverlay').style.opacity = '0';
      document.getElementById('blackRobuxWorld').style.display = 'none';
      document.getElementById('grayRobuxEffect').style.display = 'none';
      document.getElementById('blackout').style.opacity = '0';
      document.getElementById('horrorElements').style.opacity = '0';
      document.getElementById('batHitEffect').style.display = 'none';
      document.getElementById('yellowReverseWorld').style.display = 'none';

      gameOverScreen.style.opacity = '0';
      gameOverScreen.style.display = 'none';
      score = 0;
      gameOverTriggered = false;
      lives = 3;
      difficulty = 1;
      settingsButton.style.display = 'block';
      robuxes = [];
      player.x = canvas.width / 2;
      player.y = canvas.height - 100;
      bgMusic.currentTime = 0;
      bgMusic.play();
      document.getElementById('controls').style.display = 'flex';
      gameStarted = true;
      gameLoop();
    };
    document.getElementById('menuButton').onclick = () => {
      location.reload();
    };
  });
}

function showCatchNotice() {
  const notice = document.getElementById('catchNotice');
  notice.textContent = language === 'ru' ? 'ЛОВИ!!' : 'CATCH!!';
  notice.style.opacity = '1';

  if (catchNoticeTimeout) clearTimeout(catchNoticeTimeout);

  catchNoticeTimeout = setTimeout(() => {
    notice.style.opacity = '0';
  }, 2000);
}

let inHell = false;
let hellInterval = null;
let hellEntryScore = 0;

function enterHellWorld() {
  if (inHell) return;
  inHell = true;
  hellEntryScore = score;

  const overlay = document.getElementById('hellOverlay');
  overlay.style.opacity = '1';

  bgMusic.pause();
  const hellMusic = document.getElementById('hellMusic');
  hellMusic.currentTime = 0;
  hellMusic.loop = true;
  hellMusic.play();

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
      // Проверяем квест прохождения адского мира
      if (!quests.hellWorldCompleted.completed) {
        quests.hellWorldCompleted.completed = true;
        const reward = mainQuest.reach100.completed && accounts[currentAccount].path === 'wanderer' ? 
          quests.hellWorldCompleted.reward * 2 : quests.hellWorldCompleted.reward;
        updateTotalScore(reward);
        accounts[currentAccount].quests = quests;
        saveAccounts();
        showQuestCompleted(
          language === 'ru' ? 'Пройти адский мир' : 'Complete hell world',
          reward
        );
      }
      exitHellWorld();
      clearInterval(checkHellExit);
    }
  }, 500);
}

function exitHellWorld() {
  inHell = false;
  if (hellInterval) clearInterval(hellInterval);

  const hellMusic = document.getElementById('hellMusic');
  hellMusic.pause();
  bgMusic.currentTime = 0;
  bgMusic.play();

  const overlay = document.getElementById('hellOverlay');
  overlay.style.opacity = '0';
}

function enterBlackRobuxWorld() {
  const blackRobuxWorld = document.getElementById('blackRobuxWorld');
  blackRobuxWorld.style.display = 'block';

  bgMusic.pause();

  if (blackWorldMusic.paused) {
    blackWorldMusic.currentTime = 0;
    blackWorldMusic.play();
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

  blackWorldMusic.onended = () => {
    if (darkWorldInterval) {
        clearInterval(darkWorldInterval);
        darkWorldInterval = null;
    }

    setTimeout(() => {
        const meow = document.getElementById('meowSound');
        meow.currentTime = 0;
        meow.play();

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

function enterYellowReverseWorld() {
  const yellowReverseWorld = document.getElementById('yellowReverseWorld');
  yellowReverseWorld.style.display = 'block';
  setTimeout(() => {
    yellowReverseWorld.style.opacity = '1';
  }, 10);

  bgMusic.pause();
  const yellowReverseMusic = document.getElementById('yellowReverseMusic');
  yellowReverseMusic.currentTime = 0;
  yellowReverseMusic.play();

  // Добавляем обработчик окончания музыки
  yellowReverseMusic.onended = exitYellowReverseWorld;

  inYellowReverse = true;
  clearRobuxesNextFrame = true;
  batSpeedMultiplier = 1.0; // Сброс скорости летучих мышей при входе
  lastBatSpeedUpdate = Date.now(); // Сброс таймера обновления скорости

  darkWorldInterval = setInterval(() => {
    if (!isPaused) {
      const speedMultiplier = getSpeedMultiplier() * batSpeedMultiplier;
      const currentTime = yellowReverseMusic.currentTime;
      
      // Добавляем летучих мышей с проверкой минимального расстояния
      let batX;
      let validPosition = false;
      let attempts = 0;
      
      do {
        batX = Math.random() * (canvas.width - 60);
        validPosition = true;
        
        // Проверяем расстояние до других врагов
        for (const r of robuxes) {
          if (Math.abs(r.x - batX) < 100) { // Минимальное расстояние 100px
            validPosition = false;
            break;
          }
        }
        
        attempts++;
        if (attempts > 50) break; // Защита от бесконечного цикла
      } while (!validPosition);
      
      if (validPosition) {
        robuxes.push({
          x: batX,
          y: 0,
          radius: 30,
          speed: (2 + Math.random()) * speedMultiplier,
          type: 'bat'
        });
      }
      
      // Добавляем демонов после 50 секунды музыки с проверкой расстояния
      if (currentTime > 50) {
        let demonX;
        validPosition = false;
        attempts = 0;
        
        do {
          demonX = Math.random() * (canvas.width - 60);
          validPosition = true;
          
          // Проверяем расстояние до других врагов
          for (const r of robuxes) {
            if (Math.abs(r.x - demonX) < 100) { // Минимальное расстояние 100px
              validPosition = false;
              break;
            }
          }
          
          attempts++;
          if (attempts > 50) break; // Защита от бесконечного цикла
        } while (!validPosition);
        
        if (validPosition) {
          robuxes.push({
            x: demonX,
            y: 0,
            radius: 35,
            speed: (4 + Math.random()) * speedMultiplier, // В 2 раза быстрее летучих мышей
            type: 'demon'
          });
        }
      }
    }
  }, 1000);
}

function exitYellowReverseWorld() {
  const yellowReverseWorld = document.getElementById('yellowReverseWorld');
  yellowReverseWorld.style.opacity = '0';
  
  setTimeout(() => {
    inYellowReverse = false;
    if (darkWorldInterval) clearInterval(darkWorldInterval);

    const yellowReverseMusic = document.getElementById('yellowReverseMusic');
    yellowReverseMusic.pause();
    yellowReverseMusic.currentTime = 0;

    yellowReverseWorld.style.display = 'none';

    bgMusic.currentTime = 0;
    bgMusic.play();

    clearRobuxesNextFrame = true;
  }, 1000); // Ждем завершения анимации исчезновения
}

function showGrayRobuxEffect() {
  const effectElement = document.getElementById('grayRobuxEffect');
  const sound = document.getElementById('grayRobuxSound');
  
  effectElement.style.display = 'flex';
  sound.currentTime = 0;
  sound.play();
  
  setTimeout(() => {
      effectElement.style.display = 'none';
      sound.pause();
      
      const blackRobuxWorld = document.getElementById('blackRobuxWorld');
      blackRobuxWorld.style.display = 'none';
      
      blackWorldMusic.pause();
      blackWorldMusic.currentTime = 0;
      
      bgMusic.currentTime = 0;
      bgMusic.play();
      
      if (darkWorldInterval) {
          clearInterval(darkWorldInterval);
          darkWorldInterval = null;
      }
      
      clearRobuxesNextFrame = true;
  }, 5000);
}