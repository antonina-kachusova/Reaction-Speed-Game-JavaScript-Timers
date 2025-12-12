const screens = document.querySelectorAll('.screen');
const startBtn = document.querySelector('#start');
const timeList = document.querySelector('#time-list');
const levelList = document.querySelector('#level-list');
const timeElement = document.querySelector('#time');
const board = document.querySelector('#board');
const themeToggleBtn = document.querySelector('#theme-toggle');

const clickSound = document.querySelector('#sound-click');
const startSound = document.querySelector('#sound-start');
const endSound = document.querySelector('#sound-end');
const wrongPlaceSound = document.querySelector('#sound-wrong-place');

const colors = ['#ff6bcb', '#6b5bff', '#46e6b0', '#ffd166', '#ff6b6b', '#4dabf7'];

const difficultySettings = {
  easy: {
    minSize: 35,
    maxSize: 80
  },
  medium: {
    minSize: 25,
    maxSize: 65
  },
  hard: {
    minSize: 15,
    maxSize: 55
  }
};

let time = 0;
let score = 0;
let intervalId = null;
let currentDifficulty = 'medium';
let isGameActive = false;

/* Helpers */
function playSound(audioElement) {
  if (!audioElement) return;
  audioElement.currentTime = 0;
  audioElement.play().catch(() => {});
}

function goToNextScreen(currentIndex) {
  screens[currentIndex].classList.add('up');
}

function updateTimerDisplay(seconds) {
  const formatted = seconds < 10 ? `0${seconds}` : seconds.toString();
  timeElement.textContent = `00:${formatted}`;
}

function setTimerVisible(visible) {
  const parent = timeElement.parentNode;
  if (!parent) return;
  parent.classList.toggle('hide', !visible);
}

/* Game flow */
startBtn.addEventListener('click', (e) => {
  e.preventDefault();
  goToNextScreen(0);
  playSound(startSound);
});

timeList.addEventListener('click', (e) => {
  const btn = e.target.closest('.time-btn');
  if (!btn) return;

  const selectedTime = Number(btn.dataset.time);
  if (Number.isNaN(selectedTime)) return;

  time = selectedTime;
  updateTimerDisplay(time);

  goToNextScreen(1);
  startGame();
});

levelList.addEventListener('click', (e) => {
  const btn = e.target.closest('.level-btn');
  if (!btn) return;

  const difficulty = btn.dataset.difficulty;
  if (!difficultySettings[difficulty]) return;

  currentDifficulty = difficulty;

  levelList.querySelectorAll('.level-btn').forEach((button) => {
    button.classList.toggle('active', button === btn);
  });
});

/* CLICK HANDLER (HIT + MISS HAPTICS & SOUNDS) */
board.addEventListener('click', (e) => {
  // If the game is not active (result screen, before start, etc.) — ignore clicks on the board
  if (!isGameActive) {
    return;
  }

  // HIT
  if (e.target.classList.contains('circle')) {
    score++;
    e.target.remove();
    createRandomCircle();
    playSound(clickSound);

    // Mobile gentle vibration for hit
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
    return;
  }

  //// MISS → ultra haptic pattern + sound (only while the game is active)
  playSound(wrongPlaceSound);

  if (navigator.vibrate) {
    navigator.vibrate([0, 40, 30, 40]);
  }
});

/* THEME TOGGLE */
themeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  document.body.classList.toggle('dark-theme');

  const isLight = document.body.classList.contains('light-theme');
  themeToggleBtn.textContent = isLight ? '☀️ Light' : '🌙 Dark';
});

/* Core game logic */
function startGame() {
  score = 0;
  board.innerHTML = '';
  setTimerVisible(true);
  isGameActive = true; // The game is now active
  createRandomCircle();
  intervalId = setInterval(decreaseTime, 1000);
}

function decreaseTime() {
  if (time <= 0) {
    finishGame();
    return;
  }

  time -= 1;
  updateTimerDisplay(time);
}

function finishGame() {
  clearInterval(intervalId);
  setTimerVisible(false);
  isGameActive = false; // The game is over
  playSound(endSound);

  board.innerHTML = `
    <div class="result">
      <h1>Your score: ${score}</h1>
      <p>Nice job! Try a different duration or difficulty to challenge yourself.</p>
      <button class="btn primary" id="restart-btn">Play again</button>
    </div>
  `;

  const restartBtn = document.querySelector('#restart-btn');
  restartBtn.addEventListener('click', resetGame);
}

function resetGame() {
  // Go back to the first screen
  screens.forEach((screen) => screen.classList.remove('up'));

  time = 0;
  score = 0;
  isGameActive = false; // Just to be safe
  board.innerHTML = '';
  timeElement.textContent = '00:00';
  setTimerVisible(true);
}

/* Circle creation with adaptive mobile sizing */
function createRandomCircle() {
  const circle = document.createElement('div');

  const settings = difficultySettings[currentDifficulty] || difficultySettings.medium;

  // BASE DIFFICULTY SIZE
  let minSize = settings.minSize;
  let maxSize = settings.maxSize;

  // 📱 ADAPTIVE MOBILE SIZING
  const screenWidth = window.innerWidth;

  if (screenWidth <= 480) {
    minSize += 15;
    maxSize += 20;
  } else if (screenWidth <= 768) {
    minSize += 5;
    maxSize += 10;
  }

  const size = getRandomNumber(minSize, maxSize);

  const {
    width,
    height
  } = board.getBoundingClientRect();
  const x = getRandomNumber(size, width - size * 2);
  const y = getRandomNumber(size, height - size * 2);

  circle.classList.add('circle');
  circle.style.width = `${size}px`;
  circle.style.height = `${size}px`;
  circle.style.top = `${y}px`;
  circle.style.left = `${x}px`;
  circle.style.background = colors[getRandomNumber(0, colors.length)];

  board.append(circle);
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}
