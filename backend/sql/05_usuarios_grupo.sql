-- =====================================================================
-- FORJA - Usuarios del sistema: integrantes del Grupo 5 + personal ficticio
-- Ejecutar sobre gimnasio_db DESPUÉS de los scripts 01 a 04.
-- Se puede ejecutar más de una vez.
--
-- Los usuarios 1 a 5 (carlos, lucia, sebastian, pnunez y mrios) se REEMPLAZAN por los integrantes
-- del grupo. No se borran porque las ventas y asistencias guardan qué usuario las registró
-- (venta.id_usuario y asistencia.id_usuario); al conservar el id, ese historial sigue siendo válido.
-- Cada integrante tiene el rol de la historia de usuario que desarrolló.
-- Contraseña de todos: 1234 (encriptada con BCrypt).
-- =====================================================================

BEGIN;

-- Hash BCrypt de "1234"
UPDATE public.usuario u
SET nombres = x.nombres, apellidos = x.apellidos, dni = x.dni, login = x.login, correo = x.correo,
    telefono = x.telefono, estado = TRUE,
    password = '$2a$10$yCe4JBIOWSxMETk4/f56oOcrCGLg2iiEAfIa8V/gIsqFta5y.S9Sa'
FROM (VALUES
    (1, 'Cristhian Sebastian', 'Arias Hernandez', '72041467', 'carias',    'u20241a467@upc.edu.pe', '987001001'),  -- HU01 y HU06
    (2, 'Gabriel',             'Cermeño Yance',   '72317426', 'gcermeno',  'u202317426@upc.edu.pe', '987001002'),  -- HU02
    (3, 'Leonel Diesel',       'Capellan Solis',  '72310969', 'lcapellan', 'u20231e969@upc.edu.pe', '987001003'),  -- HU04
    (4, 'Mauricio Alonso',     'Armas Trujillo',  '72211140', 'marmas',    'u20221b140@upc.edu.pe', '987001004'),  -- HU05
    (5, 'Favio Stephano',      'Diaz Corzano',    '72318689', 'fdiaz',     'u202318689@upc.edu.pe', '987001005')   -- HU03
) AS x(id, nombres, apellidos, dni, login, correo, telefono)
WHERE u.id_usuario = x.id;

-- Roles según la historia de usuario de cada integrante
DELETE FROM public.usuario_has_rol WHERE id_usuario BETWEEN 1 AND 5;
INSERT INTO public.usuario_has_rol (id_usuario, id_rol) VALUES
    (1, 1),  -- carias:    Administrador      (HU01 clases, HU06 roles)
    (2, 2),  -- gcermeno:  Control de ingreso (HU02 reservas e ingreso)
    (3, 2),  -- lcapellan: Control de ingreso (HU04 membresías)
    (4, 3),  -- marmas:    Vendedor           (HU05 tienda)
    (5, 2);  -- fdiaz:     Control de ingreso (HU03 cobro de clases libres)

-- Personal ficticio (usuarios 6 a 10, creados en el script 04): misma contraseña y roles
UPDATE public.usuario SET password = '$2a$10$yCe4JBIOWSxMETk4/f56oOcrCGLg2iiEAfIa8V/gIsqFta5y.S9Sa' WHERE id_usuario BETWEEN 6 AND 10;
DELETE FROM public.usuario_has_rol WHERE id_usuario BETWEEN 6 AND 10;
INSERT INTO public.usuario_has_rol (id_usuario, id_rol) VALUES
    (6, 2),   -- rquispe:   Control de ingreso
    (7, 3),   -- lparedes:  Vendedor
    (8, 2),   -- acastillo: Control de ingreso
    (9, 3),   -- jramos:    Vendedor
    (10, 1);  -- vchavez:   Administrador

COMMIT;

-- Resultado: usuario, nombre y rol
SELECT u.id_usuario, u.login, u.nombres || ' ' || u.apellidos AS nombre, r.nombre AS rol
FROM public.usuario u
JOIN public.usuario_has_rol ur ON ur.id_usuario = u.id_usuario
JOIN public.rol r ON r.id_rol = ur.id_rol
ORDER BY u.id_usuario;
