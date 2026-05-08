const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const menuScreen = document.getElementById('menu-screen');
const gameScreen = document.getElementById('game-screen');
const finalScreen = document.getElementById('final-screen');
const messageOverlay = document.getElementById('message-overlay');
const messageText = document.getElementById('message-text');
const countdownOverlay = document.getElementById('countdown');
const countdownNumber = document.getElementById('countdown-number');

const btn3Goals = document.getElementById('btn-3-goals');
const btnGoldenGoal = document.getElementById('btn-golden-goal');
const btnResetBall = document.getElementById('btn-reset-ball');
const btnRestart = document.getElementById('btn-restart');
const btnMenu = document.getElementById('btn-menu');
const btnMenuLive = document.getElementById('btn-menu-live');

const scorePlayerText = document.getElementById('score-player');
const scoreRivalText = document.getElementById('score-rival');
const modeText = document.getElementById('mode-text');
const finalTitle = document.getElementById('final-title');
const finalResult = document.getElementById('final-result');

const config = {
    width: 1000,
    height: 750,
    goalWidth: 70,
    goalHeight: 220,
    lineWidth: 6,
    centerCircleRadius: 120,
    friction: 0.98,
    ballBounce: 0.86,
    ballMaxSpeed: 22,
};

const state = {
    current: 'menu',
    mode: '3goals',
    targetScore: 3,
    goldenGoal: false,
};

const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false,
};

const players = [
    {
        x: 0,
        y: 0,
        radius: 24,
        color: '#2e91ff',
        speed: 6.5,
        shootPower: 12,
        controlled: true,
    },
    {
        x: 0,
        y: 0,
        radius: 24,
        color: '#72b3ff',
        speed: 5.2,
        kickCooldown: 0,
    },
    {
        x: 0,
        y: 0,
        radius: 24,
        color: '#72b3ff',
        speed: 5.2,
        kickCooldown: 0,
    },
];

const bots = [
    {
        x: 0,
        y: 0,
        radius: 24,
        color: '#ff0000',
        speed: 5.2,
        role: 'attack',
        kickCooldown: 0,
    },
    {
        x: 0,
        y: 0,
        radius: 24,
        color: '#cc0000',
        speed: 4.9,
        role: 'mid',
        kickCooldown: 0,
    },
    {
        x: 0,
        y: 0,
        radius: 24,
        color: '#990000',
        speed: 4.7,
        role: 'defend',
        kickCooldown: 0,
    },
];

const ball = {
    x: 0,
    y: 0,
    radius: 14,
    vx: 0,
    vy: 0,
};

let playerScore = 0;
let rivalScore = 0;
let pauseTimeout = null;

canvas.width = config.width;
canvas.height = config.height;

function showScreen(screen) {
    menuScreen.classList.toggle('hidden', screen !== 'menu');
    gameScreen.classList.toggle('hidden', screen !== 'game');
    finalScreen.classList.toggle('hidden', screen !== 'final');
}

function showMessage(text) {
    messageText.textContent = text;
    messageOverlay.classList.remove('hidden');
}

function hideMessage() {
    messageOverlay.classList.add('hidden');
}

function showCountdown() {
    countdownOverlay.classList.remove('hidden');
}

function hideCountdown() {
    countdownOverlay.classList.add('hidden');
}

function updateScoreboard() {
    scorePlayerText.textContent = playerScore;
    scoreRivalText.textContent = rivalScore;
}

function resetEntities() {
    players[0].x = config.width * 0.18;
    players[0].y = config.height / 2;

    players[1].x = config.width * 0.18;
    players[1].y = config.height * 0.3;

    players[2].x = config.width * 0.18;
    players[2].y = config.height * 0.7;

    bots[0].x = config.width * 0.82;
    bots[0].y = config.height / 2;

    bots[1].x = config.width * 0.82;
    bots[1].y = config.height * 0.28;

    bots[2].x = config.width * 0.82;
    bots[2].y = config.height * 0.72;

    resetBall();
}

function initializeGame() {
    playerScore = 0;
    rivalScore = 0;

    updateScoreboard();
    resetEntities();

    modeText.textContent = state.goldenGoal
        ? 'Gol de Oro'
        : `Partido a ${state.targetScore} goles`;

    showMessage('¡Vamos!');

    startCountdown(() => {
        state.current = 'playing';
        hideMessage();
    });
}

function resetBall() {
    ball.x = config.width / 2;
    ball.y = config.height / 2;
    ball.vx = 0;
    ball.vy = 0;
}

function setMode(mode) {
    state.mode = mode;
    state.goldenGoal = mode === 'golden';
    state.targetScore = state.goldenGoal ? 1 : 3;
}

function startCountdown(onComplete) {
    let count = 3;

    countdownNumber.textContent = count;
    showCountdown();

    const interval = setInterval(() => {
        count--;

        if (count > 0) {
            countdownNumber.textContent = count;
        } else {
            clearInterval(interval);
            hideCountdown();
            onComplete();
        }
    }, 1000);
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function distance(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
}

function normalizeVector(dx, dy) {
    const len = Math.hypot(dx, dy) || 1;

    return {
        x: dx / len,
        y: dy / len,
    };
}

function ballInGoalZone(isLeftGoal) {
    const goalTop = (config.height - config.goalHeight) / 2;
    const goalBottom = goalTop + config.goalHeight;

    if (
        ball.y < goalTop + ball.radius ||
        ball.y > goalBottom - ball.radius
    ) {
        return false;
    }

    return isLeftGoal
        ? ball.x - ball.radius <= 0
        : ball.x + ball.radius >= config.width;
}

function handleGoals() {
    const leftGoal = ballInGoalZone(true);
    const rightGoal = ballInGoalZone(false);

    if (!leftGoal && !rightGoal) {
        return;
    }

    if (leftGoal) {
        rivalScore++;
        processGoal(false);
    }

    if (rightGoal) {
        playerScore++;
        processGoal(true);
    }

    updateScoreboard();
}

function processGoal(playerWon) {
    state.current = 'goal';

    showMessage(
        playerWon
            ? '⚽ ¡Has marcado!'
            : '❌ El rival ha marcado'
    );

    if (
        state.goldenGoal ||
        playerScore >= state.targetScore ||
        rivalScore >= state.targetScore
    ) {
        setTimeout(gameOver, 1400);
        return;
    }

    pauseTimeout = setTimeout(() => {
        resetEntities();
        hideMessage();

        startCountdown(() => {
            state.current = 'playing';
        });
    }, 1400);
}

function gameOver() {
    state.current = 'gameOver';

    const playerWon = playerScore > rivalScore;

    finalTitle.textContent = playerWon
        ? '¡Victoria!'
        : 'Derrota';

    finalResult.textContent = playerWon
        ? `Has ganado ${playerScore} - ${rivalScore}`
        : `Has perdido ${rivalScore} - ${playerScore}`;

    showScreen('final');
}

function applyBallPhysics() {
    ball.vx *= config.friction;
    ball.vy *= config.friction;

    ball.x += ball.vx;
    ball.y += ball.vy;

    const goalTop = (config.height - config.goalHeight) / 2;
    const goalBottom = goalTop + config.goalHeight;

    const insideGoal =
        ball.y >= goalTop &&
        ball.y <= goalBottom;

    if (!insideGoal) {
        if (ball.x - ball.radius <= 0) {
            ball.x = ball.radius;
            ball.vx *= -config.ballBounce;
        }

        if (ball.x + ball.radius >= config.width) {
            ball.x = config.width - ball.radius;
            ball.vx *= -config.ballBounce;
        }
    }

    if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.vy *= -config.ballBounce;
    }

    if (ball.y + ball.radius >= config.height) {
        ball.y = config.height - ball.radius;
        ball.vy *= -config.ballBounce;
    }
}

function updatePlayer() {
    const player = players[0];

    let moveX = 0;
    let moveY = 0;

    if (keys.ArrowLeft) moveX--;
    if (keys.ArrowRight) moveX++;
    if (keys.ArrowUp) moveY--;
    if (keys.ArrowDown) moveY++;

    if (moveX || moveY) {
        const dir = normalizeVector(moveX, moveY);

        player.x += dir.x * player.speed;
        player.y += dir.y * player.speed;
    }

    player.x = clamp(player.x, player.radius, config.width - player.radius);
    player.y = clamp(player.y, player.radius, config.height - player.radius);

    const dist = distance(player.x, player.y, ball.x, ball.y);

    if (
        keys.Space &&
        dist <= player.radius + ball.radius + 8
    ) {
        const dir = normalizeVector(
            ball.x - player.x,
            ball.y - player.y
        );

        ball.vx += dir.x * player.shootPower;
        ball.vy += dir.y * player.shootPower;

        keys.Space = false;
    }
}

function updateBots() {
    bots.forEach((bot) => {
        const dir = normalizeVector(
            ball.x - bot.x,
            ball.y - bot.y
        );

        bot.x += dir.x * bot.speed;
        bot.y += dir.y * bot.speed;

        const dist = distance(bot.x, bot.y, ball.x, ball.y);

        if (dist <= bot.radius + ball.radius + 5) {
            const shot = normalizeVector(
                -ball.x,
                config.height / 2 - ball.y
            );

            ball.vx = shot.x * 12;
            ball.vy = shot.y * 12;
        }
    });
}

function handleBallCollision(entity) {
    const dx = ball.x - entity.x;
    const dy = ball.y - entity.y;

    const dist = Math.hypot(dx, dy);
    const minDist = ball.radius + entity.radius;

    if (dist >= minDist || dist === 0) return;

    const overlap = minDist - dist;
    const normal = normalizeVector(dx, dy);

    ball.x += normal.x * overlap;
    ball.y += normal.y * overlap;

    ball.vx += normal.x * 4;
    ball.vy += normal.y * 4;
}

function update() {
    if (state.current !== 'playing') return;

    updatePlayer();
    updateBots();

    applyBallPhysics();

    players.forEach(handleBallCollision);
    bots.forEach(handleBallCollision);

    handleGoals();
}

function drawField() {
    ctx.fillStyle = '#1f7a35';
    ctx.fillRect(0, 0, config.width, config.height);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = config.lineWidth;

    ctx.strokeRect(0, 0, config.width, config.height);

    ctx.beginPath();
    ctx.moveTo(config.width / 2, 0);
    ctx.lineTo(config.width / 2, config.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(
        config.width / 2,
        config.height / 2,
        config.centerCircleRadius,
        0,
        Math.PI * 2
    );
    ctx.stroke();

    const goalTop = (config.height - config.goalHeight) / 2;

    ctx.fillStyle = 'rgba(255,255,255,0.15)';

    ctx.fillRect(
        0,
        goalTop,
        config.goalWidth,
        config.goalHeight
    );

    ctx.fillRect(
        config.width - config.goalWidth,
        goalTop,
        config.goalWidth,
        config.goalHeight
    );
}

function drawEntity(entity) {
    ctx.beginPath();

    ctx.fillStyle = entity.color;

    ctx.arc(
        entity.x,
        entity.y,
        entity.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

function drawBall() {
    ctx.beginPath();

    ctx.fillStyle = '#fff';

    ctx.arc(
        ball.x,
        ball.y,
        ball.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

function draw() {
    drawField();

    drawBall();

    players.forEach(drawEntity);
    bots.forEach(drawEntity);
}

function loop() {
    update();
    draw();

    requestAnimationFrame(loop);
}

function resetGame() {
    if (pauseTimeout) {
        clearTimeout(pauseTimeout);
    }

    state.current = 'menu';

    hideMessage();
    hideCountdown();

    showScreen('menu');
}

btn3Goals.addEventListener('click', () => {
    setMode('3goals');

    showScreen('game');

    initializeGame();
});

btnGoldenGoal.addEventListener('click', () => {
    setMode('golden');

    showScreen('game');

    initializeGame();
});

btnResetBall.addEventListener('click', () => {
    resetBall();

    showMessage('Pelota reseteada');

    setTimeout(hideMessage, 1200);
});

btnRestart.addEventListener('click', () => {
    showScreen('game');

    initializeGame();
});

btnMenu.addEventListener('click', () => {
    resetGame();
});

btnMenuLive.addEventListener('click', () => {
    resetGame();
});

window.addEventListener('keydown', (event) => {
    if (event.code in keys) {
        keys[event.code] = true;
        event.preventDefault();
    }
});

window.addEventListener('keyup', (event) => {
    if (event.code in keys) {
        keys[event.code] = false;
        event.preventDefault();
    }
});

window.addEventListener('blur', () => {
    Object.keys(keys).forEach((key) => {
        keys[key] = false;
    });
});

showScreen('menu');

resetEntities();

requestAnimationFrame(loop);