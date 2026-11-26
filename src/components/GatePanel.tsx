import type { GateView } from '../types';
import { FAIL_LIMIT } from '../constants';
import { fmtTime } from '../lib/utils';
import { Barrier } from './Barrier';

export function GatePanel({ gate, lockLeft }: { gate: GateView; lockLeft: number }) {
  const locked = lockLeft > 0;
  const kind = locked ? 'locked' : gate.kind;
  return (
    <section
      key={kind + gate.seq}
      className={'gate gate-' + kind}
      role="status"
      aria-live="assertive"
      aria-label="Semáforo de compuerta"
    >
      <Barrier open={kind === 'ok'} />
      <div className="min-w-0 flex-1">
        {kind === 'idle' && (
          <>
            <p className="kg-label gate-sub">Compuerta cerrada</p>
            <h2 className="gate-title">Esperando escaneo</h2>
            <p className="gate-reason">Escanee el código del pedido o escríbalo para validar la salida del repartidor.</p>
          </>
        )}
        {kind === 'ok' && (
          <>
            <p className="kg-label gate-sub">Semáforo verde · {gate.mode === 'ONLINE' ? 'Validado con API Karri' : 'Validado en modo local'}</p>
            <h2 className="gate-title">Compuerta abierta<span className="gate-title-2"> · Salida autorizada</span></h2>
            <dl className="gate-facts">
              <div><dt>Pedido</dt><dd className="font-mono">{gate.code}</dd></div>
              <div><dt>Repartidor</dt><dd>{gate.courier}</dd></div>
              <div><dt>Productos</dt><dd className="tabnum">{gate.items}</dd></div>
              <div><dt>Hora de salida</dt><dd className="tabnum">{fmtTime(gate.at)}</dd></div>
              <div><dt>Validación</dt><dd className="tabnum">{gate.ms} ms</dd></div>
            </dl>
          </>
        )}
        {kind === 'fail' && (
          <>
            <p className="kg-label gate-sub">Semáforo rojo · {gate.code}</p>
            <h2 className="gate-title">Paso bloqueado<span className="gate-title-2"> · Incidencia detectada</span></h2>
            <p className="gate-reason"><strong>Motivo:</strong> {gate.reason}</p>
            <p className="gate-meta tabnum">{gate.courier !== '—' ? `Repartidor: ${gate.courier} · ` : ''}Respuesta en {gate.ms} ms</p>
          </>
        )}
        {kind === 'locked' && (
          <>
            <p className="kg-label gate-sub">Seguridad · supervisor notificado</p>
            <h2 className="gate-title">Terminal bloqueada</h2>
            <p className="gate-reason">Se detectaron {FAIL_LIMIT} escaneos fallidos seguidos. Podrá escanear de nuevo en:</p>
            <p className="gate-count tabnum" aria-live="off">{lockLeft}<span> s</span></p>
          </>
        )}
      </div>
    </section>
  );
}
