package com.empresa.service.impl;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.empresa.entity.Rol;
import com.empresa.entity.Usuario;
import com.empresa.repository.RolRepository;
import com.empresa.repository.UsuarioRepository;
import com.empresa.security.UsuarioPrincipal;
import com.empresa.service.UsuarioService;

@Service
public class UsuarioServiceImpl implements UsuarioService {

    @Autowired
    private UsuarioRepository repository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static ResponseStatusException err(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }

    private String encripta(String password) {
        if (password.matches("^\\$2[aby]?\\$\\d{2}\\$[./A-Za-z0-9]{53}$")) {
            return password; // ya viene encriptada con BCrypt
        }
        return passwordEncoder.encode(password);
    }

    /** Id del usuario que está logueado (token JWT), o null si no hay sesión. */
    private Integer idUsuarioActual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UsuarioPrincipal p) {
            return p.getIdUsuario();
        }
        return null;
    }

    /**
     * Roles del usuario (tabla usuario_has_rol): al menos uno, existentes y activos.
     * El JSON solo trae los ids ([{"idRol": 2}]); aquí se cargan desde la base de datos.
     */
    private Set<Rol> validarRoles(Set<Rol> enviados) {
        if (enviados == null || enviados.isEmpty()) {
            throw err("Asigna al menos un rol al usuario");
        }
        Set<Rol> roles = new LinkedHashSet<>();
        for (Rol r : enviados) {
            if (r == null || r.getIdRol() == null) {
                throw err("Cada rol debe indicar su idRol");
            }
            Rol rol = rolRepository.findById(r.getIdRol())
                    .orElseThrow(() -> err("El rol " + r.getIdRol() + " no existe"));
            if (!Boolean.TRUE.equals(rol.getEstado())) {
                throw err("El rol " + rol.getNombre() + " está inactivo");
            }
            roles.add(rol);
        }
        return roles;
    }

    private static Set<Integer> ids(Set<Rol> roles) {
        return roles.stream().map(Rol::getIdRol).collect(Collectors.toSet());
    }

    @Override
    public List<Usuario> listaTodos() {
        return repository.findAll();
    }

    @Override
    public Optional<Usuario> buscaPorId(Integer id) {
        return repository.findById(id);
    }

    @Override
    @Transactional
    public Usuario inserta(Usuario obj) {
        if (obj.getPassword() == null || obj.getPassword().isBlank()) {
            throw err("El password es obligatorio");
        }
        obj.setIdUsuario(null);
        obj.setRoles(validarRoles(obj.getRoles()));
        obj.setPassword(encripta(obj.getPassword()));
        return repository.save(obj);
    }

    @Override
    @Transactional
    public Usuario actualiza(Usuario obj) {
        Usuario actual = repository.findById(obj.getIdUsuario())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Registro no encontrado"));
        obj.setFechaRegistro(actual.getFechaRegistro());

        // Si no envía roles se conservan los actuales
        if (obj.getRoles() == null || obj.getRoles().isEmpty()) {
            obj.setRoles(new LinkedHashSet<>(actual.getRoles()));
        } else {
            obj.setRoles(validarRoles(obj.getRoles()));
        }

        // Nadie puede quitarse permisos ni desactivarse a sí mismo (se quedaría sin acceso)
        if (obj.getIdUsuario().equals(idUsuarioActual())) {
            if (!ids(obj.getRoles()).equals(ids(actual.getRoles()))) {
                throw err("No puedes cambiar tus propios roles: pídeselo a otro administrador");
            }
            if (!Boolean.TRUE.equals(obj.getEstado())) {
                throw err("No puedes desactivar tu propia cuenta");
            }
        }

        if (obj.getPassword() == null || obj.getPassword().isBlank()) {
            obj.setPassword(actual.getPassword()); // si no envía password, se conserva el actual
        } else {
            obj.setPassword(encripta(obj.getPassword()));
        }
        return repository.save(obj);
    }

    @Override
    @Transactional
    public void elimina(Integer id) {
        if (id.equals(idUsuarioActual())) {
            throw err("No puedes desactivar tu propia cuenta");
        }
        repository.findById(id).ifPresent(e -> {
            e.setEstado(false);
            repository.save(e);
        });
    }
}
