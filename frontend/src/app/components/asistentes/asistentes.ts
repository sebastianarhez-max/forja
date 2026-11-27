import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { Cliente } from '../../models/cliente';
import { Asistente, Cupos } from '../../models/consultas';
import { Horario } from '../../models/horario';
import { TipoPago } from '../../models/tipo-pago';
import { ClienteService } from '../../services/cliente-service';
import { ConsultaService } from '../../services/consulta-service';
import { HorarioService } from '../../services/horario-service';
import { RegistroService } from '../../services/registro-service';
import { TipoPagoService } from '../../services/tipo-pago-service';
import { TokenService } from '../../security/token.service';
import { EstadoAsistenciaPipe, HoraPipe, SolesPipe } from '../../shared/pipes';
import {
  COLOR_PRIMARIO,
  alertaAviso,
  alertaError,
  alertaExito,
  confirmar,
  fechaSugerida,
  ordenarClases,
  textoClase,
} from '../../shared/util';

/** HU02 · Asistentes de una clase: registrar ingreso (con o sin reserva) y marcar faltas. */
@Component({
  selector: 'app-asistentes',
  imports: [FormsModule, HoraPipe, SolesPipe, EstadoAsistenciaPipe],
  templateUrl: './asistentes.html',
})
export class Asistentes implements OnInit {
  private readonly horarioService = inject(HorarioService);
  private readonly clienteService = inject(ClienteService);
  private readonly tipoPagoService = inject(TipoPagoService);
  private readonly consultaService = inject(ConsultaService);
  private readonly registroService = inject(RegistroService);
  private readonly tokenService = inject(TokenService);

  readonly idHorarioParam = input<string | undefined>(undefined, { alias: 'idHorario' });
  readonly fechaParam = input<string | undefined>(undefined, { alias: 'fecha' });

  readonly texto = textoClase;
  readonly clases = signal<Horario[]>([]);
  readonly clientes = signal<Cliente[]>([]);
  readonly tiposPago = signal<TipoPago[]>([]);
  readonly idHorario = signal<number | null>(null);
  readonly fecha = signal('');
  readonly asistentes = signal<Asistente[]>([]);
  readonly cupos = signal<Cupos | null>(null);
  readonly idClienteSinReserva = signal<number | null>(null);
  readonly cargado = signal(false);

  readonly clase = computed(() => this.clases().find((h) => h.idHorario === this.idHorario()) ?? null);
  readonly resumen = computed(() => {
    const a = this.asistentes();
    return {
      reservados: a.filter((x) => x.estado === 'RESERVADO').length,
      asistieron: a.filter((x) => x.estado === 'ASISTIO').length,
      faltaron: a.filter((x) => x.estado === 'FALTO').length,
    };
  });
  /** Clientes que todavía no tienen registro en esta clase y fecha. */
  readonly clientesDisponibles = computed(() => {
    const ya = new Set(this.asistentes().map((a) => a.idCliente));
    return this.clientes().filter((c) => !ya.has(c.idCliente!));
  });

  ngOnInit(): void {
    forkJoin({
      clases: this.horarioService.lista(),
      clientes: this.clienteService.lista(),
      tipos: this.tipoPagoService.lista(),
    }).subscribe({
      next: ({ clases, clientes, tipos }) => {
        this.clases.set(ordenarClases(clases.filter((h) => h.estado)));
        this.clientes.set(clientes.filter((c) => c.estado).sort((a, b) => a.nombres.localeCompare(b.nombres)));
        this.tiposPago.set(tipos.filter((t) => t.estado));
        const id = Number(this.idHorarioParam());
        if (id && this.clases().some((h) => h.idHorario === id)) {
          this.elegirClase(id, this.fechaParam());
        }
      },
      error: (e) => alertaError(e, 'No se pudo cargar los datos'),
    });
  }

  elegirClase(id: number | null, fecha?: string): void {
    this.idHorario.set(id);
    const h = this.clase();
    if (h) {
      this.fecha.set(fecha || fechaSugerida(h));
      this.consultar();
    }
  }

  cambiarFecha(f: string): void {
    this.fecha.set(f);
    if (this.clase() && f) this.consultar();
  }

  consultar(): void {
    const id = this.idHorario();
    if (!id || !this.fecha()) {
      alertaAviso('Selecciona una clase y una fecha');
      return;
    }
    forkJoin({
      lista: this.consultaService.asistencia(id, this.fecha()),
      cupos: this.consultaService.cupos(id, this.fecha()),
    }).subscribe({
      next: ({ lista, cupos }) => {
        this.asistentes.set(lista);
        this.cupos.set(cupos[0] ?? null);
        this.cargado.set(true);
      },
      error: (e) => alertaError(e),
    });
  }

  /** En clases LIBRE se pide el método de pago antes de registrar el ingreso. */
  private async pedirTipoPago(): Promise<number | null | undefined> {
    const h = this.clase();
    if (!h || h.tipoAcceso !== 'LIBRE') return null;
    const opciones: Record<string, string> = {};
    this.tiposPago().forEach((t) => (opciones[String(t.idTipoPago)] = t.nombre));
    const r = await Swal.fire({
      title: 'Cobro de clase libre',
      text: `Entrada: S/ ${Number(h.precioEntrada).toFixed(2)}. ¿Con qué método pagó?`,
      input: 'select',
      inputOptions: opciones,
      inputPlaceholder: 'Método de pago',
      showCancelButton: true,
      confirmButtonText: 'Registrar ingreso',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: COLOR_PRIMARIO,
      inputValidator: (v) => (v ? null : 'Selecciona el método de pago'),
    });
    return r.isConfirmed ? Number(r.value) : undefined; // undefined = canceló
  }

  async registrarIngreso(idCliente: number): Promise<void> {
    const idTipoPago = await this.pedirTipoPago();
    if (idTipoPago === undefined) return;
    this.registroService
      .registrarIngreso({
        idHorario: this.idHorario()!,
        idCliente,
        idUsuario: this.tokenService.getUserId(),
        fecha: this.fecha(),
        idTipoPago,
      })
      .subscribe({
        next: (a) => {
          alertaExito(`Ingreso registrado: ${a.cliente.nombres} ${a.cliente.apellidos}`);
          this.idClienteSinReserva.set(null);
          this.consultar();
        },
        error: (e) => alertaError(e, 'No se pudo registrar el ingreso'),
      });
  }

  async marcarFalta(a: Asistente): Promise<void> {
    if (!(await confirmar('Marcar falta', `${a.nombres} ${a.apellidos} no asistió. Se liberará su cupo.`, 'Marcar falta'))) return;
    this.registroService.marcarFalta(a.idAsistencia).subscribe({
      next: () => {
        alertaExito('Falta registrada y cupo liberado');
        this.consultar();
      },
      error: (e) => alertaError(e),
    });
  }
}
