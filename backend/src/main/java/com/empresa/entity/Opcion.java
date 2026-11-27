package com.empresa.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Opción del menú lateral (tabla opcion).
 * La ruta es la misma ruta de Angular (app.routes.ts) y el tipo es el grupo del menú:
 * 1 = Día a día, 2 = Gestión, 3 = Configuración.
 */
@Entity
@Table(name = "opcion")
@Getter
@Setter
@NoArgsConstructor
public class Opcion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idOpcion;

    private String nombre;
    private String ruta;
    private Short tipo;
    private Short orden;
    private Boolean estado = true;
}
