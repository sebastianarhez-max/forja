package com.empresa;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ForjaApplication {

    public static void main(String[] args) {
        // El gimnasio opera en Lima: sin esto, en Render (UTC) "hoy" cambia a las 7 p. m.
        TimeZone.setDefault(TimeZone.getTimeZone("America/Lima"));
        SpringApplication.run(ForjaApplication.class, args);
    }
}
