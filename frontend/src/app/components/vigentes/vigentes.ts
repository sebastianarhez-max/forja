import { Component, OnInit, inject, signal } from '@angular/core';
import { MembresiaVigente } from '../../models/consultas';
import { ConsultaService } from '../../services/consulta-service';
import { FechaPipe } from '../../shared/pipes';
import { alertaError } from '../../shared/util';

/** HU04 · Membresías vigentes hoy, con sus días restantes. */
@Component({
  selector: 'app-vigentes',
  imports: [FechaPipe],
  template: `
    <section class="card">
      <h2 class="card-title">Membresías vigentes hoy</h2>
      <p class="card-sub">{{ lista().length }} socios con acceso activo</p>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Socio</th><th>Plan</th><th>Inicio</th><th>Fin</th><th>Días restantes</th></tr></thead>
          <tbody>
            @for (m of lista(); track m.idMembresia) {
              <tr>
                <td class="strong">{{ m.nombres }} {{ m.apellidos }}</td>
                <td>{{ m.plan }}</td>
                <td>{{ m.fechaInicio | fecha }}</td>
                <td>{{ m.fechaFin | fecha }}</td>
                <td>
                  <span class="badge" [class.badge-ok]="m.diasRestantes > 7" [class.badge-warn]="m.diasRestantes <= 7 && m.diasRestantes > 2" [class.badge-bad]="m.diasRestantes <= 2">{{ m.diasRestantes }} días</span>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="vacio">No hay membresías vigentes</td></tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class Vigentes implements OnInit {
  private readonly consultaService = inject(ConsultaService);
  readonly lista = signal<MembresiaVigente[]>([]);

  ngOnInit(): void {
    this.consultaService.membresiasVigentes().subscribe({
      next: (d) => this.lista.set(d.map((m) => ({ ...m, diasRestantes: Number(m.diasRestantes) }))),
      error: (e) => alertaError(e),
    });
  }
}
