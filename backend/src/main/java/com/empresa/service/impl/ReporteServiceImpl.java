package com.empresa.service.impl;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.empresa.dto.*;
import com.empresa.entity.EstadoAsistencia;
import com.empresa.repository.AsistenciaRepository;
import com.empresa.repository.DetalleVentaRepository;
import com.empresa.repository.MembresiaRepository;
import com.empresa.repository.PagoRepository;
import com.empresa.service.ReporteService;

/** Solo consultas: transacción de solo lectura (readOnly = true), como los listados del ejemplo del profesor. */
@Service
@Transactional(readOnly = true)
public class ReporteServiceImpl implements ReporteService {

    @Autowired
    private MembresiaRepository membresiaRepository;

    @Autowired
    private AsistenciaRepository asistenciaRepository;

    @Autowired
    private PagoRepository pagoRepository;

    @Autowired
    private DetalleVentaRepository detalleVentaRepository;

    @Override
    public List<MembresiaPlanDTO> membresiasPorPlan() {
        return membresiaRepository.reportePorPlan();
    }

    @Override
    public List<AsistenciaEstadoDTO> asistenciaPorEstado(Integer idHorario, LocalDate fecha) {
        return asistenciaRepository.reportePorEstado(idHorario, fecha);
    }

    @Override
    public List<IngresoMetodoPagoDTO> ingresosPorMetodoPago(LocalDate desde, LocalDate hasta) {
        return pagoRepository.reportePorMetodoPago(desde.atStartOfDay(), hasta.plusDays(1).atStartOfDay());
    }

    @Override
    public List<ClaseConcurrenciaDTO> clasesMasConcurridas() {
        return asistenciaRepository.reporteClasesConcurridas(EstadoAsistencia.ASISTIO);
    }

    @Override
    public List<ProductoVendidoDTO> productosMasVendidos() {
        return detalleVentaRepository.reporteProductosVendidos();
    }
}
