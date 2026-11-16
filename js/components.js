/*
 * components.js
 * the building blocks every screen is made from: buttons, chips, switches,
 * tags, empty states, the filter and sort toolbar, modals, menus, toasts and
 * banners. screens call these instead of writing their own html, so the
 * whole app looks and behaves the same everywhere.
 * you can see every one of them on the design system page, #/design.
 *
 * writing style: titles, buttons and labels use title case, e.g. "Book a Room".
 * sentences, like descriptions and messages, use normal sentence case.
 */

// ---------------------------------------------------------------- buttons

// one button. kind is "primary", "secondary", "danger", "danger-solid" or "ghost".
// give it href to make it a link, or onclick to run a function
//   btn("Directions", { kind: "primary", icon: "walk", href: "#/find/lib2/go" })
function btn(label, { kind = "secondary", icon: iconName, size, href, onclick, disabled, wide, ariaLabel, id } = {}) {
  const classes = ["btn", `btn-${kind}`, size === "small" ? "btn-small" : "", wide ? "btn-wide" : "", label ? "" : "btn-icon"].join(" ");
  const inside = `${iconName ? icon(iconName, size === "small" ? 16 : 18) : ""}${label ? `<span>${label}</span>` : ""}`;
  const extra = `${ariaLabel ? `aria-label="${ariaLabel}"` : ""} ${id ? `id="${id}"` : ""}`;
  if (href && !disabled) return `<a class="${classes}" href="${href}" ${extra}>${inside}</a>`;
  return `<button class="${classes}" ${onclick ? `onclick="${onclick}"` : ""} ${disabled ? "disabled" : ""} ${extra}>${inside}</button>`;
}

// ---------------------------------------------------------------- small pieces

// a round number badge, e.g. the count next to "Best Matches"
function badge(count, strong = false) {
  return `<span class="badge ${strong ? "badge-strong" : ""}">${count}</span>`;
}

// the busyness word on its colour, e.g. "Quiet" on green
function busyTag(space, big = false) {
  const label = busyLabel(space);
  return `<span class="tag tag-${label.colour} ${big ? "tag-big" : ""}">${label.text}</span>`;
}

// the match score as a small pill, e.g. "86/100"
function scoreTag(space) {
  return `<span class="score" title="Match score out of 100">${matchScore(space)}<small>/100</small></span>`;
}

// a pill you can switch on and off, e.g. a filter
function chip(label, { iconName, on = false, onclick, removable = false } = {}) {
  return `<button class="chip ${on ? "chip-on" : ""}" aria-pressed="${on}" onclick="${onclick}">
    ${on && !removable ? icon("check", 16) : iconName ? icon(iconName, 16) : ""}
    <span>${label}</span>${removable ? icon("close", 14) : ""}
  </button>`;
}

// a row of joined buttons where one is picked, e.g. walking distance.
// options is a list of { value, label }, and action(value) gives the onclick
function segmented(options, current, action, ariaLabel = "") {
  return `<div class="segmented" role="group" aria-label="${ariaLabel}">
    ${options.map(option => {
      const on = option.value === current;
      return `<button class="${on ? "on" : ""}" aria-pressed="${on}" onclick="${action(option.value)}">${option.label}</button>`;
    }).join("")}
  </div>`;
}

// an on/off switch, like on a phone
function switchToggle(on, label, onclick) {
  return `<button class="switch ${on ? "on" : ""}" role="switch" aria-checked="${on}" aria-label="${label}" onclick="${onclick}"><span></span></button>`;
}

// the heading at the top of a normal page
function pageHead(title, subtitle = "") {
  return `<header class="page-head"><h1>${title}</h1>${subtitle ? `<p class="muted">${subtitle}</p>` : ""}</header>`;
}

// shown when a list has nothing in it, with buttons to get out of it
function emptyState({ iconName = "info", title, text = "", actions = "" }) {
  return `<div class="empty">
    <span class="empty-icon">${icon(iconName, 26)}</span>
    <p><strong>${title}</strong></p>
    ${text ? `<p class="muted">${text}</p>` : ""}
    ${actions ? `<div class="empty-actions">${actions}</div>` : ""}
  </div>`;
}

// a row of small pills, each an icon and a few words, e.g. "Library", "Fits 6", "9 min walk".
// used for the key facts about a space, so they never look like a plain line of text
//   facts([["building", "Library"], ["people", "Fits 6"]])
function facts(items) {
  return `<span class="facts">${items.map(([iconName, text]) => `<span>${icon(iconName, 15)}${text}</span>`).join("")}</span>`;
}

// a coloured box with an icon and a message. kind is "good", "warn" or "info"
function notice(kind, text) {
  return `<div class="notice notice-${kind}">${icon(kind === "good" ? "check" : kind === "warn" ? "alert" : "info", 18)}<span>${text}</span></div>`;
}

// ---------------------------------------------------------------- filter and sort toolbar

// the filters and sort buttons side by side, then the switched-on filters
// underneath. listName is "find" or "book"
function toolbar(listName) {
  return `${toolbarButtons(listName)}${activeFilters(listName)}`;
}

// just the two buttons: filters, which opens a modal, and sort, which opens a menu.
// lab 7 fix: the filters button always says how many filters are on
function toolbarButtons(listName) {
  const prefs = data[listName];
  const sort = SORTS.find(s => s.id === prefs.sort);
  return `<div class="toolbar">
    <button class="btn btn-secondary toolbar-btn" onclick="openFilters('${listName}')">
      ${icon("filter", 18)}<span>Filters</span>${prefs.filters.length ? badge(prefs.filters.length, true) : ""}
    </button>
    <div class="menu-wrap">
      <button class="btn btn-secondary toolbar-btn" aria-haspopup="true" aria-expanded="${ui.menu === listName}"
        onclick="toggleMenu('${listName}')">
        ${icon("sort", 18)}<span>${listName === "book" ? sort.roomLabel : sort.label}</span>${icon("down", 16)}
      </button>
      ${ui.menu === listName ? sortMenu(listName) : ""}
    </div>
  </div>`;
}

// every filter that's on, as a chip you can tap to remove, plus the walking distance.
// lab 7 fix: you can always see exactly which filters are on
function activeFilters(listName) {
  const prefs = data[listName];
  const walk = WALK_OPTIONS.find(option => option.min === prefs.maxWalk);
  const chips = [
    chip(walk.label === "Any" ? "Any Distance" : `Within ${walk.label}`, { iconName: "walk", onclick: `openFilters('${listName}')` }),
    ...prefs.filters.map(id => chip(findFilter(id).label, { on: true, removable: true, onclick: `toggleFilter('${listName}', '${id}')` })),
  ].join("");
  return `<div class="active-filters">${chips}
    ${prefs.filters.length ? `<button class="link-btn" onclick="clearFilters('${listName}')">Clear All</button>` : ""}
  </div>`;
}

// the drop-down list of sort choices
function sortMenu(listName) {
  const prefs = data[listName];
  return `<div class="menu" role="menu">
    ${SORTS.map(sort => `<button role="menuitemradio" aria-checked="${prefs.sort === sort.id}"
        class="${prefs.sort === sort.id ? "on" : ""}" onclick="setSort('${listName}', '${sort.id}')">
        <span>${listName === "book" ? sort.roomLabel : sort.label}</span>${prefs.sort === sort.id ? icon("check", 16) : ""}
      </button>`).join("")}
    <p class="menu-note">Best Match uses the match score. Open a result to see how it's worked out.</p>
  </div>`;
}

// the inside of the filters modal. changes apply straight away, and the
// button at the bottom says how many results there now are
function filterModal(listName) {
  const prefs = data[listName];
  const pool = SPACES.filter(space => space.kind === (listName === "book" ? "room" : "open"))
    .filter(space => listName !== "book" || space.capacity >= prefs.groupSize);
  const count = pool.filter(space => isBestMatch(space, prefs)).length;

  const tiles = filtersFor(listName).map(filter => {
    const on = prefs.filters.includes(filter.id);
    return `<button class="tile ${on ? "on" : ""}" aria-pressed="${on}" onclick="toggleFilter('${listName}', '${filter.id}')">
      ${icon(filter.icon)}<span>${filter.label}</span>${on ? icon("check", 18) : ""}
    </button>`;
  }).join("");

  return modalFrame({
    title: "Filters",
    body: `
      <h3>Walking Distance</h3>
      ${segmented(WALK_OPTIONS.map(o => ({ value: o.min, label: o.label })), prefs.maxWalk, v => `setWalk('${listName}', ${v})`, "Walking distance")}
      <p class="small muted gap-top">From ${startPlace().name} · <a href="#/settings" onclick="closeModal()">change</a></p>
      <h3>What You Need</h3>
      <div class="tile-grid">${tiles}</div>`,
    footer: `
      ${btn("Reset", { kind: "ghost", onclick: `clearFilters('${listName}')`, disabled: !prefs.filters.length })}
      ${btn(`Show ${count} ${count === 1 ? "Best Match" : "Best Matches"}`, { kind: "primary", onclick: "closeModal()" })}`,
  });
}

// how a space's match score is worked out, as bars
function scoreBreakdown(space) {
  const parts = scoreParts(space);
  return `<details class="score-box">
    <summary>${scoreTag(space)} <span>How Is This Worked Out?</span>${icon("down", 16)}</summary>
    <div class="score-parts">
      ${parts.map(part => `<div class="score-row">
        <span>${part.label}</span>
        <span class="bar"><i style="width:${part.value * 100}%"></i></span>
        <span class="score-points">${Math.round(part.value * part.weight)} / ${part.weight}</span>
      </div>`).join("")}
      <p class="small muted">Best matches must have everything you asked for. Then they're ranked by this score.</p>
    </div>
  </details>`;
}

// ---------------------------------------------------------------- modals

// every popup in the app uses the same frame: a title, a close button,
// the body, and buttons at the bottom
function modalFrame({ title, body, footer = "", iconName }) {
  return `<header class="modal-head">
      ${iconName ? `<span class="modal-icon">${icon(iconName, 22)}</span>` : ""}
      <h2 id="modal-title">${title}</h2>
      ${btn("", { kind: "ghost", icon: "close", onclick: "closeModal()", ariaLabel: "Close" })}
    </header>
    <div class="modal-body">${body}</div>
    ${footer ? `<footer class="modal-foot">${footer}</footer>` : ""}`;
}

// opens the modal. draw is a function that returns the html inside it.
// keeping the function, not the html, means the modal can redraw itself
// whenever the rest of the screen redraws, so it's never out of date
function openModal(draw) {
  ui.modal = draw;
  refreshModal();
  $("#modal").hidden = false;
  // move keyboard focus into the modal, for keyboard and screen reader users
  const first = $("#modal-box").querySelector("button, a, input, select");
  if (first) first.focus();
}

function refreshModal() {
  if (ui.modal) $("#modal-box").innerHTML = ui.modal();
}

function closeModal() {
  $("#modal").hidden = true;
  ui.modal = null;
  ui.report = null;
}

// a yes/no question in the shared modal, used instead of the browser's
// plain confirm box so it matches the app. onConfirm runs if they say yes.
// cancelLabel is the safe choice, so it should say what it keeps
function confirmModal({ title, text, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false, onConfirm }) {
  ui.modalAction = onConfirm;
  openModal(() => modalFrame({
    title,
    iconName: danger ? "alert" : "info",
    body: `<p>${text}</p>`,
    footer: `${btn(cancelLabel, { onclick: "closeModal()" })}
      ${btn(confirmLabel, { kind: danger ? "danger-solid" : "primary", onclick: "runModalAction()" })}`,
  }));
}

function runModalAction() {
  const action = ui.modalAction;
  closeModal();
  if (action) action();
}

// ---------------------------------------------------------------- menus

// opens or closes a drop-down menu, e.g. the sort menu on find
function toggleMenu(name) {
  ui.menu = ui.menu === name ? null : name;
  render();
}

// clicking anywhere outside an open menu closes it
document.addEventListener("click", event => {
  if (ui.menu && !event.target.closest(".menu-wrap")) {
    ui.menu = null;
    render();
  }
});

// ---------------------------------------------------------------- toasts and banners

// a small message at the bottom. if undo is given, it shows an undo button
// and stays until closed. otherwise it hides itself after 4 seconds
let toastTimer;
function showToast(message, undo) {
  const toast = $("#toast");
  clearTimeout(toastTimer);
  toast.innerHTML = `${icon("check", 18)}<span>${message}</span>
    ${undo ? `<button class="toast-undo" id="toast-undo">Undo</button>` : ""}
    ${btn("", { kind: "ghost", icon: "close", size: "small", onclick: "hideToast()", ariaLabel: "Close message" })}`;
  toast.hidden = false;

  if (undo) {
    $("#toast-undo").onclick = () => { undo(); hideToast(); showToast("Undone"); };
  } else {
    toastTimer = setTimeout(hideToast, 4000);
  }
}

function hideToast() {
  $("#toast").hidden = true;
}

// a banner at the top for live alerts. tapping it opens the given address
function showBanner(title, text, address) {
  const banner = $("#banner");
  banner.innerHTML = `<button class="banner-main" onclick="hideBanner(); go('${address}')">
      ${icon("bell", 20)}<span><strong>${title}</strong><br>${text}</span>
    </button>
    ${btn("", { kind: "ghost", icon: "close", size: "small", onclick: "hideBanner()", ariaLabel: "Close alert" })}`;
  banner.hidden = false;
}

function hideBanner() {
  $("#banner").hidden = true;
}
