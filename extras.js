// Efectos visuales adicionales de la página (versión optimizada)
document.addEventListener('DOMContentLoaded', () => {
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------- Barra de progreso de lectura ----------
    const barra = document.createElement('div');
    barra.className = 'progreso-scroll';
    barra.setAttribute('aria-hidden', 'true');
    document.body.appendChild(barra);

    // Una sola actualización por frame, sin importar cuántos eventos de scroll lleguen
    let barraPendiente = false;
    const pintarBarra = () => {
        barraPendiente = false;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        barra.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    const actualizarBarra = () => {
        if (barraPendiente) return;
        barraPendiente = true;
        requestAnimationFrame(pintarBarra);
    };
    window.addEventListener('scroll', actualizarBarra, { passive: true });
    window.addEventListener('resize', actualizarBarra);
    pintarBarra();

    // ---------- Revelado al hacer scroll ----------
    if (!reducir && 'IntersectionObserver' in window) {
        const objetivos = document.querySelectorAll(
            '.section-content h2, .timeline-card, .card-tropas, .card-heroe, ' +
            '.card-jugador, .historia-bloque, .tesoro-panel, .emotes-layout > *'
        );
        const observador = new IntersectionObserver((entradas) => {
            entradas.forEach((entrada) => {
                if (!entrada.isIntersecting) return;
                const el = entrada.target;
                el.classList.add('visible');
                observador.unobserve(el);

                // Cuando termina la animación de entrada se quitan las clases:
                // así su transición de 0.7s ya no estorba (por ejemplo, al inclinar las cartas)
                setTimeout(() => {
                    el.classList.remove('revelar', 'visible');
                    el.style.removeProperty('--retraso');
                }, 1300);
            });
        }, { threshold: 0.15 });

        objetivos.forEach((el) => {
            const posicion = Array.from(el.parentElement.children).indexOf(el);
            el.classList.add('revelar');
            el.style.setProperty('--retraso', `${Math.min(posicion, 5) * 0.08}s`);
            observador.observe(el);
        });
    }

    // ---------- Brillo e inclinación en las cartas ----------
    if (!reducir) {
        document.querySelectorAll('.card-tropas, .card-heroe').forEach((carta) => {
            // La carta se mide UNA vez al entrar el mouse (no en cada movimiento)
            let izq = 0;
            let arriba = 0;
            let ancho = 1;
            let alto = 1;
            let px = 0;
            let py = 0;
            let cuadro = null;

            const pintar = () => {
                cuadro = null;
                const x = (px - izq) / ancho;
                const y = (py - arriba) / alto;
                carta.style.transform =
                    `perspective(700px) rotateX(${(0.5 - y) * 10}deg) rotateY(${(x - 0.5) * 12}deg) translateY(-8px) scale(1.03)`;
                carta.style.setProperty('--bx', `${x * 100}%`);
                carta.style.setProperty('--by', `${y * 100}%`);
            };

            carta.addEventListener('mouseenter', () => {
                const r = carta.getBoundingClientRect();
                izq = r.left + window.scrollX;
                arriba = r.top + window.scrollY;
                ancho = r.width || 1;
                alto = r.height || 1;
                carta.classList.add('tilt-activa');
            });

            carta.addEventListener('mousemove', (e) => {
                px = e.pageX;
                py = e.pageY;
                if (cuadro === null) cuadro = requestAnimationFrame(pintar);
            });

            carta.addEventListener('mouseleave', () => {
                if (cuadro !== null) {
                    cancelAnimationFrame(cuadro);
                    cuadro = null;
                }
                carta.style.transform = '';
                carta.classList.remove('tilt-activa');
            });
        });
    }

    // ---------- Contadores animados ----------
    const contadores = document.querySelectorAll('.gema-contador strong, .emotes-cantidad');
    if ('IntersectionObserver' in window) {
        const observadorNumeros = new IntersectionObserver((entradas) => {
            entradas.forEach((entrada) => {
                if (!entrada.isIntersecting) return;
                const el = entrada.target;
                observadorNumeros.unobserve(el);
                const partes = el.textContent.trim().match(/^(\d+)(.*)$/);
                if (!partes || reducir) return;
                const meta = parseInt(partes[1], 10);
                const sufijo = partes[2];
                const valor = { n: 0 };
                gsap.to(valor, {
                    n: meta,
                    duration: 1.8,
                    ease: 'power2.out',
                    onUpdate: () => { el.textContent = Math.round(valor.n) + sufijo; }
                });
            });
        }, { threshold: 0.6 });
        contadores.forEach((el) => observadorNumeros.observe(el));
    }

    // ---------- Partículas de elixir (sección del video) ----------
    const seccionVideo = document.querySelector('.video-section');
    if (seccionVideo && !reducir) {
        const lienzo = document.createElement('canvas');
        lienzo.className = 'particulas';
        lienzo.setAttribute('aria-hidden', 'true');
        seccionVideo.prepend(lienzo);
        const ctx = lienzo.getContext('2d');

        if (ctx) {
            const colores = ['#d4a937', '#ecd078', '#8e5bd6', '#4a90d9'];

            const aRgba = (hex, a) => {
                const n = parseInt(hex.slice(1), 16);
                return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
            };

            // Un "brillo" ya dibujado por cada color. Es muchísimo más barato
            // que usar shadowBlur en cada partícula y en cada frame.
            const brillos = {};
            colores.forEach((color) => {
                const sprite = document.createElement('canvas');
                sprite.width = 32;
                sprite.height = 32;
                const sctx = sprite.getContext('2d');
                const g = sctx.createRadialGradient(16, 16, 0, 16, 16, 16);
                g.addColorStop(0, aRgba(color, 1));
                g.addColorStop(0.3, aRgba(color, 0.9));
                g.addColorStop(1, aRgba(color, 0));
                sctx.fillStyle = g;
                sctx.fillRect(0, 0, 32, 32);
                brillos[color] = sprite;
            });

            const puntos = Array.from({ length: 45 }, () => ({
                x: Math.random(),
                y: Math.random(),
                r: 1 + Math.random() * 2.5,
                v: 0.0005 + Math.random() * 0.001,
                f: Math.random() * 6,
                a: 0.25 + Math.random() * 0.5,
                c: colores[Math.floor(Math.random() * colores.length)]
            }));

            let activo = false;      // ¿la sección está en pantalla?
            let corriendo = false;   // ¿hay un bucle de animación en marcha?
            let ultimoCuadro = 0;

            // El tamaño se mide solo cuando cambia, no en cada frame
            const medir = () => {
                const w = seccionVideo.clientWidth;
                const h = seccionVideo.clientHeight;
                if (w && h && (lienzo.width !== w || lienzo.height !== h)) {
                    lienzo.width = w;
                    lienzo.height = h;
                }
            };

            const animar = (tiempo) => {
                // Fuera de pantalla el bucle se detiene por completo
                if (!activo) {
                    corriendo = false;
                    return;
                }
                requestAnimationFrame(animar);

                // Limitado a ~30 cuadros por segundo: se ve igual y cuesta la mitad
                const dt = tiempo - ultimoCuadro;
                if (dt < 33) return;
                ultimoCuadro = tiempo;
                const paso = Math.min(dt, 100) / 16.67;

                const w = lienzo.width;
                const h = lienzo.height;
                ctx.clearRect(0, 0, w, h);

                puntos.forEach((p) => {
                    p.y -= p.v * paso;
                    if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
                    const tam = p.r * 6;
                    ctx.globalAlpha = p.a;
                    ctx.drawImage(
                        brillos[p.c],
                        p.x * w + Math.sin(p.y * 8 + p.f) * 12 - tam / 2,
                        p.y * h - tam / 2,
                        tam,
                        tam
                    );
                });
            };

            const arrancar = () => {
                if (corriendo) return;
                corriendo = true;
                requestAnimationFrame(animar);
            };

            if ('ResizeObserver' in window) {
                new ResizeObserver(medir).observe(seccionVideo);
            } else {
                window.addEventListener('resize', medir);
            }

            if ('IntersectionObserver' in window) {
                new IntersectionObserver(([entrada]) => {
                    activo = entrada.isIntersecting;
                    if (activo) {
                        medir();
                        arrancar();
                    }
                }).observe(seccionVideo);
            } else {
                activo = true;
                medir();
                arrancar();
            }
        } else {
            lienzo.remove();
        }
    }

    // ---------- Confeti al abrir el cofre ----------
    const botonCofre = document.getElementById('cofre-boton');

    const lanzarConfeti = () => {
        const lienzo = document.createElement('canvas');
        lienzo.className = 'confeti-lienzo';
        lienzo.setAttribute('aria-hidden', 'true');
        lienzo.width = window.innerWidth;
        lienzo.height = window.innerHeight;
        document.body.appendChild(lienzo);
        const ctx = lienzo.getContext('2d');
        if (!ctx) {
            lienzo.remove();
            return;
        }

        const colores = ['#d4a937', '#ecd078', '#8e5bd6', '#4a90d9', '#ffffff'];
        const caja = botonCofre.getBoundingClientRect();
        const piezas = Array.from({ length: 140 }, () => ({
            x: caja.left + caja.width / 2,
            y: caja.top + caja.height / 2,
            vx: (Math.random() - 0.5) * 14,
            vy: -Math.random() * 14 - 4,
            w: 6 + Math.random() * 6,
            h: 4 + Math.random() * 5,
            r: Math.random() * 6,
            vr: (Math.random() - 0.5) * 0.4,
            c: colores[Math.floor(Math.random() * colores.length)]
        }));

        let cuadro = 0;
        const paso = () => {
            cuadro++;
            ctx.clearRect(0, 0, lienzo.width, lienzo.height);
            piezas.forEach((p) => {
                p.vy += 0.35;
                p.vx *= 0.99;
                p.x += p.vx;
                p.y += p.vy;
                p.r += p.vr;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.r);
                ctx.globalAlpha = Math.max(0, 1 - cuadro / 150);
                ctx.fillStyle = p.c;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            });
            if (cuadro < 150) {
                requestAnimationFrame(paso);
            } else {
                lienzo.remove();
            }
        };
        paso();
    };

    if (botonCofre && !reducir) {
        botonCofre.addEventListener('click', () => {
            if (botonCofre.classList.contains('abierto')) lanzarConfeti();
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const comportamiento = reducir ? 'auto' : 'smooth';
    const seccionWeb = document.getElementById('seccion-web');

    const mano = [
        { nombre: 'P.E.K.K.A', costo: 7, img: './imagenes/carta-pekka.jpg' },
        { nombre: 'Montapuercos', costo: 4, img: './imagenes/carta-montapuercos.jpg' },
        { nombre: 'Mago Eléctrico', costo: 4, img: './imagenes/carta-mago-electrico.jpg' },
        { nombre: 'Gigante Noble', costo: 6, img: './imagenes/carta-gigante-noble.jpg' },
        { nombre: 'Chispitas', costo: 6, img: './imagenes/carta-chispitas.jpg' },
        { nombre: 'El Tronco', costo: 2, img: './imagenes/carta-tronco.jpg' }
    ];

    // ---------- Simulador de elixir ----------
    const puntoInsercion = document.querySelector('.cofre-sorpresa-section');
    if (puntoInsercion) {
        const seccionElixir = document.createElement('section');
        seccionElixir.className = 'elixir-section';
        seccionElixir.innerHTML = `
            <div class="section-content">
                <h2>Simulador de elixir</h2>
                <p class="subtitulo-sec">Despliega cartas y administra tu elixir: se recarga solo, como en la arena.</p>
                <div class="elixir-panel">
                    <div class="elixir-barra" role="progressbar" aria-label="Elixir" aria-valuemin="0" aria-valuemax="10" aria-valuenow="5">
                        ${'<span class="elixir-seg"></span>'.repeat(10)}
                    </div>
                    <p class="elixir-estado"><strong>5</strong> / 10 de elixir</p>
                    <div class="elixir-mano">
                        ${mano.map(carta => `
                            <button class="elixir-carta" type="button" data-costo="${carta.costo}" data-nombre="${carta.nombre}">
                                <span class="elixir-costo">${carta.costo}</span>
                                <img src="${carta.img}" alt="" loading="lazy">
                                <span>${carta.nombre}</span>
                            </button>`).join('')}
                    </div>
                    <div class="elixir-controles">
                        <button class="elixir-doble" type="button" aria-pressed="false">Doble elixir</button>
                        <p class="elixir-mensaje" aria-live="polite">Toca una carta para desplegarla.</p>
                    </div>
                </div>
            </div>`;
        puntoInsercion.before(seccionElixir);

        const segmentos = seccionElixir.querySelectorAll('.elixir-seg');
        const barra = seccionElixir.querySelector('.elixir-barra');
        const estado = seccionElixir.querySelector('.elixir-estado strong');
        const mensaje = seccionElixir.querySelector('.elixir-mensaje');
        const botonesCarta = seccionElixir.querySelectorAll('.elixir-carta');
        const botonDoble = seccionElixir.querySelector('.elixir-doble');
        const costos = Array.from(botonesCarta, (boton) => Number(boton.dataset.costo));
        const ultimosRellenos = new Array(segmentos.length).fill(-1);
        let ultimoEntero = -1;
        let elixir = 5;
        let doble = false;
        let visibleElixir = !('IntersectionObserver' in window);
        let ultimo = null;
        let corriendo = false;

        // Solo se toca el DOM cuando algo cambió de verdad
        const pintarElixir = () => {
            segmentos.forEach((segmento, indice) => {
                const relleno = Math.min(1, Math.max(0, elixir - indice));
                if (relleno !== ultimosRellenos[indice]) {
                    ultimosRellenos[indice] = relleno;
                    segmento.style.setProperty('--f', relleno);
                }
            });

            const entero = Math.floor(elixir);
            if (entero !== ultimoEntero) {
                ultimoEntero = entero;
                estado.textContent = entero;
                barra.setAttribute('aria-valuenow', String(entero));
            }

            botonesCarta.forEach((boton, indice) => {
                boton.classList.toggle('bloqueada', elixir < costos[indice]);
            });
        };

        // El bucle solo corre si la sección se ve y el elixir no está lleno
        const bucle = (tiempo) => {
            if (!visibleElixir || elixir >= 10) {
                corriendo = false;
                ultimo = null;
                return;
            }
            if (ultimo !== null) {
                elixir = Math.min(10, elixir + (tiempo - ultimo) / (doble ? 1400 : 2800));
            }
            ultimo = tiempo;
            pintarElixir();
            requestAnimationFrame(bucle);
        };

        const arrancar = () => {
            if (corriendo || !visibleElixir || elixir >= 10) return;
            corriendo = true;
            ultimo = null;
            requestAnimationFrame(bucle);
        };

        if ('IntersectionObserver' in window) {
            new IntersectionObserver(([entrada]) => {
                visibleElixir = entrada.isIntersecting;
                ultimo = null;
                if (visibleElixir) arrancar();
            }, { threshold: 0.3 }).observe(seccionElixir);
        }

        pintarElixir();
        arrancar();

        botonesCarta.forEach((boton, indice) => {
            boton.addEventListener('click', () => {
                const costo = costos[indice];
                const nombre = boton.dataset.nombre;
                boton.classList.remove('jugada', 'sin-elixir');
                void boton.offsetWidth;

                if (elixir >= costo) {
                    elixir -= costo;
                    boton.classList.add('jugada');
                    mensaje.textContent = `${nombre} desplegada: -${costo} de elixir.`;
                } else {
                    const faltan = Math.ceil(costo - elixir);
                    boton.classList.add('sin-elixir');
                    mensaje.textContent = `Te ${faltan > 1 ? 'faltan' : 'falta'} ${faltan} de elixir para ${nombre}.`;
                }
                pintarElixir();
                arrancar(); // al gastar elixir, vuelve a recargarse
            });
        });

        botonDoble.addEventListener('click', () => {
            doble = !doble;
            botonDoble.setAttribute('aria-pressed', String(doble));
            mensaje.textContent = doble
                ? 'Doble elixir activado: se recarga el doble de rápido.'
                : 'Elixir normal.';
        });
    }

    // ---------- Menú flotante ----------
    const secciones = [
        ['.video-section', 'Video'],
        ['.historia-section', 'Línea de tiempo'],
        ['.cartas-section:not(.cartas-origen-section)', 'Cartas'],
        ['.historia-profunda-section', 'Origen'],
        ['.cartas-origen-section', 'Cartas y origen'],
        ['.evoluciones-section', 'Campeones'],
        ['.leyendas-section', 'Leyendas'],
        ['.cofres-gemas-section', 'Tesoros'],
        ['.emotes-section', 'Emotes'],
        ['.elixir-section', 'Simulador de elixir'],
        ['.cofre-sorpresa-section', 'Sorpresa']
    ].filter(([selector]) => document.querySelector(selector));

    const menu = document.createElement('nav');
    menu.className = 'menu-flotante';
    menu.setAttribute('aria-label', 'Secciones de la página');

    const puntos = secciones.map(([selector, etiqueta]) => {
        const destino = document.querySelector(selector);
        const punto = document.createElement('button');
        punto.type = 'button';
        punto.className = 'menu-punto';
        punto.dataset.etiqueta = etiqueta;
        punto.setAttribute('aria-label', `Ir a ${etiqueta}`);
        punto.addEventListener('click', () => {
            destino.scrollIntoView({ behavior: comportamiento });
        });
        menu.appendChild(punto);
        return { destino, punto };
    });
    document.body.appendChild(menu);

    if ('IntersectionObserver' in window) {
        const observadorMenu = new IntersectionObserver((entradas) => {
            entradas.forEach((entrada) => {
                if (!entrada.isIntersecting) return;
                puntos.forEach((punto) => {
                    punto.punto.classList.toggle('activo', punto.destino === entrada.target);
                });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        puntos.forEach((punto) => observadorMenu.observe(punto.destino));
    }

    // ---------- Botón de volver arriba ----------
    const botonSubir = document.createElement('button');
    botonSubir.type = 'button';
    botonSubir.className = 'volver-arriba';
    botonSubir.setAttribute('aria-label', 'Volver arriba');
    botonSubir.textContent = '↑';
    botonSubir.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: comportamiento });
    });
    document.body.appendChild(botonSubir);

    const actualizarFlotantes = () => {
        const webVisible = !seccionWeb.classList.contains('web-oculta');
        menu.classList.toggle('visible', webVisible);
        botonSubir.classList.toggle('visible', webVisible && window.scrollY > 700);
    };

    // Como máximo una revisión por frame mientras se hace scroll
    let flotantesPendiente = false;
    const programarFlotantes = () => {
        if (flotantesPendiente) return;
        flotantesPendiente = true;
        requestAnimationFrame(() => {
            flotantesPendiente = false;
            actualizarFlotantes();
        });
    };
    window.addEventListener('scroll', programarFlotantes, { passive: true });
    new MutationObserver(actualizarFlotantes).observe(seccionWeb, {
        attributes: true,
        attributeFilter: ['class']
    });
    actualizarFlotantes();
});
