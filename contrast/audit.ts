/**
 * WCAG contrast audit for the Aurora theme.
 *
 * Renders each deck with Marp, reads every text run's colour, size and weight,
 * then hides the text and measures each run against the pixels that were behind
 * it, so gradients, stripes and chips count. A run's ratio is taken at its 1st
 * percentile worst pixel. The page number is measured; blockquote quote marks
 * are decoration and are not.
 *
 *   npx -p @marp-team/marp-cli node contrast/audit.ts [options] [deck.md ...]
 *
 * With no decks it audits demo.md and contrast/*.md. Options:
 *   --theme <css>    theme to audit (default: marp-aurora-theme.css)
 *   --size 16:9|4:3  render at the theme's size preset (the 4K slides)
 *   --scale <n>      judge text at n times its size, e.g. 0.5 for a 4K deck on a
 *                    1080p screen, where less text counts as large
 *   --level aa|aaa   list the runs failing this level and exit with 1 if there
 *                    are any (default: aa)
 *
 * Needs Node 22.18 or later, and Chrome; set CHROME_PATH if it is not at the
 * macOS default.
 */
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";

type Level = "aa" | "aaa";
type Rgb = [number, number, number];
type Rect = [number, number, number, number];

interface SlideSize {
  width: number;
  height: number;
  top: number;
}

interface TextRun {
  slide: number;
  kind: "lead" | "invert" | "light";
  text: string;
  path: string;
  colorText: string;
  rgb: Rgb | null;
  size: number;
  weight: number;
  rects: Rect[];
}

interface MeasuredRun extends TextRun {
  deck: string;
  ratio: number | null;
  background: Rgb | null;
}

const isLevel = (value: string): value is Level =>
  value === "aa" || value === "aaa";

// WCAG large text is 18pt (24px), or 14pt (18.66px) bold.
const isLarge = (size: number, weight: number) =>
  size >= 24 || (size >= 18.66 && weight >= 700);

const requiredRatio = (level: Level, large: boolean) =>
  level === "aa" ? (large ? 3 : 4.5) : large ? 4.5 : 7;

const toHex = (rgb: Rgb) =>
  `#${rgb.map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`;

const root = resolve(import.meta.dirname, "..");
const { values: options, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    theme: { type: "string", default: join(root, "marp-aurora-theme.css") },
    size: { type: "string" },
    scale: { type: "string", default: "1" },
    level: { type: "string", default: "aa" },
  },
});
const { level } = options;
if (!isLevel(level)) {
  console.error(`--level must be aa or aaa, not "${level}"`);
  process.exit(2);
}
const scale = Number(options.scale);

const decks = positionals.length
  ? positionals.map((deck) => resolve(deck))
  : [
      join(root, "demo.md"),
      ...readdirSync(import.meta.dirname)
        .filter((file) => file.endsWith(".md"))
        .map((file) => join(import.meta.dirname, file)),
    ];

// npx -p puts marp on the PATH; puppeteer-core is one of its dependencies.
const marp = spawnSync("sh", ["-c", "command -v marp"], {
  encoding: "utf8",
}).stdout.trim();
if (!marp) {
  console.error(
    "marp not found: run with npx -p @marp-team/marp-cli node contrast/audit.ts",
  );
  process.exit(2);
}
const puppeteer = createRequire(realpathSync(marp))("puppeteer-core");

const tmp = mkdtempSync(join(tmpdir(), "aurora-contrast-"));

// The size presets live in the theme, so a sized copy of the deck selects one.
const sizedCopy = (deck: string, size: string) => {
  const copy = join(tmp, basename(deck));
  writeFileSync(
    copy,
    readFileSync(deck, "utf8").replace(/^---\n/, `---\nsize: ${size}\n`),
  );
  return copy;
};

const auditDeck = async (browser, deck: string): Promise<MeasuredRun[]> => {
  const source = options.size == null ? deck : sizedCopy(deck, options.size);
  const html = join(tmp, `${basename(deck, ".md")}.html`);
  const marpResult = spawnSync(
    marp,
    [
      "--no-config-file",
      "--html",
      "--allow-local-files",
      "--theme-set",
      resolve(options.theme),
      "--template",
      "bare",
      "-o",
      html,
      source,
    ],
    { cwd: dirname(deck), stdio: ["ignore", "ignore", "pipe"] },
  );
  if (marpResult.status !== 0) throw new Error(marpResult.stderr.toString());

  const page = await browser.newPage();
  await page.goto(`file://${html}`, { waitUntil: "networkidle0" });
  // The bare template sizes every slide to the viewport; give each its own size instead.
  const widths: number[] = await page.evaluate(() =>
    [...document.querySelectorAll("svg[data-marpit-svg]")].map((svg) => {
      const [, , width, height] = (svg.getAttribute("viewBox") ?? "")
        .split(" ")
        .map(Number);
      svg.setAttribute(
        "style",
        `width:${width}px!important;height:${height}px!important;display:block`,
      );
      return width;
    }),
  );
  await page.addStyleTag({
    content: "html,body{overflow:visible!important;margin:0}",
  });
  await page.setViewport({ width: Math.max(...widths), height: 720 });
  await page.evaluate(() => document.fonts.ready);

  const found: TextRun[] = await page.evaluate(() => {
    const maybeParseColor = (
      value: string,
    ): [number, number, number] | null => {
      const rgbMatch = value.match(/^rgba?\(([^)]+)\)$/);
      if (rgbMatch) {
        const [, channels] = rgbMatch;
        const [red, green, blue] = channels
          .split(/[ ,/]+/)
          .filter(Boolean)
          .map(Number);
        return [red, green, blue];
      }
      const srgbMatch = value.match(/^color\(srgb ([^)]+)\)$/);
      if (srgbMatch) {
        const [, channels] = srgbMatch;
        const [red, green, blue] = channels
          .split(/[ /]+/)
          .filter(Boolean)
          .map((channel) => Number(channel) * 255);
        return [red, green, blue];
      }
      return null;
    };
    const pathTo = (element: Element | null, section: Element): string[] =>
      element == null || element === section
        ? []
        : [
            ...pathTo(element.parentElement, section),
            element.tagName.toLowerCase() +
              (element.classList.length ? `.${element.classList.item(0)}` : ""),
          ];
    const textNodes = (section: Element): Node[] => {
      const snapshot = document.evaluate(
        ".//text()",
        section,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null,
      );
      return Array.from({ length: snapshot.snapshotLength }, (_, index) =>
        snapshot.snapshotItem(index),
      ).filter((node): node is Node => node != null);
    };
    const sections = [
      ...document.querySelectorAll(
        "svg[data-marpit-svg] > foreignObject > section",
      ),
    ];
    return sections.flatMap((section, slide) => {
      const box = section.getBoundingClientRect();
      const kind = section.classList.contains("lead")
        ? "lead"
        : section.classList.contains("invert")
          ? "invert"
          : "light";
      const textRuns = textNodes(section).flatMap((node) => {
        const element = node.parentElement;
        const text = node.textContent?.trim() ?? "";
        if (element == null || !text) return [];
        const style = getComputedStyle(element);
        if (style.visibility === "hidden") return [];
        const range = document.createRange();
        range.selectNodeContents(node);
        const rects = [...range.getClientRects()]
          .filter(
            (rect) =>
              rect.width > 1 &&
              rect.height > 1 &&
              rect.bottom > box.top &&
              rect.top < box.bottom,
          )
          .map((rect): [number, number, number, number] => [
            rect.left,
            rect.top - box.top,
            rect.right,
            rect.bottom - box.top,
          ]);
        if (!rects.length) return [];
        return [
          {
            slide,
            kind,
            text: text.slice(0, 40),
            path: pathTo(element, section).join(">"),
            colorText: style.color,
            rgb: maybeParseColor(style.color),
            size: parseFloat(style.fontSize),
            weight: Number(style.fontWeight),
            rects,
          },
        ];
      });
      // The page number is generated content, so measure the box Gaia puts it in.
      const after = getComputedStyle(section, "::after");
      const pageNumber = ["none", "normal"].includes(after.content)
        ? []
        : [
            {
              slide,
              kind,
              text: "page number",
              path: "section::after",
              colorText: after.color,
              rgb: maybeParseColor(after.color),
              size: parseFloat(after.fontSize),
              weight: Number(after.fontWeight),
              rects: [
                [
                  box.right - 115,
                  box.height - 55,
                  box.right - 25,
                  box.height - 15,
                ],
              ],
            },
          ];
      return [...textRuns, ...pageNumber];
    });
  });

  // Hide the text, then read what was behind it, one slide at a time.
  await page.addStyleTag({
    content: `section, section *, section::after, section *::before, section *::after {
      color: transparent !important; -webkit-text-fill-color: transparent !important;
      text-shadow: none !important; text-decoration-color: transparent !important; }`,
  });
  const slides: SlideSize[] = await page.evaluate(() =>
    [...document.querySelectorAll("svg[data-marpit-svg]")].map((svg) => {
      const { width, height, top } = svg.getBoundingClientRect();
      return { width, height, top: top + scrollY };
    }),
  );
  const measured = await Array.fromAsync(
    slides.entries(),
    async ([slide, { width, height, top }]) => {
      const png = await page.screenshot({
        clip: { x: 0, y: top, width, height },
        captureBeyondViewport: true,
        encoding: "base64",
      });
      return page.evaluate(
        async (png: string, slideRuns: TextRun[]) => {
          const linear = (channel: number) => {
            const value = channel / 255;
            return value <= 0.04045
              ? value / 12.92
              : ((value + 0.055) / 1.055) ** 2.4;
          };
          const luminance = ([red, green, blue]: ArrayLike<number> &
            Iterable<number>) =>
            0.2126 * linear(red) +
            0.7152 * linear(green) +
            0.0722 * linear(blue);
          const bitmap = await createImageBitmap(
            await (await fetch(`data:image/png;base64,${png}`)).blob(),
          );
          const context = new OffscreenCanvas(
            bitmap.width,
            bitmap.height,
          ).getContext("2d");
          if (context == null) throw new Error("no 2D canvas context");
          context.drawImage(bitmap, 0, 0);
          const { data, width, height } = context.getImageData(
            0,
            0,
            bitmap.width,
            bitmap.height,
          );
          return slideRuns.map((run) => {
            if (run.rgb == null)
              return { ...run, ratio: null, background: null };
            const foreground = luminance(run.rgb);
            // Hot loop over every pixel behind the text: plain loops on purpose.
            const samples: [number, number][] = [];
            for (const [left, top, right, bottom] of run.rects)
              for (
                let y = Math.max(0, Math.ceil(top));
                y < Math.min(height, Math.floor(bottom));
                y++
              )
                for (
                  let x = Math.max(0, Math.ceil(left));
                  x < Math.min(width, Math.floor(right));
                  x++
                ) {
                  const offset = (y * width + x) * 4;
                  const background = luminance(
                    data.subarray(offset, offset + 3),
                  );
                  samples.push([
                    (Math.max(foreground, background) + 0.05) /
                      (Math.min(foreground, background) + 0.05),
                    offset,
                  ]);
                }
            samples.sort(([a], [b]) => a - b);
            const worst = samples.at(Math.floor(samples.length * 0.01));
            if (worst == null) return { ...run, ratio: null, background: null };
            const [ratio, offset] = worst;
            const [red, green, blue] = data.subarray(offset, offset + 3);
            return { ...run, ratio, background: [red, green, blue] };
          });
        },
        png,
        found.filter((run) => run.slide === slide),
      );
    },
  );
  await page.close();
  return measured.flat().map((run) => ({ ...run, deck: basename(deck) }));
};

const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const runs = await (async () => {
  try {
    return (
      await Array.fromAsync(decks, (deck) => auditDeck(browser, deck))
    ).flat();
  } finally {
    await browser.close();
    rmSync(tmp, { recursive: true, force: true });
  }
})();

const judged = runs.map((run) => {
  const scaledSize = run.size * scale;
  const large = isLarge(scaledSize, run.weight);
  const ratio = run.ratio ?? 0;
  return {
    ...run,
    scaledSize,
    large,
    aa: ratio >= requiredRatio("aa", large),
    aaa: ratio >= requiredRatio("aaa", large),
    label: `${run.kind}|${run.path.replace(/^.*>span\.(hljs-[\w-]+)$/, "$1")}|${
      run.rgb == null ? run.colorText : toHex(run.rgb)
    }`,
  };
});
const unmeasured = judged.filter((run) => run.ratio == null);
const measured = judged.filter((run) => run.ratio != null);
const failing = measured.filter((run) => !run[level]);

console.log(
  `${measured.length} text runs, ${measured.filter((run) => !run.aa).length} fail AA, ${
    measured.filter((run) => !run.aaa).length
  } fail AAA`,
);
unmeasured.forEach((run) =>
  console.log(
    `not measured: "${run.text}" (${run.deck} #${run.slide + 1}), ${
      run.rgb == null
        ? `unknown colour ${run.colorText}`
        : "no pixels on the slide"
    }`,
  ),
);

const lowestRatio = (group: typeof failing) =>
  Math.min(...group.map((run) => run.ratio ?? 0));
[...Map.groupBy(failing, (run) => run.label)]
  .sort(([, a], [, b]) => lowestRatio(a) - lowestRatio(b))
  .forEach(([label, group]) => {
    const worst = group.reduce((a, b) =>
      (a.ratio ?? 0) < (b.ratio ?? 0) ? a : b,
    );
    console.log(
      `${(worst.ratio ?? 0).toFixed(2)} need ${requiredRatio(level, worst.large)} ${label} on ${
        worst.background == null ? "?" : toHex(worst.background)
      } ${+worst.scaledSize.toFixed(1)}px/${worst.weight} x${group.length} e.g. "${worst.text}" (${worst.deck} #${worst.slide + 1})`,
    );
  });

process.exit(
  failing.length || unmeasured.some((run) => run.rgb == null) ? 1 : 0,
);
