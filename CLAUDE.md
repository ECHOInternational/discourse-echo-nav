# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A [Discourse](https://www.discourse.org/) plugin (`# name: ECHO Navigation`) that grafts ECHOcommunity's site-wide header, navigation, language switcher, and footer onto the top/bottom of the Discourse forum (conversations.echocommunity.org) so the forum visually matches the main site at echocommunity.org.

There is no build, lint, or test tooling — the repo is the deployable artifact. Discourse loads `plugin.rb` and compiles the assets. "Testing" means running it inside a Discourse instance (a container rebuild — `./launcher rebuild app` — is the reliable way to pick up changes, especially when asset files are added or removed).

## How it fits together

`plugin.rb` is the entry point and does two distinct things:

1. **Registers assets / icons** — `register_asset "stylesheets/echo-nav.css"` and `register_svg_icon "phone"`. The interactive JavaScript is **not** registered here; it lives in the auto-loaded initializer tree (see below).
2. **Injects remote HTML at request time** via `register_html_builder` for two hook points: `server:header` (header + navigation + language) and `server:before-body-close` (footer). Each builder fetches HTML over HTTP from `https://www.echocommunity.org/#{I18n.locale}/remote/*` endpoints (via `URI.open`) and wraps it in `.echocommunity_core` containers.

The key architectural fact: **the markup this plugin styles and scripts is not in this repo** — it is fetched live from echocommunity.org's `/remote/header`, `/remote/navigation`, `/remote/language`, and `/remote/footer` endpoints (served by the `RemoteController` in the `ECHOcommunity` Rails app, one directory up). CSS class names and DOM structure that the CSS and initializer target are defined by that remote service. Changes to the remote markup can silently break the styling/JS here. The remote header also embeds two inline `<script>` blocks: one defining a `search_types` global (data the initializer reads), and one that *used* to set the default search mode by calling a global function — see the JS notes below.

Responses are cached in `Rails.cache` keyed by locale (`header_#{I18n.locale}`, `footer_#{I18n.locale}`) with a 1-day TTL, so edits to remote markup take up to a day to appear, and HTTP fetch failures are caught and rendered inline as `"An Error Occurred: ..."`.

## ⚠️ The Discourse-version JS gotcha (most important thing to know)

On Discourse 3.x, **plain JavaScript registered via `register_asset "foo.js"` is compiled into an AMD `define(...)` module that nothing imports, so it never executes.** This silently broke the plugin on Discourse 3.0.6 (dropdowns, mobile collapse, icon swap, search switcher all dead) even though the files loaded in the page. Do **not** add interactive JS via `register_asset`.

Interactive behavior instead lives in **`assets/javascripts/discourse/initializers/echo-nav.js`**, which Discourse auto-loads and runs. It uses `withPluginApi` and `import $ from "jquery"` (don't rely on a global `$`). It re-implements, scoped to `.echocommunity_core`:

- The Bootstrap-3 **dropdown** and mobile-navbar **collapse** toggles (the remote markup is Bootstrap 3 and uses `data-toggle="dropdown"`/`"collapse"`; the existing CSS already styles `.open > .dropdown-menu` and `.collapse.in`, so the JS only toggles those classes). This is why the vendored Bootstrap 3 JS was removed — only those two behaviors were ever needed.
- The **Font Awesome → SVG swap**: Discourse ships icons as an SVG sprite (no FA webfont), so the remote markup's `<i class="fa fa-*">` render nothing until swapped for `<svg><use href="#..."></use></svg>`. Scoping to `.echocommunity_core` keeps it from touching Discourse's own icons.
- The **search-mode switcher** (reads the `search_types` global) and the **default search type** (the remote inline script called a global `choose_search_type()` that no longer exists, so the initializer sets the default itself — "conversations" on the Discourse host).

## The CSS

`assets/stylesheets/echo-nav.css` — ~4200 lines, almost entirely namespaced under `.echocommunity_core` to scope it away from Discourse's own styles. It is a **static snapshot of echocommunity.org's compiled Bootstrap + custom styles**, so it drifts when the main site rebrands. When colors look "off," compare against the live brand variables in `../ECHOcommunity/app/assets/stylesheets/base.css.scss` (e.g. the navbar underline tracks `$echoPrimaryLightGreen` = `$lochinvar` `#006552`; `.btn-success` tracks `$brand-success` `#42A55E`, with hover/active/border shades derived via Bootstrap's `darken()`). The namespacing pass also mangled some Bootstrap selectors (e.g. `.open > .dropdown-toggle.echocommunity_core .btn-default`); the functionally important rules still work.

## Conventions

- Any new SVG icon the initializer references (e.g. `phone`) must also be registered in `plugin.rb` with `register_svg_icon`, or Discourse won't render it. (`search`/`user` are core icons already in the sprite.)
- The plugin version lives in the `# version:` header of `plugin.rb`. Releases are tagged commits named after that version (e.g. `v3.0.1`); bump the header and tag to match when releasing. The default branch is `master`. (There is also a long-lived `v3.0.0` branch that was used for staging; `master` now contains the current code.)
- Files use tab indentation (`plugin.rb`); the JS initializer uses standard 2-space JS style.

## Related

- The remote endpoints live in `../ECHOcommunity` (Rails app). A known templating bug in its `app/views/shared/_nav_universal.html.erb` (default search type uses `controller.action_name`, always `"header"` under the remote route) is tracked in ECHOInternational/ECHOcommunity#162 — low impact, the initializer works around it.
