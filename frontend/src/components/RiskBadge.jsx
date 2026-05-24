const MAP = {
  Low:    'badge-low',
  Medium: 'badge-medium',
  High:   'badge-high',
}
export default function RiskBadge({ risk }) {
  return <span className={MAP[risk] || 'badge-low'}>● {risk} Risk</span>
}
