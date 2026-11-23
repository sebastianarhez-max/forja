package com.empresa.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "horario")
@Getter
@Setter
@NoArgsConstructor
public class Horario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idHorario;

    @ManyToOne(optional = false)
    @JoinColumn(name = "idActividad", nullable = false)
    private Actividad actividad;
    @ManyToOne(optional = false)
    @JoinColumn(name = "idEntrenador", nullable = false)
    private Entrenador entrenador;

    /** Sala donde se dicta la clase (opcional para no romper horarios antiguos). */
    @ManyToOne
    @JoinColumn(name = "idSala")
    private Sala sala;

    private String dia;
    private LocalDate fecha;
    private LocalTime horaInicio;
    private LocalTime horaFin;
    /** Si no se envía: HorarioServiceImpl usa la capacidad de la sala; sin sala queda en 20 (ver valoresPorDefecto). */
    private Integer cupoMaximo;
    @Enumerated(EnumType.STRING)
    private TipoAcceso tipoAcceso = TipoAcceso.MEMBRESIA;
    private BigDecimal precioEntrada = BigDecimal.ZERO;
    private Boolean estado = true;

    /** Cupo por defecto cuando la clase no tiene sala ni cupo indicado. */
    @PrePersist
    @PreUpdate
    void valoresPorDefecto() {
        if (cupoMaximo == null) {
            cupoMaximo = 20;
        }
    }
}
