import { useCallback, useEffect, useRef, useState } from 'react';
import type { AuditEntry, GateView, Mode, Order, Status, ToastItem } from '../types';
import { COURIERS, FAIL_LIMIT, FAIL_WINDOW_MS, IDLE, LOCK_SECONDS } from '../constants';
import { delay, seedOrders, validateOrder } from '../lib/utils';
import { usePersisted } from './usePersisted';
import { useGateSound } from './useGateSound';

/** Hook reutilizable con toda la lógica de validación, anti-fuerza bruta y sincronización. */
export function useGateValidator() {
  const [orders, setOrders, ordersRef] = usePersisted<Order[]>('karrigate.orders.v1', seedOrders);
  const [audit, setAudit, auditRef] = usePersisted<AuditEntry[]>('karrigate.audit.v1', () => []);
  const [queue, setQueue, queueRef] = usePersisted<string[]>('karrigate.queue.v1', () => []);
  const [online, setOnlineState, onlineRef] = usePersisted<boolean>('karrigate.online.v1', () => true);
  const [soundOn, setSoundOn, soundRef] = usePersisted<boolean>('karrigate.sound.v1', () => true);

  const [gate, setGate] = useState<GateView>(IDLE);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const failures = useRef<number[]>([]);
  const lockRef = useRef<number | null>(null);
  const busy = useRef(false);
  const syncingRef = useRef(false);
  const seqRef = useRef(0);
  const toastId = useRef(0);
  const sound = useGateSound(soundRef);

  const pushToast = useCallback((kind: ToastItem['kind'], text: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4800);
  }, []);

  const addAudit = useCallback(
    (e: Omit<AuditEntry, 'id'>) => {
      const entry: AuditEntry = { ...e, id: e.ts + Math.random().toString(36).slice(2, 7) };
      setAudit([entry, ...auditRef.current].slice(0, 200));
    },
    [setAudit, auditRef]
  );

  /* Cuenta regresiva del bloqueo */
  useEffect(() => {
    if (lockUntil === null) return;
    const iv = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= lockUntil) {
        lockRef.current = null;
        setLockUntil(null);
        setGate(IDLE);
        sound.unlock();
        pushToast('info', 'Terminal desbloqueada. Ya puede escanear de nuevo.');
      }
    }, 200);
    return () => clearInterval(iv);
  }, [lockUntil]);

  /* La compuerta vuelve a reposo después de un rato */
  useEffect(() => {
    if (gate.kind === 'idle') return;
    const seq = gate.seq;
    const to = setTimeout(() => setGate((g) => (g.seq === seq ? IDLE : g)), 12000);
    return () => clearTimeout(to);
  }, [gate.seq]);

  /* Escaneo y validación */
  const scan = useCallback(async (raw: string): Promise<void> => {
    const code = raw.trim().toUpperCase();
    if (!code || busy.current || lockRef.current) return;
    busy.current = true;
    const t0 = performance.now();
    const mode: Mode = onlineRef.current ? 'ONLINE' : 'OFFLINE';
    if (mode === 'ONLINE') await delay(80 + Math.random() * 120); // latencia simulada de la API Karri
    const res = validateOrder(ordersRef.current, code);
    const ms = Math.round(performance.now() - t0);
    const at = new Date().toISOString();
    const seq = ++seqRef.current;
    const courier = res.order ? res.order.courier : '—';
    const items = res.order ? res.order.items : 0;

    if (res.ok && res.order) {
      const dispatched: Order = { ...res.order, status: 'EN_CAMINO', dispatchedAt: at, sync: mode === 'ONLINE' ? 'synced' : 'pending' };
      setOrders(ordersRef.current.map((o) => (o.code === code ? dispatched : o)));
      if (mode === 'OFFLINE') setQueue([...queueRef.current, code]);
      failures.current = [];
      addAudit({ ts: at, code, courier, mode, result: 'AUTORIZADO', reason: mode === 'OFFLINE' ? 'Salida autorizada (en cola de sincronización)' : 'Salida autorizada', ms });
      setGate({ kind: 'ok', seq, code, courier, items, reason: res.reason, ms, at, mode });
      sound.success();
    } else {
      addAudit({ ts: at, code, courier, mode, result: 'BLOQUEADO', reason: res.reason, ms });
      setGate({ kind: 'fail', seq, code, courier, items, reason: res.reason, ms, at, mode });
      sound.error();
      const t = Date.now();
      failures.current = [...failures.current.filter((x) => t - x < FAIL_WINDOW_MS), t];
      if (failures.current.length >= FAIL_LIMIT) {
        failures.current = [];
        const until = t + LOCK_SECONDS * 1000;
        lockRef.current = until;
        setNow(t);
        setLockUntil(until);
        setAlertMsg(`${FAIL_LIMIT} escaneos fallidos consecutivos en menos de 60 segundos. Terminal bloqueada ${LOCK_SECONDS} segundos.`);
        addAudit({ ts: new Date().toISOString(), code: '—', courier: '—', mode, result: 'ALERTA', reason: 'Alerta al supervisor: posible fuerza bruta. Terminal bloqueada.', ms: 0 });
        setTimeout(() => sound.alarm(), 350);
      }
    }
    busy.current = false;
  }, []);

  /* Sincronización con la API Karri */
  const syncNow = useCallback(async () => {
    if (syncingRef.current || !onlineRef.current || queueRef.current.length === 0) return;
    syncingRef.current = true;
    setSyncing(true);
    await delay(1200);
    if (!onlineRef.current) {
      syncingRef.current = false;
      setSyncing(false);
      return;
    }
    const n = queueRef.current.length;
    setOrders(ordersRef.current.map((o) => (o.sync === 'pending' ? { ...o, sync: 'synced' as const } : o)));
    setQueue([]);
    syncingRef.current = false;
    setSyncing(false);
    pushToast('ok', `${n} ${n === 1 ? 'despacho sincronizado' : 'despachos sincronizados'} con la API de Karri.`);
  }, []);

  useEffect(() => {
    if (online && queue.length > 0) syncNow();
  }, [online, queue.length]);

  const setOnline = useCallback((v: boolean) => {
    setOnlineState(v);
    pushToast(v ? 'ok' : 'warn', v ? 'Conexión restablecida. API de Karri conectada.' : 'Sin conexión. Las validaciones continúan en modo local.');
  }, []);

  const createOrder = useCallback(() => {
    const nums = ordersRef.current.map((o) => parseInt(o.code.split('-')[1], 10)).filter((n) => !isNaN(n));
    const next = Math.max(1005, ...nums) + 1;
    const o: Order = {
      code: `KARRI-${next}`,
      courier: COURIERS[Math.floor(Math.random() * COURIERS.length)],
      items: 1 + Math.floor(Math.random() * 6),
      status: 'RECOLECTADO_LISTO',
      tokenValid: true,
      dispatchedAt: null,
      sync: null,
    };
    setOrders([o, ...ordersRef.current]);
    pushToast('info', `Pedido ${o.code} creado y listo para escanear.`);
  }, []);

  const resetAll = useCallback(() => {
    setOrders(seedOrders());
    setAudit([]);
    setQueue([]);
    setOnlineState(true);
    failures.current = [];
    lockRef.current = null;
    setLockUntil(null);
    setGate(IDLE);
    setAlertMsg(null);
    setSyncing(false);
    syncingRef.current = false;
    pushToast('info', 'Datos de fábrica restablecidos.');
  }, []);

  const lockLeft = lockUntil === null ? 0 : Math.max(0, Math.ceil((lockUntil - now) / 1000));

  return {
    orders, audit, queue, online, setOnline, soundOn, setSoundOn,
    gate, lockLeft, alertMsg, dismissAlert: () => setAlertMsg(null),
    syncing, syncNow, toasts, scan, createOrder, resetAll,
  };
}
