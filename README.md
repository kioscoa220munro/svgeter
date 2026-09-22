# Nazer π Lab

Laboratorio reproducible para estudiar bloques de dígitos y sus reversos en **prefijos finitos** de secuencias numéricas. El repositorio fue reconvertido desde el concepto original de Éter.

> **Alcance:** una observación en un prefijo finito no demuestra por sí sola qué ocurre en la expansión infinita de una constante. El proyecto separa explícitamente observación computacional, evidencia estadística y demostración matemática.

## Componentes

- `index.html`: aplicación web con Web Worker, CSV y JSON.
- `research_worker.js`: análisis sin bloquear la interfaz.
- `research_engine.py`: motor exacto con codificación entera de ventanas.
- `research_runner.py`: CLI para análisis observado y Monte Carlo.
- `null_models.py`: IID uniforme, IID marginal, Markov-1 y Markov-2.
- `prepare_constants.py`: prepara archivos reproducibles de π, e, √2 y φ mediante `mpmath`.
- `tests/`: pruebas unitarias y comparación contra una implementación de referencia.
- `RESEARCH_PROTOCOL.md`: protocolo científico.
- `REPORT_TEMPLATE.md`: plantilla de informe.
- `.github/workflows/test.yml`: pruebas automáticas.
- `.github/workflows/smoke-research.yml`: experimento de humo reproducible.

## Preparar datos piloto

Instalar dependencias:

```bash
python -m pip install -r requirements.txt
```

Crear 100.000 dígitos por constante:

```bash
python prepare_constants.py --n 100000 --output-dir data
```

Esto crea:

```text
data/pi_digits.txt
data/e_digits.txt
data/sqrt2_digits.txt
data/phi_digits.txt
data/manifest.json
```

El manifiesto registra el tamaño solicitado, versión de `mpmath` y SHA-256 de cada secuencia limpia. Para estudios de escala extrema, conservar además una fuente independiente de alta precisión y comparar hashes.

## Ejecutar análisis

```bash
python research_runner.py \
  --data-dir data \
  --n 1000 10000 100000 \
  --l-max 15 \
  --all-lengths \
  --null-reps 1000 \
  --null-model iid-uniform \
  --seed 220 \
  --output research_results.csv
```

Modelos disponibles: `iid-uniform`, `iid-marginal`, `markov1` y `markov2`.

## Interpretación

Unilateral significa que el bloque aparece y su reverso no aparece **dentro del mismo prefijo analizado**. No demuestra que el reverso no aparezca más adelante en la expansión infinita. Los p-valores son empíricos, dependen de la semilla y del número de réplicas, y no constituyen una demostración matemática.

## Pruebas

```bash
python -m unittest discover -s tests -v
```

El workflow `smoke-research.yml` prepara 1.000 dígitos por constante y ejecuta una comparación pequeña con modelos nulos para detectar fallos de integración.
