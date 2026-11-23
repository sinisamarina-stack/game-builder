import type { GameDefinition } from "@/games/definition";
import { getTemplate, templates } from "@/games/registry";
import type { AnyGameTemplate } from "@/games/types";

interface SidebarProps {
  current: GameDefinition;
  saved: GameDefinition[];
  onNew: (template: AnyGameTemplate) => void;
  onLoad: (game: GameDefinition) => void;
  onDelete: (id: string) => void;
}

export function Sidebar({ current, saved, onNew, onLoad, onDelete }: SidebarProps) {
  return (
    <div className="space-y-6 p-4">
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">New from template</h3>
        <div className="space-y-2">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onNew(template)}
              className={`w-full rounded-lg border p-3 text-left transition hover:bg-white/5 ${
                template.id === current.templateId ? "border-white/25 bg-white/5" : "border-white/10"
              }`}
            >
              <span className="flex items-center gap-2 font-medium">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: template.accent }} />
                {template.name}
              </span>
              <span className="mt-1 block text-xs text-zinc-400">{template.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Saved games</h3>
        {saved.length === 0 ? (
          <p className="text-sm text-zinc-500">Nothing saved yet. Saved games live in this browser.</p>
        ) : (
          <ul className="space-y-1">
            {saved.map((game) => (
              <li key={game.id} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onLoad(game)}
                  className={`min-w-0 flex-1 rounded-md px-2 py-1.5 text-left text-sm hover:bg-white/5 ${
                    game.id === current.id ? "bg-white/10" : ""
                  }`}
                >
                  <span className="block truncate">{game.name}</span>
                  <span className="block text-xs text-zinc-500">{getTemplate(game.templateId)?.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(game.id)}
                  aria-label={`Delete ${game.name}`}
                  className="rounded-md px-2 py-1 text-zinc-500 hover:bg-white/5 hover:text-red-400"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
