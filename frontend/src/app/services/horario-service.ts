import { Injectable } from '@angular/core';
import { Horario } from '../models/horario';
import { CrudService } from './crud-service';

@Injectable({ providedIn: 'root' })
export class HorarioService extends CrudService<Horario> {
  protected readonly recurso = 'horario';
}
