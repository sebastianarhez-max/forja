import { Injectable } from '@angular/core';
import { InscripcionTorneo } from '../models/torneo';
import { CrudService } from './crud-service';

@Injectable({ providedIn: 'root' })
export class InscripcionTorneoService extends CrudService<InscripcionTorneo> {
  protected readonly recurso = 'inscripciontorneo';
}
