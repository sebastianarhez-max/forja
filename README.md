# FORJA – Sistema de gestión de gimnasio (Grupo 5)

Proyecto del curso **Arquitectura de Aplicaciones Web** (UPC, sección 8230).
FORJA permite al administrador de un gimnasio gestionar clases, salas, socios, reservas y asistencia,
cobros de clases libres, membresías y la tienda.

| Carpeta | Contenido |
|---|---|
| `backend/` | Servicio REST en Java 17 + Spring Boot 3.3, Spring Security con JWT y PostgreSQL. |
| `frontend/` | Aplicación web del administrador en Angular 21. |
| `postman/` | Colección de Postman con 120 peticiones para probar el servicio. |

## Integrantes
| Apellidos y nombres | Código |
|---|---|
| Arias Hernandez, Cristhian Sebastian | U20241a467 |
| Cermeño Yance, Gabriel | U202317426 |
| Capellan Solis, Leonel Diesel | U20231E969 |
| Diaz Corzano, Favio Stephano | U202318689 |
| Armas Trujillo, Mauricio Alonso | U20221B140 |

## Cómo ejecutarlo en local

### 1. Base de datos (PostgreSQL)
1. Crear la base `gimnasio_db`.
2. Ejecutar `backend/sql/gimnasio_forja_postgres.sql` (19 tablas con datos de prueba).
   Si la base ya existía sin salas, ejecutar una sola vez `backend/sql/02_migracion_salas.sql`.

### 2. Backend
```bash
cd backend
mvn spring-boot:run
```
Queda en `http://localhost:8080/url`. La conexión se configura con las variables de entorno
`DB_URL`, `DB_USER`, `DB_PASSWORD` y `JWT_SECRET` (ver `backend/README.md`).

### 3. Frontend
```bash
cd frontend
npm install
npx ng serve
```
Abrir `http://localhost:4200` e iniciar sesión con un usuario de prueba (por ejemplo `carlos` / `1234`).
La dirección del backend se cambia en `frontend/src/app/app.settings.ts`.

### 4. Pruebas con Postman
Importar `postman/FORJA_API.postman_collection.json`, cambiar la variable `baseUrl` a `http://localhost:8080`
y ejecutar primero la carpeta **00 Autenticacion**, que guarda el token para el resto de peticiones.
