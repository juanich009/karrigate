import { Icon } from './Icon';

export function Kpi({ icon, label, value, sub, tone }: { icon: string; label: string; value: string; sub: string; tone?: string }) {
  return (
    <div className="kg-card kpi">
      <div className="flex items-center justify-between gap-2">
        <span className="kg-label">{label}</span>
        <Icon name={icon} size={18} className={'kpi-icon ' + (tone || '')} />
      </div>
      <div className="kpi-value tabnum">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}
