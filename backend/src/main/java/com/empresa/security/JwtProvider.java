package com.empresa.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.crypto.SecretKey;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtProvider {

    private static final Logger logger = LoggerFactory.getLogger(JwtProvider.class);

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration; // segundos

    private SecretKey key() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(Authentication authentication) {
        logger.info(">>> generateToken");
        UsuarioPrincipal p = (UsuarioPrincipal) authentication.getPrincipal();

        Map<String, Object> claims = new HashMap<>();
        claims.put("idUsuario", p.getIdUsuario());
        claims.put("nombreCompleto", p.getNombreCompleto());
        claims.put("login", p.getLogin());
        // Roles y opciones del menú: el frontend arma el menú lateral con estas opciones
        claims.put("roles", p.getRoles());
        claims.put("opciones", opcionesParaToken(p));

        Date now = new Date();
        return Jwts.builder()
                .claims(claims)
                .subject(p.getUsername())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiration * 1000))
                .signWith(key())
                .compact();
    }

    /** Solo los datos que necesita el menú (sin estado), en el orden en que se muestran. */
    private List<Map<String, Object>> opcionesParaToken(UsuarioPrincipal p) {
        return p.getOpciones().stream().map(o -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("idOpcion", o.getIdOpcion());
            m.put("nombre", o.getNombre());
            m.put("ruta", o.getRuta());
            m.put("tipo", o.getTipo());
            return m;
        }).collect(Collectors.toList());
    }

    public String getNombreUsuarioFromToken(String token) {
        return Jwts.parser().verifyWith(key()).build().parseSignedClaims(token).getPayload().getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key()).build().parseSignedClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            logger.error(">>> validateToken >>> token expirado");
        } catch (JwtException e) {
            logger.error(">>> validateToken >>> token inválido: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error(">>> validateToken >>> token vacío");
        }
        return false;
    }
}
