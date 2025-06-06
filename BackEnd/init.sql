-- Eliminar tablas existentes si es necesario (para desarrollo inicial)
DROP TABLE IF EXISTS libros_categorias CASCADE;
DROP TABLE IF EXISTS usuarios_roles CASCADE;
DROP TABLE IF EXISTS proveedores_libros CASCADE;
DROP TABLE IF EXISTS compras CASCADE;
DROP TABLE IF EXISTS prestamos CASCADE;
DROP TABLE IF EXISTS reservas CASCADE;
DROP TABLE IF EXISTS multas CASCADE;
DROP TABLE IF EXISTS historial_prestamos CASCADE;
DROP TABLE IF EXISTS historial_reservas CASCADE;
DROP TABLE IF EXISTS inventarios CASCADE;
DROP TABLE IF EXISTS ejemplares CASCADE;
DROP TABLE IF EXISTS libros CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS proveedores CASCADE;
DROP TABLE IF EXISTS ubicaciones CASCADE;
DROP TABLE IF EXISTS bibliotecarios CASCADE;
DROP TABLE IF EXISTS edificios CASCADE;
DROP TABLE IF EXISTS salas CASCADE;
DROP TABLE IF EXISTS eventos CASCADE;

-- Eliminar tipos existentes si es necesario
DROP TYPE IF EXISTS estado_prestamo CASCADE;
DROP TYPE IF EXISTS estado_reserva CASCADE;
DROP TYPE IF EXISTS tipo_multa CASCADE;
DROP TYPE IF EXISTS estado_ejemplar CASCADE;
DROP TYPE IF EXISTS tipo_evento CASCADE;

-- Tipos de datos personalizados
CREATE TYPE estado_prestamo AS ENUM ('pendiente', 'activo', 'devuelto', 'atrasado');
CREATE TYPE estado_reserva AS ENUM ('pendiente', 'confirmada', 'cancelada', 'expirada');
CREATE TYPE tipo_multa AS ENUM ('retraso', 'perdida', 'daño');
CREATE TYPE estado_ejemplar AS ENUM ('disponible', 'prestado', 'reservado', 'mantenimiento');
CREATE TYPE tipo_evento AS ENUM ('conferencia', 'taller', 'exposicion', 'club_lectura');

-- Tablas
CREATE TABLE edificios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE salas (
    id SERIAL PRIMARY KEY,
    edificio_id INT NOT NULL REFERENCES edificios(id),
    nombre VARCHAR(100) NOT NULL,
    capacidad INT,
    UNIQUE (edificio_id, nombre)
);

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE libros (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    autor VARCHAR(255) NOT NULL,
    editorial VARCHAR(255),
    isbn VARCHAR(13) UNIQUE,
    año_publicacion INT CHECK (año_publicacion > 1500)
);

CREATE TABLE ejemplares (
    id SERIAL PRIMARY KEY,
    libro_id INT NOT NULL REFERENCES libros(id),
    sala_id INT NOT NULL REFERENCES salas(id),
    estado estado_ejemplar NOT NULL DEFAULT 'disponible'
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE bibliotecarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE proveedores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    email VARCHAR(100)
);

-- Tablas de relación (N:M)
CREATE TABLE libros_categorias (
    libro_id INT NOT NULL REFERENCES libros(id),
    categoria_id INT NOT NULL REFERENCES categorias(id),
    PRIMARY KEY (libro_id, categoria_id)
);

CREATE TABLE usuarios_roles (
    usuario_id INT NOT NULL REFERENCES usuarios(id),
    rol_id INT NOT NULL REFERENCES roles(id),
    PRIMARY KEY (usuario_id, rol_id)
);

CREATE TABLE proveedores_libros (
    proveedor_id INT NOT NULL REFERENCES proveedores(id),
    libro_id INT NOT NULL REFERENCES libros(id),
    PRIMARY KEY (proveedor_id, libro_id)
);

-- Tablas de transacciones
CREATE TABLE prestamos (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id),
    ejemplar_id INT NOT NULL REFERENCES ejemplares(id),
    bibliotecario_id INT NOT NULL REFERENCES bibliotecarios(id),
    fecha_prestamo DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_devolucion DATE NOT NULL,
    estado estado_prestamo NOT NULL DEFAULT 'pendiente',
    CHECK (fecha_devolucion > fecha_prestamo)
);

CREATE TABLE reservas (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id),
    ejemplar_id INT NOT NULL REFERENCES ejemplares(id),
    fecha_reserva DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_expiracion DATE NOT NULL,
    estado estado_reserva NOT NULL DEFAULT 'pendiente',
    CHECK (fecha_expiracion > fecha_reserva)
);

CREATE TABLE multas (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id),
    prestamo_id INT NOT NULL REFERENCES prestamos(id),
    monto DECIMAL(10, 2) NOT NULL CHECK (monto > 0),
    tipo tipo_multa NOT NULL,
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagada', 'cancelada'))
);

-- Tablas históricas
CREATE TABLE historial_prestamos (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id),
    ejemplar_id INT NOT NULL REFERENCES ejemplares(id),
    bibliotecario_id INT NOT NULL REFERENCES bibliotecarios(id),
    fecha_prestamo DATE NOT NULL,
    fecha_devolucion DATE NOT NULL,
    estado estado_prestamo NOT NULL
);

CREATE TABLE historial_reservas (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id),
    ejemplar_id INT NOT NULL REFERENCES ejemplares(id),
    fecha_reserva DATE NOT NULL,
    fecha_expiracion DATE NOT NULL,
    estado estado_reserva NOT NULL
);

-- Tablas de gestión
CREATE TABLE compras (
    id SERIAL PRIMARY KEY,
    proveedor_id INT NOT NULL REFERENCES proveedores(id),
    libro_id INT NOT NULL REFERENCES libros(id),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) CHECK (precio_unitario > 0),
    fecha_compra DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE inventarios (
    id SERIAL PRIMARY KEY,
    ejemplar_id INT NOT NULL REFERENCES ejemplares(id),
    cantidad INT NOT NULL CHECK (cantidad >= 0),
    fecha_actualizacion DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE eventos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha DATE NOT NULL,
    tipo tipo_evento NOT NULL,
    sala_id INT REFERENCES salas(id)
);

----------------------------------------
-- Funciones SQL (mínimo 3)
----------------------------------------

-- 1. Función para calcular días de atraso en préstamos
CREATE OR REPLACE FUNCTION calcular_dias_atraso(p_prestamo_id INT)
RETURNS INT AS $$
DECLARE
    dias_atraso INT;
BEGIN
    SELECT GREATEST(0, CURRENT_DATE - fecha_devolucion) INTO dias_atraso
    FROM prestamos 
    WHERE id = p_prestamo_id;
    
    RETURN dias_atraso;
END;
$$ LANGUAGE plpgsql;

-- 2. Función para verificar disponibilidad de ejemplar
CREATE OR REPLACE FUNCTION verificar_disponibilidad(p_ejemplar_id INT)
RETURNS BOOLEAN AS $$
DECLARE
    disponible BOOLEAN;
BEGIN
    SELECT estado = 'disponible' INTO disponible
    FROM ejemplares 
    WHERE id = p_ejemplar_id;
    
    RETURN disponible;
END;
$$ LANGUAGE plpgsql;

-- 3. Función para contar préstamos activos por usuario
CREATE OR REPLACE FUNCTION contar_prestamos_activos(p_usuario_id INT)
RETURNS INT AS $$
DECLARE
    total_prestamos INT;
BEGIN
    SELECT COUNT(*) INTO total_prestamos
    FROM prestamos 
    WHERE usuario_id = p_usuario_id AND estado = 'activo';
    
    RETURN total_prestamos;
END;
$$ LANGUAGE plpgsql;

----------------------------------------
-- Triggers (mínimo 3)
----------------------------------------

-- 1. Trigger para actualizar estado de ejemplar al prestar
CREATE OR REPLACE FUNCTION actualizar_estado_ejemplar()
RETURNS TRIGGER AS $$
BEGIN
    -- Al crear un nuevo préstamo
    IF TG_OP = 'INSERT' THEN
        UPDATE ejemplares SET estado = 'prestado' 
        WHERE id = NEW.ejemplar_id;
    
    -- Al devolver un préstamo
    ELSIF TG_OP = 'UPDATE' AND NEW.estado = 'devuelto' THEN
        UPDATE ejemplares SET estado = 'disponible' 
        WHERE id = NEW.ejemplar_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_actualizar_estado_ejemplar
AFTER INSERT OR UPDATE ON prestamos
FOR EACH ROW
EXECUTE FUNCTION actualizar_estado_ejemplar();

-- 2. Trigger para registrar multa automáticamente por atraso
CREATE OR REPLACE FUNCTION generar_multa_automatica()
RETURNS TRIGGER AS $$
DECLARE
    dias_atraso INT;
BEGIN
    IF NEW.estado = 'devuelto' AND NEW.fecha_devolucion < CURRENT_DATE THEN
        dias_atraso := CURRENT_DATE - NEW.fecha_devolucion;
        
        INSERT INTO multas (usuario_id, prestamo_id, monto, tipo, estado)
        VALUES (
            NEW.usuario_id, 
            NEW.id, 
            dias_atraso * 5.00, -- $5 por día de retraso
            'retraso',
            'pendiente'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_generar_multa_automatica
AFTER UPDATE ON prestamos
FOR EACH ROW
EXECUTE FUNCTION generar_multa_automatica();

-- 3. Trigger para actualizar inventario al comprar
CREATE OR REPLACE FUNCTION actualizar_inventario_compra()
RETURNS TRIGGER AS $$
BEGIN
    -- Crear nuevos ejemplares según la cantidad comprada
    FOR i IN 1..NEW.cantidad LOOP
        INSERT INTO ejemplares (libro_id, sala_id, estado)
        VALUES (NEW.libro_id, 1, 'disponible'); -- Sala 1 = Depósito
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_actualizar_inventario_compra
AFTER INSERT ON compras
FOR EACH ROW
EXECUTE FUNCTION actualizar_inventario_compra();

----------------------------------------
-- Vistas (mínimo 2)
----------------------------------------

-- 1. Vista de libros disponibles con ubicación
CREATE VIEW libros_disponibles AS
SELECT 
    l.titulo,
    l.autor,
    l.editorial,
    l.isbn,
    e.id AS ejemplar_id,
    s.nombre AS sala,
    ed.nombre AS edificio
FROM libros l
JOIN ejemplares e ON l.id = e.libro_id
JOIN salas s ON e.sala_id = s.id
JOIN edificios ed ON s.edificio_id = ed.id
WHERE e.estado = 'disponible';

-- 2. Vista de préstamos activos con detalles
CREATE VIEW prestamos_activos AS
SELECT 
    p.id AS prestamo_id,
    u.nombre AS usuario,
    l.titulo AS libro,
    b.nombre AS bibliotecario,
    p.fecha_prestamo,
    p.fecha_devolucion,
    p.estado
FROM prestamos p
JOIN usuarios u ON p.usuario_id = u.id
JOIN ejemplares e ON p.ejemplar_id = e.id
JOIN libros l ON e.libro_id = l.id
JOIN bibliotecarios b ON p.bibliotecario_id = b.id
WHERE p.estado = 'activo';

----------------------------------------
-- Datos de prueba (1000+ registros)
----------------------------------------

-- Edificios
INSERT INTO edificios (nombre) VALUES
('Edificio Central'),
('Edificio Norte'),
('Edificio Sur');

-- Salas
INSERT INTO salas (edificio_id, nombre, capacidad) VALUES
(1, 'Sala General', 100),
(1, 'Sala de Referencia', 50),
(2, 'Sala de Estudio', 80),
(2, 'Sala Multimedia', 30),
(3, 'Sala Infantil', 60),
(3, 'Sala Juvenil', 70),
(1, 'Sala de Profesores', 20),
(2, 'Sala de Computo', 40),
(3, 'Sala de Conferencias', 100),
(1, 'Sala de Archivo', 30);

-- Categorías
INSERT INTO categorias (nombre, descripcion) VALUES
('Ciencia Ficción', 'Libros de ciencia ficción'),
('Fantasía', 'Libros de fantasía'),
('Terror', 'Libros de terror'),
('Romance', 'Novelas románticas'),
('Histórica', 'Novelas históricas'),
('Biografía', 'Biografías'),
('Ciencia', 'Libros de ciencia'),
('Tecnología', 'Libros de tecnología'),
('Arte', 'Libros de arte'),
('Infantil', 'Libros para niños');

-- Roles
INSERT INTO roles (nombre) VALUES
('Estudiante'),
('Profesor'),
('Investigador'),
('Visitante');

-- Bibliotecarios
INSERT INTO bibliotecarios (nombre, telefono, email) VALUES
('Ana García', '12345678', 'ana@biblioteca.edu'),
('Carlos López', '23456789', 'carlos@biblioteca.edu'),
('Marta Rodríguez', '34567890', 'marta@biblioteca.edu'),
('Javier Pérez', '45678901', 'javier@biblioteca.edu'),
('Lucía Martín', '56789012', 'lucia@biblioteca.edu');

-- Proveedores
INSERT INTO proveedores (nombre, direccion, telefono, email) VALUES
('Proveedor A', 'Calle 1', '11111111', 'proveedora@example.com'),
('Proveedor B', 'Calle 2', '22222222', 'proveedorb@example.com'),
('Proveedor C', 'Calle 3', '33333333', 'proveedorc@example.com'),
('Proveedor D', 'Calle 4', '44444444', 'proveedord@example.com'),
('Proveedor E', 'Calle 5', '55555555', 'proveedore@example.com');

-- Libros (100 libros)
INSERT INTO libros (titulo, autor, editorial, isbn, año_publicacion)
SELECT 
    'Libro ' || i,
    'Autor ' || (i % 20 + 1),
    'Editorial ' || (i % 10 + 1),
    LPAD(i::text, 13, '0'),
    2000 + (i % 20)
FROM generate_series(1, 100) i;

-- Asignar categorías a libros (3 categorías por libro)
INSERT INTO libros_categorias (libro_id, categoria_id)
SELECT 
    (i % 100) + 1 AS libro_id,
    (random() * 9 + 1)::int AS categoria_id
FROM generate_series(1, 300) i
ON CONFLICT DO NOTHING;

-- Ejemplares (300 ejemplares)
INSERT INTO ejemplares (libro_id, sala_id, estado)
SELECT 
    (i % 100) + 1 AS libro_id,
    (random() * 9 + 1)::int AS sala_id,
    CASE 
        WHEN random() < 0.7 THEN 'disponible'
        ELSE 'prestado'
    END::estado_ejemplar
FROM generate_series(1, 300) i;

-- Usuarios (50 usuarios)
INSERT INTO usuarios (nombre, direccion, telefono, email)
SELECT 
    'Usuario ' || i,
    'Dirección ' || i,
    '555-' || LPAD(i::text, 4, '0'),
    'usuario' || i || '@example.com'
FROM generate_series(1, 50) i;

-- Asignar roles a usuarios (2 roles por usuario)
INSERT INTO usuarios_roles (usuario_id, rol_id)
SELECT 
    (i % 50) + 1 AS usuario_id,
    (random() * 3 + 1)::int AS rol_id
FROM generate_series(1, 100) i
ON CONFLICT DO NOTHING;

-- Proveedores_libros (150 registros)
INSERT INTO proveedores_libros (proveedor_id, libro_id)
SELECT 
    (random() * 4 + 1)::int AS proveedor_id,
    (random() * 99 + 1)::int AS libro_id
FROM generate_series(1, 150) i
ON CONFLICT DO NOTHING;

-- Compras (50 compras)
INSERT INTO compras (proveedor_id, libro_id, cantidad, precio_unitario, fecha_compra)
SELECT 
    (random() * 4 + 1)::int AS proveedor_id,
    (random() * 99 + 1)::int AS libro_id,
    (random() * 10 + 1)::int AS cantidad,
    (random() * 50 + 10)::decimal(10,2) AS precio_unitario,
    CURRENT_DATE - (random() * 365)::int
FROM generate_series(1, 50) i;

-- Préstamos (200 préstamos)
INSERT INTO prestamos (usuario_id, ejemplar_id, bibliotecario_id, fecha_prestamo, fecha_devolucion, estado)
SELECT 
    (random() * 49 + 1)::int AS usuario_id,
    (random() * 299 + 1)::int AS ejemplar_id,
    (random() * 4 + 1)::int AS bibliotecario_id,
    CURRENT_DATE - (random() * 30)::int,
    CURRENT_DATE + (random() * 14)::int,
    CASE 
        WHEN random() < 0.8 THEN 'activo'
        ELSE 'devuelto'
    END::estado_prestamo
FROM generate_series(1, 200) i;

-- Reservas (100 reservas)
INSERT INTO reservas (usuario_id, ejemplar_id, fecha_reserva, fecha_expiracion, estado)
SELECT 
    (random() * 49 + 1)::int AS usuario_id,
    (random() * 299 + 1)::int AS ejemplar_id,
    CURRENT_DATE - (random() * 15)::int,
    CURRENT_DATE + (random() * 7)::int,
    CASE 
        WHEN random() < 0.6 THEN 'pendiente'
        WHEN random() < 0.8 THEN 'confirmada'
        ELSE 'cancelada'
    END::estado_reserva
FROM generate_series(1, 100) i;

-- Multas (50 multas)
INSERT INTO multas (usuario_id, prestamo_id, monto, tipo, fecha_emision, estado)
SELECT 
    (random() * 49 + 1)::int AS usuario_id,
    (random() * 199 + 1)::int AS prestamo_id,
    (random() * 100)::decimal(10,2),
    CASE (random() * 2)::int
        WHEN 0 THEN 'retraso'
        WHEN 1 THEN 'perdida'
        ELSE 'daño'
    END::tipo_multa,
    CURRENT_DATE - (random() * 30)::int,
    CASE 
        WHEN random() < 0.7 THEN 'pendiente'
        ELSE 'pagada'
    END
FROM generate_series(1, 50) i;

-- Historial de préstamos (100 registros)
INSERT INTO historial_prestamos (usuario_id, ejemplar_id, bibliotecario_id, fecha_prestamo, fecha_devolucion, estado)
SELECT 
    (random() * 49 + 1)::int AS usuario_id,
    (random() * 299 + 1)::int AS ejemplar_id,
    (random() * 4 + 1)::int AS bibliotecario_id,
    CURRENT_DATE - (random() * 60 + 30)::int,
    CURRENT_DATE - (random() * 30)::int,
    'devuelto'
FROM generate_series(1, 100) i;

-- Historial de reservas (50 registros)
INSERT INTO historial_reservas (usuario_id, ejemplar_id, fecha_reserva, fecha_expiracion, estado)
SELECT 
    (random() * 49 + 1)::int AS usuario_id,
    (random() * 299 + 1)::int AS ejemplar_id,
    CURRENT_DATE - (random() * 45 + 15)::int,
    CURRENT_DATE - (random() * 15)::int,
    CASE 
        WHEN random() < 0.5 THEN 'cancelada'
        ELSE 'expirada'
    END::estado_reserva
FROM generate_series(1, 50) i;

-- Inventarios (300 registros, uno por ejemplar)
INSERT INTO inventarios (ejemplar_id, cantidad, fecha_actualizacion)
SELECT 
    id,
    1,
    CURRENT_DATE
FROM ejemplares;

-- Eventos (20 eventos)
INSERT INTO eventos (nombre, descripcion, fecha, tipo, sala_id)
SELECT 
    'Evento ' || i,
    'Descripción del evento ' || i,
    CURRENT_DATE + (random() * 30)::int,
    CASE (random() * 3)::int
        WHEN 0 THEN 'conferencia'
        WHEN 1 THEN 'taller'
        WHEN 2 THEN 'exposicion'
        ELSE 'club_lectura'
    END::tipo_evento,
    (random() * 9 + 1)::int
FROM generate_series(1, 20) i;

