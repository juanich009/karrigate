import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import type { Status } from './types';
import { QUICK_TESTS, STATUS_CLASS, STATUS_LABEL } from './constants';
import { fmtStamp, fmtTime, sameDay } from './lib/utils';
import { useGateValidator } from './hooks/useGateValidator';
import { Icon } from './components/Icon';
import { GatePanel } from './components/GatePanel';
import { Kpi } from './components/Kpi';

export default function App() {
  const g = useGateValidator();
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<'TODOS' | Status>('TODOS');
  const [confirmReset, setConfirmReset] = useState(false);
  const [clock, setClock] = useState(new Date());
  const inputRef = useRef<HTMLInputElement>(null);
  const locked = g.lockLeft > 0;

  useEffect(() => {
    const iv = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  /* Autofocus permanente del campo de escaneo */
  useEffect(() => {
    if (!locked) inputRef.current?.focus();
  }, [locked, g.gate.seq]);
  useEffect(() => {
    const refocus = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('button, select, input, a, textarea')) return;
      inputRef.current?.focus();
    };
    document.addEventListener('click', refocus);
    return () => document.removeEventListener('click', refocus);
  }, []);

  useEffect(() => {
    if (!confirmReset) return;
    const to = setTimeout(() => setConfirmReset(false), 4000);
    return () => clearTimeout(to);
  }, [confirmReset]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = input;
    setInput('');
    g.scan(v);
  };

  const stats = useMemo(() => {
    const today = g.orders.filter((o) => o.dispatchedAt && sameDay(o.dispatchedAt)).length;
    const timed = g.audit.filter((a) => a.result !== 'ALERTA');
    const avg = timed.length ? timed.reduce((s, a) => s + a.ms, 0) / timed.length : null;
    const blocked = g.audit.filter((a) => a.result === 'BLOQUEADO').length;
    return { today, avg, blocked };
  }, [g.orders, g.audit]);

  const visible = g.orders.filter((o) => filter === 'TODOS' || o.status === filter);

  return (
    <div className="kg-root">
      {/* Barra superior */}
      <header className="kg-header">
        <div className="kg-wrap flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="logo" aria-hidden="true"><Icon name="scan" size={22} /></span>
            <div className="min-w-0">
              <h1 className="brand">KarriGate</h1>
              <p className="brand-sub">Control automatizado de despacho</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="clock tabnum" aria-label="Hora local">{clock.toLocaleTimeString('es-MX', { hour12: false })}</span>
            <button id="btn-sonido" type="button" className="btn btn-icon" onClick={() => g.setSoundOn(!g.soundOn)} aria-pressed={g.soundOn} title={g.soundOn ? 'Silenciar sonidos' : 'Activar sonidos'}>
              <Icon name={g.soundOn ? 'volume' : 'volumeX'} />
              <span className="sr-only">{g.soundOn ? 'Silenciar sonidos' : 'Activar sonidos'}</span>
            </button>
            <button id="switch-red" type="button" role="switch" aria-checked={g.online} onClick={() => g.setOnline(!g.online)} className={'net ' + (g.online ? 'net-on' : 'net-off')}>
              <Icon name={g.online ? 'wifi' : 'wifiOff'} />
              <span className="net-text">{g.online ? 'Online · API Karri conectada' : 'Offline · Modo local de respaldo'}</span>
              <span className="track" aria-hidden="true"><span className="thumb" /></span>
            </button>
            <button id="btn-reiniciar" type="button" className={'btn ' + (confirmReset ? 'btn-danger' : '')} onClick={() => { if (confirmReset) { g.resetAll(); setConfirmReset(false); } else setConfirmReset(true); }}>
              <Icon name="reset" />
              {confirmReset ? 'Confirmar reinicio' : 'Reiniciar datos de fábrica'}
            </button>
          </div>
        </div>
        <div className="hazard" aria-hidden="true" />
      </header>

      <main className="kg-wrap kg-main">
        {g.alertMsg && (
          <div className="alert" role="alert">
            <Icon name="alert" size={22} />
            <p className="min-w-0 flex-1"><strong>ALERTA AL SUPERVISOR.</strong> {g.alertMsg}</p>
            <button type="button" className="btn btn-light" onClick={g.dismissAlert}>Enterado</button>
          </div>
        )}

        {/* KPIs */}
        <section aria-label="Indicadores en tiempo real" className="kpis">
          <Kpi icon="truck" label="Despachados hoy" value={String(stats.today)} sub="Pedidos con salida registrada" />
          <Kpi icon="clock" label="Validación promedio" value={stats.avg === null ? '—' : (stats.avg / 1000).toFixed(2) + ' s'} sub={stats.avg !== null && stats.avg > 400 ? 'Sobre la meta de 0.40 s' : 'Meta: menos de 0.40 s'} tone={stats.avg !== null && stats.avg > 400 ? 'text-bad' : 'text-ok'} />
          <Kpi icon="shieldAlert" label="Intentos bloqueados" value={String(stats.blocked)} sub="Eventos de seguridad" tone={stats.blocked > 0 ? 'text-bad' : ''} />
          <Kpi icon="upload" label="Pendientes en cola" value={String(g.queue.length)} sub={g.queue.length ? 'Por sincronizar con Karri' : 'Todo sincronizado'} tone={g.queue.length ? 'text-warn' : 'text-ok'} />
        </section>

        {/* Terminal de escaneo */}
        <div className="terminal">
          <div className="min-w-0 flex flex-col gap-4">
            <form onSubmit={submit} className="kg-card scanbox">
              <label htmlFor="scan-input" className="kg-label flex items-center gap-2"><Icon name="scan" size={16} /> Terminal de escaneo en puerta</label>
              <div className="scanrow">
                <input
                  id="scan-input"
                  ref={inputRef}
                  autoFocus
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  value={input}
                  disabled={locked}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={locked ? `Terminal bloqueada (${g.lockLeft} s)` : 'Escanee o escriba el código, ej. KARRI-1001'}
                  className="scaninput"
                />
                <button id="btn-validar" type="submit" className="btn btn-primary btn-lg" disabled={locked || !input.trim()}>Validar</button>
              </div>
              <div>
                <p className="kg-label mb-2">Simular escaneo con un clic</p>
                <div className="quick">
                  {QUICK_TESTS.map((q) => (
                    <button key={q.code} type="button" className="btn quick-btn" disabled={locked} onClick={() => g.scan(q.code)}>
                      <span className="font-mono">{q.code}</span>
                      <span className="quick-tag">{q.tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
            <GatePanel gate={g.gate} lockLeft={g.lockLeft} />
          </div>

          <aside className="kg-card queue" aria-label="Cola de sincronización">
            <div className="flex items-center justify-between gap-2">
              <h2 className="kg-h">Pendientes de sincronizar</h2>
              <span className={'pill ' + (g.queue.length ? 'pill-warn' : 'pill-ok')}>{g.queue.length}</span>
            </div>
            <div className={'netstate ' + (g.online ? 'netstate-on' : 'netstate-off')}>
              <Icon name={g.online ? 'wifi' : 'wifiOff'} size={16} />
              {g.syncing ? 'Sincronizando con la API de Karri…' : g.online ? 'Conectado a la API de Karri' : 'Sin conexión: los despachos se guardan aquí'}
            </div>
            {g.queue.length === 0 ? (
              <p className="muted text-sm">No hay despachos en espera. Cambie a modo Offline y escanee un pedido para verlo aquí.</p>
            ) : (
              <ul className="queue-list">
                {g.queue.map((c) => {
                  const o = g.orders.find((x) => x.code === c);
                  return (
                    <li key={c}>
                      <span className="font-mono">{c}</span>
                      <span className="muted text-sm truncate">{o ? o.courier : ''}</span>
                    </li>
                  );
                })}
              </ul>
            )}
            <button id="btn-sync" type="button" className="btn" disabled={!g.online || g.queue.length === 0 || g.syncing} onClick={g.syncNow}>
              <Icon name="refresh" className={g.syncing ? 'spin' : ''} />
              Sincronizar ahora
            </button>
          </aside>
        </div>

        {/* Pedidos y auditoría */}
        <div className="lower">
          <section className="kg-card tablecard" aria-label="Pedidos">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
              <h2 className="kg-h flex items-center gap-2"><Icon name="package" size={18} /> Pedidos</h2>
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="filtro-estado" className="sr-only">Filtrar por estado</label>
                <select id="filtro-estado" className="select" value={filter} onChange={(e) => setFilter(e.target.value as any)}>
                  <option value="TODOS">Todos los estados</option>
                  <option value="RECOLECTADO_LISTO">Recolectado · listo</option>
                  <option value="PENDIENTE_EMPAQUE">Pendiente de empaque</option>
                  <option value="EN_CAMINO">En camino</option>
                </select>
                <button id="btn-nuevo" type="button" className="btn btn-primary" onClick={g.createOrder}>
                  <Icon name="plus" /> Crear nuevo pedido simulado
                </button>
              </div>
            </div>
            <div className="scroll">
              <table>
                <thead>
                  <tr><th>Pedido</th><th>Repartidor</th><th className="num">Prod.</th><th>Estado</th><th>Token</th><th>Salida</th><th>Sync</th></tr>
                </thead>
                <tbody>
                  {visible.length === 0 && (
                    <tr><td colSpan={7} className="muted empty">No hay pedidos con este estado.</td></tr>
                  )}
                  {visible.map((o) => (
                    <tr key={o.code}>
                      <td>
                        <button type="button" className="codebtn font-mono" disabled={locked} onClick={() => g.scan(o.code)} title="Escanear este pedido">{o.code}</button>
                      </td>
                      <td>{o.courier}</td>
                      <td className="num tabnum">{o.items}</td>
                      <td><span className={'pill ' + STATUS_CLASS[o.status]}>{STATUS_LABEL[o.status]}</span></td>
                      <td><span className={'pill ' + (o.tokenValid ? 'pill-ok' : 'pill-bad')}>{o.tokenValid ? 'Válido' : 'Expirado'}</span></td>
                      <td className="tabnum">{o.dispatchedAt ? fmtTime(o.dispatchedAt) : '—'}</td>
                      <td>{o.sync === 'pending' ? <span className="pill pill-warn">Pendiente</span> : o.sync === 'synced' ? <span className="pill pill-ok">Sincronizado</span> : <span className="muted">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="kg-card tablecard" aria-label="Log de auditoría">
            <div className="flex items-center justify-between gap-3 p-4">
              <h2 className="kg-h flex items-center gap-2"><Icon name="history" size={18} /> Log de auditoría</h2>
              <span className="muted text-sm tabnum">{g.audit.length} {g.audit.length === 1 ? 'evento' : 'eventos'}</span>
            </div>
            <div className="scroll scroll-tall">
              <table>
                <thead>
                  <tr><th>Fecha y hora</th><th>Código</th><th>Repartidor</th><th>Modo</th><th>Resultado</th><th>Detalle</th><th className="num">ms</th></tr>
                </thead>
                <tbody>
                  {g.audit.length === 0 && (
                    <tr><td colSpan={7} className="muted empty">Aún no hay escaneos. Cada intento quedará registrado aquí al instante.</td></tr>
                  )}
                  {g.audit.map((a) => (
                    <tr key={a.id}>
                      <td className="tabnum nowrap">{fmtStamp(a.ts)}</td>
                      <td className="font-mono nowrap">{a.code}</td>
                      <td className="nowrap">{a.courier}</td>
                      <td><span className={'pill ' + (a.mode === 'ONLINE' ? 'pill-info' : 'pill-warn')}>{a.mode === 'ONLINE' ? 'Online' : 'Offline'}</span></td>
                      <td><span className={'pill ' + (a.result === 'AUTORIZADO' ? 'pill-ok' : 'pill-bad')}>{a.result === 'AUTORIZADO' ? 'Autorizado' : a.result === 'ALERTA' ? 'Alerta' : 'Bloqueado'}</span></td>
                      <td className="detail">{a.reason}</td>
                      <td className="num tabnum">{a.result === 'ALERTA' ? '—' : a.ms}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      <div className="toasts" aria-live="polite">
        {g.toasts.map((t) => (
          <div key={t.id} className={'toast toast-' + t.kind}>
            <Icon name={t.kind === 'ok' ? 'check' : t.kind === 'warn' ? 'wifiOff' : 'refresh'} size={16} />
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
