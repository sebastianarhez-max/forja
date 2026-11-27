package com.empresa.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@Table(name = "usuario")
@Getter
@Setter
@NoArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idUsuario;

    private String nombres;
    private String apellidos;
    private String dni;
    private String login;
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;
    private String correo;
    private String telefono;
    private LocalDateTime fechaRegistro = LocalDateTime.now();
    private Boolean estado = true;

    /**
     * Roles del usuario (tabla intermedia usuario_has_rol).
     * En el JSON se envían como [{"idRol": 2}] y se devuelven con su nombre, sin la lista de opciones.
     */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "usuario_has_rol",
            joinColumns = @JoinColumn(name = "id_usuario"),
            inverseJoinColumns = @JoinColumn(name = "id_rol"))
    @JsonIgnoreProperties("opciones")
    @OrderBy("idRol ASC")
    private Set<Rol> roles = new LinkedHashSet<>();
}
