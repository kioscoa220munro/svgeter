# Protocolo de investigación — Nazer π Lab

## 1. Pregunta

Medir si los bloques de longitud (L) presentes en un prefijo de una secuencia están cerrados bajo la operación de reversión.

La pregunta experimental es finita:

> Dado (N) y (L), ¿para cada bloque (S) presente en (D[0:N]) también aparece (S^R) en ese mismo prefijo?

No se presupone una respuesta especial para π.

## 2. Definiciones

- (B_{N,L}): conjunto de bloques distintos de longitud (L) presentes en el prefijo.
- (S^R): bloque (S) leído al revés.
- **Palíndromo**: (S=S^R).
- **Unilateral**: (S\in B_{N,L}) y (S^R\notin B_{N,L}).
- **Cerrado bajo reversión**: no existen unilaterales.
- (L^*): menor (L) probado con al menos un unilateral.
- **Par cerrado**: un par no palindrómico para el que aparecen ambas orientaciones.
- **Cobertura de pares**: pares cerrados / pares representados al menos en una orientación.

## 3. Convenciones

1. La unidad de análisis es un bloque de dígitos, no un número entero. Por eso los ceros iniciales se conservan.
2. El prefijo debe tener exactamente (N) dígitos útiles.
3. Las comparaciones deben usar el mismo (N), base, limpieza, rango de (L) y criterio de inclusión.
4. Los palíndromos se reportan por separado.
5. El bloque unilateral mostrado como ejemplo se elige lexicográficamente para que la salida sea reproducible.
6. La posición de aparición es 0-indexada.

## 4. Validez de los datos

Registrar:

- nombre del archivo;
- procedencia;
- fecha de obtención;
- número de bytes;
- número de dígitos disponibles;
- SHA-256 del archivo original cuando se ejecute el runner;
- SHA-256 de la secuencia limpia;
- criterio exacto de limpieza.

El formato actual del proyecto conserva ASCII `0`–`9`. Si un archivo contiene texto adicional, ese texto no debe confundirse con una fuente de dígitos: para publicaciones formales se recomienda proporcionar además el archivo fuente de solo dígitos.

## 5. Análisis observado

Para cada constante y cada (N):

1. Validar que existen al menos (N) dígitos.
2. Analizar (L=1,dots,L_{max}).
3. Construir las ventanas deslizantes.
4. Codificar cada bloque exactamente, manteniendo ceros iniciales.
5. Comprobar cada bloque contra su reverso.
6. Registrar ventanas, distintos, palíndromos, unilaterales, pares cerrados, cobertura, bloque ejemplo y posición.
7. En modo exploratorio, detenerse en el primer (L) unilateral; en modo exhaustivo, continuar hasta (L_{max}).

## 6. Modelos nulos

Los modelos nulos proporcionan comparadores, no demostraciones.

### IID uniforme

Cada dígito es independiente y tiene probabilidad 0,1.

### IID marginal

Cada dígito es independiente pero usa la distribución marginal observada en la fuente.

### Markov-1

La distribución del siguiente dígito depende del anterior y se estima de la fuente. Si una transición no está disponible, se retrocede a la marginal.

### Markov-2

La distribución depende de los dos dígitos anteriores y se estima de la fuente. Si el contexto no está disponible, se retrocede a Markov-1 y después a la marginal.

Para Monte Carlo:

- fijar una semilla;
- registrar el número de réplicas;
- usar la misma (N) y el mismo rango de (L);
- conservar la distribución completa o, como mínimo, cuantiles, media, desviación estándar y p-valor empírico.

El p-valor empírico unilateral usado por el proyecto es:

[
p_{\ge} = \frac{1 + \#\{X_i \ge X_{obs}\}}{R+1}.
]

No tratar un p-valor exploratorio como prueba de una ley matemática.

## 7. Robustez

Repetir con:

- (N) crecientes;
- distintos (L_{max});
- π, e, √2 y φ;
- semillas independientes;
- varios modelos nulos;
- implementaciones independientes cuando sea posible.

Una señal que desaparece al cambiar (N), el modelo o la implementación no debe presentarse como fenómeno establecido.

## 8. Separación de niveles de evidencia

**Nivel 1 — observación computacional:** el bloque y su reverso se comportan de cierta forma en un prefijo concreto.

**Nivel 2 — evidencia estadística:** la observación se compara con modelos nulos y replicaciones.

**Nivel 3 — afirmación matemática:** existe un argumento demostrativo válido sobre la estructura de la secuencia.

El proyecto no debe saltar del Nivel 1 o 2 al Nivel 3 sin prueba.

## 9. Revisión independiente

Antes de formular una conjetura pública:

- repetir con una segunda implementación;
- intercambiar archivos de datos entre investigadores;
- comprobar hashes;
- comprobar resultados sobre casos sintéticos con respuesta conocida;
- publicar código, parámetros y semillas;
- intentar activamente encontrar contraejemplos.

## 10. Resultado y lenguaje permitido

Es válido escribir:

> “En el prefijo de longitud (N), para (L=L_0), encontramos (k) bloques unilaterales.”

No es válido inferir de esa sola observación:

> “El reverso no aparece jamás en la expansión infinita.”

La ausencia en un prefijo es ausencia **solo dentro del dominio observado**.

## 11. Registro mínimo

Cada ejecución formal debe conservar:

- commit o versión del código;
- constante;
- base;
- (N);
- rango de (L);
- archivo y hashes;
- modelo nulo;
- semilla;
- número de réplicas;
- resultados completos;
- timestamp UTC;
- entorno de ejecución;
- errores o datos insuficientes.

