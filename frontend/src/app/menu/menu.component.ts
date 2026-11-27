import { Component, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { TokenService } from '../security/token.service';
import { confirmar } from '../shared/util';
import { GRUPOS_MENU, Opcion } from '../models/opcion';

interface GrupoMenu {
  titulo: string;
  opciones: Opcion[];
}

/**
 * Barra de menú superior (como el menú del proyecto guía).
 * Es dinámica: las opciones vienen de la base de datos (rol_has_opcion) dentro del token,
 * se agrupan por su tipo en desplegables y solo aparecen los grupos que tienen opciones.
 */
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
  readonly roles = this.tokenService.getRoles().join(', ');
  readonly inicio = this.tokenService.primeraRuta();

  /** En celulares el menú se muestra al tocar el botón de tres líneas. */
  readonly menuAbierto = signal(false);
  /** Título del desplegable abierto (solo uno a la vez). */
  readonly grupoAbierto = signal<string | null>(null);
  /** URL actual, para resaltar el grupo de la pantalla en la que está el usuario. */
  readonly url = signal(this.router.url);

  readonly menu: GrupoMenu[] = GRUPOS_MENU.map((g) => ({
    titulo: g.titulo,
    opciones: this.tokenService.getOpciones().filter((o) => o.tipo === g.tipo),
  })).filter((g) => g.opciones.length > 0);

  constructor() {
    // Al cambiar de pantalla se cierran el desplegable y el menú del celular
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      this.url.set((e as NavigationEnd).urlAfterRedirects);
      this.cerrarMenus();
    });
  }

  alternarGrupo(titulo: string): void {
    this.grupoAbierto.set(this.grupoAbierto() === titulo ? null : titulo);
  }

  /** El grupo se resalta si la pantalla actual es una de sus opciones. */
  grupoActivo(g: GrupoMenu): boolean {
    const url = this.url();
    return g.opciones.some((o) => url === '/' + o.ruta || url.startsWith('/' + o.ruta + '/') || url.startsWith('/' + o.ruta + '?'));
  }

  cerrarMenus(): void {
    this.grupoAbierto.set(null);
    this.menuAbierto.set(false);
  }

  @HostListener('document:keydown.escape')
  alPresionarEscape(): void {
    this.cerrarMenus();
  }

  async cerrarSesion(): Promise<void> {
    this.cerrarMenus();
    if (await confirmar('Cerrar sesión', '¿Deseas salir del sistema?', 'Sí, salir')) {
      this.tokenService.logOut();
      this.router.navigate(['/login']);
    }
  }
}
