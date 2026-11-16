/*
 * app.js
 * the brain of the app. it decides which screen to show, and holds every
 * function the buttons call, like signIn, toggleFilter and askToBook.
 *
 * how a click works:
 *   1. a button runs one of the functions below, or changes the address
 *   2. that changes data, which is saved, or ui, which isn't
 *   3. render redraws the screen from scratch
 *
 * the addresses:
 *   #/find              the map and results
 *   #/find/lib2         the same, with lib2's card open on the map
 *   #/find/lib2/go      directions to lib2
 *   #/book              book a room
 *   #/book/room020      book a room, with room 0.20's panel open
 *   #/bookings          my bookings
 *   #/settings          settings and profile
 *   #/design            the design system page
 */

// things that only matter while the page is open, so they aren't saved
const ui = {
  findView: "list",      // on phones, find shows either the list or the map
  map: { ...HOME_VIEW }, // the part of the campus on screen, see map.js
  shownSpace: null,      // the space the map last moved to, so it only moves once
  slot: null,            // the booking time picked, e.g. "14:00"
  menu: null,            // the drop-down menu that's open, if any
  modal: null,           // a function that draws the open modal, see components.js
  modalAction: null,     // what a confirm modal does if you say yes
  report: null,          // the busyness report, e.g. { id, level, done, before }
  walk: null,            // the pretend walk, e.g. { id, progress, timer }
  last: {},              // the screen and id drawn last time, e.g. { screen: "book", id: "room020" }
  entering: false,       // true when a card or panel has just opened, so it animates in once
};

// the tabs: the address they open, their icon and their name
const TABS = [
  { screen: "find",     icon: "search",       label: "Find" },
  { screen: "book",     icon: "calendarPlus", label: "Book a Room" },
  { screen: "bookings", icon: "ticket",       label: "My Bookings" },
  { screen: "settings", icon: "gear",         label: "Settings" },
];

// ---------------------------------------------------------------- moving between screens

// changes the address, e.g. go("#/book"). the hashchange listener then redraws
function go(address) {
  location.hash = address;
}

// splits the address into its parts.
// "#/find/lib2/go" becomes { screen: "find", id: "lib2", mode: "go" }
function currentRoute() {
  const [screen = "find", id = null, mode = null] = location.hash.replace("#/", "").split("/").filter(Boolean);
  return { screen, id, mode };
}

// reads the address and draws the right screen
function render() {
  const { screen, id, mode } = currentRoute();
  applySettings();

  // leaving the directions stops the pretend walk
  if (ui.walk && !(screen === "find" && id === ui.walk.id && mode === "go")) stopWalk();

  // remember how far down the results list was scrolled, to put it back after
  const panel = $("#find-panel");
  const scrolled = panel ? panel.scrollTop : 0;

  // something has just opened if the id is new, e.g. a room was picked.
  // screens use this to play their opening animation only once
  const sameScreen = screen === ui.last.screen;
  ui.entering = Boolean(id) && (id !== ui.last.id || !sameScreen);
  if (screen === "book" && ui.entering) ui.slot = null; // a new room starts with no time picked

  // where every sliding card is now, so they can glide to their new places
  const before = sameScreen ? cardPositions() : null;

  // not signed in yet, or not finished set up, so those come first
  const ready = Boolean(data.user && data.setupDone);
  let html;
  if (!data.user) html = signInScreen();
  else if (!data.setupDone) html = setupScreen();
  else if (screen === "find") html = findScreen(id && findSpace(id) ? id : null, mode);
  else if (screen === "book") html = bookScreen(id);
  else if (screen === "bookings") html = bookingsScreen();
  else if (screen === "settings") html = settingsScreen();
  else if (screen === "design") html = designScreen();
  else html = notFound();

  $("#main").innerHTML = html;
  ui.last = { screen, id };

  // the find screen fills the window and doesn't scroll, the others do
  const onFind = ready && screen === "find";
  document.body.classList.toggle("find-page", onFind);
  document.body.classList.toggle("signed-out", !ready);
  // on phones the room panel covers the screen, so the page behind shouldn't scroll
  document.body.classList.toggle("panel-open", ready && screen === "book" && Boolean(id));
  drawTabs(ready ? screen : null);

  // cards that moved slide from where they were to where they are now
  if (before) flipCards(before);

  // an open modal redraws too, so it always shows the latest data
  refreshModal();

  if (onFind) {
    $("#find-panel").scrollTop = scrolled;
    setupMap();

    // a newly opened space: move the map to it
    if (id && id !== ui.shownSpace && findSpace(id)) panTo(findSpace(id));
    ui.shownSpace = id;
  }
}

// ---------------------------------------------------------------- sliding cards

// the position of every card marked with data-flip, keyed by its id
function cardPositions() {
  const positions = new Map();
  document.querySelectorAll("[data-flip]").forEach(card => positions.set(card.dataset.flip, card.getBoundingClientRect()));
  return positions;
}

// the "flip" trick: after a redraw, each card jumps to its new place. this
// moves it back to where it was, then lets it glide to the new place, so it
// looks like the cards slide over. it's how the room cards move left when
// the panel opens, and back again when it closes
function flipCards(before) {
  if (motionOff()) return;
  document.querySelectorAll("[data-flip]").forEach(card => {
    const old = before.get(card.dataset.flip);
    if (!old) return;
    const now = card.getBoundingClientRect();
    const dx = old.left - now.left;
    const dy = old.top - now.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    card.animate(
      [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
      { duration: 420, easing: "cubic-bezier(.2, .8, .2, 1)" },
    );
  });
}

// draws the tabs, with the current one picked. hidden before sign-in
function drawTabs(current) {
  const nav = $("#tabs");
  nav.hidden = !current;
  if (!current) return;
  const upcoming = data.bookings.filter(b => !isPast(b)).length;
  nav.innerHTML = TABS.map(tab => {
    const on = tab.screen === current || (tab.screen === "settings" && current === "design");
    return `<a href="#/${tab.screen}" class="${on ? "on" : ""}" ${on ? `aria-current="page"` : ""}>
      ${icon(tab.icon, 22)}<span>${tab.label}</span>
      ${tab.screen === "bookings" && upcoming ? `<span class="tab-badge">${upcoming}</span>` : ""}
    </a>`;
  }).join("");
}

// a page that doesn't exist
function notFound() {
  return `<section class="page">${emptyState({ iconName: "search", title: "Page Not Found",
    actions: btn("Go to Find", { kind: "primary", href: "#/find" }) })}</section>`;
}

// redraw whenever the address changes. going to a different screen starts
// at the top, but opening a room on the same screen keeps your place
window.addEventListener("hashchange", () => {
  // on phones, opening a space switches to the map so you can see it
  const { screen, id } = currentRoute();
  if (screen === "find" && id && isNarrow()) ui.findView = "map";
  const newScreen = screen !== ui.last.screen;
  ui.menu = null;
  render();
  if (newScreen) window.scrollTo(0, 0);
});

// ---------------------------------------------------------------- settings

// puts the appearance and accessibility settings onto the page, as
// attributes and classes the css reads
function applySettings() {
  const s = data.settings;
  const root = document.documentElement;
  const dark = s.theme === "dark" || (s.theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.dataset.theme = dark ? "dark" : "light";
  root.dataset.accent = s.accent;
  root.classList.toggle("large-text", s.largeText);
  root.classList.toggle("high-contrast", s.highContrast);
  root.classList.toggle("reduce-motion", s.reduceMotion);
  // the colour of the phone's status bar follows the accent too
  $('meta[name="theme-color"]').content = ACCENTS.find(a => a.id === s.accent).hex;
}

// if the device switches between light and dark, follow it when theme is auto
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => render());

// flips an on/off setting, e.g. toggleSetting("largeText")
function toggleSetting(name) {
  data.settings[name] = !data.settings[name];
  saveData();
  render();
}

function setAccent(id) {
  data.settings.accent = id;
  saveData();
  render();
}

function setTheme(theme) {
  data.settings.theme = theme;
  saveData();
  render();
}

function setStartPlace(id) {
  data.settings.startPlace = id;
  saveData();
  render();
  showToast(`Walk times are now from ${findPlace(id).name}`);
}

function setName(name) {
  data.user.name = name.trim() || data.user.email.split("@")[0];
  saveData();
  render();
  showToast("Name saved");
}

function openAvatarPicker() {
  openModal(avatarModal);
}

function setAvatar(name) {
  data.user.avatar = name;
  saveData();
  render();
}

function setAvatarColour(id) {
  data.user.avatarColour = id;
  saveData();
  render();
}

// ---------------------------------------------------------------- sign in and set up

// checks the email looks like a uea one, then signs in. no real check happens
function signIn(event) {
  event.preventDefault(); // stops the form reloading the page
  const email = $("#email").value.trim().toLowerCase();
  const error = $("#sign-in-error");

  if (!email.endsWith("@uea.ac.uk")) {
    error.textContent = "Use your UEA email, ending in @uea.ac.uk";
    error.hidden = false;
    return;
  }

  // makes a display name from the email, e.g. "abc12xyz@uea.ac.uk" becomes "abc12xyz"
  data.user = { name: email.split("@")[0], email, avatar: "initials", avatarColour: data.settings.accent };
  saveData();
  go("#/find");
  render();
}

function finishSetup() {
  data.setupDone = true;
  saveData();
  go("#/find");
  render();
}

function askToSignOut() {
  confirmModal({
    title: "Sign Out?",
    text: "Your bookings and settings stay saved on this device.",
    confirmLabel: "Sign Out",
    onConfirm: () => {
      data.user = null;
      data.setupDone = false;
      saveData();
      go("#/find");
      render();
    },
  });
}

// wipes everything, so the app starts again from the sign-in screen
function askToReset() {
  confirmModal({
    title: "Reset All App Data?",
    text: "This deletes your bookings, reports and settings, and signs you out. It can't be undone.",
    confirmLabel: "Reset Everything",
    cancelLabel: "Keep My Data",
    danger: true,
    onConfirm: () => {
      data = freshData();
      saveData();
      go("#/find");
      render();
    },
  });
}

// ---------------------------------------------------------------- filters and sorting

// listName is "find" or "book", since each page keeps its own filters

function openFilters(listName) {
  ui.menu = null;
  openModal(() => filterModal(listName));
}

// switches a filter on if it's off, or off if it's on
function toggleFilter(listName, id) {
  const prefs = data[listName];
  if (prefs.filters.includes(id)) prefs.filters = prefs.filters.filter(f => f !== id);
  else prefs.filters.push(id);
  saveData();
  render();
}

function clearFilters(listName) {
  const before = [...data[listName].filters];
  data[listName].filters = [];
  saveData();
  render();
  // lets the user get their filters back if they pressed it by mistake
  showToast("Filters cleared", () => { data[listName].filters = before; saveData(); render(); });
}

// sets the walking distance in minutes
function setWalk(listName, minutes) {
  data[listName].maxWalk = minutes;
  saveData();
  render();
}

function setSort(listName, id) {
  data[listName].sort = id;
  ui.menu = null;
  saveData();
  render();
}

// on phones, swaps between the list and the map
function setFindView(view) {
  ui.findView = view;
  render();
}

// ---------------------------------------------------------------- booking

function setGroupSize(change) {
  data.book.groupSize = Math.min(12, Math.max(1, data.book.groupSize + change));
  saveData();
  render();
}

// picks a day: 0 is today, 1 is tomorrow, and so on
function setBookDay(offset) {
  data.book.day = offset;
  ui.slot = null; // a time picked on another day might not be free on this one
  saveData();
  render();
}

// opens a room's booking panel, with no time picked yet
function startBooking(id) {
  ui.slot = null;
  go(`#/book/${id}`);
}

function pickSlot(slot) {
  ui.slot = slot;
  render();
}

// asks "are you sure?" with all the details, before booking
function askToBook(roomId) {
  const room = findSpace(roomId);
  const date = bookDate();

  // the user can't be in two rooms at once
  const clash = data.bookings.find(b => b.date === date && b.slot === ui.slot);
  if (clash) {
    showToast(`You already have ${findSpace(clash.roomId).name} at ${ui.slot}`);
    return;
  }

  const size = data.book.groupSize;
  confirmModal({
    title: `Book ${room.name}?`,
    text: `${dateLabel(date)}, ${ui.slot} to ${endTime(ui.slot)}, for ${people(size)}. ${room.building}, ${walkMins(room)} min walk.`,
    confirmLabel: "Book",
    cancelLabel: "Not Yet",
    onConfirm: () => {
      const booking = { id: String(Date.now()), roomId, date, slot: ui.slot, people: size };
      data.bookings.push(booking);
      saveData();
      // stay on the room, so the time now shows as "yours". it's also in my bookings
      ui.slot = null;
      render();
      // lab 7 fix: undo stays until the user closes it, instead of vanishing after 8 seconds
      showToast(`Booked ${room.name}, ${dateLabel(date).toLowerCase()} at ${booking.slot}. It's in My Bookings.`, () => removeBooking(booking.id));
    },
  });
}

function askToCancel(id) {
  const booking = data.bookings.find(b => b.id === id);
  const room = findSpace(booking.roomId);
  confirmModal({
    title: "Cancel This Booking?",
    text: `${room.name}, ${dateLabel(booking.date).toLowerCase()} at ${booking.slot}. Someone else will then be able to book it.`,
    confirmLabel: "Cancel Booking",
    cancelLabel: "Keep Booking",
    danger: true,
    onConfirm: () => {
      removeBooking(id);
      showToast("Booking cancelled", () => { data.bookings.push(booking); saveData(); render(); });
    },
  });
}

function removeBooking(id) {
  data.bookings = data.bookings.filter(b => b.id !== id);
  saveData();
  render();
}

// ---------------------------------------------------------------- busyness reports

function openReport(id) {
  // "before" remembers the old report so undo can put it back
  ui.report = { id, level: null, done: false, before: data.reports[id] || null };
  openModal(reportModal);
}

function pickLevel(index) {
  ui.report.level = index;
  refreshModal();
}

// saves the report, then shows the confirmation step
function sendReport() {
  const id = ui.report.id;
  data.reports[id] = { busy: LEVELS[ui.report.level].busy, time: Date.now() };
  saveData();
  ui.report.done = true;

  // if they'd just arrived from directions, go back to the space's details
  if (ui.walk && ui.walk.id === id) go(`#/find/${id}`);
  else render();
}

// puts the old busyness back and closes the modal
function undoReport() {
  const { id, before } = ui.report;
  if (before) data.reports[id] = before;
  else delete data.reports[id];
  saveData();
  closeModal();
  render();
  showToast("Update removed");
}

// goes back to the pick-a-level step, keeping the level they chose
function changeReport() {
  ui.report.done = false;
  refreshModal();
}

// pretends to ask people at the space, and a reply comes in a few seconds later
function askForUpdate(id) {
  const space = findSpace(id);
  showToast(`Asked people at ${space.name}. We'll tell you when someone replies.`);
  setTimeout(() => {
    // the made-up reply is a little busier or quieter than now
    const now = busyness(space).busy;
    space.busy = Math.min(0.97, Math.max(0.1, now + (Math.random() < 0.5 ? -0.15 : 0.15)));
    space.updatedMin = 0;
    delete data.reports[id];
    saveData();
    render();
    showBanner(`${space.name} update`, `Someone there says it's ${busyLabel(space).text.toLowerCase()}.`, `#/find/${id}`);
  }, 4000);
}

// the nearest open space that's quiet, used when a space is busy
function nearbyAlternative(space) {
  return SPACES
    .filter(other => other.id !== space.id && other.kind === "open" && busyLabel(other).colour === "green")
    .sort((a, b) => Math.hypot(a.x - space.x, a.y - space.y) - Math.hypot(b.x - space.x, b.y - space.y))[0];
}

// ---------------------------------------------------------------- pretend walking

// moves the walking dot a little every 200 ms, so each minute takes a second.
// only the dot and the text change, so the map doesn't get redrawn every step
function startWalk(id) {
  const space = findSpace(id);
  const minutes = walkMins(space);
  ui.walk = { id, progress: 0, alerted: false };
  render(); // redraws once, so the button says "walking…"

  ui.walk.timer = setInterval(() => {
    ui.walk.progress = Math.min(1, ui.walk.progress + 1 / (minutes * 5));
    moveWalker(space, minutes);

    // halfway there, warn if the space has got busy, with a quieter one nearby
    if (ui.walk.progress >= 0.5 && !ui.walk.alerted && data.settings.alerts && busyLabel(space).colour !== "green") {
      ui.walk.alerted = true;
      const other = nearbyAlternative(space);
      if (other) showBanner(`${space.name} is filling up`, `${other.name} is quiet. Tap to see it.`, `#/find/${other.id}`);
    }

    // arrived: stop moving and redraw, which shows the "you've arrived" card
    if (ui.walk.progress >= 1) {
      clearInterval(ui.walk.timer);
      render();
    }
  }, 200);
}

// puts the walking dot in the right place and updates the minutes left
function moveWalker(space, minutes) {
  const start = startPlace();
  const point = pointAlong([[start.x, start.y], routeBend(space), [space.x, space.y]], ui.walk.progress);
  const dot = $("#walker");
  if (dot) {
    dot.dataset.x = point[0];
    dot.dataset.y = point[1];
    scaleMarkers($("#map"));
  }
  const left = Math.ceil(minutes * (1 - ui.walk.progress));
  if ($("#walk-status")) $("#walk-status").textContent = `${left} min to go`;
  if ($("#walk-bar")) $("#walk-bar").style.width = `${ui.walk.progress * 100}%`;
}

// finds the point a fraction of the way along a line made of straight parts
function pointAlong(points, fraction) {
  const lengths = [];
  for (let i = 1; i < points.length; i++) {
    lengths.push(Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  }
  let distanceLeft = fraction * lengths.reduce((a, b) => a + b, 0);

  // walk along each part until the distance runs out
  for (let i = 0; i < lengths.length; i++) {
    if (distanceLeft <= lengths[i]) {
      const t = distanceLeft / lengths[i];
      return [points[i][0] + (points[i + 1][0] - points[i][0]) * t,
              points[i][1] + (points[i + 1][1] - points[i][1]) * t];
    }
    distanceLeft -= lengths[i];
  }
  return points[points.length - 1];
}

function stopWalk() {
  if (ui.walk) clearInterval(ui.walk.timer);
  ui.walk = null;
}

// ---------------------------------------------------------------- start

// clicking the dark area behind a modal closes it
$("#modal").addEventListener("click", event => {
  if (event.target.id === "modal") closeModal();
});

// the escape key closes a menu, then a modal, then the card on the map
document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  if (ui.menu) { ui.menu = null; render(); }
  else if (!$("#modal").hidden) closeModal();
  else if (currentRoute().id) go(`#/${currentRoute().screen}`); // closes a card on find, or a room's panel
});

render();
