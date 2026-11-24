import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login.component';
import { Seccion } from './components/seccion/seccion';
import { MenuComponent } from './menu/menu.component';
import { authGuard, loginGuard } from './security/auth.guard';
// Inicio y reportes
import { IndexComponent } from './index/index.component';
import { Reportes } from './components/reportes/reportes';
// Clases y horarios (HU01)
import { Actividades } from './components/actividades/actividades';
import { Entrenadores } from './components/entrenadores/entrenadores';
import { Programacion } from './components/programacion/programacion';
// Salas
import { Salas } from './components/salas/salas';
// Socios, reservas y asistencia (HU02)
import { Asistentes } from './components/asistentes/asistentes';
import { Clientes } from './components/clientes/clientes';
import { Reservas } from './components/reservas/reservas';
// Clases libres: cobro y recaudación (HU03)
import { Cobro } from './components/cobro/cobro';
import { Recaudacion } from './components/recaudacion/recaudacion';
// Membresías (HU04)
import { Contratar } from './components/contratar/contratar';
import { Planes } from './components/planes/planes';
import { PorVencer } from './components/por-vencer/por-vencer';
import { Vigentes } from './components/vigentes/vigentes';
// Tienda: inventario y ventas (HU05)
import { Historial } from './components/historial/historial';
import { Productos } from './components/productos/productos';
import { Reposicion } from './components/reposicion/reposicion';
import { StockBajo } from './components/stock-bajo/stock-bajo';
import { Venta } from './components/venta/venta';
// Socios: seguimiento físico y rutinas
import { Evaluaciones } from './components/evaluaciones/evaluaciones';
import { Rutinas } from './components/rutinas/rutinas';
// Torneos y configuración
import { Torneos } from './components/torneos/torneos';
import { MetodosPago } from './components/metodos-pago/metodos-pago';
import { Usuarios } from './components/usuarios/usuarios';

/**
 * Rutas del sistema. Cada módulo usa el componente Seccion (título + pestañas).
 * Relación con las historias de usuario:
 *   HU01 -> /clases        HU02 -> /socios y /asistencia      HU03 -> /clases-libres
 *   HU04 -> /membresias    HU05 -> /tienda
 */
export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [loginGuard], title: 'FORJA · Iniciar sesión' },
  {
    path: '',
    component: MenuComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      { path: 'inicio', component: IndexComponent, title: 'FORJA · Inicio' },

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
