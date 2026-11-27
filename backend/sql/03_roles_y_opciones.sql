-- =====================================================================
-- FORJA - Seguridad por roles y menú dinámico
-- Ejecutar sobre la base gimnasio_db (PostgreSQL) DESPUÉS de los scripts
-- 01 (gimnasio_forja_postgres.sql) y 02 (02_migracion_salas.sql).
-- Se puede ejecutar más de una vez: no duplica datos.
--
-- Modelo (igual al proyecto guía del curso):
--   opcion           -> cada opción del menú lateral (ruta de Angular)
--   rol              -> Administrador, Control de ingreso, Vendedor
--   rol_has_opcion   -> qué opciones ve cada rol
--   usuario_has_rol  -> qué rol(es) tiene cada usuario
-- Al iniciar sesión, el backend lee las opciones del usuario y las manda
-- dentro del token; el frontend arma el menú con un for sobre ellas.
-- =====================================================================

-- ---------------------------------------------------------------- tablas
CREATE TABLE IF NOT EXISTS public.opcion (
    id_opcion  SERIAL PRIMARY KEY,
    nombre     VARCHAR(60)  NOT NULL,
    ruta       VARCHAR(100) NOT NULL,
    -- tipo = grupo del menú: 1 Día a día, 2 Gestión, 3 Configuración
    tipo       SMALLINT     NOT NULL,
    orden      SMALLINT     NOT NULL DEFAULT 0,
    estado     BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_opcion_ruta UNIQUE (ruta),
    CONSTRAINT chk_opcion_tipo CHECK (tipo BETWEEN 1 AND 3)
);

CREATE TABLE IF NOT EXISTS public.rol (
    id_rol  SERIAL PRIMARY KEY,
    nombre  VARCHAR(45) NOT NULL,
    estado  BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_rol_nombre UNIQUE (nombre)
);

CREATE TABLE IF NOT EXISTS public.rol_has_opcion (
    id_rol     INTEGER NOT NULL,
    id_opcion  INTEGER NOT NULL,
    CONSTRAINT pk_rol_has_opcion PRIMARY KEY (id_rol, id_opcion),
    CONSTRAINT fk_rho_rol    FOREIGN KEY (id_rol)    REFERENCES public.rol (id_rol) ON DELETE CASCADE,
    CONSTRAINT fk_rho_opcion FOREIGN KEY (id_opcion) REFERENCES public.opcion (id_opcion)
);

CREATE TABLE IF NOT EXISTS public.usuario_has_rol (
    id_usuario  INTEGER NOT NULL,
    id_rol      INTEGER NOT NULL,
    CONSTRAINT pk_usuario_has_rol PRIMARY KEY (id_usuario, id_rol),
    CONSTRAINT fk_uhr_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_uhr_rol     FOREIGN KEY (id_rol)     REFERENCES public.rol (id_rol)
);

-- ------------------------------------------------- opciones del menú lateral
-- La ruta es la misma que usa app.routes.ts del frontend.
INSERT INTO public.opcion (id_opcion, nombre, ruta, tipo, orden) VALUES
    ( 1, 'Inicio',                'inicio',        1, 1),
    ( 2, 'Reservas y asistencia', 'asistencia',    1, 2),
    ( 3, 'Clases libres',         'clases-libres', 1, 3),
    ( 4, 'Tienda',                'tienda',        1, 4),
    ( 5, 'Socios',                'socios',        2, 1),
    ( 6, 'Membresías',            'membresias',    2, 2),
    ( 7, 'Clases y horarios',     'clases',        2, 3),
    ( 8, 'Salas',                 'salas',         2, 4),
    ( 9, 'Torneos',               'torneos',       2, 5),
    (10, 'Reportes',              'reportes',      2, 6),
    (11, 'Usuarios y pagos',      'configuracion', 3, 1),
    (12, 'Roles y permisos',      'roles',         3, 2)
ON CONFLICT (id_opcion) DO NOTHING;

-- ----------------------------------------------------------------- roles
INSERT INTO public.rol (id_rol, nombre) VALUES
    (1, 'Administrador'),      -- ve y gestiona todo, incluidos usuarios y roles
    (2, 'Control de ingreso'), -- recepción: socios, membresías, clases, reservas y cobros
    (3, 'Vendedor')            -- solo la tienda
ON CONFLICT (id_rol) DO NOTHING;

-- ------------------------------------------------------ opciones por rol
-- Administrador: todas las opciones
INSERT INTO public.rol_has_opcion (id_rol, id_opcion)
SELECT 1, id_opcion FROM public.opcion
ON CONFLICT DO NOTHING;

-- Control de ingreso: todo menos Tienda, Torneos, Reportes y Configuración
INSERT INTO public.rol_has_opcion (id_rol, id_opcion) VALUES
    (2, 1), (2, 2), (2, 3), (2, 5), (2, 6), (2, 7), (2, 8)
ON CONFLICT DO NOTHING;

-- Vendedor: Inicio y Tienda
INSERT INTO public.rol_has_opcion (id_rol, id_opcion) VALUES
    (3, 1), (3, 4)
ON CONFLICT DO NOTHING;

-- ------------------------------------------- rol de los usuarios existentes
-- carlos y sebastian = Administrador, lucia y mrios = Control de ingreso, pnunez = Vendedor
INSERT INTO public.usuario_has_rol (id_usuario, id_rol)
SELECT u.id_usuario, x.id_rol
FROM (VALUES ('carlos', 1), ('sebastian', 1), ('lucia', 2), ('mrios', 2), ('pnunez', 3)) AS x(login, id_rol)
JOIN public.usuario u ON u.login = x.login
ON CONFLICT DO NOTHING;

-- Cualquier otro usuario que haya quedado sin rol recibe Administrador,
-- para que nadie pierda el acceso que tenía antes de este cambio.
INSERT INTO public.usuario_has_rol (id_usuario, id_rol)
SELECT u.id_usuario, 1
FROM public.usuario u
WHERE NOT EXISTS (SELECT 1 FROM public.usuario_has_rol r WHERE r.id_usuario = u.id_usuario);

-- Las secuencias continúan después de los ids insertados a mano
SELECT setval('public.opcion_id_opcion_seq', (SELECT MAX(id_opcion) FROM public.opcion));
SELECT setval('public.rol_id_rol_seq',       (SELECT MAX(id_rol)    FROM public.rol));
