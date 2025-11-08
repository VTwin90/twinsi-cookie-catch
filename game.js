const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load Twinsi Bear image
const twinsibearImg = new Image();
twinsibearImg.src = 'assets/twinsi_bear.png';

// Twinsi Bear setup
let twinsi = { x: 170, y: 0, width: 60, height: 60 };

// Game state
let items = [];
let score = 0;
let timeLeft = 45;
let gameActive = true;
let spawnInterval;
let countdownInterval;
let lastCaughtItem = null;
let bonusCookieSpawned = false;
let sparklePulse = 0;

// Star field
let stars = [];

function generateStars(count) {
  stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      pulse: Math.random() * 100
    });
  }
}

// Resize canvas to match wrapper
function resizeCanvas() {
  const maxWidth = 400;
  const headerHeight = 60;
  const buttonHeight = 80;
  const padding = 40;

  const availableHeight = window.innerHeight - headerHeight - buttonHeight - padding;
  const width = Math.min(window.innerWidth, maxWidth);
  const height = Math.min(availableHeight, width * 1.5); // maintain 2:3 ratio

  canvas.width = width;
  canvas.height = height;

  twinsi.y = canvas.height - 80;
  generateStars(50); // regenerate stars on resize
}

// Draw Game Background
function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#2c2c4a');
  gradient.addColorStop(0.5, '#4a4a6a');
  gradient.addColorStop(1, '#3a3a5a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let star of stars) {
    const alpha = 0.1 + Math.sin((star.pulse + sparklePulse) / 20) * 0.1;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw Twinsi Bear
function drawTwinsi() {
  ctx.drawImage(twinsibearImg, twinsi.x - 20, twinsi.y, 100, 80);
}

// Draw falling items
function drawItems() {
  ctx.font = '28px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  ctx.textAlign = 'left';

  items.forEach(item => {
    const emoji = item.type === 'coal' ? '🪨' : '🍪';

    if (item.type === 'bonus-cookie') {
      const pulseBlur = 20 + Math.sin(sparklePulse / 10) * 10;
      const pulseAlpha = 0.6 + Math.sin(sparklePulse / 10) * 0.4;

      ctx.save();
      ctx.shadowColor = `rgba(255, 255, 150, ${pulseAlpha})`;
      ctx.shadowBlur = pulseBlur;
      ctx.fillStyle = '#fff';
      ctx.fillText(emoji, item.x, item.y);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 150, ${pulseAlpha * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.strokeText(emoji, item.x, item.y);
      ctx.restore();
    } else {
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
      ctx.shadowBlur = 4;
      ctx.fillText(emoji, item.x, item.y);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeText(emoji, item.x, item.y);
      ctx.restore();
    }
  });

  sparklePulse++;
}

// Update item positions and check collisions
function updateItems() {
  const updatedItems = [];
  const width = canvas.width;
  const height = canvas.height;

  for (let item of items) {
    item.y += 4;

    const caught =
      item.y + 28 > twinsi.y &&
      item.x + 28 > twinsi.x &&
      item.x < twinsi.x + twinsi.width;

    if (caught) {
      lastCaughtItem = item.type;
      if (item.type === 'bonus-cookie') {
        score += 5;
      } else {
        score += item.type === 'cookie' ? 1 : -1;
      }
      continue;
    }

    if (item.y < height) {
      updatedItems.push(item);
    }
  }

  items = updatedItems;
}

// Spawn cookie or coal
function spawnItem() {
  if (!gameActive || timeLeft <= 0) return;

  const width = canvas.width;
  const x = Math.random() * (width - 30);
  let type = Math.random() < 0.7 ? 'cookie' : 'coal';

  if (!bonusCookieSpawned && timeLeft <= 5) {
    type = 'bonus-cookie';
    bonusCookieSpawned = true;
  }

  items.push({ x, y: 0, type });
}

// Draw score and timer
function drawHUD() {
  const width = canvas.width;
  ctx.fillStyle = '#fff';
  ctx.font = '25px Iceberg';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 10, 30);
  ctx.textAlign = 'right';
  ctx.fillText(`Time: ${timeLeft}`, width - 10, 30);
}

// Game loop
function gameLoop() {
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);
  drawBackground();

  drawTwinsi();
  drawItems();
  updateItems();
  drawHUD();

  const allItemsCleared = items.length === 0;

  if (timeLeft > 0 || !allItemsCleared) {
    requestAnimationFrame(gameLoop);
  } else {
    gameActive = false;
    clearInterval(spawnInterval);
    clearInterval(countdownInterval);

    ctx.clearRect(0, 0, width, height);
    drawBackground();
    drawTwinsi();
    drawHUD();

    ctx.fillStyle = '#fff';
    ctx.font = '30px Iceberg';
    ctx.textAlign = 'center';
    ctx.fillText(`Game Over! Score: ${score}`, width / 2, height / 2);
    document.getElementById('play-again').style.display = 'block';
  }
}

// Start game
function startGame() {
  score = 0;
  timeLeft = 45;
  items = [];
  gameActive = true;
  lastCaughtItem = null;
  bonusCookieSpawned = false;
  sparklePulse = 0;

  clearInterval(spawnInterval);
  clearInterval(countdownInterval);

  spawnInterval = setInterval(spawnItem, 1000);
  countdownInterval = setInterval(() => {
    if (timeLeft > 0) timeLeft--;
  }, 1000);

  document.getElementById('play-again').style.display = 'none';
  resizeCanvas();
  gameLoop();
}

startGame();

// Controls
document.addEventListener('keydown', e => {
  const width = canvas.width;
  if (e.key === 'ArrowLeft') twinsi.x = Math.max(0, twinsi.x - 20);
  if (e.key === 'ArrowRight') twinsi.x = Math.min(width - twinsi.width, twinsi.x + 20);
});

canvas.addEventListener('click', e => {
  const width = canvas.width;
  const clickX = e.clientX - canvas.getBoundingClientRect().left;
  if (clickX < width / 2) {
    twinsi.x = Math.max(0, twinsi.x - 20);
  } else {
    twinsi.x = Math.min(width - twinsi.width, twinsi.x + 20);
  }
});

canvas.addEventListener('mousemove', e => {
  const width = canvas.width;
  const mouseX = e.clientX - canvas.getBoundingClientRect().left;
  twinsi.x = Math.min(width - twinsi.width, Math.max(0, mouseX - twinsi.width / 2));
});

canvas.addEventListener('touchmove', e => {
  const width = canvas.width;
  const touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
  twinsi.x = Math.min(width - twinsi.width, Math.max(0, touchX - twinsi.width / 2));
});

// Play again button
document.getElementById('play-again').addEventListener('click', () => {
  startGame();
});
