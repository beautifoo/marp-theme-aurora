---
marp: true
theme: aurora
paginate: true
---

# Aurora Theme Demo

This presentation tests the customizable **Aurora Marp theme**.

---

## Typography and Links

This slide demonstrates:

- List formatting
  - Nested item
    - Deeply nested item
- **Bold**, *Italic*, and ~~Strikethrough~~
- Link to [somewhere](https://lorenzopieri.dev)

---

## Table

| ID    | [Description](https://example.com)  | <mark>Status</mark> |
|-------|-------------------------------------|---------------------|
| # 101 | Login button unresponsive on mobile | Open                |
| # 102 | Incorrect total in shopping cart    | In Progress         |
| # 103 | Profile picture upload fails        | Resolved            |
| # 104 | 404 error on FAQ page               | Won't Fix           |
| # 105 | Search results not paginated        | In Review           |

---

## Code

Inline code: `CONSTANT`

Block code:

```js
"use strict"
// Greet someone, without the spaces
const spaces = /\s+/g
function greet(name, times = 2) {
  return `Hi ${name.replace(spaces, "")}! `.repeat(times)
}
```

```css
#app .card:hover { color: crimson; padding: 0.5em; }
```

---

## Blockquote

> Design is not just what it looks like and feels like. Design is how it works.
> — Steve Jobs
>
> > A quote inside a quote keeps the outer stripe only.

---

<!-- _header: Header
_footer: Footer -->

## Header & Footer

This slide shows the header and the footer in action.

---

<!-- _class: lead -->

## Lead Slide

This slide uses the `lead` style with a vibrant background and white highlights.

> Make a bold first impression <mark>about something significant</mark>.
>
> > Then keep it short.

- One idea per slide
- Big text, few words

---

<!-- _class: lead
_header: Header with a `chip`
_footer: Footer with a `chip` -->

## Code on a Lead Slide

```js
"use strict"
// Greet someone, without the spaces
const spaces = /\s+/g
function greet(name, times = 2) {
  return `Hi ${name.replace(spaces, "")}! `.repeat(times)
}
```

```css
#app .card:hover { color: crimson; padding: 0.5em; }
```

---

<!-- _class: invert -->

## Invert Slide

This slide uses the `invert` style with a dark background and bright highlights.

| Highlight in [links](https://example.com) | Highlight in <mark>marks</mark> |
|-------------------------------------------|---------------------------------|
| Also applies to block borders             | And to the top stripe           |

> It brings contrast and clarity — <mark>perfect for emphasis</mark>.

---

<!-- _class: invert -->

## Code on an Invert Slide

```js
"use strict"
// Greet someone, without the spaces
const spaces = /\s+/g
function greet(name, times = 2) {
  return `Hi ${name.replace(spaces, "")}! `.repeat(times)
}
```

```css
#app .card:hover { color: crimson; padding: 0.5em; }
```

---

<!-- _class: lead invert -->

## Lead and Invert Together

Both classes at once: code chips like `this` and code blocks stay white.

```js
const classes = ["lead", "invert"] // both at once
```
