# FORJA · Frontend (Angular 21)

Aplicación web del administrador del gimnasio FORJA. Consume el backend `sistema-gimnasio-backend`
(Spring Boot + PostgreSQL + JWT). Sigue la estructura del proyecto guía del curso (login con JWT,
TokenService, interceptor, servicios por entidad y componentes standalone).

## Requisitos
- Node.js 20 o superior y npm
- Angular CLI 21 (`npm install -g @angular/cli`) — opcional, también funciona con `npx ng`
- Backend encendido (por defecto en `http://localhost:8080`)

## Cómo ejecutarlo
```bash
cd forja-frontend
npm install
ng serve -o          # abre http://localhost:4200/login
```
Usuario de prueba: `carlos` / `1234` (si no cambiaste las contraseñas de los datos de prueba).

Para usar el backend desplegado en Render, cambia `src/app/app.settings.ts`:
```ts
public static API_ENDPOINT = 'https://grupo-5-forja-api.onrender.com/url';
```

## Pantallas y historias de usuario
| Menú | Historia | Pestañas |
|---|---|---|
| Inicio | — | Indicadores del día, clases de hoy, membresías por vencer, stock bajo |
| Clases | HU01 | Actividades · Entrenadores · Clases (programación con sala) |
| Salas | Pedido del profesor | Registro de salas con aforo y horario semanal de cada sala |
| Clientes y asistencia | HU02 | Clientes (con historial) · Cupos y reserva · Asistentes (ingreso / falta) |
| Cobro y recaudación | HU03 | Registrar ingreso con cobro · Recaudación y desglose por método |
| Membresías | HU04 | Planes · Contratar (membresía + pago) · Vigentes · Por vencer |
| Inventario y ventas | HU05 | Categorías y productos · Reposición · Registrar venta · Stock bajo · Historial |
| Reportes | Backlog #7 | Ingresos del período, por método de pago, por plan, clases y productos |

## Estructura
```
src/app/
├── app.config.ts / app.routes.ts / app.settings.ts
├── security/      login (AuthService), TokenService, interceptor JWT y guards
├── layout/        Shell (barra superior + menú lateral) y Seccion (título + pestañas de cada HU)
├── auth/          pantalla de login
├── models/        interfaces de las entidades y de las consultas
├── services/      CrudService genérico + un servicio por entidad, RegistroService,
│                  ConsultaService y ReporteService
├── shared/        pipes (soles, fecha, hora, día), mensajes de error y alertas (SweetAlert2)
└── pages/         inicio, clases, salas, clientes, cobro, membresias, inventario, reportes
```

- Toda la sesión vive en `sessionStorage`; el interceptor agrega `Authorization: Bearer <token>`
  y, si el backend responde 401, cierra la sesión y vuelve al login.
- Los estados de pantalla usan *signals* de Angular y los formularios usan *Reactive Forms* con validaciones.
