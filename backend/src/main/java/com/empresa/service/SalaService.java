package com.empresa.service;

import java.util.List;
import java.util.Optional;

import com.empresa.entity.Sala;

public interface SalaService {

    List<Sala> listaTodos();

    Optional<Sala> buscaPorId(Integer id);

    Sala inserta(Sala obj);

    Sala actualiza(Sala obj);

    void elimina(Integer id);
}
