import type { AnyGameTemplate, AnyParamDef, GameSettings, ParamGroup, SettingValue } from "@/games/types";

interface SettingsPanelProps {
  template: AnyGameTemplate;
  settings: GameSettings;
  onChange: (key: string, value: SettingValue) => void;
  onReset: () => void;
}

const GROUPS: ParamGroup[] = ["Gameplay", "Look"];

const decimals = (step: number) => (step >= 1 ? 0 : String(step).split(".")[1]?.length ?? 0);

/** Editor form generated from a template's `params`. */
export function SettingsPanel({ template, settings, onChange, onReset }: SettingsPanelProps) {
  return (
    <div className="space-y-6 p-4">
      {GROUPS.map((group) => {
        const params = template.params.filter((param) => param.group === group);
        if (params.length === 0) return null;
        return (
          <section key={group}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">{group}</h3>
            <div className="space-y-3">
              {params.map((param) => (
                <Field key={param.key} param={param} value={settings[param.key]} onChange={onChange} />
              ))}
            </div>
          </section>
        );
      })}
      <button
        type="button"
        onClick={onReset}
        className="w-full rounded-md border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5"
      >
        Reset to defaults
      </button>
    </div>
  );
}

function Field({
  param,
  value,
  onChange,
}: {
  param: AnyParamDef;
  value: SettingValue;
  onChange: (key: string, value: SettingValue) => void;
}) {
  if (param.type === "number") {
    return (
      <label className="block text-sm">
        <span className="flex justify-between text-zinc-300">
          {param.label}
          <span className="tabular-nums text-zinc-500">{Number(value).toFixed(decimals(param.step))}</span>
        </span>
        <input
          type="range"
          min={param.min}
          max={param.max}
          step={param.step}
          value={Number(value)}
          onChange={(event) => onChange(param.key, Number(event.target.value))}
          className="mt-1 w-full accent-sky-400"
        />
      </label>
    );
  }
  if (param.type === "select") {
    return (
      <label className="flex items-center justify-between gap-3 text-sm text-zinc-300">
        {param.label}
        <select
          value={String(value)}
          onChange={(event) => onChange(param.key, event.target.value)}
          className="rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-sky-400"
        >
          {param.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (param.type === "color") {
    return (
      <label className="flex items-center justify-between text-sm text-zinc-300">
        {param.label}
        <span className="flex items-center gap-2">
          <span className="font-mono text-xs text-zinc-500">{String(value)}</span>
          <input
            type="color"
            value={String(value)}
            onChange={(event) => onChange(param.key, event.target.value)}
            className="h-7 w-10 cursor-pointer rounded border border-white/10 bg-transparent"
          />
        </span>
      </label>
    );
  }
  return (
    <label className="flex items-center justify-between text-sm text-zinc-300">
      {param.label}
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(event) => onChange(param.key, event.target.checked)}
        className="h-4 w-4 accent-sky-400"
      />
    </label>
  );
}
