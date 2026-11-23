package com.empresa.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Ambiente físico del gimnasio donde se dicta una clase (Sala 1, Sala 2, Sala de spinning...). */
@Entity
@Table(name = "sala")
@Getter
@Setter
@NoArgsConstructor
public class Sala {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idSala;

    private String nombre;

    /** Aforo máximo de la sala: el cupo de una clase no puede superarlo. */
    private Integer capacidad;

    private String descripcion;

    private Boolean estado = true;
}
