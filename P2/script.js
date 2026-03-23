let password = [];
let intentos = 7;
let crono;
let jugando = false;
let terminado = false; 

const display = document.getElementById("display");
const intentosSpan = document.getElementById("intentos");
const mensaje = document.getElementById("mensaje");
const musica = document.getElementById("musica");

const celdas = [
  document.getElementById("c0"),
  document.getElementById("c1"),
  document.getElementById("c2"),
  document.getElementById("c3")
];

const teclado = document.getElementById("teclado");

function getRandomNumber() {
  return Math.floor(Math.random() * 10);
}

function generarPassword() {
  let nums = [];
  while (nums.length < 4) {
    let n = getRandomNumber();
    if (!nums.includes(n)) nums.push(n);
  }
  return nums;
}

function crearTeclado() {
  teclado.innerHTML = "";
  for (let i = 0; i <= 9; i++) {
    let btn = document.createElement("button");
    btn.textContent = i;

    btn.onclick = () => jugar(i, btn);

    teclado.appendChild(btn);
  }
}

function jugar(numero, boton) {
  if (!jugando || terminado) return; 

  // arrancar música
  if (musica.paused) {
    musica.play();
  }

  if (!crono.timer) crono.start();

  boton.disabled = true;

  if (intentos > 0) {
    intentos--;
  }

  intentosSpan.textContent = intentos;

  if (password.includes(numero)) {
    password.forEach((n, i) => {
      if (n === numero) {
        celdas[i].textContent = numero;
        celdas[i].classList.add("acierto");
      }
    });
  }

  comprobarFin();
}

function comprobarFin() {
  let ganado = password.every((n, i) => celdas[i].textContent == n);

  if (ganado) {
    crono.stop();
    jugando = false;
    terminado = true; 
    musica.pause();
    mensaje.textContent = `Ganaste | Tiempo: ${display.textContent} | Usados: ${7 - intentos} | Restantes: ${intentos}`;
  }

  if (intentos === 0 && !ganado) {
    crono.stop();
    jugando = false;
    terminado = true; 
    musica.pause();
    mensaje.textContent = `Perdiste | Clave: ${password.join("")}`;
  }
}

function reset() {
  password = generarPassword();
  intentos = 7;
  jugando = true;
  terminado = false; // RESETEA ESTADO
  intentosSpan.textContent = intentos;
  mensaje.textContent = "";

  // reset música
  musica.pause();
  musica.currentTime = 0;

  celdas.forEach(c => {
    c.textContent = "*";
    c.classList.remove("acierto");
  });

  crearTeclado();
  crono.reset();
}

document.getElementById("start").onclick = () => {
  if (terminado) return; 

  jugando = true;
  crono.start();
  musica.play();
};

document.getElementById("stop").onclick = () => {
  jugando = false;
  crono.stop();
  musica.pause();
};

document.getElementById("reset").onclick = reset;

// activar audio tras primer clic (evita bloqueo del navegador)
document.body.addEventListener("click", () => {
  musica.play();
}, { once: true });

crono = new Crono(display);
reset();