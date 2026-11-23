package com.empresa.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.empresa.entity.Producto;
import com.empresa.service.ProductoService;
import com.empresa.util.AppSettings;

@RestController
@RequestMapping({ "/url/producto", "/url/productos" })
@CrossOrigin(origins = AppSettings.URL_CROSS_ORIGIN)
public class ProductoController {

    @Autowired
    private ProductoService service;

    @GetMapping
    public ResponseEntity<List<Producto>> listaTodos() {
        return ResponseEntity.ok(service.listaTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscaPorId(@PathVariable Integer id) {
        Optional<Producto> opt = service.buscaPorId(id);
        if (opt.isPresent()) {
            return ResponseEntity.ok(opt.get());
        }
        HashMap<String, Object> salida = new HashMap<>();
        salida.put("error", "Registro no encontrado");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(salida);
    }

    @PostMapping
    public ResponseEntity<?> registro(@RequestBody Producto obj) {
        HashMap<String, Object> salida = new HashMap<>();
        Producto objSalida = service.inserta(obj);
        salida.put("data", objSalida);
        salida.put("mensaje", "Registro exitoso");
        return ResponseEntity.status(HttpStatus.CREATED).body(salida);
    }

    @PutMapping({ "", "/{id}" })
    public ResponseEntity<?> actualiza(@PathVariable(required = false) Integer id, @RequestBody Producto obj) {
        HashMap<String, Object> salida = new HashMap<>();
        if (id != null) {
            obj.setIdProducto(id); // PUT /url/xxx/{id}: el id de la ruta manda
        }
        if (obj.getIdProducto() == null || service.buscaPorId(obj.getIdProducto()).isEmpty()) {
            salida.put("error", "El registro no existe: envía el campo idProducto en el JSON");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(salida);
        }
        Producto objSalida = service.actualiza(obj);
        salida.put("data", objSalida);
        salida.put("mensaje", "Actualización exitosa");
        return ResponseEntity.ok(salida);
    }

    @DeleteMapping("/{id}")
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
}
