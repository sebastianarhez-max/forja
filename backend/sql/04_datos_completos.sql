-- =====================================================================
-- FORJA - Datos de prueba completos (mínimo 10 registros por tabla)
-- Ejecutar sobre gimnasio_db DESPUÉS de los scripts 01, 02 y 03.
-- Se puede ejecutar más de una vez: no duplica datos.
--
-- Los datos respetan las reglas de negocio del sistema:
--   * fecha_fin de cada membresía = fecha_inicio + duración del plan, y cada una tiene su pago
--     por el precio del plan;
--   * cada asistencia cae en el día de su clase, sin duplicados, y en clases MEMBRESIA el socio
--     tiene una membresía vigente en esa fecha; en clases LIBRE el monto es el precio de entrada;
--   * el total de cada venta es la suma de sus detalles;
--   * ninguna clase se cruza con otra en la misma sala y el cupo no supera el aforo.
-- Fecha de referencia: 27/11/2026 (hay membresías vigentes y otras por vencer en los próximos días).
-- =====================================================================

BEGIN;

-- ------------------------------------------------------------ usuarios (personal del gimnasio)
-- Misma contraseña que las cuentas existentes (se copia el hash BCrypt del usuario 1).
INSERT INTO public.usuario (id_usuario, nombres, apellidos, dni, login, password, correo, telefono, estado)
SELECT x.id, x.nombres, x.apellidos, x.dni, x.login, (SELECT password FROM public.usuario WHERE id_usuario = 1), x.correo, x.telefono, TRUE
FROM (VALUES
    ( 6, 'Rosa',    'Quispe Huaman', '45123456', 'rquispe',   'rquispe@gym.com',   '987123456'),
    ( 7, 'Luis',    'Paredes Soto',  '46234567', 'lparedes',  'lparedes@gym.com',  '976234567'),
    ( 8, 'Andrea',  'Castillo Rios', '47345678', 'acastillo', 'acastillo@gym.com', '965345678'),
    ( 9, 'Jorge',   'Ramos Vela',    '48456789', 'jramos',    'jramos@gym.com',    '954456789'),
    (10, 'Valeria', 'Chavez Pinto',  '49567890', 'vchavez',   'vchavez@gym.com',   '943567890')
) AS x(id, nombres, apellidos, dni, login, correo, telefono)
ON CONFLICT DO NOTHING;

-- 2 de Control de ingreso, 2 Vendedores y 1 Administradora
INSERT INTO public.usuario_has_rol (id_usuario, id_rol)
SELECT u.id_usuario, x.id_rol
FROM (VALUES ('rquispe', 2), ('acastillo', 2), ('lparedes', 3), ('jramos', 3), ('vchavez', 1)) AS x(login, id_rol)
JOIN public.usuario u ON u.login = x.login
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------ clases: actividades, entrenadores, salas
INSERT INTO public.actividad (id_actividad, nombre, descripcion, estado) VALUES
    ( 7, 'Pilates',        'Fortalecimiento del core con reformer',      TRUE),
    ( 8, 'Boxeo',          'Técnica de boxeo y acondicionamiento',       TRUE),
    ( 9, 'Funcional HIIT', 'Circuitos de alta intensidad por intervalos', TRUE),
    (10, 'Stretching',     'Estiramiento y movilidad articular',         TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO public.entrenador (id_entrenador, nombres, apellidos, dni, especialidad, telefono, correo, estado) VALUES
    ( 6, 'Carla',  'Medina Ruiz',    '45889900', 'Pilates y core',            '944555666', 'cmedina@gym.com',  TRUE),
    ( 7, 'Bruno',  'Vargas Peña',    '46990011', 'Boxeo y acondicionamiento', '933444555', 'bvargas@gym.com',  TRUE),
    ( 8, 'Lucía',  'Herrera Cano',   '47001122', 'Funcional y HIIT',          '922333444', 'lherrera@gym.com', TRUE),
    ( 9, 'Diego',  'Ccori Mamani',   '48112233', 'Stretching y movilidad',    '911222333', 'dccori@gym.com',   TRUE),
    (10, 'Sofía',  'Paz Olivares',   '49223344', 'Crossfit y halterofilia',   '900111222', 'spaz@gym.com',     TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO public.sala (id_sala, nombre, capacidad, descripcion, estado) VALUES
    ( 4, 'Sala 4',  15, 'Sala de pilates con 15 reformers',        TRUE),
    ( 5, 'Sala 5',  20, 'Ring y sacos de boxeo',                   TRUE),
    ( 6, 'Sala 6',  25, 'Funcional y HIIT',                        TRUE),
    ( 7, 'Sala 7',  18, 'Stretching y movilidad',                  TRUE),
    ( 8, 'Sala 8',  40, 'Zona de pesas libres y máquinas',         TRUE),
    ( 9, 'Sala 9',  12, 'Entrenamiento personalizado',             TRUE),
    (10, 'Terraza', 30, 'Clases al aire libre',                    TRUE)
ON CONFLICT DO NOTHING;

-- Horarios en salas nuevas (no se cruzan con los existentes); 2 clases LIBRE con fecha
INSERT INTO public.horario (id_horario, id_actividad, id_entrenador, id_sala, dia, fecha, hora_inicio, hora_fin, cupo_maximo, tipo_acceso, precio_entrada, estado) VALUES
    ( 9,  7,  6,  4, 'Lunes',     NULL,         '09:00', '10:00', 15, 'MEMBRESIA',  0.00, TRUE),
    (10,  8,  7,  5, 'Martes',    NULL,         '19:00', '20:00', 20, 'MEMBRESIA',  0.00, TRUE),
    (11,  9,  8,  6, 'Miercoles', NULL,         '18:00', '19:00', 25, 'MEMBRESIA',  0.00, TRUE),
    (12, 10,  9,  7, 'Jueves',    NULL,         '08:00', '09:00', 18, 'MEMBRESIA',  0.00, TRUE),
    (13,  2, 10,  6, 'Viernes',   NULL,         '07:00', '08:00', 25, 'MEMBRESIA',  0.00, TRUE),
    (14,  6,  8, 10, 'Sabado',    '2026-11-28', '09:00', '10:30', 30, 'LIBRE',     20.00, TRUE),
    (15,  8,  7,  5, 'Sabado',    '2026-12-05', '10:00', '11:30', 20, 'LIBRE',     25.00, TRUE)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------ socios
INSERT INTO public.cliente (id_cliente, nombres, apellidos, dni, correo, telefono, fecha_nacimiento, direccion, estado) VALUES
    ( 6, 'Andrés',    'Vega Torres',    '75123456', 'andres.vega@gmail.com', '944111222', '1996-04-10', 'Av. Javier Prado 1500', TRUE),
    ( 7, 'Camila',    'Rios Herrera',   '76234567', 'camila.rios@gmail.com', '933222111', '2001-09-15', 'Jr. Huallaga 320',      TRUE),
    ( 8, 'Sebastián', 'Ortiz Lara',     '77345678', 'sortiz@gmail.com',      '922111000', '1994-12-02', 'Av. La Marina 2100',    TRUE),
    ( 9, 'Daniela',   'Mendoza Silva',  '78456789', 'dmendoza@gmail.com',    '911000999', '2002-01-25', 'Calle Los Olivos 77',   TRUE),
    (10, 'Gonzalo',   'Huaman Rios',    '79567890', 'ghuaman@gmail.com',     '900999888', '1990-06-18', 'Av. Universitaria 950', TRUE),
    (11, 'Valentina', 'Cruz Soto',      '70678901', 'vcruz@gmail.com',       '988000111', '1999-08-08', 'Av. Benavides 3400',    TRUE),
    (12, 'Mateo',     'Paredes Luna',   '71789012', 'mparedes@gmail.com',    '977000222', '2003-03-03', 'Jr. Ica 455',           TRUE)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------ membresías y pagos
INSERT INTO public.plan (id_plan, nombre, descripcion, duracion_dias, precio, estado) VALUES
    ( 6, 'Semanal',             'Acceso completo por 7 días',                7,  25, TRUE),
    ( 7, 'Bimestral',           'Acceso completo por 60 días',              60, 150, TRUE),
    ( 8, 'Estudiante mensual',  'Plan mensual con carnet universitario',     30,  60, TRUE),
    ( 9, 'Nocturno mensual',    'Acceso de 8 p. m. a 11 p. m. por 30 días',  30,  65, TRUE),
    (10, 'Corporativo mensual', 'Tarifa para empresas con convenio',         30,  70, TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO public.tipo_pago (id_tipo_pago, nombre, estado) VALUES
    ( 6, 'Depósito bancario',    TRUE),
    ( 7, 'Tunki',                TRUE),
    ( 8, 'Agora PAY',            TRUE),
    ( 9, 'Vale de regalo FORJA', TRUE),
    (10, 'PayPal',               FALSE)  -- inactivo: no aparece al cobrar
ON CONFLICT DO NOTHING;

-- fecha_fin se calcula igual que el sistema: fecha_inicio + duración del plan
INSERT INTO public.membresia (id_membresia, id_cliente, id_plan, fecha_inicio, fecha_fin, estado)
SELECT x.id, x.id_cliente, x.id_plan, x.inicio::date, x.inicio::date + p.duracion_dias, TRUE
FROM (VALUES
    ( 7,  6, 2, '2026-11-10'),  -- vigente hasta 10/12
    ( 8,  7, 8, '2026-11-01'),  -- vence 01/12 (por vencer)
    ( 9,  8, 3, '2026-10-01'),  -- vigente hasta 30/12
    (10,  9, 1, '2026-11-15'),  -- vence 30/11 (por vencer)
    (11, 10, 7, '2026-10-05'),  -- vence 04/12 (por vencer)
    (12, 11, 6, '2026-11-24'),  -- vence 01/12 (por vencer)
    (13, 12, 9, '2026-11-20'),  -- vigente hasta 20/12
    (14,  1, 2, '2026-11-05')   -- renovación de María: vigente hasta 05/12
) AS x(id, id_cliente, id_plan, inicio)
JOIN public.plan p ON p.id_plan = x.id_plan
ON CONFLICT DO NOTHING;

-- Un pago por membresía, por el precio del plan
INSERT INTO public.pago (id_pago, id_membresia, id_tipo_pago, monto, fecha, concepto)
SELECT x.id, m.id_membresia, x.id_tipo_pago, p.precio, m.fecha_inicio, 'Pago membresía ' || p.nombre
FROM (VALUES (7, 7, 1), (8, 8, 3), (9, 9, 2), (10, 10, 4), (11, 11, 6), (12, 12, 3), (13, 13, 7), (14, 14, 1)) AS x(id, id_membresia, id_tipo_pago)
JOIN public.membresia m ON m.id_membresia = x.id_membresia
JOIN public.plan p ON p.id_plan = m.id_plan
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------ asistencia
-- Cada fecha coincide con el día de la clase y cada socio tiene membresía vigente en esa fecha.
INSERT INTO public.asistencia (id_asistencia, id_horario, id_cliente, id_usuario, fecha, hora_ingreso, estado, id_tipo_pago, monto_pagado) VALUES
    (10,  9,  6, 2, '2026-11-23', '2026-11-23 08:55', 'ASISTIO',   NULL, 0.00),  -- Pilates, lunes
    (11,  9,  7, 2, '2026-11-23', '2026-11-23 08:58', 'ASISTIO',   NULL, 0.00),
    (12, 10,  8, 5, '2026-11-24', '2026-11-24 18:55', 'ASISTIO',   NULL, 0.00),  -- Boxeo, martes
    (13, 10, 10, 5, '2026-11-24', NULL,               'FALTO',     NULL, 0.00),
    (14, 11, 11, 6, '2026-11-25', '2026-11-25 17:57', 'ASISTIO',   NULL, 0.00),  -- Funcional, miércoles
    (15, 12,  1, 8, '2026-11-26', '2026-11-26 07:55', 'ASISTIO',   NULL, 0.00),  -- Stretching, jueves
    (16, 14,  9, 2, '2026-11-28', NULL,               'RESERVADO', NULL, 0.00),  -- Clase libre del sábado
    (17, 14, 12, 2, '2026-11-28', NULL,               'RESERVADO', NULL, 0.00)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------ tienda
INSERT INTO public.categoria_producto (id_categoria, nombre, estado) VALUES
    ( 6, 'Snacks saludables',   TRUE),
    ( 7, 'Vitaminas',           TRUE),
    ( 8, 'Calzado deportivo',   TRUE),
    ( 9, 'Recuperación',        TRUE),
    (10, 'Accesorios de boxeo', TRUE)
ON CONFLICT DO NOTHING;

-- Algunos productos quedan con stock bajo (stock <= stock_minimo) para la alerta de reposición
INSERT INTO public.producto (id_producto, id_categoria, nombre, precio, stock, stock_minimo, estado) VALUES
    ( 6,  6, 'Barra proteica 60g',              7.5, 40, 15, TRUE),
    ( 7,  7, 'Multivitamínico 60 cápsulas',      55,  4,  5, TRUE),  -- stock bajo
    ( 8,  8, 'Zapatillas de training',          260,  6,  3, TRUE),
    ( 9,  9, 'Rodillo de espuma (foam roller)',  70,  2,  4, TRUE),  -- stock bajo
    (10, 10, 'Guantes de boxeo 12 oz',          150,  8,  3, TRUE),
    (11, 10, 'Vendas de boxeo 4.5 m',            20, 25,  8, TRUE),
    (12,  4, 'Agua mineral 625ml',                3,  9, 20, TRUE),  -- stock bajo
    (13,  1, 'Creatina monohidratada 300g',      95, 10,  4, TRUE)
ON CONFLICT DO NOTHING;

-- Ventas registradas por los vendedores (usuarios 4, 7 y 9); sin cliente = público general
INSERT INTO public.venta (id_venta, id_usuario, id_cliente, fecha, total)
SELECT x.id, x.id_usuario, x.id_cliente, x.fecha::timestamp, 0
FROM (VALUES
    ( 7, 4,  6,    '2026-11-20 10:15'),
    ( 8, 7,  NULL::int, '2026-11-21 18:40'),
    ( 9, 4,  8,    '2026-11-23 09:05'),
    (10, 9,  9,    '2026-11-24 19:30'),
    (11, 7,  10,   '2026-11-25 07:50'),
    (12, 9,  NULL, '2026-11-26 20:10')
) AS x(id, id_usuario, id_cliente, fecha)
ON CONFLICT DO NOTHING;

-- Detalles con el precio del producto y su subtotal
INSERT INTO public.detalle_venta (id_detalle, id_venta, id_producto, cantidad, precio_unitario, subtotal)
SELECT x.id, x.id_venta, x.id_producto, x.cantidad, p.precio, p.precio * x.cantidad
FROM (VALUES
    ( 7,  7,  6, 3), ( 8,  7, 12, 2),
    ( 9,  8, 10, 1),
    (10,  9, 13, 1), (11,  9, 11, 2),
    (12, 10,  4, 3),
    (13, 11,  1, 1), (14, 11,  6, 2),
    (15, 12,  3, 1), (16, 12,  2, 1)
) AS x(id, id_venta, id_producto, cantidad)
JOIN public.producto p ON p.id_producto = x.id_producto
ON CONFLICT DO NOTHING;

-- El total de cada venta nueva es la suma de sus detalles
UPDATE public.venta v
SET total = ROUND((SELECT SUM(d.subtotal) FROM public.detalle_venta d WHERE d.id_venta = v.id_venta)::numeric, 2)
WHERE v.id_venta BETWEEN 7 AND 12;

-- ------------------------------------------------------------ torneos
INSERT INTO public.torneo (id_torneo, nombre, descripcion, fecha, lugar, estado) VALUES
    ( 6, 'Liga de Boxeo Amateur FORJA',   'Combates amateur por categoría de peso',    '2026-12-12', 'Sede FORJA Miraflores', TRUE),
    ( 7, 'Maratón de Spinning Solidario', 'Tres horas de spinning con fines benéficos', '2026-12-19', 'Sede FORJA San Isidro', TRUE),
    ( 8, 'Open de Calistenia',            'Competencia de dominadas, fondos y skills', '2027-02-07', 'Sede FORJA Surco',      TRUE),
    ( 9, 'Reto Funcional por Parejas',    'Circuito funcional en parejas',             '2027-03-14', 'Sede FORJA Miraflores', TRUE),
    (10, 'Copa Pilates Core Challenge',   'Reto de resistencia de core',               '2026-09-27', 'Sede FORJA Surco',      TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO public.inscripcion_torneo (id_inscripcion, id_cliente, id_torneo, id_entrenador, categoria, sexo, peso_minimo, peso_maximo, puesto, puntaje, observaciones, estado) VALUES
    ( 6,  6,  6, 7, 'Peso ligero masculino', 'M', 60.00, 70.00, NULL, NULL,  NULL,                      TRUE),
    ( 7,  8,  6, 7, 'Peso medio masculino',  'M', 70.00, 80.00, NULL, NULL,  NULL,                      TRUE),
    ( 8,  7,  7, 4, 'Libre femenino',        'F', NULL,  NULL,  NULL, NULL,  NULL,                      TRUE),
    ( 9,  9,  7, 4, 'Libre femenino',        'F', NULL,  NULL,  NULL, NULL,  NULL,                      TRUE),
    (10, 10,  2, 3, 'Open Masculino',        'M', 75.00, 90.00, NULL, NULL,  NULL,                      TRUE),
    (11, 11,  5, 8, 'Equipos mixtos',        'F', NULL,  NULL,  NULL, NULL,  NULL,                      TRUE),
    (12,  1, 10, 6, 'Principiantes',         'F', NULL,  NULL,  2,    87.50, 'Segundo puesto en core',  TRUE)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------ seguimiento físico
INSERT INTO public.rutina (id_rutina, id_cliente, id_entrenador, nombre, objetivo, ejercicios, fecha_creacion, estado) VALUES
    ( 6,  6,  7, 'Acondicionamiento para boxeo', 'Mejorar resistencia',
        '[{"nombre": "Saltar soga", "series": 4, "descansoSeg": 60, "repeticiones": 100}, {"nombre": "Sombra", "series": 3, "descansoSeg": 60, "repeticiones": 1}, {"nombre": "Saco pesado", "series": 4, "descansoSeg": 90, "repeticiones": 1}]', '2026-11-10', TRUE),
    ( 7,  7,  6, 'Pilates principiante',         'Fortalecer core',
        '[{"nombre": "Hundred", "series": 2, "descansoSeg": 30, "repeticiones": 100}, {"nombre": "Roll up", "series": 3, "descansoSeg": 30, "repeticiones": 8}]', '2026-11-02', TRUE),
    ( 8,  8,  3, 'Fuerza base 5x5',              'Ganar fuerza',
        '[{"nombre": "Sentadilla", "series": 5, "descansoSeg": 120, "repeticiones": 5}, {"nombre": "Press banca", "series": 5, "descansoSeg": 120, "repeticiones": 5}, {"nombre": "Remo con barra", "series": 5, "descansoSeg": 120, "repeticiones": 5}]', '2026-10-01', TRUE),
    ( 9,  9,  8, 'HIIT quema grasa',             'Perder grasa',
        '[{"nombre": "Burpees", "series": 5, "descansoSeg": 30, "repeticiones": 12}, {"nombre": "Jumping jacks", "series": 5, "descansoSeg": 30, "repeticiones": 30}]', '2026-11-15', TRUE),
    (10, 10,  9, 'Movilidad de espalda',         'Reducir dolor lumbar',
        '[{"nombre": "Gato-camello", "series": 3, "descansoSeg": 30, "repeticiones": 10}, {"nombre": "Puente de glúteos", "series": 3, "descansoSeg": 45, "repeticiones": 12}]', '2026-10-05', TRUE)
ON CONFLICT DO NOTHING;

-- El IMC se calcula con el peso y la altura: peso / altura²
INSERT INTO public.evaluacion_fisica (id_evaluacion, id_cliente, fecha, peso, altura, imc, grasa_corporal, observaciones)
SELECT x.id, x.id_cliente, x.fecha::date, x.peso, x.altura, ROUND(x.peso / (x.altura * x.altura), 2), x.grasa, x.obs
FROM (VALUES
    ( 6,  6, '2026-11-10', 74.00::numeric, 1.76::numeric, 17.50::numeric, 'Evaluación inicial'),
    ( 7,  7, '2026-11-02', 56.50, 1.62, 23.00, 'Evaluación inicial'),
    ( 8,  8, '2026-10-01', 82.00, 1.78, 19.00, 'Buen estado físico'),
    ( 9,  9, '2026-11-15', 68.00, 1.60, 29.50, 'Sobrepeso leve'),
    (10, 10, '2026-10-05', 88.50, 1.74, 26.00, 'Sobrepeso: control mensual'),
    (11,  1, '2026-11-05', 61.00, 1.65, 22.50, 'Bajó 1.5 kg desde setiembre')
) AS x(id, id_cliente, fecha, peso, altura, grasa, obs)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------ secuencias
-- Los ids se insertaron a mano: las secuencias continúan después del mayor id de cada tabla.
SELECT setval(pg_get_serial_sequence('public.' || t.tabla, t.columna),
              GREATEST((xpath('/row/m/text()', query_to_xml(format('SELECT MAX(%I) AS m FROM public.%I', t.columna, t.tabla), false, true, '')))[1]::text::int, 1))
FROM (VALUES
    ('usuario', 'id_usuario'), ('actividad', 'id_actividad'), ('entrenador', 'id_entrenador'), ('sala', 'id_sala'),
    ('horario', 'id_horario'), ('cliente', 'id_cliente'), ('plan', 'id_plan'), ('tipo_pago', 'id_tipo_pago'),
    ('membresia', 'id_membresia'), ('pago', 'id_pago'), ('asistencia', 'id_asistencia'),
    ('categoria_producto', 'id_categoria'), ('producto', 'id_producto'), ('venta', 'id_venta'),
    ('detalle_venta', 'id_detalle'), ('torneo', 'id_torneo'), ('inscripcion_torneo', 'id_inscripcion'),
    ('rutina', 'id_rutina'), ('evaluacion_fisica', 'id_evaluacion')
) AS t(tabla, columna);

COMMIT;
