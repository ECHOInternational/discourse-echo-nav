import { withPluginApi } from "discourse/lib/plugin-api";
import $ from "jquery";

// The ECHOcommunity header/nav/footer markup is injected server-side by this
// plugin (see plugin.rb) and is Bootstrap-3 markup. Discourse no longer runs
// plain `register_asset` JS — it compiles those files into AMD modules that are
// never imported, so the old vendored Bootstrap + echo-shim never executed.
//
// This initializer is auto-loaded by Discourse (it lives under
// assets/javascripts/discourse/initializers) and re-implements exactly the two
// Bootstrap behaviours the remote markup relies on — dropdowns and the mobile
// navbar collapse — plus the icon swap and search-mode switcher the old shim
// provided. The existing echo-nav.css already styles `.open > .dropdown-menu`
// and `.collapse.in`, so we only need to toggle those classes.

// `search_types` is declared with `let` in an inline <script> in the remote
// header, so it is a global lexical binding (not a property of `window`).
// Read it by bare name, falling back defensively.
function getSearchTypes() {
  try {
    // eslint-disable-next-line no-undef
    return typeof search_types !== "undefined" ? search_types : window.search_types;
  } catch (e) {
    return window.search_types;
  }
}

function buildSearchDropdown(searchTypes, searchType) {
  const html = [
    `<li><a href='#' class='search_mode current' data-type='${searchType}'>` +
      `${searchTypes[searchType].name} <span class='caret'></span></a></li>`,
  ];
  for (const type in searchTypes) {
    if (type !== searchType) {
      html.push(
        `<li><a href='#' class='search_mode' data-type='${type}'>` +
          `${searchTypes[type].name}</a></li>`
      );
    }
  }
  return html.join("");
}

function chooseSearchType(searchType) {
  const searchTypes = getSearchTypes();
  if (!searchTypes || !searchTypes[searchType]) {
    return;
  }
  const selection = $(".echocommunity_core .current_selection");
  $('.echocommunity_core input[name="search_type"]').val(searchType);
  selection.html(searchTypes[searchType].name);
  const placeholder = selection.is(":hidden")
    ? searchTypes[searchType].placeholder_long
    : searchTypes[searchType].placeholder_short;
  $(".echocommunity_core .search_terms").attr("placeholder", placeholder);
  $(".echocommunity_core .search-dropdown-menu").html(
    buildSearchDropdown(searchTypes, searchType)
  );
}

// The remote header markup ships an inline <script> that tries to pick the
// default search mode by calling the old global `choose_search_type()`. That
// global no longer exists (it now lives in this module), so the inline script
// throws and the default is never applied. Reproduce its intent here: on the
// Discourse host, default to "conversations"; elsewhere, "resources".
function applyDefaultSearchType() {
  if (!$(".echocommunity_core .multimode-search").length) {
    return;
  }
  const onConversations =
    window.location.host === "conversations.echocommunity.org";
  chooseSearchType(onConversations ? "conversations" : "resources");
}

// Discourse ships icons as an SVG sprite, not the Font Awesome webfont, so the
// remote markup's `<i class="fa fa-*">` tags render nothing. Swap them for the
// inline SVG references Discourse understands. Scoped to `.echocommunity_core`
// so we never touch Discourse's own icons. `phone` is registered in plugin.rb;
// `search`/`user` are core icons already in the sprite.
function replaceIcons() {
  const swaps = {
    "fa-search": "search",
    "fa-phone": "phone",
    "fa-user": "user",
  };
  Object.keys(swaps).forEach((faClass) => {
    const icon = swaps[faClass];
    $(`.echocommunity_core .${faClass}`).replaceWith(
      `<svg class='fa d-icon d-icon-${icon} svg-icon svg-node' aria-hidden='true'>` +
        `<use href='#${icon}'></use></svg>`
    );
  });
}

function closeAllDropdowns() {
  $(".echocommunity_core .open").removeClass("open");
}

export default {
  name: "echo-nav",

  initialize() {
    withPluginApi("0.8.31", (api) => {
      // Bootstrap-3 dropdown toggle (search switcher + the 7 nav menus).
      $(document).on(
        "click.echoNav",
        '.echocommunity_core [data-toggle="dropdown"]',
        function (e) {
          e.preventDefault();
          const parent = $(this).parent();
          const willOpen = !parent.hasClass("open");
          closeAllDropdowns();
          parent.toggleClass("open", willOpen);
        }
      );

      // Bootstrap-3 collapse toggle (mobile navbar hamburger).
      $(document).on(
        "click.echoNav",
        '.echocommunity_core [data-toggle="collapse"]',
        function (e) {
          e.preventDefault();
          const target = $(this).data("target") || $(this).attr("href");
          if (target) {
            $(target).toggleClass("in");
          }
        }
      );

      // Search-mode switcher; also closes the dropdown after a choice.
      $(document).on(
        "click.echoNav",
        ".echocommunity_core .search_mode",
        function (e) {
          e.preventDefault();
          chooseSearchType($(e.currentTarget).data("type"));
          closeAllDropdowns();
        }
      );

      // Click anywhere outside a toggle/menu closes open dropdowns. This runs
      // after the delegated handlers above (jQuery fires document-bound
      // handlers last), so opening a dropdown is not immediately undone.
      $(document).on("click.echoNav", function (e) {
        if (
          !$(e.target).closest(
            '.echocommunity_core [data-toggle="dropdown"], .echocommunity_core .dropdown-menu'
          ).length
        ) {
          closeAllDropdowns();
        }
      });

      // The header is server-rendered into the static page shell, so it exists
      // at boot; re-run on page changes to cover any re-render.
      api.onPageChange(() => replaceIcons());
      replaceIcons();

      // Set the default search mode once at boot. Not on page change — that
      // would clobber a selection the user made and then navigated away from.
      applyDefaultSearchType();
    });
  },
};
