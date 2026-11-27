/**
 * Dirección del backend (Spring Boot). Se elige sola según dónde se abre el frontend:
 * - En tu computadora (localhost): el backend de Eclipse/STS, http://localhost:8080/url
 * - En la nube (Render u otro dominio): el backend desplegado en Render.
 */
const ES_LOCAL = typeof window === 'undefined' || ['localhost', '127.0.0.1'].includes(window.location.hostname);

export class AppSettings {
  public static API_ENDPOINT = ES_LOCAL
    ? 'http://localhost:8080/url'
    : 'https://grupo-5-forja-api.onrender.com/url';
}
