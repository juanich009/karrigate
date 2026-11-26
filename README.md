# KarriGate · Control Automatizado de Despacho

Aplicación web para validar y liberar la salida de paquetes recolectados por repartidores en un almacén o punto de venta.
Funciona 100% en el navegador (sin backend): la API de Karri está simulada con datos de prueba y el estado se guarda en `localStorage` (modo offline-first).

## Stack
React 18 · TypeScript · Tailwind CSS · Vite

## Ejecutar en local
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # genera la carpeta dist/
npm run typecheck  # revisión de tipos
```
Requiere Node.js 18 o superior.

## Estructura
```
src/
  App.tsx                    Vista principal (terminal, KPIs, tablas)
  hooks/useGateValidator.ts  Lógica de validación, anti-fuerza bruta, cola offline y sincronización
  hooks/usePersisted.ts      Estado persistente en localStorage
  hooks/useGateSound.ts      Sonidos con Web Audio API
  lib/utils.ts               validateOrder (regla de negocio), datos iniciales y formato
  components/                GatePanel (semáforo), Kpi, Icon, Barrier
```

## Reglas de negocio
- **Verde (salida autorizada):** el pedido existe, está `RECOLECTADO_LISTO` y su token es válido. Pasa a `EN_CAMINO` y registra la hora.
- **Rojo (bloqueado):** código inexistente, pedido ya `EN_CAMINO` (duplicado), `PENDIENTE_EMPAQUE` o token expirado.
- **Anti-fuerza bruta:** 3 fallos consecutivos en menos de 60 s bloquean la terminal 15 s y generan alerta al supervisor.
- **Offline:** con el interruptor en Offline, las validaciones siguen locales y los despachos quedan en cola; al volver a Online se sincronizan solos.

## Publicar sin servidor (GitHub Pages)
Es una app estática: no necesita servidor propio.
1. Sube el proyecto a un repositorio de GitHub (rama `main`).
2. En **Settings > Pages**, elige **Source: GitHub Actions**.
3. El flujo `.github/workflows/deploy.yml` compila y publica la app. La URL aparece en esa misma sección.

## Datos de demostración
`KARRI-1001`/`1002` salen en verde; `1003` pendiente de empaque; `1004` ya despachado; `1005` token expirado.
Botón "Reiniciar datos de fábrica" para repetir la demo.
