export type Status = 'RECOLECTADO_LISTO' | 'PENDIENTE_EMPAQUE' | 'EN_CAMINO';
export type Mode = 'ONLINE' | 'OFFLINE';
export type Result = 'AUTORIZADO' | 'BLOQUEADO' | 'ALERTA';

export interface Order {
  code: string;
  courier: string;
  items: number;
  status: Status;
  tokenValid: boolean;
  dispatchedAt: string | null;
  sync: 'synced' | 'pending' | null;
}
export interface AuditEntry {
  id: string;
  ts: string;
  code: string;
  courier: string;
  mode: Mode;
  result: Result;
  reason: string;
  ms: number;
}
export interface GateView {
  kind: 'idle' | 'ok' | 'fail';
  seq: number;
  code: string;
  courier: string;
  items: number;
  reason: string;
  ms: number;
  at: string;
  mode: Mode;
}
export interface ToastItem {
  id: number;
  kind: 'ok' | 'info' | 'warn';
  text: string;
}
