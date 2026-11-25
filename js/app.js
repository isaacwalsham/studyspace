// screen state, not saved
const ui = {
  findView: "list",      // on phones, find shows either the list or the map
  map: { ...HOME_VIEW }, // the visible part of the map
  shownSpace: null,      // so the map only pans to a space once
  slot: null,            // picked booking time
  menu: null,            // open dropdown
  modal: null,           // draws the open modal
  modalAction: null,     // runs if a confirm is accepted
  report: null,          // busyness report in progress
  walk: null,            // fake walk in progress
  last: {},              // last screen and id drawn
  entering: false,       // just opened, so animate once
};

// tabs: address, icon, label
const TABS = [
  { screen: "find",     icon: "search",       label: "Find" },
  { screen: "book",     icon: "calendarPlus", label: "Book a Room" },
  { screen: "bookings", icon: "ticket",       label: "My Bookings" },
  { screen: "settings", icon: "gear",         label: "Settings" },
];

// moving between screens

// changing the address triggers a redraw
function go(address) {
  location.hash = address;
}

// "#/find/lib2/go" -> screen find, id lib2, mode go
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

  // keep the list's scroll position
  const panel = $("#find-panel");
  const scrolled = panel ? panel.scrollTop : 0;

  // only animate things the first time they open
  const sameScreen = screen === ui.last.screen;
  ui.entering = Boolean(id) && (id !== ui.last.id || !sameScreen);
  if (screen === "book" && ui.entering) ui.slot = null; // new room, no time picked

  // card positions before the redraw
  const before = sameScreen ? cardPositions() : null;

  // sign in and setup come first
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

  // find doesn't scroll, other pages do
  const onFind = ready && screen === "find";
  document.body.classList.toggle("find-page", onFind);
  document.body.classList.toggle("signed-out", !ready);
  // stop the page scrolling behind the room panel on phones
  document.body.classList.toggle("panel-open", ready && screen === "book" && Boolean(id));
  drawTabs(ready ? screen : null);

  if (before) flipCards(before);

  // keep an open modal up to date
  refreshModal();

  if (onFind) {
    $("#find-panel").scrollTop = scrolled;
    setupMap();

    // a newly opened space: move the map to it, or show the whole route
    const showing = id && findSpace(id) ? `${id} ${mode || ""}` : null;
    if (showing && showing !== ui.shownSpace) {
      if (mode === "go") fitRoute(findSpace(id));
      else panTo(findSpace(id));
    }
    ui.shownSpace = showing;
  }
}

// sliding cards

// where each data-flip card is on screen
function cardPositions() {
  const positions = new Map();
  document.querySelectorAll("[data-flip]").forEach(card => positions.set(card.dataset.flip, card.getBoundingClientRect()));
  return positions;
}

// flip animation: after a redraw, put each card back where it was and let
// it slide to its new spot. it's how the room cards move when the panel opens
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

// hidden until signed in
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

// redraw on every address change. a new screen starts at the top
window.addEventListener("hashchange", () => {
  // on phones, show the map when a space opens
  const { screen, id } = currentRoute();
  if (screen === "find" && id && isNarrow()) ui.findView = "map";
  const newScreen = screen !== ui.last.screen;
  ui.menu = null;
  render();
  if (newScreen) window.scrollTo(0, 0);
});

// settings

// theme, accent and accessibility settings, for the css
function applySettings() {
  const s = data.settings;
  const root = document.documentElement;
  const dark = s.theme === "dark" || (s.theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.dataset.theme = dark ? "dark" : "light";
  root.dataset.accent = s.accent;
  root.classList.toggle("large-text", s.largeText);
  root.classList.toggle("high-contrast", s.highContrast);
  root.classList.toggle("reduce-motion", s.reduceMotion);
  // phone status bar follows the accent
  $('meta[name="theme-color"]').content = ACCENTS.find(a => a.id === s.accent).hex;
}

// follow the device when theme is auto
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => render());

// e.g. toggleSetting("largeText")
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

// sign in and set up

// fake sign in, only checks it's a uea email
function signIn(event) {
  event.preventDefault(); // don't reload the page
  const email = $("#email").value.trim().toLowerCase();
  const error = $("#sign-in-error");

  if (!email.endsWith("@uea.ac.uk")) {
    error.textContent = "Use your UEA email, ending in @uea.ac.uk";
    error.hidden = false;
    return;
  }

  // name is the bit before the @
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
      hideToast();
      hideBanner();
      saveData();
      go("#/find");
      render();
    },
  });
}

// clears everything and goes back to sign in
function askToReset() {
  confirmModal({
    title: "Reset All App Data?",
    text: "This deletes your bookings, reports and settings, and signs you out. It can't be undone.",
    confirmLabel: "Reset Everything",
    cancelLabel: "Keep My Data",
    danger: true,
    onConfirm: () => {
      data = freshData();
      hideToast();
      hideBanner();
      saveData();
      go("#/find");
      render();
    },
  });
}

// filters and sorting

// listName is "find" or "book"

function openFilters(listName) {
  ui.menu = null;
  openModal(() => filterModal(listName));
}

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
  // undo in case it was a mistake
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

// booking

function setGroupSize(change) {
  data.book.groupSize = Math.min(12, Math.max(1, data.book.groupSize + change));
  saveData();
  render();
}

// 0 is today, 1 tomorrow and so on
function setBookDay(offset) {
  data.book.day = offset;
  ui.slot = null; // that time might not be free on this day
  saveData();
  render();
}

// opens a room's panel
function startBooking(id) {
  ui.slot = null;
  go(`#/book/${id}`);
}

function pickSlot(slot) {
  ui.slot = slot;
  render();
}

// confirm before booking
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
      // stay on the room so the slot shows as yours
      ui.slot = null;
      render();
      // lab 7 fix: undo stays until closed
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

// busyness reports

function openReport(id) {
  // keep the old report for undo
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

  // back to the details if they came from directions
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

// back to picking a level
function changeReport() {
  ui.report.done = false;
  refreshModal();
}

// fake request, a made-up reply comes back after a few seconds
function askForUpdate(id) {
  const space = findSpace(id);
  showToast(`Asked people at ${space.name}. We'll tell you when someone replies.`);
  setTimeout(() => {
    const now = busyness(space).busy;
    space.busy = Math.min(0.97, Math.max(0.1, now + (Math.random() < 0.5 ? -0.15 : 0.15)));
    space.updatedMin = 0;
    delete data.reports[id];
    saveData();
    render();
    showBanner(`${space.name} update`, `Someone there says it's ${busyLabel(space).text.toLowerCase()}.`, `#/find/${id}`);
  }, 4000);
}

// nearest quiet open space, by walking distance from this one
function nearbyAlternative(space) {
  return SPACES
    .filter(other => other.id !== space.id && other.kind === "open" && busyLabel(other).colour === "green")
    .sort((a, b) => findRoute(space, a).metres - findRoute(space, b).metres)[0];
}

// pretend walking

// moves the dot every 200ms, one walking minute per second.
// only the dot and text update, not the whole map
function startWalk(id) {
  const space = findSpace(id);
  const minutes = walkMins(space);
  ui.walk = { id, progress: 0, alerted: false };
  render(); // so the button says walking

  ui.walk.timer = setInterval(() => {
    ui.walk.progress = Math.min(1, ui.walk.progress + 1 / (minutes * 5));
    moveWalker(space, minutes);

    // halfway, warn if it's got busy
    if (ui.walk.progress >= 0.5 && !ui.walk.alerted && data.settings.alerts && busyLabel(space).colour !== "green") {
      ui.walk.alerted = true;
      const other = nearbyAlternative(space);
      if (other) showBanner(`${space.name} is filling up`, `${other.name} is quiet. Tap to see it.`, `#/find/${other.id}`);
    }

    // arrived
    if (ui.walk.progress >= 1) {
      clearInterval(ui.walk.timer);
      render();
    }
  }, 200);
}

// puts the walking dot in the right place and updates the minutes left
function moveWalker(space, minutes) {
  const point = pointAlong(walkRoute(space).points, ui.walk.progress);
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

// point a fraction of the way along the route
function pointAlong(points, fraction) {
  const lengths = [];
  for (let i = 1; i < points.length; i++) {
    lengths.push(Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  }
  let distanceLeft = fraction * lengths.reduce((a, b) => a + b, 0);

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

// start

// click outside a modal to close it
$("#modal").addEventListener("click", event => {
  if (event.target.id === "modal") closeModal();
});

// escape closes the menu, then the modal, then the card
document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  if (ui.menu) { ui.menu = null; render(); }
  else if (!$("#modal").hidden) closeModal();
  else if (currentRoute().id) go(`#/${currentRoute().screen}`);
});

// opening a link straight to a space on a phone shows the map
if (currentRoute().screen === "find" && currentRoute().id && isNarrow()) ui.findView = "map";
render();
