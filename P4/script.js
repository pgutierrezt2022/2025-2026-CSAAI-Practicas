const grid = document.getElementById("grid");
const nivelSpan = document.getElementById("nivel");
const tiempoSpan = document.getElementById("tiempo");
const estadoSpan = document.getElementById("estado");
const mensaje = document.getElementById("mensaje");

const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const musicaBtn = document.getElementById("toggleMusica");
const audio = document.getElementById("musica");

const selectorSecuencia = document.getElementById("selectorSecuencia");
const nivelInicialSelect = document.getElementById("nivelInicial");

let jugando = false;
let nivelActual = 1;
let intervalo;
let timerInterval;

let tiempo = 0;
let velocidad = 800;
let musicaActiva = true;

// ======================
// GRID
// ======================
function crearGrid(palabras) {
  grid.innerHTML = "";

  palabras.forEach(p => {
    const div = document.createElement("div");
    div.classList.add("card");

    // Guardamos la palabra
    div.dataset.palabra = p;

    // Crear imagen
    const img = document.createElement("img");
    img.src = `img/${p.toLowerCase()}.png`;
    img.alt = p;

    // Crear texto
    const span = document.createElement("span");
    span.textContent = p;

    // Añadir al div
    div.appendChild(img);
    div.appendChild(span);

    // Añadir al grid
    grid.appendChild(div);
  });
}

// ======================
// GENERAR NIVEL
// ======================
function generarNivel(nivel) {

  const tipo = selectorSecuencia.value;

  let palabra1 = "CASA";
  let palabra2 = "CAMA";

  // <N Frutas
  if (tipo === "fruta") {
    palabra1 = "MANZANA";
    palabra2 = "PERA";
  }

  if (tipo === "navidad") {
    palabra1 = "SANTA";
    palabra2 = "RUDOLF";
  }

  let base = [
    palabra1, palabra1, palabra1, palabra1,
    palabra2, palabra2, palabra2, palabra2
  ];

  switch (nivel) {
    case 1:
      return base;

    case 2:
      return [...base].sort(() => Math.random() - 0.5);

    case 3:
      return [
        palabra1, palabra2,
        palabra1, palabra2,
        palabra1, palabra2,
        palabra1, palabra2
      ];

    case 4:
      return [...base].sort(() => Math.random() - 0.5);

    case 5:
      return [...base].sort(() => Math.random() - 0.5);
  }
}

// ======================
// RECORRER GRID
// ======================
function recorrerGrid() {
  const cards = document.querySelectorAll(".card");
  let i = 0;

  intervalo = setInterval(() => {

    cards.forEach(c => c.classList.remove("active"));

    cards[i].classList.add("active");

    mensaje.textContent = cards[i].dataset.palabra;

    i++;

    if (i >= cards.length) {
      clearInterval(intervalo);
      siguienteNivel();
    }

  }, velocidad);
}

// ======================
// SIGUIENTE NIVEL
// ======================
function siguienteNivel() {
  if (!jugando) return;

  nivelActual++;

  if (nivelActual > 5) {
    terminarJuego();
    return;
  }

  velocidad = Math.max(200, velocidad - 100);

  estadoSpan.textContent = "Preparando...";
  mensaje.textContent = "Siguiente nivel...";

  setTimeout(() => {
    iniciarNivel();
  }, 1500);
}

// ======================
// INICIAR NIVEL
// ======================
function iniciarNivel() {
  if (!jugando) return;

  nivelSpan.textContent = nivelActual;
  estadoSpan.textContent = "Jugando";

  const palabras = generarNivel(nivelActual);
  crearGrid(palabras);

  recorrerGrid();
}

// ======================
// EMPEZAR JUEGO
// ======================
startBtn.onclick = () => {
  if (jugando) return;

  jugando = true;

  // Bloquear controles
  selectorSecuencia.disabled = true;
  nivelInicialSelect.disabled = true;

  nivelActual = parseInt(nivelInicialSelect.value);
  velocidad = 800 - (nivelActual * 100);

  tiempo = 0;
  tiempoSpan.textContent = 0;

  estadoSpan.textContent = "Preparando...";
  mensaje.textContent = "Empieza en 3...";

  // Contador de tiempo
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (jugando) {
      tiempo++;
      tiempoSpan.textContent = tiempo;
    }
  }, 1000);

  // Cuenta atrás
  setTimeout(() => mensaje.textContent = "2...", 500);
  setTimeout(() => mensaje.textContent = "1...", 1000);

  // Música
  if (musicaActiva) {
    audio.currentTime = 0;
    audio.play();
  }

  // Iniciar nivel
  setTimeout(() => {
    iniciarNivel();
  }, 1500);
};

// ======================
// DETENER JUEGO
// ======================
stopBtn.onclick = () => {
  jugando = false;

  clearInterval(intervalo);
  clearInterval(timerInterval);

  audio.pause();

  estadoSpan.textContent = "Detenido";

  // Desbloquear controles
  selectorSecuencia.disabled = false;
  nivelInicialSelect.disabled = false;

  mensaje.textContent = 'Pulsa "Empezar"';
  nivelSpan.textContent = 1;
  tiempoSpan.textContent = 0;
};

// ======================
// MÚSICA
// ======================
musicaBtn.onclick = () => {
  musicaActiva = !musicaActiva;

  if (musicaActiva) {
    musicaBtn.textContent = "Música ON";
    if (jugando) audio.play();
  } else {
    musicaBtn.textContent = "Música OFF";
    audio.pause();
  }
};

// ======================
// FIN DEL JUEGO
// ======================
function terminarJuego() {
  jugando = false;

  clearInterval(intervalo);
  clearInterval(timerInterval);

  audio.pause();

  estadoSpan.textContent = "Finalizado";
  mensaje.textContent = "¡Juego terminado!";

  // Desbloquear controles
  selectorSecuencia.disabled = false;
  nivelInicialSelect.disabled = false;
}