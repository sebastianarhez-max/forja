import { Injectable } from '@angular/core';
import { Actividad } from '../models/actividad';
import { CrudService } from './crud-service';

@Injectable({ providedIn: 'root' })
export class ActividadService extends CrudService<Actividad> {
  protected readonly recurso = 'actividad';
}
