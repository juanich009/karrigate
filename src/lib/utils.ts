import type { Order } from '../types';

export const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('es-MX', { hour12: false });
export const fmtStamp = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' }) + ' ' + fmtTime(iso);
};
export const sameDay = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

export function seedOrders(): Order[] {
  const earlier = new Date(Date.now() - 5 * 60000).toISOString();
  return [
    { code: 'KARRI-1001', courier: 'Carlos Mendoza', items: 3, status: 'RECOLECTADO_LISTO', tokenValid: true, dispatchedAt: null, sync: null },
    { code: 'KARRI-1002', courier: 'Ana López', items: 1, status: 'RECOLECTADO_LISTO', tokenValid: true, dispatchedAt: null, sync: null },
    { code: 'KARRI-1003', courier: 'Luis Ramírez', items: 5, status: 'PENDIENTE_EMPAQUE', tokenValid: true, dispatchedAt: null, sync: null },
    { code: 'KARRI-1004', courier: 'Sofía Torres', items: 2, status: 'EN_CAMINO', tokenValid: true, dispatchedAt: earlier, sync: 'synced' },
    { code: 'KARRI-1005', courier: 'Jorge Ruiz', items: 4, status: 'RECOLECTADO_LISTO', tokenValid: false, dispatchedAt: null, sync: null },
  ];
}

/** Regla de negocio pura: decide si un código puede salir por la compuerta. */
export function validateOrder(orders: Order[], code: string): { ok: boolean; reason: string; order: Order | null } {
  const order = orders.find((o) => o.code === code) || null;
  if (!order) return { ok: false, reason: `El código ${code} no existe en el sistema.`, order: null };
  if (order.status === 'EN_CAMINO') {
    const hora = order.dispatchedAt ? ` a las ${fmtTime(order.dispatchedAt)}` : '';
    return { ok: false, reason: `Pedido ya despachado${hora}. Intento de salida duplicado.`, order };
  }
  if (order.status === 'PENDIENTE_EMPAQUE') {
    return { ok: false, reason: 'El pedido sigue pendiente de empaque. Aún no está listo para salir.', order };
  }
  if (!order.tokenValid) {
    return { ok: false, reason: 'El token de salida expiró. Solicite una nueva autorización en Karri.', order };
  }
  return { ok: true, reason: 'Pedido validado. Salida registrada.', order };
}
