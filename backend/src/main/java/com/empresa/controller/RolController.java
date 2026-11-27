package com.empresa.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.empresa.entity.Opcion;
import com.empresa.entity.Rol;
import com.empresa.service.RolService;
import com.empresa.util.AppSettings;

/**
 * Roles y sus opciones del menú (tablas rol y rol_has_opcion).
 * Ejemplo de alta: {"nombre": "Entrenador", "opciones": [{"idOpcion": 1}, {"idOpcion": 7}]}
 */
@RestController
@CrossOrigin(origins = AppSettings.URL_CROSS_ORIGIN)
public class RolController {

    @Autowired
    private RolService service;

    @GetMapping("/url/rol")
    public ResponseEntity<List<Rol>> listaTodos() {
        return ResponseEntity.ok(service.listaTodos());
    }

    @GetMapping("/url/rol/{id}")
    public ResponseEntity<?> buscaPorId(@PathVariable Integer id) {
        Optional<Rol> opt = service.buscaPorId(id);
        if (opt.isPresent()) {
            return ResponseEntity.ok(opt.get());
        }
        HashMap<String, Object> salida = new HashMap<>();
        salida.put("error", "Registro no encontrado");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(salida);
    }

    @PostMapping("/url/rol")
    public ResponseEntity<?> registro(@RequestBody Rol obj) {
        HashMap<String, Object> salida = new HashMap<>();
        Rol objSalida = service.inserta(obj);
        salida.put("data", objSalida);
        salida.put("mensaje", "Registro exitoso");
        return ResponseEntity.status(HttpStatus.CREATED).body(salida);
    }

    @PutMapping({ "/url/rol", "/url/rol/{id}" })
    public ResponseEntity<?> actualiza(@PathVariable(required = false) Integer id, @RequestBody Rol obj) {
        HashMap<String, Object> salida = new HashMap<>();
        if (id != null) {
            obj.setIdRol(id); // PUT /url/rol/{id}: el id de la ruta manda
        }
        if (obj.getIdRol() == null || service.buscaPorId(obj.getIdRol()).isEmpty()) {
            salida.put("error", "El registro no existe: envía el campo idRol en el JSON");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(salida);
        }
        Rol objSalida = service.actualiza(obj);
        salida.put("data", objSalida);
        salida.put("mensaje", "Actualización exitosa");
        return ResponseEntity.ok(salida);
    }

    @DeleteMapping("/url/rol/{id}")
    public ResponseEntity<?> elimina(@PathVariable Integer id) {
        HashMap<String, Object> salida = new HashMap<>();
        if (service.buscaPorId(id).isEmpty()) {
            salida.put("error", "Registro no encontrado");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(salida);
        }
        service.elimina(id);
        salida.put("mensaje", "Eliminación exitosa");
        return ResponseEntity.ok(salida);
    }

    /** Opciones del menú disponibles para asignar a un rol. */
    @GetMapping("/url/opcion")
    public ResponseEntity<List<Opcion>> listaOpciones() {
        return ResponseEntity.ok(service.listaOpciones());
    }
}
