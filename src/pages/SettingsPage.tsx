import { Download, Monitor, Moon, Sun, Trash2, Upload } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Button, Card, ErrorPanel, PageTitle, Segmented, Spinner } from '../components/ui'
import { useToast } from '../components/Toast'
import { parseBackup } from '../data/backup'
import { store } from '../data/store'
import { SIZES, type Settings, type Size } from '../data/types'
import { KCAL_PER_LB, MAX_STREAK_STEPS, STREAK_STEP } from '../domain/rules'
import { useAppData } from '../hooks/useAppData'
import { formatKcal, SIZE_LABEL } from '../lib/format'
import { useTheme, type ThemePref } from '../theme/theme'

export function SettingsPage() {
  const data = useAppData()
  return (
    <div>
      <PageTitle>Settings</PageTitle>
      <div className="flex flex-col gap-4">
        <AppearanceCard />
        {data.status === 'loading' && <Spinner />}
        {data.status === 'error' && <ErrorPanel error={data.error} />}
        {data.status === 'ready' && (
          <>
            <GoalCard settings={data.data.settings} />
            <LockCard settings={data.data.settings} />
            <DataCard count={data.data.entries.length} />
          </>
        )}
        <StorageCard />
      </div>
    </div>
  )
}

function AppearanceCard() {
  const { pref, setPref } = useTheme()
  return (
    <Card title="Appearance">
      <Segmented<ThemePref>
        label="Theme"
        value={pref}
        onChange={setPref}
        options={[
          { value: 'system', label: 'System', icon: <Monitor className="size-4" aria-hidden /> },
          { value: 'light', label: 'Light', icon: <Sun className="size-4" aria-hidden /> },
          { value: 'dark', label: 'Dark', icon: <Moon className="size-4" aria-hidden /> },
        ]}
      />
    </Card>
  )
}

/** Number field that saves on blur or Enter and reverts invalid input. */
function NumberField({
  label,
  value,
  min,
  max,
  suffix,
  onSave,
}: {
  label: string
  value: number
  min: number
  max: number
  suffix: string
  onSave: (n: number) => Promise<void>
}) {
  const id = useId()
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])
  const commit = () => {
    const n = Math.round(Number(draft))
    if (!Number.isFinite(n) || n < min || n > max) return setDraft(String(value))
    if (n !== value) void onSave(n)
  }
  return (
    <div className="flex min-h-12 items-center justify-between gap-3">
      <label htmlFor={id} className="text-[15px]">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          inputMode="numeric"
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ''))}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          className="h-10 w-24 rounded-lg bg-surface-2 px-3 text-right text-[16px] tabular-nums outline-none focus:ring-2 focus:ring-accent"
        />
        <span className="w-8 text-[13px] text-muted">{suffix}</span>
      </div>
    </div>
  )
}

function GoalCard({ settings }: { settings: Settings }) {
  return (
    <Card title="Goal" subtitle={`≈ ${(settings.goalKcal / KCAL_PER_LB).toFixed(1)} lb at ${formatKcal(KCAL_PER_LB)} kcal per lb.`}>
      <NumberField
        label="Calories to avoid"
        value={settings.goalKcal}
        min={1000}
        max={1_000_000}
        suffix="kcal"
        onSave={(goalKcal) => store.saveSettings({ ...settings, goalKcal })}
      />
    </Card>
  )
}

function LockCard({ settings }: { settings: Settings }) {
  const setMinutes = (size: Size, n: number) =>
    store.saveSettings({ ...settings, lockMinutes: { ...settings.lockMinutes, [size]: n } })
  return (
    <Card title="Snack lock" subtitle="How long snacks stay locked after you skip one. Changes apply to future skips.">
      <div className="divide-y divide-line">
        {SIZES.map((size) => (
          <NumberField
            key={size}
            label={`${SIZE_LABEL[size]} snack`}
            value={settings.lockMinutes[size]}
            min={5}
            max={24 * 60}
            suffix="min"
            onSave={(n) => setMinutes(size, n)}
          />
        ))}
        <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 pt-1">
          <span className="text-[15px]">
            Grow lock with streak
            <span className="block text-[13px] text-muted">
              +{STREAK_STEP * 100}% per hold completed in a row, up to +{STREAK_STEP * MAX_STREAK_STEPS * 100}%. A snack resets it.
            </span>
          </span>
          <input
            type="checkbox"
            checked={settings.growLockWithStreak}
            onChange={(e) => void store.saveSettings({ ...settings, growLockWithStreak: e.target.checked })}
            className="size-6 shrink-0 accent-[var(--accent)]"
          />
        </label>
      </div>
    </Card>
  )
}

async function deliverFile(json: string, filename: string) {
  const file = new File([json], filename, { type: 'application/json' })
  // On iPhone the share sheet is the reliable way to save into Files.
  if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function DataCard({ count }: { count: number }) {
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try {
      await fn()
    } catch (e) {
      toast({ message: e instanceof Error ? e.message : String(e), tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const exportData = () =>
    run(async () => {
      const backup = await store.exportAll()
      const date = new Date().toISOString().slice(0, 10)
      await deliverFile(JSON.stringify(backup, null, 2), `holdout-backup-${date}.json`)
    })

  const importData = (file: File) =>
    run(async () => {
      const backup = parseBackup(await file.text())
      const ok = confirm(`Replace your ${count} current entries with ${backup.entries.length} from this backup?`)
      if (!ok) return
      await store.replaceAll(backup)
      toast({ message: `Imported ${backup.entries.length} entries` })
    })

  const erase = () =>
    run(async () => {
      if (!confirm('Erase all entries and settings on this device? Export a backup first if you might want them.')) return
      await store.eraseAll()
      toast({ message: 'All data erased' })
    })

  return (
    <Card title="Data" subtitle={`${count} entries, stored only on this device. Export regularly as a backup.`}>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button onClick={() => void exportData()} disabled={busy}>
          <Download className="size-4" aria-hidden /> Export JSON
        </Button>
        <Button onClick={() => fileRef.current?.click()} disabled={busy}>
          <Upload className="size-4" aria-hidden /> Import JSON
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) void importData(f)
          }}
        />
        <Button variant="danger" className="sm:col-span-2" onClick={() => void erase()} disabled={busy}>
          <Trash2 className="size-4" aria-hidden /> Erase all data
        </Button>
      </div>
    </Card>
  )
}

function StorageCard() {
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    void navigator.storage?.persisted?.().then(setPersisted)
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  const standalone = matchMedia('(display-mode: standalone)').matches
  return (
    <Card title="About">
      <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-[15px]">
        <dt className="text-muted">Installed app</dt>
        <dd>{standalone ? 'Yes' : 'No'}</dd>
        <dt className="text-muted">Storage protected</dt>
        <dd>{persisted === null ? 'Unknown' : persisted ? 'Yes' : 'No'}</dd>
        <dt className="text-muted">Network</dt>
        <dd>{online ? 'Online' : 'Offline (works fully)'}</dd>
        <dt className="text-muted">Version</dt>
        <dd className="tabular-nums">{__APP_VERSION__}</dd>
      </dl>
      {!standalone && (
        <p className="mt-3 text-[13px] text-muted">
          On iPhone, Safari can clear data for sites you have not opened in a while. Add Holdout to your Home Screen to keep it.
        </p>
      )}
    </Card>
  )
}
