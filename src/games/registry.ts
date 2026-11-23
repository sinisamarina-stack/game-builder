import { dropper } from "./dropper";
import { runner } from "./runner";
import { swimmer } from "./swimmer";
import type { AnyGameTemplate } from "./types";

/** Every template the builder offers. Add new mini-games here. */
export const templates: AnyGameTemplate[] = [runner, dropper, swimmer];

export function getTemplate(id: string): AnyGameTemplate | undefined {
  return templates.find((template) => template.id === id);
}
