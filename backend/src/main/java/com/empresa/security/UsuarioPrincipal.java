package com.empresa.security;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.empresa.entity.Opcion;
import com.empresa.entity.Rol;
import com.empresa.entity.Usuario;

/**
 * Usuario logueado con sus roles y las opciones del menú que puede ver.
 *
 * Authorities que recibe Spring Security:
 *   - el nombre de cada rol (por ejemplo "Administrador");
 *   - "OPC_" + ruta de cada opción (por ejemplo "OPC_tienda").
 * SecurityConfig protege cada endpoint con la opción a la que pertenece, por eso
 * si en la base de datos se le quita una opción a un rol, el acceso cambia sin tocar código.
 */
public class UsuarioPrincipal implements UserDetails {

    private static final long serialVersionUID = 1L;

    /** Prefijo de las authorities que representan una opción del menú. */
    public static final String PREFIJO_OPCION = "OPC_";

    private final Integer idUsuario;
    private final String login;
    private final String password;
    private final String nombreCompleto;
    private final boolean enabled;
    private final List<String> roles;
    private final List<Opcion> opciones;
    private final Collection<? extends GrantedAuthority> authorities;

    public UsuarioPrincipal(Integer idUsuario, String login, String password, String nombreCompleto,
            boolean enabled, List<String> roles, List<Opcion> opciones) {
        this.idUsuario = idUsuario;
        this.login = login;
        this.password = password;
        this.nombreCompleto = nombreCompleto;
        this.enabled = enabled;
        this.roles = roles;
        this.opciones = opciones;

        List<GrantedAuthority> lista = new ArrayList<>();
        for (String rol : roles) {
            lista.add(new SimpleGrantedAuthority(rol));
        }
        for (Opcion o : opciones) {
            lista.add(new SimpleGrantedAuthority(PREFIJO_OPCION + o.getRuta()));
        }
        this.authorities = lista;
    }

    public static UsuarioPrincipal build(Usuario u, List<Rol> roles, List<Opcion> opciones) {
        List<String> nombresRoles = roles.stream().map(Rol::getNombre).toList();
        return new UsuarioPrincipal(u.getIdUsuario(), u.getLogin(), u.getPassword(),
                u.getNombres() + " " + u.getApellidos(), Boolean.TRUE.equals(u.getEstado()), nombresRoles, opciones);
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public String getLogin() {
        return login;
    }

    public String getNombreCompleto() {
        return nombreCompleto;
    }

    /** Nombres de los roles (sin las authorities de opciones). */
    public List<String> getRoles() {
        return roles;
    }

    public List<Opcion> getOpciones() {
        return opciones;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return login;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
