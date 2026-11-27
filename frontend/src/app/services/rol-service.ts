import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppSettings } from '../app.settings';
import { Opcion } from '../models/opcion';
import { Rol } from '../models/rol';
import { CrudService } from './crud-service';

/** Roles (tabla rol) y sus opciones del menú (tabla rol_has_opcion). */
@Injectable({ providedIn: 'root' })
export class RolService extends CrudService<Rol> {
  protected readonly recurso = 'rol';

  /** Todas las opciones del menú, para elegir cuáles tendrá cada rol. */
  opciones(): Observable<Opcion[]> {
    return this.http.get<Opcion[]>(AppSettings.API_ENDPOINT + '/opcion');
  }
}
