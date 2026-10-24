-- 1. Tabla de Arenas
CREATE TABLE arenas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    numero_arena INT NOT NULL,
    copas_requeridas INT NOT NULL,
    imagen_url VARCHAR(255)
);

-- 2. Tabla de Cartas (P.E.K.K.A, Chispitas, Montapuercos, etc.)
CREATE TABLE cartas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    calidad VARCHAR(50) CHECK (calidad IN ('Común', 'Especial', 'Épica', 'Legendaria', 'Campeón')),
    tipo VARCHAR(50) CHECK (tipo IN ('Tropa', 'Hechizo', 'Estructura')),
    costo_elixir INT NOT NULL,
    historia TEXT,
    imagen_url VARCHAR(255),
    arena_id INT REFERENCES arenas(id) ON DELETE SET NULL
);

-- 3. Tabla de Héroes y Evoluciones
CREATE TABLE evoluciones_heroes (
    id SERIAL PRIMARY KEY,
    carta_id INT REFERENCES cartas(id) ON DELETE CASCADE,
    tipo VARCHAR(50) CHECK (tipo IN ('Evolución', 'Héroe')),
    habilidad_especial TEXT,
    imagen_url VARCHAR(255)
);

-- 4. Tabla de Historia y Cronología
CREATE TABLE cronologia_historia (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    fecha_lanzamiento DATE,
    descripcion TEXT,
    imagen_url VARCHAR(255)
);