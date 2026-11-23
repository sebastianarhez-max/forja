import { Injectable } from '@angular/core';
import { Entrenador } from '../models/entrenador';
import { CrudService } from './crud-service';

@Injectable({ providedIn: 'root' })
export class EntrenadorService extends CrudService<Entrenador> {
  protected readonly recurso = 'entrenador';
}
