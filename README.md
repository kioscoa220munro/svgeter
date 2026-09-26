# Imagen 4D

Aplicación para reconstruir un lugar a partir de video y representarlo como un mundo espacial navegable con una dimensión temporal.

## Flujo
Video/cámara → muestreo → estructura espacial estimada → nube 3D → navegación → línea temporal.

El visor usa Three.js y permite orbitar, hacer zoom y desplazar la cámara. El motor actual es una reconstrucción ligera de navegador: estima profundidad monocular y fusiona muestras temporales. No pretende sustituir todavía un sistema de reconstrucción 4D de GPU como 4D Gaussian Splatting.

## Archivos principales
- `imagen4d.html`: interfaz.
- `imagen4d.js`: visor 3D y captura.
- `imagen4d_worker.js`: reconstrucción espacial en Web Worker.
- `imagen4d.css`: interfaz.

El objetivo siguiente es reemplazar la estimación ligera por poses de cámara + profundidad/gaussian splatting para conseguir una reconstrucción geométrica más fiel.