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
    rounds: 0,
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


// ==================== FUNCIONES ====================

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

    ball.x = config.width / 2;
    ball.y = config.height / 2;
    ball.vx = 0;
    ball.vy = 0;
}

function initializeGame() {
    document.body.focus();
    playerScore = 0;
    rivalScore = 0;
    state.rounds = 0;
    updateScoreboard();
    resetEntities();
    modeText.textContent = state.goldenGoal ? 'Gol de Oro' : `Partido a ${state.targetScore} goles`;
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

function botShoot(enemy) {
    const goalCenterY = config.height / 2;
    const direction = normalizeVector(0 - ball.x, goalCenterY - ball.y);
    const power = enemy.role === 'attack' ? 16 : enemy.role === 'mid' ? 13 : 10;
    ball.vx = direction.x * power;
    ball.vy = direction.y * power;
    enemy.kickCooldown = 35;
}

function teammateShoot(mate) {
    const goalCenterY = config.height / 2;
    const direction = normalizeVector(config.width - ball.x, goalCenterY - ball.y);
    const power = 14;
    ball.vx = direction.x * power;
    ball.vy = direction.y * power;
    mate.kickCooldown = 40;
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
    const intervalId = setInterval(() => {
        count -= 1;
        if (count > 0) {
            countdownNumber.textContent = count;
        } else {
            clearInterval(intervalId);
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
    return { x: dx / len, y: dy / len };
}

function avoidCrowd(entity, others, radius, strength = 0.8) {
    let ax = 0;
    let ay = 0;
    others.forEach((other) => {
        if (other === entity) return;
        const d = distance(entity.x, entity.y, other.x, other.y);
        if (d > 0 && d < radius) {
            const push = (radius - d) / radius;
            const diff = normalizeVector(entity.x - other.x, entity.y - other.y);
            ax += diff.x * push;
            ay += diff.y * push;
        }
    });
    return { x: ax * strength, y: ay * strength };
}

function ballInGoalZone(isLeftGoal) {
    const goalTop = (config.height - config.goalHeight) / 2;
    const goalBottom = goalTop + config.goalHeight;
    if (ball.y < goalTop + ball.radius || ball.y > goalBottom - ball.radius) {
        return false;
    }
    return isLeftGoal ? ball.x - ball.radius <= 0 : ball.x + ball.radius >= config.width;
}

function handleGoals() {
    const leftGoal = ballInGoalZone(true);
    const rightGoal = ballInGoalZone(false);
    if (!leftGoal && !rightGoal) return false;

    if (leftGoal) {
        rivalScore += 1;
        updateScoreboard();
        processGoal('Rival');
        return true;
    }
    if (rightGoal) {
        playerScore += 1;
        updateScoreboard();
        processGoal('Tú');
        return true;
    }
    return false;
}

function processGoal(team) {
    state.current = 'goal';
    state.rounds += 1;
    const message = team === 'Tú' ? 'Has metido gol' : 'El rival ha metido gol';
    showMessage(message);

    if (state.goldenGoal || playerScore === state.targetScore || rivalScore === state.targetScore) {
        gameOver();
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
    finalTitle.textContent = playerWon ? '¡Victoria!' : 'Derrota';
    finalResult.textContent = playerWon
        ? `Has ganado ${playerScore} - ${rivalScore}`
        : `Has perdido ${rivalScore} - ${playerScore}`;
    showScreen('final');
}

function applyBallPhysics() {
    ball.vx *= config.friction;
    ball.vy *= config.friction;
    if (Math.abs(ball.vx) < 0.02) ball.vx = 0;
    if (Math.abs(ball.vy) < 0.02) ball.vy = 0;

    ball.x += ball.vx;
    ball.y += ball.vy;

    const goalTop = (config.height - config.goalHeight) / 2;
    const goalBottom = goalTop + config.goalHeight;

    const insideLeftGoal = ball.x - ball.radius <= 0 && ball.y >= goalTop && ball.y <= goalBottom;
    const insideRightGoal = ball.x + ball.radius >= config.width && ball.y >= goalTop && ball.y <= goalBottom;

    if (!insideLeftGoal && ball.x - ball.radius <= 0) {
        ball.x = ball.radius;
        ball.vx = Math.abs(ball.vx) * config.ballBounce;
    }
    if (!insideRightGoal && ball.x + ball.radius >= config.width) {
        ball.x = config.width - ball.radius;
        ball.vx = -Math.abs(ball.vx) * config.ballBounce;
    }
    if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.vy = Math.abs(ball.vy) * config.ballBounce;
    }
    if (ball.y + ball.radius >= config.height) {
        ball.y = config.height - ball.radius;
        ball.vy = -Math.abs(ball.vy) * config.ballBounce;
    }

    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed > config.ballMaxSpeed) {
        const ratio = config.ballMaxSpeed / speed;
        ball.vx *= ratio;
        ball.vy *= ratio;
    }
}

function updatePlayer() {
    const controlled = players[0];
    const moveX = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
    const moveY = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);

    if (moveX || moveY) {
        const normalized = normalizeVector(moveX, moveY);
        controlled.x += normalized.x * controlled.speed;
        controlled.y += normalized.y * controlled.speed;
    }

    controlled.x = clamp(controlled.x, controlled.radius, config.width - controlled.radius);
    controlled.y = clamp(controlled.y, controlled.radius, config.height - controlled.radius);

    if (keys.Space) {
        const dist = distance(controlled.x, controlled.y, ball.x, ball.y);
        if (dist <= controlled.radius + ball.radius + 4) {
            const direction = normalizeVector(ball.x - controlled.x, ball.y - controlled.y);
            ball.vx += direction.x * controlled.shootPower;
            ball.vy += direction.y * controlled.shootPower;
            keys.Space = false;
        }
    }
}

function updateTeammates() {
    const ballOnOwnHalf = ball.x < config.width * 0.5;
    const ballInEnemyHalf = ball.x > config.width * 0.5;
    const crowd = players.concat(bots);

    for (let i = 1; i < players.length; i += 1) {
        const mate = players[i];
        let targetX, targetY;

        if (i === 1) { // Mediocampista
            if (ballOnOwnHalf) {
                targetX = clamp(ball.x + 100, mate.radius + 20, config.width * 0.48);
                targetY = clamp(ball.y, mate.radius + 30, config.height - mate.radius - 30);
            } else {
                targetX = clamp(config.width * 0.35, mate.radius + 20, config.width * 0.48);
                targetY = clamp(config.height / 2, mate.radius + 30, config.height - mate.radius - 30);
            }
        } else { // Atacante
            if (ballInEnemyHalf) {
                targetX = clamp(ball.x + 80, config.width * 0.52, config.width * 0.90);
                targetY = clamp(ball.y - 50, mate.radius + 30, config.height - mate.radius - 30);
            } else {
                targetX = clamp(config.width * 0.40, mate.radius + 20, config.width * 0.55);
                targetY = clamp(config.height * 0.35, mate.radius + 30, config.height - mate.radius - 30);
            }
        }

        const avoidance = avoidCrowd(mate, crowd, 90, 0.9);
        const dx = targetX - mate.x + avoidance.x;
        const dy = targetY - mate.y + avoidance.y;
        const dist = Math.hypot(dx, dy);

        if (mate.kickCooldown > 0) mate.kickCooldown -= 1;

        if (dist > 12) {
            const direction = normalizeVector(dx, dy);
            mate.x += direction.x * mate.speed * 0.98;
            mate.y += direction.y * mate.speed * 0.98;
        }

        const distToBall = distance(mate.x, mate.y, ball.x, ball.y);
        if (distToBall <= mate.radius + ball.radius + 6 && mate.kickCooldown <= 0) {
            teammateShoot(mate);
        }

        mate.x = clamp(mate.x, mate.radius + 10, config.width - mate.radius - 10);
        mate.y = clamp(mate.y, mate.radius + 10, config.height - mate.radius - 10);
    }
}

function updateBots() {
    const crowd = bots.concat(players);
    for (let i = 0; i < bots.length; i += 1) {
        const enemy = bots[i];
        let targetX, targetY;
        const distanceToBall = distance(enemy.x, enemy.y, ball.x, ball.y);
        const ballOnOwnHalf = ball.x < config.width * 0.5;
        const ballInDanger = ballOnOwnHalf || distanceToBall < 220;

        if (ballInDanger) {
            if (enemy.role === 'attack') {
                targetX = clamp(ball.x + 45, enemy.radius + 20, config.width * 0.95);
                targetY = clamp(ball.y - 30, enemy.radius + 30, config.height - enemy.radius - 30);
            } else if (enemy.role === 'mid') {
                targetX = clamp(ball.x + 55, enemy.radius + 20, config.width * 0.90);
                targetY = clamp(ball.y + 35, enemy.radius + 30, config.height - enemy.radius - 30);
            } else {
                targetX = clamp(ball.x + 80, enemy.radius + 20, config.width * 0.85);
                targetY = clamp(ball.y, enemy.radius + 30, config.height - enemy.radius - 30);
            }
        } else {
            if (enemy.role === 'attack') {
                targetX = config.width * 0.7;
                targetY = config.height * 0.42;
            } else if (enemy.role === 'mid') {
                targetX = config.width * 0.78;
                targetY = config.height * 0.55;
            } else {
                targetX = config.width * 0.82;
                targetY = config.height / 2;
            }
        }

        const avoidance = avoidCrowd(enemy, crowd, 90, 0.75);
        const dx = targetX - enemy.x + avoidance.x;
        const dy = targetY - enemy.y + avoidance.y;
        const dist = Math.hypot(dx, dy);

        if (enemy.kickCooldown > 0) enemy.kickCooldown -= 1;

        if (dist > 12) {
            const direction = normalizeVector(dx, dy);
            const speedFactor = dist < 70 ? 0.8 : 1;
            enemy.x += direction.x * enemy.speed * speedFactor;
            enemy.y += direction.y * enemy.speed * speedFactor;
        }

        const distToBall = distance(enemy.x, enemy.y, ball.x, ball.y);
        if (distToBall <= enemy.radius + ball.radius + 6 && enemy.kickCooldown <= 0) {
            botShoot(enemy);
        }

        enemy.x = clamp(enemy.x, enemy.radius + 10, config.width - enemy.radius - 10);
        enemy.y = clamp(enemy.y, enemy.radius + 10, config.height - enemy.radius - 10);
    }
}

function handleEntityCollision(entity) {
    const dx = ball.x - entity.x;
    const dy = ball.y - entity.y;
    const dist = Math.hypot(dx, dy);
    const minDistance = ball.radius + entity.radius;

    if (dist >= minDistance || dist === 0) return;

    const overlap = minDistance - dist;
    const normal = normalizeVector(dx, dy);

    ball.x += normal.x * overlap;
    ball.y += normal.y * overlap;

    const force = 5;
    ball.vx += normal.x * force;
    ball.vy += normal.y * force;

    if (!entity.controlled) {
        entity.x -= normal.x * overlap * 0.25;
        entity.y -= normal.y * overlap * 0.25;
    }

    if (entity.controlled) {
        ball.vx += (keys.ArrowRight ? 0.8 : 0) - (keys.ArrowLeft ? 0.8 : 0);
        ball.vy += (keys.ArrowDown ? 0.8 : 0) - (keys.ArrowUp ? 0.8 : 0);
    }
}

function resolveEntityOverlap(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    let dist = Math.hypot(dx, dy);
    const minDistance = a.radius + b.radius;

    if (dist === 0) dist = 1;
    if (dist >= minDistance) return;

    const overlap = (minDistance - dist) / 2;
    const nx = dx / dist;
    const ny = dy / dist;

    a.x -= nx * overlap;
    a.y -= ny * overlap;
    b.x += nx * overlap;
    b.y += ny * overlap;

    a.x = clamp(a.x, a.radius, config.width - a.radius);
    a.y = clamp(a.y, a.radius, config.height - a.radius);
    b.x = clamp(b.x, b.radius, config.width - b.radius);
    b.y = clamp(b.y, b.radius, config.height - b.radius);
}

function update() {
    if (state.current !== 'playing') return;

    updatePlayer();
    updateTeammates();
    updateBots();

    // Resolver colisiones entre jugadores
    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            resolveEntityOverlap(players[i], players[j]);
        }
    }

    // Resolver colisiones entre bots
    for (let i = 0; i < bots.length; i++) {
        for (let j = i + 1; j < bots.length; j++) {
            resolveEntityOverlap(bots[i], bots[j]);
        }
    }

    // Resolver colisiones entre players y bots
    players.forEach(p => {
        bots.forEach(b => resolveEntityOverlap(p, b));
    });

    applyBallPhysics();
    players.forEach(handleEntityCollision);
    bots.forEach(handleEntityCollision);
    handleGoals();
}

function drawField() {
    const gradient = ctx.createLinearGradient(0, 0, 0, config.height);
    gradient.addColorStop(0, '#1f7a35');
    gradient.addColorStop(1, '#13471f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, config.width, config.height);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = config.lineWidth;
    ctx.strokeRect(0, 0, config.width, config.height);

    ctx.beginPath();
    ctx.moveTo(config.width / 2, 0);
    ctx.lineTo(config.width / 2, config.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(config.width / 2, config.height / 2, config.centerCircleRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(config.width / 2, config.height / 2, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    const goalTop = (config.height - config.goalHeight) / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, goalTop, config.goalWidth, config.goalHeight);
    ctx.fillRect(config.width - config.goalWidth, goalTop, config.goalWidth, config.goalHeight);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, goalTop, config.goalWidth, config.goalHeight);
    ctx.strokeRect(config.width - config.goalWidth, goalTop, config.goalWidth, config.goalHeight);
}

function drawEntity(entity, fillStyle) {
    ctx.beginPath();
    ctx.fillStyle = fillStyle;
    ctx.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff22';
    ctx.stroke();
}

function drawBall() {
    const gradient = ctx.createRadialGradient(ball.x - 4, ball.y - 4, 3, ball.x, ball.y, ball.radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#d1d1d1');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function draw() {
    drawField();
    drawBall();
    players.forEach(p => drawEntity(p, p.color));
    bots.forEach(b => drawEntity(b, b.color));
}

function loop(timestamp) {
    update();
    draw();
    requestAnimationFrame(loop);
}

function resetGame() {
    if (pauseTimeout) {
        clearTimeout(pauseTimeout);
        pauseTimeout = null;
    }
    state.current = 'menu';
    hideMessage();
    hideCountdown();
    showScreen('menu');
}  

// ==================== EVENTOS ====================

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

// Botón "Menú principal" dentro del juego
btnMenuLive.addEventListener('click', () => {
    resetGame();
});

btnRestart.addEventListener('click', () => {
    showScreen('game');
    initializeGame();
});

btnMenu.addEventListener('click', () => {
    resetGame();
});

// Controles de teclado
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
    Object.keys(keys).forEach(key => keys[key] = false);
});

canvas.addEventListener('click', () => canvas.focus());

showScreen('menu');
requestAnimationFrame(loop);