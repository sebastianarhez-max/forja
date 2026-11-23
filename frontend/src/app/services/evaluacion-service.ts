import { Injectable } from '@angular/core';
import { EvaluacionFisica } from '../models/seguimiento';
import { CrudService } from './crud-service';

@Injectable({ providedIn: 'root' })
export class EvaluacionService extends CrudService<EvaluacionFisica> {
  protected readonly recurso = 'evaluacion';
}
