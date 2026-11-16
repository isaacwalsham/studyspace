/*
 * screens/design.js
 * the design system page: every building block from components.js, working,
 * with a line on when to use each one. open it from settings, about, or #/design.
 * it uses the real components, so it can never drift from the real app.
 */

function designScreen() {
  const sample = findSpace("lib2");
  const busySample = findSpace("hive");

  return `<section class="page wide">
    ${btn("Settings", { kind: "ghost", icon: "back", href: "#/settings" })}
    ${pageHead("Design System", "The shared pieces every screen is built from. Change one here and it changes everywhere.")}

    ${designBlock("Colours", "One accent colour for anything you can press or have picked. Status colours only ever mean busyness, and always come with a word.", `
      <div class="token-row">
        <span class="token"><i style="background:var(--accent)"></i>Accent</span>
        <span class="token"><i style="background:var(--accent-soft)"></i>Accent Soft</span>
        <span class="token"><i style="background:var(--ink)"></i>Text</span>
        <span class="token"><i style="background:var(--muted)"></i>Muted Text</span>
        <span class="token"><i style="background:var(--line)"></i>Border</span>
        <span class="token"><i style="background:var(--surface)"></i>Card</span>
        <span class="token"><i style="background:var(--page)"></i>Page</span>
      </div>
      <div class="token-row">
        <span class="token"><i class="stripe-green"></i>Quiet</span>
        <span class="token"><i class="stripe-amber"></i>Some Seats</span>
        <span class="token"><i class="stripe-orange"></i>Busy</span>
        <span class="token"><i class="stripe-red"></i>Full</span>
        <span class="token"><i class="stripe-grey"></i>Not a Match</span>
      </div>`)}

    ${designBlock("Text", "One font, the device's own. Titles, buttons and labels use title case. Sentences use sentence case. Extra info is muted grey, never lighter.", `
      <h1 class="no-gap">Page Title</h1>
      <h2 class="no-gap">Section Heading ${badge(3)}</h2>
      <h3>Group Label</h3>
      <p>Body text for descriptions and messages.</p>
      <p class="muted small">Muted small text for extra details, like walk times.</p>`)}

    ${designBlock("Buttons", "Primary is the one main action on a screen. Secondary is for other actions, danger for things that delete, ghost for quiet links. All are at least 44 pixels tall, so they're easy to tap.", `
      <div class="demo-row">
        ${btn("Primary", { kind: "primary", icon: "check" })}
        ${btn("Secondary", { icon: "walk" })}
        ${btn("Danger", { kind: "danger" })}
        ${btn("Danger Solid", { kind: "danger-solid" })}
        ${btn("Ghost", { kind: "ghost", icon: "back" })}
      </div>
      <div class="demo-row">
        ${btn("Small", { size: "small" })}
        ${btn("Small Primary", { size: "small", kind: "primary" })}
        ${btn("Disabled", { kind: "primary", disabled: true })}
        ${btn("", { icon: "plus", ariaLabel: "Icon button" })}
        ${btn("", { icon: "close", kind: "ghost", ariaLabel: "Icon ghost button" })}
      </div>`)}

    ${designBlock("Choices", "Chips switch filters on and off. Tiles are bigger chips, for modals and set up. A segmented control picks one of a few options. A switch turns a setting on or off.", `
      <div class="demo-row">
        ${chip("Quiet", { iconName: "quiet" })}
        ${chip("Sockets", { on: true })}
        ${chip("Removable", { on: true, removable: true })}
      </div>
      <div class="tile-grid demo-gap">
        <button class="tile">${icon("sun")}<span>Tile</span></button>
        <button class="tile on">${icon("plug")}<span>Tile, Picked</span>${icon("check", 18)}</button>
      </div>
      <div class="demo-row">
        ${segmented([{ value: 1, label: "One" }, { value: 2, label: "Two" }, { value: 3, label: "Three" }], 2, () => "", "Example")}
        ${switchToggle(true, "Example on", "")} ${switchToggle(false, "Example off", "")}
      </div>`)}

    ${designBlock("Tags and Badges", "Tags show busyness. Badges show a count. The score shows the match score out of 100.", `
      <div class="demo-row">
        ${busyTag(sample)} ${busyTag(findSpace("tpsc"))} ${busyTag(findSpace("cmp"))} ${busyTag(busySample)}
        ${badge(5)} ${badge(2, true)} ${scoreTag(sample)}
      </div>`)}

    ${designBlock("Notices", "A coloured box with an icon, for a message inside a screen.", `
      ${notice("good", "Has everything you asked for")}
      ${notice("warn", "Doesn't have: sockets")}
      ${notice("info", "It's busy here. A quieter space is 2 min away.")}`)}

    ${designBlock("Cards", "Every list item is a card with the same padding, border and corner. The coloured stripe on the left is its busyness.", `
      ${resultCard(sample, false, null)}
      ${resultCard(busySample, true, null)}`)}

    ${designBlock("Empty State", "When a list has nothing in it, say why and give a way forward.", emptyState({
      iconName: "search", title: "Nothing Has Everything You Asked For", text: "Try one of these:",
      actions: btn("Walk Up to 15 min") }))}

    ${designBlock("Filter and Sort Toolbar", "Shared by Find and Book a Room. Filters opens a modal, sort opens a menu, and the filters that are on show as chips underneath.", toolbar("find"))}

    ${designBlock("Modals", "Every popup uses the same frame: a title, a close button, the content, and buttons at the bottom. They slide up on phones and sit in the middle on wide screens.", `
      <div class="demo-row">
        ${btn("Confirm Modal", { onclick: "demoConfirm()" })}
        ${btn("Danger Confirm", { onclick: "demoDanger()" })}
        ${btn("Filters Modal", { onclick: "openFilters('find')" })}
        ${btn("Report Modal", { onclick: "openReport('lib2')" })}
        ${btn("Picture Modal", { onclick: "openAvatarPicker()" })}
      </div>`)}

    ${designBlock("Feedback", "A toast confirms something just happened, at the bottom. If it can be undone, it stays until closed. A banner is a live alert at the top, and opens what it's about.", `
      <div class="demo-row">
        ${btn("Show a Toast", { onclick: "showToast('Saved')" })}
        ${btn("Toast With Undo", { onclick: "showToast('Booked Group Room 0.20', () => {})" })}
        ${btn("Show a Banner", { onclick: "showBanner('The Hive Café is filling up', 'Silent Study, Floor 2 is quiet. Tap to see it.', '#/find/lib2')" })}
      </div>`)}
  </section>`;
}

// one section of the design page: a title, when to use it, and examples
function designBlock(title, description, examples) {
  return `<section class="design-block">
    <h2>${title}</h2>
    <p class="muted">${description}</p>
    <div class="card demo">${examples}</div>
  </section>`;
}

// example modals for the design page
function demoConfirm() {
  confirmModal({ title: "Book This Room?", text: "Group Room 0.20, tomorrow, 14:00 to 15:00, for 4 people.", confirmLabel: "Book", cancelLabel: "Not Yet", onConfirm: () => showToast("Example only, nothing was booked") });
}

function demoDanger() {
  confirmModal({ title: "Cancel This Booking?", text: "Group Room 0.20, tomorrow at 14:00. Someone else can then book it.", confirmLabel: "Cancel Booking", cancelLabel: "Keep Booking", danger: true, onConfirm: () => showToast("Example only, nothing was cancelled") });
}
