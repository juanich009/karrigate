import type { GateView, Status } from './types';

export const STATUS_LABEL: Record<Status, string> = {
  RECOLECTADO_LISTO: 'Recolectado · listo',
  PENDIENTE_EMPAQUE: 'Pendiente de empaque',
  EN_CAMINO: 'En camino',
};
export const STATUS_CLASS: Record<Status, string> = {
  RECOLECTADO_LISTO: 'pill-ok',
  PENDIENTE_EMPAQUE: 'pill-warn',
  EN_CAMINO: 'pill-info',
};
export const COURIERS = ['Marta Villaseñor', 'Diego Herrera', 'Paola Núñez', 'Iván Castillo', 'Renata Salas', 'Héctor Vega'];
export const LOCK_SECONDS = 15;
export const FAIL_WINDOW_MS = 60000;
export const FAIL_LIMIT = 3;
export const IDLE: GateView = { kind: 'idle', seq: 0, code: '', courier: '', items: 0, reason: '', ms: 0, at: '', mode: 'ONLINE' };

export const QUICK_TESTS: { code: string; tag: string }[] = [
  { code: 'KARRI-1001', tag: 'Autorizado' },
  { code: 'KARRI-1002', tag: 'Autorizado' },
  { code: 'KARRI-1003', tag: 'Sin empacar' },
  { code: 'KARRI-1004', tag: 'Duplicado' },
  { code: 'KARRI-1005', tag: 'Token vencido' },
  { code: 'KARRI-9999', tag: 'No existe' },
];
