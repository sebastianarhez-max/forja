import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Asistencia } from '../../models/asistencia';
import { Cliente } from '../../models/cliente';
import { Cupos } from '../../models/consultas';
import { Horario } from '../../models/horario';
import { TipoPago } from '../../models/tipo-pago';
import { ClienteService } from '../../services/cliente-service';
import { ConsultaService } from '../../services/consulta-service';
import { HorarioService } from '../../services/horario-service';
import { RegistroService } from '../../services/registro-service';
import { TipoPagoService } from '../../services/tipo-pago-service';
import { TokenService } from '../../security/token.service';
import { DiaPipe, HoraPipe, SolesPipe } from '../../shared/pipes';
import { alertaAviso, alertaError, alertaExito, fechaSugerida, ordenarClases, textoClase } from '../../shared/util';

/** HU03 · Registrar el ingreso y cobro de una clase LIBRE. */
@Component({
  selector: 'app-cobro',
  imports: [FormsModule, RouterLink, DiaPipe, HoraPipe, SolesPipe],
  templateUrl: './cobro.html',
})
export class Cobro implements OnInit {
  private readonly horarioService = inject(HorarioService);
  private readonly clienteService = inject(ClienteService);
  private readonly tipoPagoService = inject(TipoPagoService);
  private readonly consultaService = inject(ConsultaService);
  private readonly registroService = inject(RegistroService);
  private readonly tokenService = inject(TokenService);

  readonly texto = textoClase;
  readonly clasesLibres = signal<Horario[]>([]);
  readonly clientes = signal<Cliente[]>([]);
  readonly tiposPago = signal<TipoPago[]>([]);
  readonly idHorario = signal<number | null>(null);
  readonly idCliente = signal<number | null>(null);
  readonly fecha = signal('');
  readonly idTipoPago = signal<number | null>(null);
  readonly cupos = signal<Cupos | null>(null);
  readonly registrando = signal(false);
  readonly ultimo = signal<Asistencia | null>(null);

  readonly clase = computed(() => this.clasesLibres().find((h) => h.idHorario === this.idHorario()) ?? null);

  ngOnInit(): void {
    forkJoin({
      clases: this.horarioService.lista(),
      clientes: this.clienteService.lista(),
      tipos: this.tipoPagoService.lista(),
    }).subscribe({
      next: ({ clases, clientes, tipos }) => {
        this.clasesLibres.set(ordenarClases(clases.filter((h) => h.estado && h.tipoAcceso === 'LIBRE')));
        this.clientes.set(clientes.filter((c) => c.estado).sort((a, b) => a.nombres.localeCompare(b.nombres)));
        this.tiposPago.set(tipos.filter((t) => t.estado));
        const primera = this.clasesLibres()[0];
        if (primera) this.elegirClase(primera.idHorario!);
      },
      error: (e) => alertaError(e, 'No se pudo cargar los datos'),
    });
  }

  elegirClase(id: number | null): void {
    this.idHorario.set(id);
    const h = this.clase();
    if (h) {
      this.fecha.set(fechaSugerida(h));
      this.actualizarCupos();
    }
  }

  cambiarFecha(f: string): void {
    this.fecha.set(f);
    this.actualizarCupos();
  }

  actualizarCupos(): void {
    const id = this.idHorario();
    if (!id || !this.fecha()) return;
    this.consultaService.cupos(id, this.fecha()).subscribe({
      next: (c) => this.cupos.set(c[0] ?? null),
      error: () => this.cupos.set(null),
    });
  }

  registrar(): void {
    if (!this.idHorario() || !this.idCliente() || !this.fecha()) {
      alertaAviso('Selecciona la clase, el socio y la fecha');
      return;
    }
    if (!this.idTipoPago()) {
      alertaAviso('El método de pago es obligatorio en las clases libres');
      return;
    }
    this.registrando.set(true);
    this.registroService
      .registrarIngreso({
        idHorario: this.idHorario()!,
        idCliente: this.idCliente()!,
        idUsuario: this.tokenService.getUserId(),
        fecha: this.fecha(),
        idTipoPago: this.idTipoPago(),
      })
      .subscribe({
        next: (a) => {
          this.registrando.set(false);
          this.ultimo.set(a);
          alertaExito(`Cobro registrado: S/ ${Number(a.montoPagado).toFixed(2)}`);
          this.idCliente.set(null);
          this.actualizarCupos();
        },
        error: (e) => {
          this.registrando.set(false);
          alertaError(e, 'No se pudo registrar el ingreso');
        },
      });
  }
}
