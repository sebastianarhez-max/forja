import { Injectable } from '@angular/core';
import { TipoPago } from '../models/tipo-pago';
import { CrudService } from './crud-service';

@Injectable({ providedIn: 'root' })
export class TipoPagoService extends CrudService<TipoPago> {
  protected readonly recurso = 'tipopago';
}
