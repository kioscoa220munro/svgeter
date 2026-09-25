# Imagen 4D — motor multimodal

Arquitectura de recursos mínimos con capacidad de escalar a reconstrucción 4D pesada.

## Capas

1. Cámara: luminancia, bordes, movimiento y campo espacial.
2. Tiempo: muestreo adaptativo y keyframes/deltas.
3. Radio: Wi‑Fi/BLE/CSI mediante observaciones importadas desde un capturador autorizado.
4. Fusión: campo 4D disperso (x,y,z,t) + intensidad + movimiento + señal.
5. Render: representación ligera en navegador; backend opcional para 4D Gaussian Splatting.

## Escalado

- Modo LIGHT: navegador + Web Worker, sin GPU requerida.
- Modo SENSOR: añade RSSI/CSI/BLE.
- Modo 4D-GS: backend GPU basado en proyectos como 4DGaussians/Vidu4D.
- Modo USplat4D: opción experimental para reconstrucción monocular con incertidumbre.

Referencias open source:
- hustvl/4DGaussians
- yikaiw/Vidu4D
- TAMU-Visual-AI/usplat4d

El motor propio no copia estos repositorios: define una capa de entrada común para poder sustituir el backend según la capacidad disponible.
