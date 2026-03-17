
export interface SwitchProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function Switch({ label, checked, onChange }: SwitchProps) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="slider"></span>
      <span className="label">{label}</span>
    </label>
  )
}