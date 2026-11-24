import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Cliente } from '../../models/cliente';
import { Membresia, Pago } from '../../models/membresia';
import { Plan } from '../../models/plan';
import { TipoPago } from '../../models/tipo-pago';
import { ClienteService } from '../../services/cliente-service';
import { MembresiaService } from '../../services/membresia-service';
import { PlanService } from '../../services/plan-service';
import { RegistroService } from '../../services/registro-service';
import { TipoPagoService } from '../../services/tipo-pago-service';
import { FechaPipe, SolesPipe } from '../../shared/pipes';
import { alertaAviso, alertaError, alertaExito, hoyIso, sumarDias } from '../../shared/util';

/** HU04 · Contratar la membresía de un cliente y registrar su pago en una sola operación. */
@Component({
  selector: 'app-contratar',
  imports: [FormsModule, FechaPipe, SolesPipe],
  templateUrl: './contratar.html',
})
export class Contratar implements OnInit {
  private readonly clienteService = inject(ClienteService);
  private readonly planService = inject(PlanService);
  private readonly tipoPagoService = inject(TipoPagoService);
  private readonly membresiaService = inject(MembresiaService);
  private readonly registroService = inject(RegistroService);

  readonly clientes = signal<Cliente[]>([]);
  readonly planes = signal<Plan[]>([]);
  readonly tiposPago = signal<TipoPago[]>([]);
  readonly membresias = signal<Membresia[]>([]);
  readonly idCliente = signal<number | null>(null);
  readonly idPlan = signal<number | null>(null);
  readonly idTipoPago = signal<number | null>(null);
  readonly fechaInicio = signal(hoyIso());
  readonly guardando = signal(false);
  readonly resultado = signal<{ membresia: Membresia; pago: Pago } | null>(null);

  readonly plan = computed(() => this.planes().find((p) => p.idPlan === this.idPlan()) ?? null);
  /** fechaFin = fechaInicio + duracionDias (la misma regla que aplica el backend). */
  readonly fechaFin = computed(() => {
    const p = this.plan();
    return p ? sumarDias(this.fechaInicio() || hoyIso(), p.duracionDias) : null;
  });
  /** Membresía activa que el cliente ya tiene y que se cruzaría con la nueva. */
  readonly membresiaActual = computed(() => {
    const id = this.idCliente();
    const ini = this.fechaInicio() || hoyIso();
    return this.membresias().find((m) => m.estado && m.cliente.idCliente === id && m.fechaFin >= ini) ?? null;
  });

  ngOnInit(): void {
    forkJoin({
      clientes: this.clienteService.lista(),
      planes: this.planService.lista(),
      tipos: this.tipoPagoService.lista(),
      membresias: this.membresiaService.lista(),
    }).subscribe({
      next: ({ clientes, planes, tipos, membresias }) => {
        this.clientes.set(clientes.filter((c) => c.estado).sort((a, b) => a.nombres.localeCompare(b.nombres)));
        this.planes.set(planes.filter((p) => p.estado).sort((a, b) => a.duracionDias - b.duracionDias));
        this.tiposPago.set(tipos.filter((t) => t.estado));
        this.membresias.set(membresias);
      },
      error: (e) => alertaError(e, 'No se pudo cargar los datos'),
    });
  }

  contratar(): void {
    if (!this.idCliente() || !this.idPlan() || !this.idTipoPago()) {
      alertaAviso('Selecciona el socio, el plan y el método de pago');
      return;
    }
    this.guardando.set(true);
    this.registroService
      .registrarMembresia({
        idCliente: this.idCliente()!,
        idPlan: this.idPlan()!,
        idTipoPago: this.idTipoPago()!,
        fechaInicio: this.fechaInicio() || null,
      })
      .subscribe({
        next: (r) => {
          this.guardando.set(false);
          this.resultado.set(r);
          alertaExito('Membresía contratada y pago registrado');
          this.membresiaService.lista().subscribe((m) => this.membresias.set(m));
          this.idCliente.set(null);
        },
        error: (e) => {
          this.guardando.set(false);
          alertaError(e, 'No se pudo registrar la membresía');
        },
      });
  }
}
