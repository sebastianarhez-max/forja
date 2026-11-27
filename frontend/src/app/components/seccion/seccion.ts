import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

export interface Pestana {
  ruta: string;
  texto: string;
}

/**
 * Encabezado de cada módulo (grupo, título, descripción y pestañas).
 * Los datos vienen de la propiedad "data" de la ruta en app.routes.ts.
 */
@Component({
  selector: 'app-seccion',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="page-code">{{ data['grupo'] }}</div>
    <h1 class="page-title">{{ data['titulo'] }}</h1>
    @if (data['subtitulo']) {
      <p class="page-sub">{{ data['subtitulo'] }}</p>
    }
    <nav class="tabs">
      @for (p of pestanas; track p.ruta) {
        <a [routerLink]="p.ruta" routerLinkActive="activo">{{ p.texto }}</a>
      }
    </nav>
    <router-outlet />
  `,
})
export class Seccion {
  readonly data = inject(ActivatedRoute).snapshot.data;
  readonly pestanas = (this.data['pestanas'] ?? []) as Pestana[];
}
