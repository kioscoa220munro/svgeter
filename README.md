# Éter

Juego móvil de salas competitivas basado en Éter.

## Nueva dirección

- Salas de **máximo 20 jugadores**.
- Los jugadores se identifican por cuenta/email; el email no se muestra a otros jugadores.
- Cada jugador puede tener una foto de avatar propia.
- El avatar no cambia de personaje: evoluciona mediante **20 marcos visuales**.
- Nivel 1–100; cada 5 niveles se desbloquea un marco.
- Nivel 100 = **ÉTER ABSOLUTO · INMORTAL**.
- Cada día el jugador recibe **100 Éter disponible**.
- El Éter disponible se puede arriesgar en desafíos; el Éter histórico determina el progreso.
- La ruleta selecciona enfrentamientos dentro de la sala.
- El juego elegido debe ser compatible con el Éter disponible de ambos jugadores.
- Los desafíos cortos arriesgan menos Éter; los largos permiten apuestas mayores.
- El ganador obtiene el Éter apostado y el perdedor lo pierde.
- La sala puede ordenar a sus jugadores por Éter final al terminar la competencia.
- El avatar, su marco y su nivel son visibles para los demás jugadores.
- La proximidad usa ubicación solo para detectar **concentración de Éter cercana**, no para mostrar posiciones exactas.
- Indicador de proximidad: **BAJO / ALTO / EXTREMO**.

## Catálogo inicial

Ta-Te-Ti, Reflejos, Tocar el objetivo, Piedra/Papel/Tijera, Memoria rápida, Quiz Éter, Conecta 4, Damas, Batalla naval, Truco y Éter Caos.

La arquitectura del catálogo permite agregar nuevos minijuegos sin cambiar la economía, las salas, la ruleta o la progresión.

## Mobile-first

La interfaz está diseñada primero para celulares: viewport seguro, botones táctiles, tarjetas compactas, navegación inferior y layouts adaptables.

## Estado actual

El prototipo web ya contiene cuenta local por email, avatar por foto, economía diaria, progresión de niveles/marcos, catálogo, sala de 20, ruleta, desafíos jugables de prueba y detector de concentración.

La sincronización multiusuario real y la autenticación persistente de servidor quedan como la siguiente capa de producción; no se simulan como si fueran datos reales.

Éter es independiente de A220 y no comparte backend, datos ni infraestructura con A220.