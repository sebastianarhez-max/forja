package com.empresa.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Rol del sistema (tabla rol): Administrador, Control de ingreso, Vendedor...
 * Sus opciones se guardan en la tabla intermedia rol_has_opcion.
 */
@Entity
@Table(name = "rol")
@Getter
@Setter
@NoArgsConstructor
public class Rol {

    /** El rol 1 es el Administrador principal: no se puede modificar ni desactivar. */
    public static final int ADMINISTRADOR = 1;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idRol;

    private String nombre;
    private Boolean estado = true;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "rol_has_opcion",
            joinColumns = @JoinColumn(name = "id_rol"),
            inverseJoinColumns = @JoinColumn(name = "id_opcion"))
    @OrderBy("tipo ASC, orden ASC")
    private Set<Opcion> opciones = new LinkedHashSet<>();
}
