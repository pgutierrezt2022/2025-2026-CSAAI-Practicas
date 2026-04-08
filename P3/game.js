const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1000;
canvas.height = 700;

// ===== BOTÓN RESET =====
const resetBtn = document.getElementById("resetBtn");

// ===== IMÁGENES =====
const reindeerImg = new Image();
reindeerImg.src = "assets/reindeer.png";

const santaImg = new Image();
santaImg.src = "assets/santa.png";

// 👇 NUEVO: EXPLOSIÓN
const explosionImg = new Image();
explosionImg.src = "assets/explosion.gif";

// ===== SONIDOS =====
const shootSound = new Audio("assets/laser.mp3");
const explosionSound = new Audio("assets/explosionn.mp3");
const winSound = new Audio("assets/win.mp3");
const loseSound = new Audio("assets/lose.mp3");

// ===== JUGADOR =====
const player = {
    x: canvas.width / 2 - 40,
    y: canvas.height - 80,
    width: 80,
    height: 70,
    speed: 6,
    lives: 3,
    energy: 5,
    maxEnergy: 5
};

// ===== BALAS =====
let bullets = [];
let enemyBullets = [];

// ===== EXPLOSIONES 👇
let explosions = [];

// ===== ENEMIGOS =====
let enemies = [];
const rows = 3;
const cols = 8;

let enemySpeed = 1;
let direction = 1;

// ===== INPUT =====
let keys = {};

document.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "Space") shoot();
});

document.addEventListener("keyup", (e) => {
    keys[e.code] = false;
});

// ===== CREAR ENEMIGOS =====
function createEnemies() {
    enemies = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            enemies.push({
                x: c * 80 + 60,
                y: r * 60 + 60,
                width: 40,
                height: 40
            });
        }
    }
}
createEnemies();

// ===== DISPARO =====
function shoot() {
    if (player.energy > 0 && !gameOver) {
        bullets.push({
            x: player.x + player.width / 2,
            y: player.y
        });

        player.energy--;
        shootSound.currentTime = 0;
        shootSound.play();
    }
}

// ===== RECARGA =====
setInterval(() => {
    if (player.energy < player.maxEnergy) {
        player.energy++;
    }
}, 1000);

// ===== DISPARO ENEMIGO =====
setInterval(() => {
    if (enemies.length > 0 && !gameOver) {
        let shooter = enemies[Math.floor(Math.random() * enemies.length)];
        enemyBullets.push({
            x: shooter.x + shooter.width / 2,
            y: shooter.y
        });
    }
}, 1000);

// ===== ESTADO =====
let score = 0;
let gameOver = false;
let win = false;

// ===== UPDATE =====
function update() {
    if (gameOver) return;

    if (keys["ArrowLeft"] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys["ArrowRight"] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }

    let edge = false;

    enemies.forEach(e => {
        e.x += enemySpeed * direction;
        if (e.x <= 0 || e.x >= canvas.width - e.width) {
            edge = true;
        }
    });

    if (edge) {
        direction *= -1;
        enemies.forEach(e => e.y += 20);
    }

    enemySpeed = 1 + (24 - enemies.length) * 0.1;

    // ===== BALAS JUGADOR =====
    bullets.forEach((b, i) => {
        b.y -= 5;

        enemies.forEach((e, j) => {
            if (
                b.x < e.x + e.width &&
                b.x > e.x &&
                b.y < e.y + e.height &&
                b.y > e.y
            ) {
                // 💥 CREAR EXPLOSIÓN
                explosions.push({
                    x: e.x + e.width / 2 - 25,
                    y: e.y + e.height / 2 - 25,
                    size: 50,
                    time: 20
                });

                enemies.splice(j, 1);
                bullets.splice(i, 1);
                score += 10;

                explosionSound.currentTime = 0;
                explosionSound.play();
            }
        });
    });

    // ===== BALAS ENEMIGO =====
    enemyBullets.forEach((b, i) => {
        b.y += 4;

        if (
            b.x < player.x + player.width &&
            b.x > player.x &&
            b.y < player.y + player.height &&
            b.y > player.y
        ) {
            enemyBullets.splice(i, 1);
            player.lives--;
        }
    });

    // ===== ACTUALIZAR EXPLOSIONES =====
    explosions.forEach((exp, i) => {
        exp.time--;
        if (exp.time <= 0) {
            explosions.splice(i, 1);
        }
    });

    // GAME OVER
    if (player.lives <= 0 && !gameOver) {
        gameOver = true;
        loseSound.play();
        showResetButton();
    }

    // VICTORIA
    if (enemies.length === 0 && !gameOver) {
        gameOver = true;
        win = true;
        winSound.play();
        showResetButton();
    }
}

// ===== MOSTRAR BOTÓN =====
function showResetButton() {
    const rect = canvas.getBoundingClientRect();

    resetBtn.style.display = "block";

    setTimeout(() => {
        const btnWidth = resetBtn.offsetWidth;
        const centerX = rect.left + canvas.width / 2;

        resetBtn.style.left = (centerX - btnWidth / 2) + "px";
        resetBtn.style.top = (rect.top + canvas.height / 2 + 50) + "px";
    }, 10);
}

// ===== RESET =====
function resetGame() {
    player.x = canvas.width / 2 - 40;
    player.y = canvas.height - 80;
    player.lives = 3;
    player.energy = player.maxEnergy;

    bullets = [];
    enemyBullets = [];
    explosions = []; // 👈 limpiar explosiones

    score = 0;
    gameOver = false;
    win = false;

    enemySpeed = 1;
    direction = 1;

    createEnemies();

    resetBtn.style.display = "none";
}

resetBtn.addEventListener("click", resetGame);

// ===== DRAW =====
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // RENO
    ctx.drawImage(reindeerImg, player.x, player.y, player.width, player.height);

    // SANTAS
    enemies.forEach(e => {
        ctx.drawImage(santaImg, e.x, e.y, e.width, e.height);
    });

    // 💥 DIBUJAR EXPLOSIONES
    explosions.forEach(exp => {
        ctx.drawImage(explosionImg, exp.x, exp.y, exp.size, exp.size);
    });

    // BALAS
    ctx.fillStyle = "cyan";
    bullets.forEach(b => ctx.fillRect(b.x, b.y, 3, 10));

    ctx.fillStyle = "orange";
    enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, 3, 10));

    // HUD
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";

    ctx.fillText("Regalos: " + score, 10, 40);
    ctx.fillText("Vidas: " + player.lives, 10, 70);
    ctx.fillText("Energía: " + player.energy, 10, 100);

    // MENSAJE FINAL
    if (gameOver) {
        ctx.fillStyle = "white";
        ctx.font = "50px Arial";
        ctx.textAlign = "center";

        if (win) {
            ctx.fillText("NAVIDAD SALVADA", canvas.width / 2, canvas.height / 2);
        } else {
            ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
        }
    }
}

// ===== LOOP =====
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();