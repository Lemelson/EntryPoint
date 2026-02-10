import "./style.css";
import {
  CITY_LABEL,
  COURSE_CHOICES,
  DIRECTION_LABEL,
  FORMAT_LABEL,
  INTERNSHIPS,
  STACK_TAGS,
  type City,
  type Direction,
  type Internship,
  type University,
  type WorkFormat,
  UNIVERSITIES,
  UNIVERSITY_BY_ID,
  UNIVERSITY_LABEL,
  PAID_LABEL,
  type Paid,
} from "./data";
import { createMatrixBadge } from "./matrix";
import { esc, fmtDateRelative, logoText, metaTags, stackTags } from "./ui";

type Filters = {
  q: string;
  universities: Set<University>;
  cities: Set<City>;
  directions: Set<Direction>;
  formats: Set<WorkFormat>;
  stack: Set<string>;
  starts: Set<string>; // "ASAP" or season labels
  profileGpa?: number;
  profileCourse?: number; // 1..4
  salaryMin?: number; // RUB
};

type Route =
  | { name: "list" }
  | { name: "detail"; id: string }
  | { name: "notfound" };

const app = must(document.querySelector<HTMLDivElement>("#app"));
let matrixBadgeCtrl: { setEnabled: (v: boolean) => void; setColor: (c: string) => void } | null = null;
const matrix2 = document.querySelector<HTMLIFrameElement>("#matrix2");
const MATRIX2_SRC = matrix2?.getAttribute("src") ?? "";

const LS_OLD_POSTS = "coolboard.user_posts.v1";
const LS_POSTS = "entrypoint.user_posts.v1";
const LS_WELCOME = "entrypoint.welcome.seen";

const SEASONS = ["Весна 2026", "Лето 2026", "Осень 2026"] as const;

const state: {
  filters: Filters;
  matrixOn: boolean;
  reducedMotion: boolean; // readonly: from prefers-reduced-motion
  all: Internship[];
  listMounted: boolean;
} = {
  filters: {
    q: "",
    universities: new Set<University>(),
    cities: new Set<City>(),
    directions: new Set<Direction>(),
    formats: new Set<WorkFormat>(),
    stack: new Set<string>(),
    starts: new Set<string>(),
  },
  matrixOn: true,
  reducedMotion: prefersReducedMotion(),
  all: [],
  listMounted: false,
};

if (state.reducedMotion) {
  state.matrixOn = false;
  document.body.classList.add("fx-off");
}

let userPosts: Internship[] = loadUserPostsWithMigration();
state.all = mergeAll();

let updateTimer = 0;
let listMinHeight = 0;
function scheduleUpdateResults() {
  window.clearTimeout(updateTimer);
  updateTimer = window.setTimeout(() => updateResults(), 90);
}

let resultsGlassRAF = 0;
let lastGlassRect = { x: 0, y: 0, w: 0, h: 0, visible: false };
function scheduleResultsGlassSync() {
  window.cancelAnimationFrame(resultsGlassRAF);
  resultsGlassRAF = window.requestAnimationFrame(() => {
    syncResultsGlass();
    // Second sync after a short delay to catch late layout updates (e.g. returning from detail view)
    window.setTimeout(() => syncResultsGlass(), 50);
  });
}

// Shell is mounted once; list view updates do not rebuild the whole page.
mountShell();
window.addEventListener("hashchange", renderRoute);
renderRoute();

function must<T>(v: T | null): T {
  if (!v) throw new Error("Missing element");
  return v;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

function mergeAll(): Internship[] {
  return [...INTERNSHIPS, ...userPosts];
}

function parseRoute(): Route {
  const raw = (location.hash || "#/").replace(/^#/, "");
  const parts = raw.split("/").filter(Boolean);
  if (parts.length === 0) return { name: "list" };
  if (parts[0] === "internship" && parts[1]) return { name: "detail", id: parts[1] };
  if (parts[0] === "") return { name: "list" };
  return { name: "notfound" };
}

function setHash(path: string) {
  if (!path.startsWith("#")) location.hash = `#${path}`;
  else location.hash = path;
}

function mountShell() {
  app.innerHTML = `
    <header class="topbar">
      <div class="container topbar-inner">
        <a class="brand" href="#/">
          <span class="brand-mark"><span class="brand-split">ENTRY</span><span class="brand-split">POINT</span></span>
          <span class="brand-sub">FIRST JOBS · MVP</span>
        </a>
        <div class="top-actions">
          <button class="matrix-toggle" id="toggle-matrix" type="button" aria-label="Matrix" aria-pressed="false" title="Matrix">
            <canvas class="matrix-toggle-canvas" id="matrix-toggle-canvas" width="40" height="40"></canvas>
          </button>
          <button class="btn" id="show-intro" type="button" title="Интро">Интро</button>
          <button class="btn btn-primary" id="create-post" type="button">Создать анкету</button>
        </div>
      </div>
    </header>

    <div id="results-glass" aria-hidden="true"></div>
    <div id="mobile-filters-backdrop" aria-hidden="true" hidden></div>

    <div id="view">
      <div id="list-view"></div>
      <div id="detail-view"></div>
    </div>

    <footer class="footer">
      <div class="container footer-inner">
        <span>EntryPoint: локальный MVP для сдачи (фильтры, карточки, отклик, шаринг).</span>
        <span>Маршрут: <span style="color: var(--accent)">#/internship/&lt;id&gt;</span></span>
      </div>
    </footer>

    <div id="overlay-root"></div>
  `;

  syncTopbarButtons();
  syncMatrixLayer();

  window.addEventListener("scroll", () => scheduleResultsGlassSync(), { passive: true });
  window.addEventListener("resize", () => scheduleResultsGlassSync(), { passive: true });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMobileFilters();
  });

  must(document.querySelector<HTMLButtonElement>("#toggle-matrix")).addEventListener("click", () => {
    if (state.reducedMotion) {
      showToast("Reduce motion включен: Matrix отключен");
      return;
    }
    state.matrixOn = !state.matrixOn;
    matrixBadgeCtrl?.setEnabled(state.matrixOn && !state.reducedMotion);
    syncTopbarButtons();
    syncMatrixLayer();
  });

  must(document.querySelector<HTMLButtonElement>("#create-post")).addEventListener("click", () => {
    openCreateModal();
  });

  must(document.querySelector<HTMLButtonElement>("#show-intro")).addEventListener("click", () => {
    showWelcomeForced();
  });

  const badgeCanvas = document.querySelector<HTMLCanvasElement>("#matrix-toggle-canvas");
  if (badgeCanvas) {
    matrixBadgeCtrl = createMatrixBadge(badgeCanvas);
    matrixBadgeCtrl.setEnabled(state.matrixOn && !state.reducedMotion);
  }

}

function openMobileFilters() {
  const bd = document.querySelector<HTMLElement>("#mobile-filters-backdrop");
  if (bd) bd.hidden = false;
  document.body.classList.add("filters-open");
}

function closeMobileFilters() {
  const bd = document.querySelector<HTMLElement>("#mobile-filters-backdrop");
  if (bd) bd.hidden = true;
  document.body.classList.remove("filters-open");
}

function syncResultsGlass() {
  const glass = document.querySelector<HTMLElement>("#results-glass");
  const listView = document.querySelector<HTMLElement>("#list-view");
  const results = document.querySelector<HTMLElement>("main.panel.results");

  if (!glass || !listView || !results || listView.style.display === "none") {
    if (glass) glass.style.display = "none";
    // If we hid the glass due to route/layout, ensure we don't early-return on the next show.
    lastGlassRect.visible = false;
    return;
  }

  // IMPORTANT: results can be very tall. Backdrop-filter may be disabled by browsers when the
  // blurred surface is too large in device pixels (especially at zoom). So we clamp the glass
  // layer to the viewport intersection.
  const r = results.getBoundingClientRect();
  const top = Math.max(0, r.top);
  const left = Math.max(0, r.left);
  const right = Math.min(window.innerWidth, r.right);
  const bottom = Math.min(window.innerHeight, r.bottom);
  const w = Math.max(0, right - left);
  const h = Math.max(0, bottom - top);

  if (w < 2 || h < 2) {
    if (lastGlassRect.visible) {
      glass.style.display = "none";
      lastGlassRect.visible = false;
    }
    return;
  }

  // Skip DOM update if nothing changed
  const roundedLeft = Math.round(left);
  const roundedTop = Math.round(top);
  const roundedW = Math.round(w);
  const roundedH = Math.round(h);
  if (lastGlassRect.x === roundedLeft && lastGlassRect.y === roundedTop &&
    lastGlassRect.w === roundedW && lastGlassRect.h === roundedH && lastGlassRect.visible) {
    return;
  }

  lastGlassRect = { x: roundedLeft, y: roundedTop, w: roundedW, h: roundedH, visible: true };
  glass.style.display = "block";
  glass.style.width = `${roundedW}px`;
  glass.style.height = `${roundedH}px`;
  glass.style.transform = `translate3d(${roundedLeft}px, ${roundedTop}px, 0)`;
}

function syncTopbarButtons() {
  const matrix = must(document.querySelector<HTMLButtonElement>("#toggle-matrix"));
  matrix.classList.toggle("is-on", state.matrixOn);
  matrix.setAttribute("aria-pressed", state.matrixOn ? "true" : "false");
  document.body.classList.toggle("fx-off", !state.matrixOn);
}

function syncMatrixLayer() {
  if (!matrix2) return;
  const enabled = state.matrixOn && !state.reducedMotion;
  if (enabled) {
    if (MATRIX2_SRC && matrix2.getAttribute("src") !== MATRIX2_SRC) matrix2.setAttribute("src", MATRIX2_SRC);
    matrix2.style.display = "block";
  } else {
    matrix2.style.display = "none";
    // Stop the animation entirely when off.
    if (matrix2.getAttribute("src") !== "about:blank") matrix2.setAttribute("src", "about:blank");
  }
}

function renderRoute() {
  const r = parseRoute();
  const listView = must(document.querySelector<HTMLDivElement>("#list-view"));
  const detailView = must(document.querySelector<HTMLDivElement>("#detail-view"));

  if (!state.listMounted) {
    buildListView(listView);
    state.listMounted = true;
  }

  if (r.name === "list") {
    detailView.style.display = "none";
    listView.style.display = "block";
    syncFilterUI();
    updateResults();
    maybeShowWelcome();
    scheduleResultsGlassSync();
    return;
  }

  // Hide welcome overlay if we navigate away.
  hideOverlay();

  listView.style.display = "none";
  detailView.style.display = "block";
  scheduleResultsGlassSync();

  if (r.name === "detail") {
    detailView.innerHTML = renderDetail(r.id);
    wireDetailView(detailView);
    // Always start at the top of the detail page (mobile browsers often keep scroll position).
    window.scrollTo(0, 0);
  } else {
    detailView.innerHTML = renderNotFound();
    wireNotFound(detailView);
    window.scrollTo(0, 0);
  }
}

function buildListView(root: HTMLElement) {
  const dirValues = Object.keys(DIRECTION_LABEL) as Direction[];
  const fmtValues = Object.keys(FORMAT_LABEL) as WorkFormat[];
  const cityValues = (Object.keys(CITY_LABEL) as City[]).filter((c) => c !== "Any");
  const UNI_TOP4: University[] = ["HSE", "MSU", "MIPT", "ITMO"];
  let uniPinned: University[] = [];

  root.innerHTML = `
    <section class="hero">
      <div class="container hero-grid">
        <div>
          <div class="hero-copy">
            <h1 class="h1">Найди свою первую стажировку</h1>
            <p class="lead">
              Поможем быстро подобрать стажировку по стеку, курсу и городу. Отклик в пару кликов, а компаниям доступно создание анкеты.
            </p>
          </div>
        </div>
        <div class="panel searchbar">
          <input class="input" id="q" placeholder="Поиск: Сбер, Т-Банк, Яндекс, ВШЭ, C#, React…" />
          <button class="btn btn-primary" id="apply-search" type="button">Найти</button>
          <button class="btn btn-filters" id="open-filters" type="button">Фильтры</button>
        </div>
      </div>
    </section>

    <section class="container layout">
      <aside class="panel filters" id="filters">
        <div class="filters-head">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
            <div class="filters-title">Фильтры</div>
            <button class="btn btn-small filters-close" id="close-filters" type="button">Закрыть</button>
          </div>
          <div class="filters-sub">Подстрой под себя и выбери стажировку быстрее</div>
        </div>
        <div class="filter-block">
          <h3>Данные студента</h3>
          <div class="field">
            <div class="field-label">Средний балл (0–10)</div>
            <input class="input" id="profile-gpa" inputmode="decimal" placeholder="Например, 7.8" />
          </div>
          <div class="field" style="margin-top:12px;">
            <div class="field-label">Курс</div>
            <div class="chips" id="chips-course">
              ${COURSE_CHOICES.map((c) => chipButton("course", String(c), `${c} курс`)).join("")}
            </div>
          </div>
        </div>

        <div class="filter-block">
          <h3>Зарплата</h3>
          <div style="display:grid; grid-template-columns:1fr; gap:10px;">
            <input class="input" id="salary-min" inputmode="numeric" placeholder="От (минимум)" />
            <div class="mini">Пусто: включая неоплачиваемые.</div>
          </div>
        </div>

        <div class="filter-block">
          <h3>Когда старт</h3>
          <div class="chips" id="chips-start">
            ${chipButton("start", "ASAP", "Как можно раньше")}
            ${SEASONS.map((s) => chipButton("start", s, s)).join("")}
          </div>
        </div>

        <div class="filter-block">
          <h3>Направление</h3>
          <div class="chips" id="chips-dir">
            ${dirValues.map((d) => chipButton("dir", d, DIRECTION_LABEL[d])).join("")}
          </div>
        </div>

        <div class="filter-block">
          <h3>Стек</h3>
          <div class="chips" id="chips-stack">
            ${STACK_TAGS.map((t) => chipButton("stack", t, t)).join("")}
          </div>
        </div>

        <div class="filter-block">
          <h3>Формат</h3>
          <div class="chips" id="chips-fmt">
            ${fmtValues.map((f) => chipButton("fmt", f, FORMAT_LABEL[f])).join("")}
          </div>
        </div>

        <div class="filter-block">
          <h3>Город</h3>
          <div class="chips" id="chips-city">
            ${cityValues.map((c) => chipButton("city", c, CITY_LABEL[c])).join("")}
          </div>
        </div>

        <div class="filter-block">
          <h3>ВУЗ</h3>
          <div class="uni-search-wrap">
            <input
              class="input"
              id="uni-search"
              placeholder="Поиск вуза…"
              autocomplete="off"
              spellcheck="false"
            />
            <div class="uni-suggest" id="uni-suggest" hidden></div>
          </div>
          <div class="chips" id="chips-uni" style="margin-top:10px;"></div>
        </div>

        <div class="filter-block filter-actions">
          <div class="filters-sticky">
            <button class="btn btn-danger" id="clear-filters-left" type="button">Сбросить фильтры</button>
          </div>
        </div>
      </aside>

      <main class="panel results">
        <div class="results-head">
          <div class="results-meta">Найдено: <span id="results-count" style="color: var(--accent)">0</span></div>
          <div class="results-meta">Подсказка: открой карточку, чтобы увидеть детали</div>
        </div>
        <div class="grid" id="results-grid"></div>
      </main>
    </section>
  `;
  scheduleResultsGlassSync();

  const q = must(document.querySelector<HTMLInputElement>("#q"));
  must(document.querySelector<HTMLButtonElement>("#apply-search")).addEventListener("click", () => {
    state.filters.q = q.value;
    updateResults();
  });
  q.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      state.filters.q = q.value;
      updateResults();
    }
  });

  // Mobile filters drawer
  document.querySelector<HTMLButtonElement>("#open-filters")?.addEventListener("click", () => openMobileFilters());
  document.querySelector<HTMLButtonElement>("#close-filters")?.addEventListener("click", () => closeMobileFilters());
  document.querySelector<HTMLElement>("#mobile-filters-backdrop")?.addEventListener("click", () => closeMobileFilters());

  // Profile auto-apply
  const gpaInput = must(document.querySelector<HTMLInputElement>("#profile-gpa"));
  gpaInput.addEventListener("input", () => {
    const s = gpaInput.value.trim();
    const gpa = s ? Number(s.replace(",", ".")) : NaN;
    if (Number.isFinite(gpa)) state.filters.profileGpa = clamp(gpa, 0, 10);
    else delete state.filters.profileGpa;
    scheduleUpdateResults();
  });

  // Salary auto-apply (min only)
  const salMin = must(document.querySelector<HTMLInputElement>("#salary-min"));
  salMin.addEventListener("input", () => {
    const s = salMin.value.trim();
    const min = s ? Number(s.replace(/\s+/g, "")) : NaN;
    if (Number.isFinite(min)) state.filters.salaryMin = clamp(min, 0, 10_000_000);
    else delete state.filters.salaryMin;
    scheduleUpdateResults();
  });

  // VUZ search: dropdown suggestions + a compact visible list (top-4 + pinned from search)
  const uniSearch = must(document.querySelector<HTMLInputElement>("#uni-search"));
  const uniSuggest = must(document.querySelector<HTMLDivElement>("#uni-suggest"));
  const uniWrap = must(document.querySelector<HTMLElement>("#chips-uni"));

  function visibleUnis(): University[] {
    const uniquePinned = uniPinned.filter((u, idx) => uniPinned.indexOf(u) === idx);
    return [...uniquePinned, ...UNI_TOP4.filter((u) => !uniquePinned.includes(u))];
  }

  function renderUniList() {
    uniWrap.innerHTML = visibleUnis()
      .map((u) => chipButton("uni", u, UNIVERSITY_BY_ID[u]?.short ?? UNIVERSITY_LABEL[u]))
      .join("");
  }

  renderUniList();

  function hideSuggest() {
    uniSuggest.hidden = true;
    uniSuggest.innerHTML = "";
  }

  function renderSuggest() {
    const q = normalizeText(uniSearch.value);
    if (!q) return hideSuggest();
    const matches = universityMatches(q).slice(0, 12);
    if (!matches.length) return hideSuggest();

    uniSuggest.hidden = false;
    uniSuggest.innerHTML = matches
      .map((m) => {
        const sel = state.filters.universities.has(m.id);
        const badge = sel ? `<span class="uni-selected">Выбрано</span>` : "";
        return `
          <button class="uni-item" type="button" data-uni-suggest="${esc(m.id)}">
            <div class="uni-row">
              <div class="uni-short">${esc(m.short)}</div>
              ${badge}
            </div>
            <div class="uni-full">${esc(m.full)}</div>
          </button>
        `;
      })
      .join("");
  }

  uniSearch.addEventListener("input", () => renderSuggest());
  uniSearch.addEventListener("focus", () => renderSuggest());
  uniSearch.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideSuggest();
  });
  document.addEventListener("click", (e) => {
    const wrap = (e.target as HTMLElement).closest(".uni-search-wrap");
    if (!wrap) hideSuggest();
  });
  // If the user scrolls the page, close the dropdown so it can't "cover" the chips row.
  window.addEventListener("scroll", () => hideSuggest(), { passive: true });

  uniSuggest.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-uni-suggest]");
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    const id = b.dataset.uniSuggest as University;
    state.filters.universities.add(id);
    if (!UNI_TOP4.includes(id)) uniPinned = [id, ...uniPinned.filter((x) => x !== id)];
    renderUniList();
    uniSearch.value = "";
    hideSuggest();
    syncFilterUI();
    scheduleUpdateResults();
    scheduleResultsGlassSync();
  });

  // Clear filters (moved from topbar)
  must(document.querySelector<HTMLButtonElement>("#clear-filters-left")).addEventListener("click", () => {
    resetFilters();
    uniPinned = [];
    renderUniList();
    syncFilterUI();
    updateResults();
    scheduleResultsGlassSync();
  });

  // Chip toggles: event delegation
  must(document.querySelector<HTMLElement>("#filters")).addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-group]");
    if (!btn) return;
    const group = btn.dataset.group!;
    const value = btn.dataset.value!;

    toggleChip(group, value);
    if (group === "uni") {
      const id = value as University;
      if (!state.filters.universities.has(id)) {
        uniPinned = uniPinned.filter((x) => x !== id);
        renderUniList();
      }
    }
    // Update pressed state immediately, then update results.
    syncFilterUI();
    scheduleUpdateResults();
    scheduleResultsGlassSync();
  });

  // Result actions: apply/share buttons should not navigate.
  must(document.querySelector<HTMLElement>("#results-grid")).addEventListener("click", async (e) => {
    const apply = (e.target as HTMLElement).closest<HTMLElement>("[data-apply]");
    if (apply) {
      e.preventDefault();
      e.stopPropagation();
      openApplyModal(apply.dataset.apply!);
      return;
    }
    const share = (e.target as HTMLElement).closest<HTMLElement>("[data-share]");
    if (share) {
      e.preventDefault();
      e.stopPropagation();
      await copyShareLink(share.dataset.share!);
      return;
    }
  });
}

function chipButton(group: string, value: string, label: string): string {
  return `<button class="tag" type="button" data-kind="chip" data-group="${esc(group)}" data-value="${esc(
    value
  )}" aria-pressed="false">${esc(label)}</button>`;
}

function toggleChip(group: string, value: string) {
  const f = state.filters;
  switch (group) {
    case "dir":
      toggleSet(f.directions as Set<any>, value);
      break;
    case "fmt":
      toggleSet(f.formats as Set<any>, value);
      break;
    case "city":
      toggleSet(f.cities as Set<any>, value);
      break;
    case "uni":
      toggleSet(f.universities as Set<any>, value);
      break;
    case "start":
      toggleSet(f.starts, value);
      break;
    case "stack":
      toggleSet(f.stack, value);
      break;
    case "course": {
      const c = Number(value);
      if (!Number.isFinite(c)) break;
      if (typeof f.profileCourse === "number" && f.profileCourse === c) delete f.profileCourse;
      else f.profileCourse = clamp(c, 1, 4);
      break;
    }
  }
}

function toggleSet<T>(set: Set<T>, value: T) {
  if (set.has(value)) set.delete(value);
  else set.add(value);
}

function syncFilterUI() {
  // Inputs
  const q = document.querySelector<HTMLInputElement>("#q");
  if (q) q.value = state.filters.q;

  const gpa = document.querySelector<HTMLInputElement>("#profile-gpa");
  if (gpa) gpa.value = typeof state.filters.profileGpa === "number" ? String(state.filters.profileGpa) : "";

  const salMin = document.querySelector<HTMLInputElement>("#salary-min");
  if (salMin) salMin.value = typeof state.filters.salaryMin === "number" ? String(state.filters.salaryMin) : "";

  // Chips (pressed state)
  document.querySelectorAll<HTMLButtonElement>("button[data-group]").forEach((b) => {
    const group = b.dataset.group!;
    const value = b.dataset.value!;
    const on = isSelected(group, value);
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/["'«»()[\]{}.,;:!?/\\|—–\-+_=]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function universityMatches(q: string) {
  const out: { id: University; short: string; full: string; score: number }[] = [];
  for (const u of UNIVERSITIES) {
    const shortN = normalizeText(u.short);
    const fullN = normalizeText(u.full);
    const aliasN = u.aliases.map((a) => normalizeText(a));

    let score = Number.POSITIVE_INFINITY;
    if (shortN.startsWith(q)) score = 0;
    else if (fullN.startsWith(q)) score = 1;
    else if (aliasN.some((a) => a.startsWith(q))) score = 2;
    else if (shortN.includes(q)) score = 3;
    else if (fullN.includes(q)) score = 4;
    else if (aliasN.some((a) => a.includes(q))) score = 5;

    if (score !== Number.POSITIVE_INFINITY) out.push({ id: u.id, short: u.short, full: u.full, score });
  }
  out.sort((a, b) => a.score - b.score || a.short.length - b.short.length);
  return out;
}

function isSelected(group: string, value: string): boolean {
  const f = state.filters;
  switch (group) {
    case "dir":
      return f.directions.has(value as any);
    case "fmt":
      return f.formats.has(value as any);
    case "city":
      return f.cities.has(value as any);
    case "uni":
      return f.universities.has(value as any);
    case "start":
      return f.starts.has(value);
    case "stack":
      return f.stack.has(value);
    case "course":
      return typeof f.profileCourse === "number" && String(f.profileCourse) === value;
    default:
      return false;
  }
}

function resetFilters() {
  state.filters.q = "";
  state.filters.universities.clear();
  state.filters.cities.clear();
  state.filters.directions.clear();
  state.filters.formats.clear();
  state.filters.stack.clear();
  state.filters.starts.clear();
  delete state.filters.profileGpa;
  delete state.filters.profileCourse;
  delete state.filters.salaryMin;

  const uniSearch = document.querySelector<HTMLInputElement>("#uni-search");
  if (uniSearch) uniSearch.value = "";
  const uniSuggest = document.querySelector<HTMLDivElement>("#uni-suggest");
  if (uniSuggest) {
    uniSuggest.hidden = true;
    uniSuggest.innerHTML = "";
  }
}

function filteredInternships(all: Internship[], f: Filters): Internship[] {
  const q = f.q.trim().toLowerCase();
  return all.filter((i) => {
    if (q) {
      const blob =
        `${i.company} ${i.roleTitle} ${i.shortPitch} ${i.stack.join(" ")} ${i.locationLabel}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    if (f.universities.size) {
      const ok = i.universities.some((u) => f.universities.has(u));
      if (!ok) return false;
    }
    if (f.cities.size && !f.cities.has(i.city)) return false;
    if (f.directions.size && !f.directions.has(i.direction)) return false;
    if (f.formats.size && !f.formats.has(i.format)) return false;
    if (f.stack.size) {
      const ok = i.stack.some((t) => f.stack.has(t));
      if (!ok) return false;
    }

    if (f.starts.size) {
      const okSeason = f.starts.has(i.season);
      const okAsap = f.starts.has("ASAP") && !!i.asap;
      if (!okSeason && !okAsap) return false;
    }

    if (typeof f.profileGpa === "number" && typeof i.minGpa === "number") {
      if (f.profileGpa + 1e-6 < i.minGpa) return false;
    }
    if (typeof f.profileCourse === "number") {
      if (typeof i.courseMin === "number" && f.profileCourse + 1e-6 < i.courseMin) return false;
      if (typeof i.courseMax === "number" && f.profileCourse - 1e-6 > i.courseMax) return false;
    }

    if (typeof f.salaryMin === "number") {
      if (typeof i.salaryMin !== "number") return false;
      if (i.salaryMin + 1e-6 < f.salaryMin) return false;
    }
    return true;
  });
}

function updateResults() {
  const route = parseRoute();
  if (route.name !== "list") return;

  const res = filteredInternships(state.all, state.filters);
  const countEl = document.querySelector<HTMLElement>("#results-count");
  if (countEl) countEl.textContent = String(res.length);

  const grid = document.querySelector<HTMLElement>("#results-grid");
  if (!grid) return;

  grid.innerHTML =
    res
      .slice(0, 50)
      .map((i, idx) => renderCard(i, idx))
      .join("") ||
    `<div class="mini">Ничего не найдено. Попробуй снять фильтры или другой запрос.</div>`;

  // Prevent "teleport" when filtering near the bottom: keep the list view from shrinking.
  const listView = document.querySelector<HTMLElement>("#list-view");
  if (listView) {
    const h = Math.ceil(listView.getBoundingClientRect().height);
    if (h > listMinHeight) listMinHeight = h;
    if (listMinHeight > 0) listView.style.minHeight = `${listMinHeight}px`;
  }

  scheduleResultsGlassSync();
}

function renderCard(i: Internship, idx: number): string {
  const delayed = state.reducedMotion ? "" : `style="animation-delay:${Math.min(240, idx * 22)}ms"`;
  const anim = state.reducedMotion ? "" : "fade-in";
  // NOTE: no locationLabel here to avoid duplicates ("Удаленно") - it's already in tags.
  return `
    <a class="linkcard" href="#/internship/${esc(i.id)}" aria-label="${esc(i.roleTitle)}">
      <article class="card ${anim}" ${delayed}>
        <div class="card-top">
          <div style="display:flex; gap:12px; min-width:0;">
            <div class="logo" aria-hidden="true">${esc(logoText(i.company))}</div>
            <div class="role">
              <h3 class="role-title">${esc(i.roleTitle)}</h3>
              <div class="role-company">${esc(i.company)}</div>
            </div>
          </div>
          <div class="salary">${esc(i.salaryLabel)}</div>
        </div>
        <div class="card-mid">
          ${metaTags(i)}
          ${stackTags(i.stack.slice(0, 6))}
        </div>
        <p class="pitch">${esc(i.shortPitch)}</p>
        <div class="card-foot">
          <div class="mini">Опубликовано: ${esc(fmtDateRelative(i.postedAtISO))}</div>
          <div class="card-actions">
            <button class="iconbtn" type="button" data-share="${esc(i.id)}" aria-label="Поделиться">⎘</button>
            <button class="btn btn-primary" type="button" data-apply="${esc(i.id)}">Откликнуться</button>
          </div>
        </div>
      </article>
    </a>
  `;
}

function renderDetail(id: string): string {
  const i = state.all.find((x) => x.id === id);
  if (!i) return renderNotFound();

  return `
    <section class="detail">
      <div class="container detail-grid">
        <div class="panel detail-main">
          <div class="backrow">
            <button class="btn" type="button" id="back-to-list-top">← Назад</button>
          </div>
          <h2>${esc(i.roleTitle)}</h2>
          <div class="sub">${esc(i.company)} · ${esc(DIRECTION_LABEL[i.direction])} · Опубликовано: ${esc(
    fmtDateRelative(i.postedAtISO)
  )}</div>
          <div class="badges-box">
            <div class="chips">
              ${metaTags(i)}
              ${stackTags(i.stack)}
            </div>
          </div>

          <div style="margin-top:12px; color: var(--muted); line-height: 1.65;">${esc(i.about)}</div>

          <div class="section-title">Что делать</div>
          <ul class="list">${i.responsibilities.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>

          <div class="section-title">Требования</div>
          <ul class="list">${i.requirements.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>

          <div class="section-title">Будет плюсом</div>
          <ul class="list">${i.niceToHave.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        </div>

        <div class="panel detail-side">
          <div class="kpi">
            <div class="k">
              <div class="label">Условия</div>
              <div class="val">${esc(i.salaryLabel)}</div>
            </div>
            <div class="k">
              <div class="label">Формат</div>
              <div class="val">${esc(FORMAT_LABEL[i.format])}</div>
            </div>
            <div class="k">
              <div class="label">Город</div>
              <div class="val">${esc(i.city === "Any" ? "Любой" : CITY_LABEL[i.city])}</div>
            </div>
            <div class="k">
              <div class="label">Сезон</div>
              <div class="val">${esc(i.season)}</div>
            </div>
          </div>

          <div class="section-title">Действия</div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn btn-primary" type="button" data-apply="${esc(i.id)}">Откликнуться</button>
            <button class="btn" type="button" data-share="${esc(i.id)}">Поделиться</button>
            <button class="btn" type="button" id="back-to-list">Назад</button>
          </div>

          <div class="section-title">Ссылка</div>
          <div class="chip" style="justify-content:space-between; width:100%;">
            <span style="overflow:hidden; text-overflow:ellipsis;">${esc(location.href)}</span>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderNotFound(): string {
  return `
    <section class="container" style="padding: 28px 0 36px;">
      <div class="panel" style="padding: 14px;">
        <h2 style="margin:0; font-family: var(--mono); font-size:18px;">Страница не найдена</h2>
        <p class="lead" style="margin-top:10px;">Вернись на главную и открой стажировку из списка.</p>
        <button class="btn btn-primary" id="go-home" type="button">На главную</button>
      </div>
    </section>
  `;
}

function wireDetailView(root: HTMLElement) {
  root.querySelector<HTMLButtonElement>("#back-to-list-top")?.addEventListener("click", () => setHash("/"));
  root.querySelector<HTMLButtonElement>("#back-to-list")?.addEventListener("click", () => setHash("/"));

  root.addEventListener("click", async (e) => {
    const apply = (e.target as HTMLElement).closest<HTMLElement>("[data-apply]");
    if (apply) {
      e.preventDefault();
      e.stopPropagation();
      openApplyModal(apply.dataset.apply!);
      return;
    }
    const share = (e.target as HTMLElement).closest<HTMLElement>("[data-share]");
    if (share) {
      e.preventDefault();
      e.stopPropagation();
      await copyShareLink(share.dataset.share!);
      return;
    }
  });
}

function wireNotFound(root: HTMLElement) {
  root.querySelector<HTMLButtonElement>("#go-home")?.addEventListener("click", () => setHash("/"));
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

async function copyShareLink(id: string) {
  const url = `${location.origin}${location.pathname}#/internship/${id}`;
  try {
    await navigator.clipboard.writeText(url);
    showToast("Ссылка скопирована");
  } catch {
    const ta = document.createElement("textarea");
    ta.value = url;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    showToast("Ссылка скопирована");
  }
}

function showToast(text: string) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = text;
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 1600);
}

function openApplyModal(id: string) {
  const i = state.all.find((x) => x.id === id);
  if (!i) return;

  const bd = document.createElement("div");
  bd.className = "modal-backdrop";
  bd.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="Отклик">
      <div class="modal-head">
        <h3 class="modal-title">Отклик: ${esc(i.roleTitle)}</h3>
        <button class="iconbtn" type="button" id="close-modal" aria-label="Закрыть">×</button>
      </div>
      <div style="margin-top: 10px; color: var(--muted); line-height: 1.5;">
        Выбери канал. Текст можно сразу отправить рекрутеру.
      </div>
      <div style="display:flex; gap:10px; margin-top: 12px; flex-wrap: wrap;">
        <a class="btn btn-primary" href="${esc(i.apply.telegramUrl)}" target="_blank" rel="noreferrer">Telegram</a>
        <a class="btn" href="mailto:${esc(i.apply.email)}?subject=${encodeURIComponent(
    `Отклик на стажировку: ${i.roleTitle}`
  )}">Email</a>
        <button class="btn" type="button" id="copy-link">Копировать ссылку</button>
      </div>
      <div style="margin-top: 12px;" class="mini">Email: ${esc(i.apply.email)}</div>
    </div>
  `;

  function close() {
    bd.remove();
    window.removeEventListener("keydown", onKey);
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") close();
  }

  bd.addEventListener("click", (e) => {
    if (e.target === bd) close();
  });
  window.addEventListener("keydown", onKey);
  bd.querySelector<HTMLButtonElement>("#close-modal")?.addEventListener("click", close);
  bd.querySelector<HTMLButtonElement>("#copy-link")?.addEventListener("click", async () => {
    await copyShareLink(id);
  });

  document.body.appendChild(bd);
}

function openCreateModal() {
  const bd = document.createElement("div");
  bd.className = "modal-backdrop";

  const dirValues = Object.keys(DIRECTION_LABEL) as Direction[];
  const fmtValues = Object.keys(FORMAT_LABEL) as WorkFormat[];
  const cityValues = Object.keys(CITY_LABEL) as City[];
  const paidValues = Object.keys(PAID_LABEL) as Paid[];

  bd.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="Создать анкету">
      <div class="modal-head">
        <h3 class="modal-title">Создать анкету (MVP)</h3>
        <button class="iconbtn" type="button" id="close-create" aria-label="Закрыть">×</button>
      </div>

      <form id="create-form" style="margin-top: 12px; display:grid; gap:10px;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <input class="input" name="company" placeholder="Компания (например, T-Bank)" required />
          <input class="input" name="title" placeholder="Роль (например, Junior Backend Intern)" required />
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <select class="input" name="direction" required>
            ${dirValues.map((d) => `<option value="${esc(d)}">${esc(DIRECTION_LABEL[d])}</option>`).join("")}
          </select>
          <select class="input" name="paid" required>
            ${paidValues.map((p) => `<option value="${esc(p)}">${esc(PAID_LABEL[p])}</option>`).join("")}
          </select>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <select class="input" name="format" required>
            ${fmtValues.map((v) => `<option value="${esc(v)}">${esc(FORMAT_LABEL[v])}</option>`).join("")}
          </select>
          <select class="input" name="city" required>
            ${cityValues.map((c) => `<option value="${esc(c)}">${esc(CITY_LABEL[c])}</option>`).join("")}
          </select>
        </div>

        <div style="display:grid; grid-template-columns:1fr; gap:10px;">
          <input class="input" name="salaryMin" inputmode="numeric" placeholder="Зарплата от (₽)" />
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <input class="input" name="courseMin" inputmode="numeric" placeholder="Мин. курс (1-4)" />
          <input class="input" name="courseMax" inputmode="numeric" placeholder="Макс. курс (1-4)" />
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <input class="input" name="minGpa" inputmode="decimal" placeholder="Мин. GPA (0-10)" />
          <input class="input" name="stack" placeholder="Стек (через запятую: Git, SQL, Docker)" />
        </div>

        <textarea class="input" name="shortPitch" placeholder="Короткое описание (1-2 предложения)" rows="3" required></textarea>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <input class="input" name="telegram" placeholder="Telegram ссылка (https://t.me/...)" required />
          <input class="input" name="email" placeholder="Email" required />
        </div>

        <div style="display:flex; gap:10px; flex-wrap: wrap; margin-top: 4px;">
          <button class="btn btn-primary" type="submit">Создать</button>
          <button class="btn" type="button" id="cancel-create">Отмена</button>
        </div>

        <div class="mini">Созданные анкеты сохраняются локально в браузере.</div>
      </form>
    </div>
  `;

  function close() {
    bd.remove();
    window.removeEventListener("keydown", onKey);
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") close();
  }

  bd.addEventListener("click", (e) => {
    if (e.target === bd) close();
  });
  window.addEventListener("keydown", onKey);
  bd.querySelector<HTMLButtonElement>("#close-create")?.addEventListener("click", close);
  bd.querySelector<HTMLButtonElement>("#cancel-create")?.addEventListener("click", close);

  const form = bd.querySelector<HTMLFormElement>("#create-form");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const company = String(fd.get("company") || "").trim();
    const title = String(fd.get("title") || "").trim();
    const direction = String(fd.get("direction") || "") as Direction;
    const paid = String(fd.get("paid") || "") as Paid;
    const format = String(fd.get("format") || "") as WorkFormat;
    let city = String(fd.get("city") || "") as City;

    const salaryMin = parseNum(fd.get("salaryMin"));
    const courseMin = parseNum(fd.get("courseMin"));
    const courseMax = parseNum(fd.get("courseMax"));
    const minGpa = parseNum(fd.get("minGpa"), true);
    const stackRaw = String(fd.get("stack") || "").trim();
    const shortPitch = String(fd.get("shortPitch") || "").trim();
    const telegram = String(fd.get("telegram") || "").trim();
    const email = String(fd.get("email") || "").trim();

    if (!company || !title || !shortPitch || !telegram || !email) return;

    if (format === "Remote") city = "Any";
    if (format !== "Remote" && city === "Any") city = "Moscow";

    const stack = stackRaw
      ? stackRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 12)
      : [];

    const id = uniqueId(`${company}-${title}`.toLowerCase());
    const nowISO = new Date().toISOString().slice(0, 10);

    const universities = guessUniversities(city);
    const locationLabel = format === "Remote" ? "Удаленно" : CITY_LABEL[city] ?? "Город";

    const salaryLabel = salaryMin
      ? `от ${Math.round(salaryMin).toLocaleString("ru-RU")} ₽`
      : paid === "Unpaid"
        ? "неоплачиваемая"
        : "договорная";

    const post: Internship = {
      id,
      company,
      roleTitle: title,
      salaryLabel,
      salaryMin: typeof salaryMin === "number" ? Math.round(salaryMin) : undefined,
      salaryMax: undefined,
      paid,
      format,
      city,
      direction,
      universities,
      programs: [],
      stack,
      courseMin: typeof courseMin === "number" ? clamp(courseMin, 1, 4) : undefined,
      courseMax: typeof courseMax === "number" ? clamp(courseMax, 1, 4) : undefined,
      minGpa: typeof minGpa === "number" ? clamp(minGpa, 0, 10) : undefined,
      season: "Весна 2026",
      duration: "6-12 недель",
      locationLabel,
      postedAtISO: nowISO,
      shortPitch,
      about: shortPitch,
      responsibilities: ["(MVP) Уточнить в описании вакансии"],
      requirements: ["(MVP) Базовые навыки по стеку"],
      niceToHave: ["(MVP) Портфолио/пет-проекты"],
      apply: { telegramUrl: telegram, email },
      userCreated: true,
    };

    userPosts = [post, ...userPosts].slice(0, 50);
    saveUserPosts();
    state.all = mergeAll();
    close();
    showToast("Анкета создана");
    setHash(`/internship/${post.id}`);
  });

  document.body.appendChild(bd);
}

function parseNum(v: FormDataEntryValue | null, decimal = false): number | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  if (!s) return undefined;
  const norm = decimal ? s.replace(",", ".") : s;
  const n = Number(norm.replace(/\s+/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function uniqueId(seed: string): string {
  const base =
    seed
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "post";
  let id = base;
  let k = 2;
  const ids = new Set(state.all.map((x) => x.id));
  while (ids.has(id)) id = `${base}-${k++}`;
  return id;
}

function guessUniversities(city: City): University[] {
  if (city === "SPb") return ["ITMO", "SPbU", "SPbPU"];
  if (city === "Novosibirsk") return ["NSU"];
  if (city === "Kazan") return ["INNO"];
  if (city === "Any") return Object.keys(UNIVERSITY_LABEL) as University[];
  return ["HSE", "MSU", "MIPT", "BMSTU", "MEPHI"];
}

function loadUserPostsWithMigration(): Internship[] {
  // Prefer new key. If empty, migrate old posts once.
  const fromNew = loadUserPosts(LS_POSTS);
  if (fromNew.length) return fromNew;

  const fromOld = loadUserPosts(LS_OLD_POSTS);
  if (fromOld.length) {
    try {
      localStorage.setItem(LS_POSTS, JSON.stringify(fromOld));
      localStorage.removeItem(LS_OLD_POSTS);
    } catch {
      // ignore
    }
  }
  return fromOld;
}

function loadUserPosts(key: string): Internship[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: Internship[] = [];
    for (const v of parsed) {
      if (!v || typeof v !== "object") continue;
      const o = v as any;
      if (typeof o.id !== "string" || typeof o.company !== "string" || typeof o.roleTitle !== "string") continue;
      if (typeof o.salaryLabel !== "string" || typeof o.locationLabel !== "string") continue;
      if (typeof o.paid !== "string" || typeof o.format !== "string" || typeof o.city !== "string") continue;
      if (typeof o.direction !== "string") continue;
      if (!Array.isArray(o.universities) || !Array.isArray(o.programs) || !Array.isArray(o.stack)) continue;
      if (typeof o.postedAtISO !== "string" || typeof o.shortPitch !== "string" || typeof o.about !== "string") continue;
      if (!Array.isArray(o.responsibilities) || !Array.isArray(o.requirements) || !Array.isArray(o.niceToHave)) continue;
      if (!o.apply || typeof o.apply !== "object" || typeof o.apply.telegramUrl !== "string" || typeof o.apply.email !== "string")
        continue;
      out.push({ ...(o as Internship), userCreated: true });
    }
    return out;
  } catch {
    return [];
  }
}

function saveUserPosts() {
  try {
    localStorage.setItem(LS_POSTS, JSON.stringify(userPosts));
  } catch {
    // ignore
  }
}

function maybeShowWelcome() {
  try {
    if (localStorage.getItem(LS_WELCOME)) return;
  } catch {
    // ignore
  }

  const overlayRoot = must(document.querySelector<HTMLDivElement>("#overlay-root"));
  if (overlayRoot.childElementCount) return;

  overlayRoot.innerHTML = `
    <div class="welcome-backdrop" role="dialog" aria-modal="true" aria-label="EntryPoint — поиск стажировок">
      <div class="welcome">
        <div class="welcome-top">
          <div class="welcome-title">EntryPoint</div>
          <button class="iconbtn" type="button" id="welcome-close" aria-label="Закрыть">×</button>
        </div>
        <div class="welcome-sub">
          Агрегатор IT-стажировок для студентов. Фильтруй вакансии по направлению, стеку, университету и городу — откликайся напрямую в Telegram или по email.
        </div>
        <ul class="welcome-list">
          <li>Умные фильтры — результаты обновляются мгновенно</li>
          <li>Указывай свой курс и GPA — увидишь только подходящие вакансии</li>
          <li>Делись ссылкой на понравившуюся стажировку</li>
          <li>Работодатель? Создай демо-анкету прямо в браузере</li>
        </ul>
        <div class="welcome-actions">
          <button class="btn btn-primary" id="welcome-start" type="button">Начать поиск</button>
          <button class="btn" id="welcome-create" type="button">Создать анкету</button>
        </div>
      </div>
    </div>
  `;

  const start = must(document.querySelector<HTMLButtonElement>("#welcome-start"));
  start.focus();

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
  };

  function close() {
    window.removeEventListener("keydown", onKey);
    try {
      localStorage.setItem(LS_WELCOME, "1");
    } catch {
      // ignore
    }
    hideOverlay();
  }

  must(document.querySelector<HTMLButtonElement>("#welcome-close")).addEventListener("click", close);
  must(document.querySelector<HTMLButtonElement>("#welcome-start")).addEventListener("click", close);
  must(document.querySelector<HTMLButtonElement>("#welcome-create")).addEventListener("click", () => {
    close();
    openCreateModal();
  });

  window.addEventListener("keydown", onKey);

  overlayRoot.querySelector<HTMLElement>(".welcome-backdrop")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) close();
  });
}

function hideOverlay() {
  const overlayRoot = document.querySelector<HTMLDivElement>("#overlay-root");
  if (overlayRoot) overlayRoot.innerHTML = "";
}

// Force show welcome modal (for Intro button) - skips localStorage check
function showWelcomeForced() {
  const overlayRoot = must(document.querySelector<HTMLDivElement>("#overlay-root"));
  if (overlayRoot.childElementCount) return; // Already showing something

  overlayRoot.innerHTML = `
    <div class="welcome-backdrop" role="dialog" aria-modal="true" aria-label="EntryPoint — поиск стажировок">
      <div class="welcome">
        <div class="welcome-top">
          <div class="welcome-title">EntryPoint</div>
          <button class="iconbtn" type="button" id="welcome-close" aria-label="Закрыть">×</button>
        </div>
        <div class="welcome-sub">
          Агрегатор IT-стажировок для студентов. Фильтруй вакансии по направлению, стеку, университету и городу — откликайся напрямую в Telegram или по email.
        </div>
        <ul class="welcome-list">
          <li>Умные фильтры — результаты обновляются мгновенно</li>
          <li>Указывай свой курс и GPA — увидишь только подходящие вакансии</li>
          <li>Делись ссылкой на понравившуюся стажировку</li>
          <li>Работодатель? Создай демо-анкету прямо в браузере</li>
        </ul>
        <div class="welcome-actions">
          <button class="btn btn-primary" id="welcome-start" type="button">Начать поиск</button>
          <button class="btn" id="welcome-create" type="button">Создать анкету</button>
        </div>
      </div>
    </div>
  `;

  const start = must(document.querySelector<HTMLButtonElement>("#welcome-start"));
  start.focus();

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
  };

  function close() {
    window.removeEventListener("keydown", onKey);
    hideOverlay();
  }

  must(document.querySelector<HTMLButtonElement>("#welcome-close")).addEventListener("click", close);
  must(document.querySelector<HTMLButtonElement>("#welcome-start")).addEventListener("click", close);
  must(document.querySelector<HTMLButtonElement>("#welcome-create")).addEventListener("click", () => {
    close();
    openCreateModal();
  });

  window.addEventListener("keydown", onKey);

  overlayRoot.querySelector<HTMLElement>(".welcome-backdrop")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) close();
  });
}
