# aurora

**Aurora** is a customizable theme for [Marp](https://marp.app/), designed to create visually appealing presentations.

## Features

- **Customizable Colors and Fonts**: Built with Gaia-compatible variables for easy customization.
- **Code Blocks**: Styled for readability with a highlight stripe.
- **Tables and Blockquotes**: Clean and professional formatting.
- **Slide Variants**: A dawn-sky `lead` and a night-sky `invert` for emphasis.
- **Accessible Contrast**: WCAG AAA contrast at the default size. See [Accessibility](#accessibility).
- **Images and Emoji**: Images are centered on a line of their own, and emoji stay inline at text size.
- **Slide Videos**: With Marp CLI, a video can autoplay on its slide, and a click opens it full-window.
- **Pagination**: Displays current and total slide numbers.

## Demo

Check out the [demo.md](demo.md) file for an example presentation using the Aurora theme.

## Usage

1. Install the [Marp for VS Code](https://marketplace.visualstudio.com/items?itemName=marp-team.marp-vscode) extension.

2. Add the `marp-aurora-theme.css` theme to your Marp configuration:

    ```json
    {
        "markdown.marp.themes": [
            "https://raw.githubusercontent.com/beautifoo/marp-theme-aurora/refs/heads/main/marp-aurora-theme.css"
        ]
    }
    ```

3. Create a Markdown file with the following front matter:

    ```yaml
    ---
    marp: true
    theme: aurora
    paginate: true
    ---
    ```

4. Write your slides in Markdown and preview them in VS Code.

## Marp CLI

[Marp CLI](https://github.com/marp-team/marp-cli) reads the `.marprc.yml` in the folder you run it from. The one
here registers the theme and allows local files, so from this folder:

```sh
npx @marp-team/marp-cli demo.md        # demo.html
npx @marp-team/marp-cli --pdf demo.md  # demo.pdf
```

From another folder, pass it with `--config-file path/to/.marprc.yml`.

## Slide Videos

The `.marprc.yml` also loads `marp-engine.mjs`, which handles videos on slides:

```html
<video data-autoplay src="./clip.mp4" poster="./clip.png"></video>
```

- **Autoplay** (opt-in with `data-autoplay`): the video plays muted from the start when its slide comes up, and pauses
  when the deck moves on. Only in the audience window, not in the presenter view.
- **Full-window player**: a click on any slide video opens it full-window with working controls, at the same position.
  Esc or a click on the backdrop closes it, and the slide video moves to where the full-window one stopped.
- **No inline controls**: inside Marp's scaled slides, Safari draws native controls at the wrong scale and Chromium
  shows them only while the pointer moves, so the theme and the engine hide them.

## Accessibility

- **Contrast**: At the default 1280×720 size, the theme's text meets WCAG AAA contrast (success criterion 1.4.6).
  On the 4K presets, shown on a 1080p screen, it meets AA. The contrast audit below measures these levels on the demo.
- **Lead slides**: Above the thin horizon line at the bottom edge, the sky keeps white text at 4.5:1 or more. That is
  AAA for large text, and the theme's text sizes are large: 33px body text, and 19px bold header, footer and page
  number. Text that you add below 24px, or below 18.66px if bold, is only sure to meet AA. An example is `<small>` in a
  header or footer.
- **Emphasis**: A mark is a highlighter box, and a strong word in a heading is extra bold. So neither stands apart from
  the text around it by color alone (success criterion 1.4.1).
- **Custom colors**: The skies and accents are mixed from `--color-primary`, `--color-secondary` and `--color-tint`.
  The levels above apply to the default palette, so run the audit again after you change it.
- **Motion**: In the HTML presenter, the horizon glow on a lead slide rises over 5 seconds when the slide opens. While
  it rises the glow is dimmer, and the audit gives the same results at the start and halfway. PDF, PNG and PPTX exports
  show the risen sky, and so do viewers who ask for reduced motion.

### Contrast audit

`contrast/audit.ts` renders `demo.md`, then measures each text run against the pixels behind it. The demo shows every
slide type and layout case the theme styles, so keep that when you change it. The audit needs Node 22.18 or later and
Google Chrome.

```sh
npx -p @marp-team/marp-cli node contrast/audit.ts                           # AA, 1280×720
npx -p @marp-team/marp-cli node contrast/audit.ts --level aaa               # AAA, 1280×720
npx -p @marp-team/marp-cli node contrast/audit.ts --size 16:9 --scale 0.5   # AA, 4K deck on a 1080p screen
```

## Extensions

To enhance your Markdown editing experience, install the following extensions:

- [Markdown Emoji](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-emoji)
- [markdownlint](https://marketplace.visualstudio.com/items?itemName=davidanson.vscode-markdownlint)

## License

This project is licensed under the [MIT License](./LICENSE).
