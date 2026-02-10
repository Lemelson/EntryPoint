type MatrixOptions = {
  enabled: boolean;
  color: string;
};

type MatrixBadgeOptions = {
  enabled: boolean;
  color: string;
};

export function createMatrixBackground(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { setEnabled: (_: boolean) => {}, setColor: (_: string) => {} };
  // TS doesn't keep the null-narrowing for captured variables inside RAF callbacks.
  const context = ctx;

  const opts: MatrixOptions = {
    enabled: true,
    color: "#56ff8a",
  };

  let raf = 0;
  let lastTs = 0;
  let width = 0;
  let height = 0;
  let cols = 0;
  let drops: number[] = [];

  const charsets = [
    "0123456789",
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "abcdefghijklmnopqrstuvwxyz",
    "アイウエオカキクケコサシスセソタチツテトナニヌネノ",
    "△◇◆○●★☆+=#@",
  ];
  const chars = charsets.join("");
  const fontSize = 14;
  const cell = 20; // more vertical spacing inside a column (readable glyphs, less overlap)
  const speed = 0.30; // rows per frame at ~30FPS

  const dpr = () => Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  function resize() {
    width = Math.floor(window.innerWidth);
    height = Math.floor(window.innerHeight);
    const ratio = dpr();

    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    cols = Math.ceil(width / cell);
    const rows = Math.max(1, Math.ceil(height / cell));
    // Start at random row positions so the effect looks alive immediately (no "first sweep").
    drops = new Array(cols).fill(0).map(() => Math.floor(Math.random() * rows));
  }

  function draw(ts: number) {
    // Throttle to ~30 FPS: less annoying + less CPU/GPU load.
    if (ts - lastTs < 33) {
      raf = requestAnimationFrame(draw);
      return;
    }
    lastTs = ts;

    if (!opts.enabled) {
      context.clearRect(0, 0, width, height);
      raf = requestAnimationFrame(draw);
      return;
    }

    // Trail fade
    // Slightly longer trails (less "flickery").
    context.fillStyle = "rgba(7, 10, 10, 0.06)";
    context.fillRect(0, 0, width, height);

    context.fillStyle = opts.color;
    context.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;

    for (let i = 0; i < drops.length; i++) {
      const text = chars.charAt((Math.random() * chars.length) | 0);
      const x = i * cell;
      // Keep glyphs aligned to the grid (avoid subpixel blur / "overlap" look).
      const y = Math.floor(drops[i]) * cell;
      context.fillText(text, x, y);

      if (y > height && Math.random() > 0.985) drops[i] = 0;
      drops[i] += speed;
    }

    raf = requestAnimationFrame(draw);
  }

  const onResize = () => resize();
  window.addEventListener("resize", onResize, { passive: true });
  resize();
  raf = requestAnimationFrame(draw);

  function setEnabled(enabled: boolean) {
    opts.enabled = enabled;
  }
  function setColor(color: string) {
    opts.color = color;
  }

  return { setEnabled, setColor };
}

export function createMatrixBadge(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { setEnabled: (_: boolean) => {}, setColor: (_: string) => {} };
  const context = ctx;

  const opts: MatrixBadgeOptions = {
    enabled: true,
    color: "#56ff8a",
  };

  const charsets = [
    "0123456789",
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "abcdefghijklmnopqrstuvwxyz",
    "アイウエオカキクケコサシスセソタチツテトナニヌネノ",
    "△◇◆○●★☆+=#@",
  ];
  const chars = charsets.join("");

  let raf = 0;
  let lastTs = 0;
  let width = 0;
  let height = 0;
  let cols = 0;
  let drops: number[] = [];

  const fontSize = 10;
  const cell = 14;
  const speed = 0.38;
  const dpr = () => Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    const ratio = dpr();

    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    cols = Math.max(1, Math.ceil(width / cell));
    const rows = Math.max(1, Math.ceil(height / cell));
    drops = new Array(cols).fill(0).map(() => Math.floor(Math.random() * rows));
  }

  function draw(ts: number) {
    if (ts - lastTs < 33) {
      raf = requestAnimationFrame(draw);
      return;
    }
    lastTs = ts;

    if (!opts.enabled) {
      context.clearRect(0, 0, width, height);
      raf = requestAnimationFrame(draw);
      return;
    }

    context.fillStyle = "rgba(7, 10, 10, 0.18)";
    context.fillRect(0, 0, width, height);

    context.fillStyle = opts.color;
    context.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;

    for (let i = 0; i < drops.length; i++) {
      const text = chars.charAt((Math.random() * chars.length) | 0);
      const x = i * cell;
      const y = Math.floor(drops[i]) * cell;
      context.fillText(text, x, y);

      if (y > height && Math.random() > 0.985) drops[i] = 0;
      drops[i] += speed;
    }

    raf = requestAnimationFrame(draw);
  }

  const onResize = () => resize();
  window.addEventListener("resize", onResize, { passive: true });
  // Resize after mount so getBoundingClientRect() is correct.
  queueMicrotask(() => resize());
  raf = requestAnimationFrame(draw);

  function setEnabled(enabled: boolean) {
    opts.enabled = enabled;
  }
  function setColor(color: string) {
    opts.color = color;
  }

  return { setEnabled, setColor };
}
