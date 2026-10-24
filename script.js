 const preloader = document.querySelector('.preloader');
const video = document.getElementById('video');
const personaje = document.getElementById('personaje');
const portal = document.getElementById('portal');
const portadaJuego = document.getElementById('portada-juego');
const seccionWeb = document.getElementById('seccion-web');
const escenario = document.querySelector('.escenario');

// 1. Carga del video sin fetch para permitir abrir la página como archivo local
function ocultarPreloader() {
    document.body.classList.remove('is-loading');
    preloader.classList.add('is-hidden');
}

video.addEventListener('loadedmetadata', ocultarPreloader, { once: true });
video.addEventListener('error', () => {
    ocultarPreloader();
    console.error('No se pudo cargar el video de la historia:', video.error);
}, { once: true });
video.src = 'uno.mp4';

// Plan B: si el video tarda demasiado en dar sus datos, no dejamos
// al visitante esperando para siempre en la pantalla de carga.
setTimeout(ocultarPreloader, 4000);

// 2. Mover personaje con el MOUSE (Drag & Drop)
let moviendo = false;

// Medidas que se toman UNA sola vez al empezar a arrastrar
// (antes se medían en cada movimiento del mouse y eso frena la página)
let limitesEscenario = null;
let rectPortal = null;
let mitadAncho = 0;
let mitadAlto = 0;

// Posición más reciente del mouse y frame pendiente
let mouseX = 0;
let mouseY = 0;
let cuadroPendiente = null;

personaje.addEventListener('mousedown', () => {
    moviendo = true;
    limitesEscenario = escenario.getBoundingClientRect();
    rectPortal = portal.getBoundingClientRect(); // dónde está el portal ahora mismo
    mitadAncho = personaje.offsetWidth / 2;
    mitadAlto = personaje.offsetHeight / 2;
});

document.addEventListener('mouseup', () => {
    moviendo = false;
});

document.addEventListener('mousemove', (e) => {
    if (!moviendo) return;

    mouseX = e.clientX;
    mouseY = e.clientY;

    // Como máximo una actualización por frame, aunque el mouse mande cientos de eventos
    if (cuadroPendiente === null) {
        cuadroPendiente = requestAnimationFrame(moverPersonaje);
    }
});

function moverPersonaje() {
    cuadroPendiente = null;
    if (!moviendo) return;

    // Posición dentro del escenario
    const x = mouseX - limitesEscenario.left;
    const y = mouseY - limitesEscenario.top;

    personaje.style.left = `${x}px`;
    personaje.style.top = `${y}px`;

    // Verificar si toca el portal
    comprobarEntradaPortal(x, y);
}

// 3. Detectar si el personaje toca el portal
// (se calcula con números, sin volver a preguntarle medidas al navegador)
function comprobarEntradaPortal(x, y) {
    const centroX = limitesEscenario.left + x;
    const centroY = limitesEscenario.top + y;

    const izquierda = centroX - mitadAncho;
    const derecha = centroX + mitadAncho;
    const arriba = centroY - mitadAlto;
    const abajo = centroY + mitadAlto;

    const tocando = !(
        derecha < rectPortal.left ||
        izquierda > rectPortal.right ||
        abajo < rectPortal.top ||
        arriba > rectPortal.bottom
    );

    if (tocando && moviendo) {
        moviendo = false;
        entrarAlVideo();
    }
}

// 4. Animación al entrar al portal
function entrarAlVideo() {
    // El personaje gira y se achica como si entrara al portal
    gsap.to(personaje, {
        scale: 0,
        rotation: 720,
        duration: 0.6,
        onComplete: () => {
            // Desaparece la portada y se activa la web del video
            gsap.to(portadaJuego, {
                opacity: 0,
                duration: 0.8,
                onComplete: () => {
                    portadaJuego.style.display = 'none';
                    seccionWeb.classList.remove('web-oculta');
                }
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const tarjetasJugadores = document.querySelectorAll('.card-jugador');

    tarjetasJugadores.forEach(jugador => {
        jugador.addEventListener('click', () => {
            const nombre = jugador.querySelector('h3').textContent;
            console.log(`¡Has seleccionado la información de la leyenda: ${nombre}!`);
        });
    });

    const botonEmoteRey = document.getElementById('emote-rey-boton');
    const sonidoEmoteRey = document.getElementById('sonido-emote-rey');
    const estadoEmoteRey = document.getElementById('emote-rey-estado');

    botonEmoteRey.addEventListener('click', () => {
        sonidoEmoteRey.currentTime = 0;
        const reproduccion = sonidoEmoteRey.play();

        if (reproduccion) {
            reproduccion.catch(error => {
                estadoEmoteRey.textContent = 'No se pudo reproducir el sonido del Rey.';
                console.error('Error al reproducir el sonido del Rey riendo:', error);
            });
        }
    });

    const botonCofre = document.getElementById('cofre-boton');
    const recompensaCofre = document.getElementById('cofre-recompensa');
    const botonEmote = document.getElementById('emote-recompensa');
    const sonidoCofre = document.getElementById('sonido-cofre');
    const textoBotonCofre = botonCofre.querySelector('.cofre-boton-texto');

    const reproducirSonidoCofre = () => {
        sonidoCofre.currentTime = 0;
        sonidoCofre.play().catch(() => {});
    };

    botonCofre.addEventListener('click', () => {
        const abierto = botonCofre.classList.toggle('abierto');
        botonCofre.setAttribute('aria-expanded', String(abierto));
        recompensaCofre.hidden = !abierto;
        textoBotonCofre.textContent = abierto ? '¡Cofre abierto!' : 'Toca para abrir';

        if (abierto) {
            reproducirSonidoCofre();
        }
    });

    botonEmote.addEventListener('click', reproducirSonidoCofre);
});