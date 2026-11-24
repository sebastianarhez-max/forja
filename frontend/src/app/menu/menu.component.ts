import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { TokenService } from '../security/token.service';
import { confirmar } from '../shared/util';

interface ItemMenu {
  ruta: string;
  texto: string;
}

interface GrupoMenu {
  titulo: string;
  items: ItemMenu[];
}

@Component({
  selector: 'app-menu',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css',
})
export class MenuComponent {
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  readonly nombre = this.tokenService.getNombreCompleto();
  readonly menuAbierto = signal(false);

  /** Menú agrupado como trabaja el administrador: lo del día, la gestión y la configuración. */
  readonly menu: GrupoMenu[] = [
    {
      titulo: 'Día a día',
      items: [
        { ruta: '/inicio', texto: 'Inicio' },
        { ruta: '/asistencia', texto: 'Reservas y asistencia' },
        { ruta: '/clases-libres', texto: 'Clases libres' },
        { ruta: '/tienda', texto: 'Tienda' },
      ],
    },
    {
      titulo: 'Gestión',
      items: [
        { ruta: '/socios', texto: 'Socios' },
        { ruta: '/membresias', texto: 'Membresías' },
        { ruta: '/clases', texto: 'Clases y horarios' },
        { ruta: '/salas', texto: 'Salas' },
        { ruta: '/torneos', texto: 'Torneos' },
        { ruta: '/reportes', texto: 'Reportes' },
      ],
    },
    {
      titulo: 'Configuración',
      items: [{ ruta: '/configuracion', texto: 'Usuarios y pagos' }],
    },
  ];

  constructor() {
    // En celulares el menú se cierra al cambiar de pantalla
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.menuAbierto.set(false));
  }

  async cerrarSesion(): Promise<void> {
    if (await confirmar('Cerrar sesión', '¿Deseas salir del sistema?', 'Sí, salir')) {
      this.tokenService.logOut();
      this.router.navigate(['/login']);
    }
  }
}
