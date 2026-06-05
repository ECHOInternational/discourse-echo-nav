# ECHO Navigation

**Grafts the ECHOcommunity website's header, navigation, language switcher, and footer onto the
Discourse forum** so `conversations.echocommunity.org` looks and navigates like the rest of
[echocommunity.org](https://www.echocommunity.org).

> **Part of the [ECHOcommunity Discourse setup](https://github.com/ECHOInternational/discourse-infrastructure)** — the self-hosted Discourse at `conversations.echocommunity.org`.
> Family: [infrastructure](https://github.com/ECHOInternational/discourse-infrastructure) · [echo-login](https://github.com/ECHOInternational/discourse-echo-login) · [echo-locale](https://github.com/ECHOInternational/discourse-echo-locale) · **echo-nav** · [ECHOcommunity (main site)](https://github.com/ECHOInternational/ECHOcommunity)

## Overview
The main site exposes its chrome at `/{locale}/remote/{header,navigation,language,footer}`. This
plugin pulls that markup into Discourse's pages (server-side) and re-implements the small amount of
front-end behavior the markup needs, so the forum carries the same branding/nav as the main site.

## How it works
- **Server-side injection:** `register_html_builder('server:header')` and
  `('server:before-body-close')` fetch the remote header/navigation/language/footer from
  `www.echocommunity.org/{I18n.locale}/remote/*`, wrap them in `.echocommunity_core`, and cache
  them in `Rails.cache` (1 day per locale).
- **Front-end behavior** (`assets/javascripts/discourse/initializers/echo-nav.js`, auto-loaded):
  the remote markup is Bootstrap 3, so the initializer re-implements its dropdowns / mobile
  collapse, swaps Font Awesome classes for Discourse's SVG sprite icons (incl. the FA6
  `search → magnifying-glass` rename), and runs the search-mode switcher — all scoped to
  `.echocommunity_core` so Discourse's own UI is untouched.
- **`stylesheets/echo-nav.css`:** a namespaced snapshot of the main site's compiled styles.

## Compatibility & branches
- **Discourse v2026.1 (ESR)** — Rails 8 / Ruby 3.4.
- **Production branch: `v2026.1-compat`** (currently v3.0.2) — what the deploy clones.
- v2026.1 specifics handled: FA6 icon rename (`magnifying-glass`); interactive JS lives in an
  auto-loaded initializer (plain `register_asset` JS is compiled to unused AMD modules and never
  runs on modern Discourse). See `CLAUDE.md` for deeper architecture notes.
- Note: `master` currently matches `v2026.1-compat` (the upgrade PR was merged here).

## Installation
In the Discourse container config / CloudFormation `after_code` hook:
```yaml
- git clone --branch v2026.1-compat https://github.com/ECHOInternational/discourse-echo-nav.git
```

## Notes
- The header/footer markup and CSS are tightly coupled to the main site's output — if
  echocommunity.org changes its `/remote/*` markup or rebrands, styling/JS here may need updating.
