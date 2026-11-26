# aurora

**Aurora** is a customizable theme for [Marp](https://marp.app/), designed to create visually appealing presentations.

## Features

- **Customizable Colors and Fonts**: Built with Gaia-compatible variables for easy customization.
- **Code Blocks**: Styled for readability with a highlight stripe.
- **Tables and Blockquotes**: Clean and professional formatting.
- **Slide Variants**: A dawn-sky `lead` and a night-sky `invert` for emphasis.
- **Accessible Contrast**: WCAG AAA contrast at the default size. See [Accessibility](#accessibility).
- **Images and Emoji**: Images are centered on a line of their own, and emoji stay inline at text size.
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

## Accessibility

- **Contrast**: At the default 1280×720 size, the theme's text meets WCAG AAA contrast (success criterion 1.4.6).
  On the 4K presets, shown on a 1080p screen, it meets AA.
- **Lead slides**: Above the thin horizon line at the bottom edge, the sky keeps white text at 4.5:1 or more. That is
  AAA for the theme's large text sizes. Smaller text that you add, for example with `<small>`, meets AA only.
- **Custom colors**: The skies and accents are mixed from `--color-primary`, `--color-secondary` and `--color-tint`.
  The levels above apply to the default palette, so run the audit again after you change it.
- **Motion**: In the HTML presenter, the horizon glow on a lead slide rises over 6 seconds when the slide opens. PDF,
  PNG and PPTX exports show the risen sky, and so do viewers who ask for reduced motion.

### Contrast audit

`contrast/audit.mjs` renders the demo and the stress decks in `contrast/`. Then it measures each text run against the
pixels behind it. It needs Google Chrome.

```sh
npx -p @marp-team/marp-cli node contrast/audit.mjs                           # AA, 1280×720
npx -p @marp-team/marp-cli node contrast/audit.mjs --level aaa               # AAA, 1280×720
npx -p @marp-team/marp-cli node contrast/audit.mjs --size 16:9 --scale 0.5   # AA, 4K deck on a 1080p screen
```

## Extensions

To enhance your Markdown editing experience, install the following extensions:

- [Markdown Emoji](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-emoji)
- [markdownlint](https://marketplace.visualstudio.com/items?itemName=davidanson.vscode-markdownlint)

## License

This project is licensed under the [MIT License](./LICENSE).
