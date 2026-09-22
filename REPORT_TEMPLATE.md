# Plantilla de informe — Nazer π Lab

## 1. Identificación

- Fecha UTC:
- Commit:
- Entorno:
- Investigador/a:
- Versión del protocolo:

## 2. Datos

| Constante | Archivo | Dígitos disponibles | SHA-256 limpio | Procedencia |
|---|---|---:|---|---|
| π | | | | |
| e | | | | |
| √2 | | | | |
| φ | | | | |

## 3. Parámetros

- Base:
- Prefijos (N):
- (L_{max}):
- Modo:
- Criterio de limpieza:

## 4. Resultado observado

Reportar por constante y (N):

- (L^*), si existe dentro del rango;
- cantidad de bloques distintos;
- palíndromos;
- unilaterales;
- pares cerrados;
- pares representados;
- cobertura de pares;
- bloque unilateral de ejemplo y reverso;
- posición 0-indexada.

## 5. Modelos nulos

Para cada modelo:

- modelo;
- semilla;
- réplicas;
- media;
- desviación estándar;
- cuantiles;
- p-valor empírico;
- observación comparada.

## 6. Controles

- ¿El motor optimizado coincide con la implementación de referencia?
- ¿Los hashes coinciden con los archivos entregados?
- ¿Se mantuvieron iguales (N), (L), base y limpieza entre comparadores?
- ¿Se conservaron resultados que contradicen la hipótesis?
- ¿Se repitió con otra semilla?
- ¿Se repitió con otra implementación?

## 7. Interpretación

### Observación

Describir únicamente lo que ocurrió en los prefijos analizados.

### Evidencia estadística

Describir qué tan compatible es la métrica observada con cada modelo nulo.

### Alcance matemático

Indicar explícitamente qué afirmaciones **no** se pueden deducir de los datos finitos.

## 8. Reproducción

Incluir los comandos exactos utilizados, por ejemplo:

```bash
python research_runner.py \
  --data-dir data \
  --n 10000 100000 1000000 \
  --l-max 16 \
  --all-lengths \
  --null-reps 1000 \
  --null-model iid-uniform \
  --seed 220
```

Adjuntar CSV, JSON de metadatos y archivos de datos o sus hashes.
