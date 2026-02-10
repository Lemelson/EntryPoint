import {
  CITY_LABEL,
  DIRECTION_LABEL,
  FORMAT_LABEL,
  type Direction,
  type Internship,
  type University,
  type WorkFormat,
  UNIVERSITY_LABEL,
  type City,
} from "./data";

export function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function logoText(company: string): string {
  const parts = company.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "U";
  const b = parts.length > 1 ? (parts[1]?.[0] ?? "") : (parts[0]?.[1] ?? "");
  return (a + b).toUpperCase();
}

export function fmtDateRelative(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const delta = Math.max(0, now.getTime() - d.getTime());
  const days = Math.floor(delta / (24 * 3600 * 1000));
  if (days <= 0) return "сегодня";
  if (days === 1) return "вчера";
  if (days < 7) return `${days} дн. назад`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} нед. назад`;
  const months = Math.floor(days / 30);
  return `${months} мес. назад`;
}

export function tag(kind: string, label: string): string {
  return `<span class="tag" data-kind="${esc(kind)}">${esc(label)}</span>`;
}

export function uniTags(unis: University[]): string {
  return unis.map((u) => tag("uni", UNIVERSITY_LABEL[u])).join("");
}

export function programTags(programs: string[]): string {
  return programs.map((p) => tag("program", p)).join("");
}

export function stackTags(stack: string[]): string {
  return stack.map((t) => tag("stack", t)).join("");
}

export function metaTags(i: Internship): string {
  const out: string[] = [];
  if (i.hot) out.push(tag("hot", "HOT"));
  out.push(tag("dir", DIRECTION_LABEL[i.direction]));
  if (i.asap) out.push(tag("start", "ASAP"));
  out.push(tag("meta", FORMAT_LABEL[i.format]));
  if (i.city !== "Any") out.push(tag("meta", CITY_LABEL[i.city]));
  out.push(tag("meta", courseRangeLabel(i.courseMin, i.courseMax)));
  out.push(tag("meta", `${i.season} · ${i.duration}`));
  if (typeof i.minGpa === "number") out.push(tag("meta", `GPA ≥ ${i.minGpa.toFixed(1)}`));
  return out.join("");
}

export function courseRangeLabel(min?: number, max?: number): string {
  if (!min && !max) return "Курс: любой";
  const mn = min ?? 1;
  const mx = max ?? 4;
  if (mn === mx) return `Курс: ${mn}`;
  return `Курс: ${mn}-${mx}`;
}

export function optionChecks<T extends string>(opts: {
  name: string;
  values: readonly T[];
  selected: ReadonlySet<T>;
  label: (v: T) => string;
}): string {
  const { name, values, selected, label } = opts;
  return values
    .map((v) => {
      const id = `${name}-${v}`;
      const checked = selected.has(v) ? "checked" : "";
      return `<label class="check" for="${esc(id)}">
  <input type="checkbox" id="${esc(id)}" data-check="${esc(name)}" value="${esc(v)}" ${checked} />
  <span>${esc(label(v))}</span>
</label>`;
    })
    .join("");
}

export function dirLabel(d: Direction): string {
  return DIRECTION_LABEL[d];
}
export function fmtLabel(f: WorkFormat): string {
  return FORMAT_LABEL[f];
}

export function cityLabel(c: City): string {
  return CITY_LABEL[c];
}
