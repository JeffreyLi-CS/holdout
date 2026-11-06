import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-fg',
  secondary: 'bg-surface-2 text-fg',
  danger: 'bg-danger/12 text-danger',
  ghost: 'bg-transparent text-fg hover:bg-surface-2',
}

export function Button({
  variant = 'secondary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 select-none items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-medium transition duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${variants[variant]} ${className}`}
      {...props}
    />
  )
}

/** A large tappable choice showing a label and a calorie figure. */
export function ChoiceButton({
  label,
  detail,
  sub,
  tone = 'neutral',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  detail: string
  sub?: string
  tone?: 'good' | 'bad' | 'neutral'
}) {
  const toneClass = { good: 'text-accent', bad: 'text-danger', neutral: 'text-muted' }[tone]
  return (
    <button
      type="button"
      className={`flex min-h-16 flex-col items-center justify-center rounded-xl bg-surface-2 px-2 py-2 transition duration-150 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
      {...props}
    >
      <span className="text-[15px] font-medium">{label}</span>
      <span className={`text-[13px] tabular-nums ${toneClass}`}>{detail}</span>
      {sub && <span className="whitespace-nowrap text-[11px] text-muted tabular-nums">{sub}</span>}
    </button>
  )
}

export function Card({
  title,
  subtitle,
  icon,
  children,
  className = '',
}: {
  title?: string
  subtitle?: ReactNode
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-2xl bg-surface p-4 shadow-[0_1px_0_var(--line)] ${className}`}>
      {title && (
        <header className="mb-3">
          <h2 className="flex items-center gap-2 text-[17px] font-semibold">
            {icon}
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string; icon?: ReactNode }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg text-[14px] font-medium transition duration-150 ${
            value === o.value ? 'bg-surface text-fg shadow-sm' : 'text-muted'
          }`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-16 text-muted">
      <span className="size-5 animate-spin rounded-full border-2 border-line border-t-accent" />
      <span className="text-[15px]">{label}…</span>
    </div>
  )
}

export function ErrorPanel({ error }: { error: Error }) {
  return (
    <Card title="Something went wrong">
      <p className="text-[15px] text-muted">Your data could not be loaded from this device's storage.</p>
      <pre className="mt-3 overflow-auto rounded-lg bg-surface-2 p-3 text-[12px] text-danger">{error.message}</pre>
      <Button className="mt-3" onClick={() => location.reload()}>
        Reload
      </Button>
    </Card>
  )
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="mb-4 text-[28px] font-bold tracking-tight md:text-[32px]">{children}</h1>
}
