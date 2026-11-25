// buttons

// kind: primary, secondary, danger, danger-solid or ghost.
// href makes it a link, onclick runs a function
function btn(label, { kind = "secondary", icon: iconName, size, href, onclick, disabled, wide, ariaLabel, id } = {}) {
  const classes = ["btn", `btn-${kind}`, size === "small" ? "btn-small" : "", wide ? "btn-wide" : "", label ? "" : "btn-icon"].join(" ");
  const inside = `${iconName ? icon(iconName, size === "small" ? 16 : 18) : ""}${label ? `<span>${label}</span>` : ""}`;
  const extra = `${ariaLabel ? `aria-label="${ariaLabel}"` : ""} ${id ? `id="${id}"` : ""}`;
  if (href && !disabled) return `<a class="${classes}" href="${href}" ${extra}>${inside}</a>`;
  return `<button class="${classes}" ${onclick ? `onclick="${onclick}"` : ""} ${disabled ? "disabled" : ""} ${extra}>${inside}</button>`;
}

// small pieces

// count badge
function badge(count, strong = false) {
  return `<span class="badge ${strong ? "badge-strong" : ""}">${count}</span>`;
}

function busyTag(space, big = false) {
  const label = busyLabel(space);
  return `<span class="tag tag-${label.colour} ${big ? "tag-big" : ""}">${label.text}</span>`;
}

function scoreTag(space) {
  return `<span class="score" title="Match score out of 100">${matchScore(space)}<small>/100</small></span>`;
}

// toggle pill, used for filters
function chip(label, { iconName, on = false, onclick, removable = false } = {}) {
  return `<button class="chip ${on ? "chip-on" : ""}" aria-pressed="${on}" onclick="${onclick}">
    ${on && !removable ? icon("check", 16) : iconName ? icon(iconName, 16) : ""}
    <span>${label}</span>${removable ? icon("close", 14) : ""}
  </button>`;
}

// joined buttons, one picked. action(value) returns the onclick
function segmented(options, current, action, ariaLabel = "") {
  return `<div class="segmented" role="group" aria-label="${ariaLabel}">
    ${options.map(option => {
      const on = option.value === current;
      return `<button class="${on ? "on" : ""}" aria-pressed="${on}" onclick="${action(option.value)}">${option.label}</button>`;
    }).join("")}
  </div>`;
}

function switchToggle(on, label, onclick) {
  return `<button class="switch ${on ? "on" : ""}" role="switch" aria-checked="${on}" aria-label="${label}" onclick="${onclick}"><span></span></button>`;
}

function pageHead(title, subtitle = "") {
  return `<header class="page-head"><h1>${title}</h1>${subtitle ? `<p class="muted">${subtitle}</p>` : ""}</header>`;
}

// empty list message with ways out
function emptyState({ iconName = "info", title, text = "", actions = "" }) {
  return `<div class="empty">
    <span class="empty-icon">${icon(iconName, 26)}</span>
    <p><strong>${title}</strong></p>
    ${text ? `<p class="muted">${text}</p>` : ""}
    ${actions ? `<div class="empty-actions">${actions}</div>` : ""}
  </div>`;
}

// small icon + text pills for key facts
function facts(items) {
  return `<span class="facts">${items.map(([iconName, text]) => `<span>${icon(iconName, 15)}${text}</span>`).join("")}</span>`;
}

// kind is good, warn or info
function notice(kind, text) {
  return `<div class="notice notice-${kind}">${icon(kind === "good" ? "check" : kind === "warn" ? "alert" : "info", 18)}<span>${text}</span></div>`;
}

// filter and sort toolbar

// filter and sort buttons, active filters underneath
function toolbar(listName) {
  return `${toolbarButtons(listName)}${activeFilters(listName)}`;
}

// lab 7 fix: the filters button shows how many are on
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

// lab 7 fix: active filters are always visible, tap one to remove it
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

// sort dropdown
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

// filters apply straight away, the button shows the result count
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
      <p class="small muted gap-top">From ${startPlace().name} · <a class="text-link" href="#/settings" onclick="closeModal()">change</a></p>
      <h3>What You Need</h3>
      <div class="tile-grid">${tiles}</div>`,
    footer: `
      ${btn("Reset", { kind: "ghost", onclick: `clearFilters('${listName}')`, disabled: !prefs.filters.length })}
      ${btn(`Show ${count} ${count === 1 ? "Best Match" : "Best Matches"}`, { kind: "primary", onclick: "closeModal()" })}`,
  });
}

// score breakdown bars
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

// modals

// shared frame for every popup
function modalFrame({ title, body, footer = "", iconName }) {
  return `<header class="modal-head">
      ${iconName ? `<span class="modal-icon">${icon(iconName, 22)}</span>` : ""}
      <h2 id="modal-title">${title}</h2>
      ${btn("", { kind: "ghost", icon: "close", onclick: "closeModal()", ariaLabel: "Close" })}
    </header>
    <div class="modal-body">${body}</div>
    ${footer ? `<footer class="modal-foot">${footer}</footer>` : ""}`;
}

// draw is a function, not html, so the modal redraws with the page
function openModal(draw) {
  ui.modal = draw;
  refreshModal();
  $("#modal").hidden = false;
  // focus the modal for keyboard users
  const first = $("#modal-box").querySelector("button, a, input, select");
  if (first) first.focus();
}

function refreshModal() {
  if (ui.modal) $("#modal-box").innerHTML = ui.modal();
}

function closeModal() {
  removePhoto();
  $("#modal").hidden = true;
  ui.modal = null;
  ui.report = null;
}

// our own confirm box. cancelLabel should say what it keeps
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

// menus

function toggleMenu(name) {
  ui.menu = ui.menu === name ? null : name;
  render();
}

// click outside to close menus
document.addEventListener("click", event => {
  if (ui.menu && !event.target.closest(".menu-wrap")) {
    ui.menu = null;
    render();
  }
});

// toasts and banners

// with undo it stays until closed, otherwise hides after 4s
let toastTimer;
function showToast(message, undo) {
  const toast = $("#toast");
  clearTimeout(toastTimer);
  toast.innerHTML = `${icon("check", 18)}<span>${message}</span>
    ${undo ? `<button class="toast-undo" id="toast-undo">Undo</button>` : ""}
    ${btn("", { kind: "ghost", icon: "close", size: "small", onclick: "hideToast()", ariaLabel: "Close message" })}`;
  toast.hidden = false;
  makeRoomForToast(toast.offsetHeight + 24);

  if (undo) {
    $("#toast-undo").onclick = () => { undo(); hideToast(); showToast("Undone"); };
  } else {
    toastTimer = setTimeout(hideToast, 4000);
  }
}

function hideToast() {
  $("#toast").hidden = true;
  makeRoomForToast(0);
}

// the css uses this to keep cards and buttons clear of the toast
function makeRoomForToast(height) {
  document.documentElement.style.setProperty("--toast", `${height}px`);
  const svg = $("#map");
  if (svg) scaleMarkers(svg);
}

// live alert banner, tapping it opens the address
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
