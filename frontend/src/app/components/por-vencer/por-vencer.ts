import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MembresiaVigente } from '../../models/consultas';
import { ConsultaService } from '../../services/consulta-service';
import { FechaPipe } from '../../shared/pipes';
import { alertaAviso, alertaError } from '../../shared/util';

/** HU04 · Membresías que vencen en los próximos N días (por defecto 7), con teléfono para contactar. */
@Component({
  selector: 'app-por-vencer',
  imports: [FormsModule, FechaPipe],
  template: `
    <section class="card">
      <h2 class="card-title">Próximas a vencer</h2>
      <p class="card-sub">Contacta al socio por teléfono antes del vencimiento.</p>
      <div class="form-actions" style="margin-bottom: 14px">
        <div class="field" style="width: 180px">
          <label for="dias">Ventana en días</label>
          <input id="dias" type="number" min="1" max="365" [ngModel]="dias()" (ngModelChange)="dias.set($event)" />
        </div>
        <button class="btn btn-outline" type="button" style="align-self: flex-end" (click)="consultar()">Consultar</button>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Socio</th><th>Teléfono</th><th>Plan</th><th>Fecha de fin</th><th>Días restantes</th></tr></thead>
          <tbody>
            @for (m of lista(); track m.idMembresia) {
              <tr>
                <td class="strong">{{ m.nombres }} {{ m.apellidos }}</td>
                <td>
                  @if (m.telefono) {
                    <a [href]="'tel:' + m.telefono">{{ m.telefono }}</a>
                  } @else { — }
                </td>
                <td>{{ m.plan }}</td>
                <td>{{ m.fechaFin | fecha }}</td>
                <td><span class="badge" [class.badge-warn]="m.diasRestantes > 2" [class.badge-bad]="m.diasRestantes <= 2">{{ m.diasRestantes }} días</span></td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="vacio">Ninguna membresía vence en los próximos {{ diasConsultados() }} días</td></tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class PorVencer implements OnInit {
  private readonly consultaService = inject(ConsultaService);
  readonly dias = signal(7);
  readonly diasConsultados = signal(7);
  readonly lista = signal<MembresiaVigente[]>([]);

  ngOnInit(): void {
    this.consultar();
  }

  consultar(): void {
    const d = Number(this.dias());
    if (!d || d < 1) {
      alertaAviso('Ingresa una cantidad de días mayor a 0');
      return;
    }
    this.consultaService.membresiasPorVencer(d).subscribe({
      next: (r) => {
        this.lista.set(r.map((m) => ({ ...m, diasRestantes: Number(m.diasRestantes) })));
        this.diasConsultados.set(d);
      },
      error: (e) => alertaError(e),
    });
  }
}
