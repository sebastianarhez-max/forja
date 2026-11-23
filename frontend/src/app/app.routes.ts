import { Routes } from '@angular/router';
import { Login } from './auth/login';
import { Seccion } from './layout/seccion';
import { Shell } from './layout/shell';
import { authGuard, loginGuard } from './security/auth.guard';
// Inicio y reportes
import { Inicio } from './pages/inicio/inicio';
import { Reportes } from './pages/reportes/reportes';
// Clases y horarios (HU01)
import { Actividades } from './pages/clases/actividades';
import { Entrenadores } from './pages/clases/entrenadores';
import { Programacion } from './pages/clases/programacion';
// Salas
import { Salas } from './pages/salas/salas';
// Socios, reservas y asistencia (HU02)
import { Asistentes } from './pages/clientes/asistentes';
import { Clientes } from './pages/clientes/clientes';
import { Reservas } from './pages/clientes/reservas';
// Clases libres: cobro y recaudación (HU03)
import { Cobro } from './pages/cobro/cobro';
import { Recaudacion } from './pages/cobro/recaudacion';
// Membresías (HU04)
import { Contratar } from './pages/membresias/contratar';
import { Planes } from './pages/membresias/planes';
import { PorVencer } from './pages/membresias/por-vencer';
import { Vigentes } from './pages/membresias/vigentes';
// Tienda: inventario y ventas (HU05)
import { Historial } from './pages/inventario/historial';
import { Productos } from './pages/inventario/productos';
import { Reposicion } from './pages/inventario/reposicion';
import { StockBajo } from './pages/inventario/stock-bajo';
import { Venta } from './pages/inventario/venta';
// Socios: seguimiento físico y rutinas
import { Evaluaciones } from './pages/clientes/evaluaciones';
import { Rutinas } from './pages/clientes/rutinas';
// Torneos y configuración
import { Torneos } from './pages/torneos/torneos';
import { MetodosPago } from './pages/configuracion/metodos-pago';
import { Usuarios } from './pages/configuracion/usuarios';

/**
 * Rutas del sistema. Cada módulo usa el componente Seccion (título + pestañas).
 * Relación con las historias de usuario:
 *   HU01 -> /clases        HU02 -> /socios y /asistencia      HU03 -> /clases-libres
 *   HU04 -> /membresias    HU05 -> /tienda
 */
export const routes: Routes = [
  { path: 'login', component: Login, canActivate: [loginGuard], title: 'FORJA · Iniciar sesión' },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      { path: 'inicio', component: Inicio, title: 'FORJA · Inicio' },

      // ---------------------------------------------------------------- día a día
      {
        path: 'asistencia',
        component: Seccion,
        title: 'FORJA · Reservas y asistencia',
        data: {
          grupo: 'Día a día',
          titulo: 'Reservas y asistencia',
          subtitulo: 'Reserva cupos en las clases y registra quién ingresó o faltó.',
          pestanas: [
            { ruta: 'reservas', texto: 'Reservar cupo' },
            { ruta: 'asistentes', texto: 'Asistentes de la clase' },
          ],
        },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'reservas' },
          { path: 'reservas', component: Reservas },
          { path: 'asistentes', component: Asistentes },
        ],
      },
      {
        path: 'clases-libres',
        component: Seccion,
        title: 'FORJA · Clases libres',
        data: {
          grupo: 'Día a día',
          titulo: 'Clases libres',
          subtitulo: 'Cobra la entrada de las clases abiertas al público y revisa lo recaudado.',
          pestanas: [
            { ruta: 'cobrar', texto: 'Cobrar entrada' },
            { ruta: 'recaudacion', texto: 'Recaudación' },
          ],
        },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'cobrar' },
          { path: 'cobrar', component: Cobro },
          { path: 'recaudacion', component: Recaudacion },
        ],
      },
      {
        path: 'tienda',
        component: Seccion,
        title: 'FORJA · Tienda',
        data: {
          grupo: 'Día a día',
          titulo: 'Tienda',
          subtitulo: 'Ventas de productos, inventario y reposición de stock.',
          pestanas: [
            { ruta: 'venta', texto: 'Nueva venta' },
            { ruta: 'productos', texto: 'Productos y categorías' },
            { ruta: 'reposicion', texto: 'Reponer stock' },
            { ruta: 'stock-bajo', texto: 'Stock bajo' },
            { ruta: 'historial', texto: 'Historial de ventas' },
          ],
        },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'venta' },
          { path: 'venta', component: Venta },
          { path: 'productos', component: Productos },
          { path: 'reposicion', component: Reposicion },
          { path: 'stock-bajo', component: StockBajo },
          { path: 'historial', component: Historial },
        ],
      },

      // ---------------------------------------------------------------- gestión
      {
        path: 'socios',
        component: Seccion,
        title: 'FORJA · Socios',
        data: {
          grupo: 'Gestión',
          titulo: 'Socios',
          subtitulo: 'Datos de los socios, su historial, evaluaciones físicas y rutinas.',
          pestanas: [
            { ruta: 'lista', texto: 'Socios' },
            { ruta: 'evaluaciones', texto: 'Evaluaciones físicas' },
            { ruta: 'rutinas', texto: 'Rutinas' },
          ],
        },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'lista' },
          { path: 'lista', component: Clientes },
          { path: 'evaluaciones', component: Evaluaciones },
          { path: 'rutinas', component: Rutinas },
        ],
      },
      {
        path: 'membresias',
        component: Seccion,
        title: 'FORJA · Membresías',
        data: {
          grupo: 'Gestión',
          titulo: 'Membresías',
          subtitulo: 'Contrata planes, controla su vigencia y contacta a quienes están por vencer.',
          pestanas: [
            { ruta: 'contratar', texto: 'Contratar' },
            { ruta: 'vigentes', texto: 'Vigentes' },
            { ruta: 'por-vencer', texto: 'Por vencer' },
            { ruta: 'planes', texto: 'Planes' },
          ],
        },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'contratar' },
          { path: 'contratar', component: Contratar },
          { path: 'vigentes', component: Vigentes },
          { path: 'por-vencer', component: PorVencer },
          { path: 'planes', component: Planes },
        ],
      },
      {
        path: 'clases',
        component: Seccion,
        title: 'FORJA · Clases y horarios',
        data: {
          grupo: 'Gestión',
          titulo: 'Clases y horarios',
          subtitulo: 'Programa los horarios de cada clase con su entrenador, sala y cupo.',
          pestanas: [
            { ruta: 'horarios', texto: 'Horarios' },
            { ruta: 'actividades', texto: 'Actividades' },
            { ruta: 'entrenadores', texto: 'Entrenadores' },
          ],
        },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'horarios' },
          { path: 'horarios', component: Programacion },
          { path: 'actividades', component: Actividades },
          { path: 'entrenadores', component: Entrenadores },
        ],
      },
      { path: 'salas', component: Salas, title: 'FORJA · Salas' },
      { path: 'torneos', component: Torneos, title: 'FORJA · Torneos' },
      { path: 'reportes', component: Reportes, title: 'FORJA · Reportes' },

      // ---------------------------------------------------------------- configuración
      {
        path: 'configuracion',
        component: Seccion,
        title: 'FORJA · Configuración',
        data: {
          grupo: 'Configuración',
          titulo: 'Usuarios y pagos',
          subtitulo: 'Cuentas que pueden ingresar al sistema y métodos de pago aceptados.',
          pestanas: [
            { ruta: 'usuarios', texto: 'Usuarios' },
            { ruta: 'metodos-pago', texto: 'Métodos de pago' },
          ],
        },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'usuarios' },
          { path: 'usuarios', component: Usuarios },
          { path: 'metodos-pago', component: MetodosPago },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
