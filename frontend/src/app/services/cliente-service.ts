import { Injectable } from '@angular/core';
import { Cliente } from '../models/cliente';
import { CrudService } from './crud-service';

@Injectable({ providedIn: 'root' })
export class ClienteService extends CrudService<Cliente> {
  protected readonly recurso = 'cliente';
}
