# FORJA API – Gestión de Gimnasio (Spring Boot + PostgreSQL + JWT)

Arquitectura por capas: `entity` · `repository` · `service` (+ `impl`) · `controller` · `dto` · `security` · `util`.
El frontend Angular está en el proyecto `forja-frontend`.

## Variables de entorno
| Variable | Ejemplo | Por defecto (local) |
|---|---|---|
| DB_URL | jdbc:postgresql://HOST:5432/BASE?sslmode=require | jdbc:postgresql://localhost:5432/gimnasio_db |
| DB_USER | forja_user | postgres |
| DB_PASSWORD | (tu contraseña) | postgres |
| JWT_SECRET | clave de 32 caracteres o más | clave de desarrollo (cámbiala en Render) |

La aplicación trabaja con la hora de Lima (`America/Lima`), aunque el servidor esté en UTC.

## Base de datos
- Base nueva: ejecutar `sql/gimnasio_forja_postgres.sql` (19 tablas, incluye `sala`).
- Base existente: ejecutar **una vez** `sql/02_migracion_salas.sql` (agrega `sala` y `horario.id_sala` sin borrar datos).
- La tabla `cliente_horario` se retiró: las inscripciones a clases se manejan con `asistencia` (reserva, ingreso y falta).

## Seguridad
1. `POST /url/auth/login` con `{"login":"carlos","password":"1234"}` devuelve el token (10 horas).
2. Todos los demás endpoints requieren el header `Authorization: Bearer <token>`.
3. Una cuenta desactivada no puede iniciar sesión y su token deja de funcionar.

## CRUD (GET lista, GET /{id}, POST → 201, PUT o PUT /{id}, DELETE /{id})
/url/usuario · entrenador · cliente · actividad · horario · **sala** · plan · membresia · tipopago · pago ·
rutina · evaluacion · categoria · producto · venta · detalleventa · torneo · inscripciontorneo · asistencia

- Alias usados en las historias de usuario: `/url/tipoPago`, `/url/tipos-pago`, `/url/categoriaProducto`, `/url/clientes`, `/url/horarios`, `/url/planes`, `/url/salas`...
- PUT reemplaza el objeto completo (el id puede ir en la ruta o en el JSON).
- DELETE hace baja lógica (estado = false) en tablas con `estado`.
- Relaciones: `"cliente": {"idCliente": 1}`, `"sala": {"idSala": 1}`.

## Salas
- `POST /url/sala` `{"nombre":"Sala 4","capacidad":15,"descripcion":"Box","estado":true}` (nombre único, capacidad > 0).
- Al registrar o editar una clase (`/url/horario`) con sala se valida:
  - la sala existe y está activa,
  - el cupo no supera la capacidad de la sala,
  - la sala no tiene otra clase activa que se cruce en día y hora.
- No se puede reducir la capacidad de una sala por debajo del cupo de sus clases activas.

## Registros con reglas de negocio
POST /url/registro/membresia · /venta · /asistencia/reservar · /asistencia/ingreso — PUT /url/registro/asistencia/{id}/falto

La venta y la reserva bloquean la fila del producto / de la clase mientras se registran, para que dos usuarios
no puedan vender el mismo stock ni ocupar el último cupo al mismo tiempo.

## Reportes (DTO)
/url/reporte/membresias-por-plan · asistencia-por-estado · ingresos-por-metodo-pago · clases-mas-concurridas · productos-mas-vendidos

## Consultas
/url/consulta/asistencia · recaudado-clase · recaudado-clase/por-pago · cupos · membresias-vigentes ·
membresias-por-vencer · cliente/{id}/historial-asistencia · productos-stock-bajo · ventas · ingresos ·
torneo/{id}/inscritos · entrenador/{id}/horarios · **sala/{id}/horarios** · **salas-resumen**
