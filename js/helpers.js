// shortcut for querySelector
const $ = selector => document.querySelector(selector);

// finds a space, filter or place by its id
const findSpace = id => SPACES.find(space => space.id === id);
const findFilter = id => FILTERS.find(filter => filter.id === id);
const findPlace = id => PLACES.find(place => place.id === id);

// phone width, where find shows the list or the map
const isNarrow = () => window.matchMedia("(max-width: 899px)").matches;

// "1 space" or "3 spaces"
const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

// "1 person" or "4 people"
const people = count => `${count} ${count === 1 ? "person" : "people"}`;

// icons

// line icons, drawn on a 24 by 24 grid
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.5-4.5"/>',
  calendarPlus: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  ticket: '<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5V14a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2.5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  sort: '<path d="M7 4v16M3.5 16.5 7 20l3.5-3.5M17 20V4M13.5 7.5 17 4l3.5 3.5"/>',
  quiet: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="m17 9 4 6M21 9l-4 6"/>',
  food: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 2-3 5s1 4 3 4v9"/>',
  coffee: '<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9zM16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3v3M12 3v3"/>',
  plug: '<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0V8zM12 17v4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  steps: '<path d="M7 3.5c1.6 0 2.6 2 2.6 4.6S8.6 12.7 7 12.7 4.4 10.6 4.4 8.1 5.4 3.5 7 3.5zM17 10c1.6 0 2.6 2 2.6 4.6s-1 4.6-2.6 4.6-2.6-2-2.6-4.6S15.4 10 17 10z"/>',
  monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  pen: '<path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1zM14.5 6.5l3 3"/>',
  access: '<circle cx="12" cy="4.5" r="1.8"/><path d="M12 7.5V13h4.5l2 6M12 10H8M10 13.2a4.8 4.8 0 1 0 5 5.8"/>',
  people: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3.5 19.5c.7-3.3 3-5 5.5-5s4.8 1.7 5.5 5M15.5 14.5c2.3 0 4.2 1.4 5 4.5"/>',
  walk: '<circle cx="13" cy="4" r="1.8"/><path d="m9 21 2.5-7L14 16v5M11.5 14 12 9l-3 2v3M12 9l3 3 3 1"/>',
  map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6zM9 3v15M15 6v15"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  building: '<path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 9h4a1 1 0 0 1 1 1v11M3 21h18M8 8h3M8 12h3M8 16h3"/>',
  door: '<path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M4 21h16"/><circle cx="14.5" cy="12" r=".9" fill="currentColor"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  back: '<path d="m15 5-7 7 7 7"/>',
  next: '<path d="m9 5 7 7-7 7"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  alert: '<path d="M12 3.5 2.5 20h19L12 3.5z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.3"/>',
  refresh: '<path d="M20 11.5A8 8 0 1 0 17.7 17M20 4.5v7h-7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  target: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5"/>',
  laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
  headphones: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  leaf: '<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15zM5 19l7-7"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.5-.8 1.5-1.5 0-1.2-1-1.5-1-2.5s.8-1.5 1.8-1.5H17a4 4 0 0 0 4-4c0-4.7-4-8.5-9-8.5z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10.5" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>',
  location: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4l2-2zM10 20.5a2 2 0 0 0 4 0"/>',
  camera: '<path d="M4 8h3l1.6-2.5h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
  eye: '<path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z"/><circle cx="12" cy="12" r="3"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5zM3 12.5l9 5 9-5M3 16.5l9 5 9-5"/>',
};

// icon name -> svg
function icon(name, size = 20) {
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true">${ICONS[name] || ""}</svg>`;
}

// map pin with a book. the book follows the accent colour
function logo(size = 28) {
  return `<svg class="logo-mark" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true">
    <path d="M16 3C10.5 3 6 7.4 6 12.9c0 7 8.6 15.1 9 15.5.6.5 1.4.5 2 0 .4-.4 9-8.5 9-15.5C26 7.4 21.5 3 16 3z" fill="#fff"/>
    <path class="logo-book" d="M10.5 10.4c1.9-.8 3.8-.6 5.5.6 1.7-1.2 3.6-1.4 5.5-.6v6.4c-1.9-.8-3.8-.6-5.5.6-1.7-1.2-3.6-1.4-5.5-.6zM16 11v6.4"
      fill="none" stroke-width="1.7" stroke-linejoin="round"/>
  </svg>`;
}

// initials or an icon on their colour
function avatar(user, size = 52) {
  const inside = user.avatar === "initials" || !user.avatar
    ? initials(user.name)
    : icon(user.avatar, Math.round(size * 0.5));
  return `<span class="avatar" data-colour="${user.avatarColour || "teal"}"
    style="width:${size}px;height:${size}px;font-size:${size * 0.36}px">${inside}</span>`;
}

// "isaac walsham" -> "IW"
function initials(name) {
  return name.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map(word => word[0].toUpperCase()).join("") || "?";
}

// where the user is

// fake gps if location is on, otherwise the place picked in settings
function startPlace() {
  const id = data.settings.useLocation ? GPS_PLACE : data.settings.startPlace;
  return findPlace(id) || PLACES[0];
}

// real route along the paths, at 80m a minute. see routes.js
function walkMins(space) {
  return minsBetween(startPlace(), space);
}

// walk between any two places
function minsBetween(from, to) {
  return Math.max(1, Math.round(findRoute(from, to).metres / 80));
}

// busyness

// a user's report overrides the seed value
function busyness(space) {
  const report = data.reports[space.id];
  if (report) {
    const minutes = Math.round((Date.now() - report.time) / 60000);
    return { busy: report.busy, updatedMin: minutes, byYou: true, photo: report.photo };
  }
  return { busy: space.busy, updatedMin: space.updatedMin, byYou: false };
}

// always a word as well as a colour, for colour-blind users
function busyLabel(space) {
  const busy = busyness(space).busy;
  if (busy < 0.4) return { text: "Quiet", colour: "green" };
  if (busy < 0.75) return { text: "Some Seats", colour: "amber" };
  if (busy < 0.9) return { text: "Busy", colour: "orange" };
  return { text: "Full", colour: "red" };
}

// "updated 4 min ago"
function updatedText(space) {
  const info = busyness(space);
  const when = info.updatedMin < 1 ? "just now" : `${info.updatedMin} min ago`;
  return info.byYou ? `You updated this ${when}${info.photo ? ", photo checked" : ""}` : `Updated ${when}`;
}

// matching

// prefs is data.find or data.book

// filters that apply to this page
function filtersFor(listName) {
  return listName === "book" ? FILTERS.filter(filter => filter.forRooms) : FILTERS;
}

// has every filter
function meetsFilters(space, filterIds) {
  return filterIds.every(id => findFilter(id).test(space));
}

// filters this space is missing
function missingFilters(space, prefs) {
  return prefs.filters.map(findFilter).filter(filter => !filter.test(space));
}

// step 1: a best match has every filter, is within the walk limit and isn't full.
// lab 7 fix: spaces missing filters used to show as best matches
function isBestMatch(space, prefs, filterIds = prefs.filters) {
  if (!meetsFilters(space, filterIds)) return false;
  if (walkMins(space) > prefs.maxWalk) return false;
  if (space.kind === "room") return freeSlots(space, bookDate()).length > 0;
  return busyLabel(space).text !== "Full";
}

// why it isn't a best match
function reasonsNotMatched(space, prefs) {
  const reasons = missingFilters(space, prefs).map(filter => filter.missing(space));
  if (walkMins(space) > prefs.maxWalk) reasons.push(`${walkMins(space)} min walk (your limit is ${prefs.maxWalk})`);
  if (space.kind === "room" && freeSlots(space, bookDate()).length === 0) reasons.push("no free times that day");
  if (space.kind === "open" && busyLabel(space).text === "Full") reasons.push("full right now");
  return reasons;
}

// "No sockets, some people passing"
function reasonsText(reasons) {
  const text = reasons.join(", ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// the filter that brings back the most spaces if turned off
function filterToDrop(spaces, prefs) {
  let best = null;
  for (const id of prefs.filters) {
    const others = prefs.filters.filter(f => f !== id);
    const count = spaces.filter(space => isBestMatch(space, prefs, others)).length;
    if (count > 0 && (!best || count > best.count)) best = { filter: findFilter(id), count };
  }
  return best;
}

// the match score

// step 2: score out of 100
// open spaces: free seats 50, walk 30, how recent 20
// rooms: free times 50, walk 30, right size 20
// e.g. 20% busy, 6 min away, updated 3 min ago = 40 + 18 + 18 = 76
function scoreParts(space) {
  // 15+ min scores 0
  const shortWalk = 1 - Math.min(walkMins(space), 15) / 15;

  if (space.kind === "room") {
    // out of the slots left today, so rooms aren't marked down later on
    const date = bookDate();
    const left = SLOTS.filter(slot => slotState(space, date, slot) !== "past").length;
    return [
      { label: "Free Times Left That Day", value: left ? freeSlots(space, date).length / left : 0, weight: 50 },
      { label: "Short Walk", value: shortWalk, weight: 30 },
      // a room for 4 used by 4 scores 1, a room for 8 used by 2 scores 0.25
      { label: "Right Size for Your Group", value: Math.min(1, data.book.groupSize / space.capacity), weight: 20 },
    ];
  }

  const info = busyness(space);
  return [
    { label: "Free Seats", value: 1 - info.busy, weight: 50 },
    { label: "Short Walk", value: shortWalk, weight: 30 },
    // 30+ min old scores 0
    { label: "Up-to-Date Info", value: 1 - Math.min(info.updatedMin, 30) / 30, weight: 20 },
  ];
}

// total out of 100
function matchScore(space) {
  return Math.round(scoreParts(space).reduce((total, part) => total + part.value * part.weight, 0));
}

function sortSpaces(spaces, prefs) {
  const list = [...spaces];
  if (prefs.sort === "nearest") return list.sort((a, b) => walkMins(a) - walkMins(b));
  if (prefs.sort === "free") {
    // rooms: most free times first. open spaces: least busy first
    const freeness = space => space.kind === "room" ? freeSlots(space, bookDate()).length : 1 - busyness(space).busy;
    return list.sort((a, b) => freeness(b) - freeness(a));
  }
  return list.sort((a, b) => matchScore(b) - matchScore(a));
}

// booking days and times

// today and the next four days
function bookingDays() {
  return [0, 1, 2, 3, 4].map(offset => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return {
      offset,
      date: dateFromToday(offset),
      label: offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : date.toLocaleDateString("en-GB", { weekday: "long" }),
      short: date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" }),
      weekday: date.toLocaleDateString("en-GB", { weekday: "short" }),
      number: date.getDate(),
    };
  });
}

// the date picked on the book a room page
function bookDate() {
  return dateFromToday(data.book.day);
}

// turns "2026-11-18" into "Today", "Tomorrow" or "Wed 18 Nov"
function dateLabel(date) {
  if (date === dateFromToday(0)) return "Today";
  if (date === dateFromToday(1)) return "Tomorrow";
  if (date === dateFromToday(-1)) return "Yesterday";
  return new Date(date + "T12:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

// fake bookings by other people, seeded by room and date so they stay the same
function takenByOthers(roomId, date) {
  let seed = [...(roomId + date)].reduce((total, ch) => (total * 31 + ch.charCodeAt(0)) % 233280, 7);
  return SLOTS.filter(() => {
    seed = (seed * 9301 + 49297) % 233280; // seeded random
    return seed / 233280 < 0.3;             // about 30% of slots are taken
  });
}

// free, taken, mine or past
function slotState(room, date, slot) {
  if (data.bookings.some(b => b.roomId === room.id && b.date === date && b.slot === slot)) return "mine";
  if (date === dateFromToday(0) && Number(slot.slice(0, 2)) <= new Date().getHours()) return "past";
  if (takenByOthers(room.id, date).includes(slot)) return "taken";
  return "free";
}

// slots still free
function freeSlots(room, date) {
  return SLOTS.filter(slot => slotState(room, date, slot) === "free");
}

// "14:00" becomes "15:00"
function endTime(slot) {
  const hour = Number(slot.slice(0, 2)) + 1;
  return `${String(hour).padStart(2, "0")}:00`;
}

function isPast(booking) {
  const today = dateFromToday(0);
  if (booking.date !== today) return booking.date < today;
  return Number(endTime(booking.slot).slice(0, 2)) <= new Date().getHours();
}

// escape user text before it goes into html
function safe(text) {
  return String(text).replace(/[&<>"']/g, ch => `&#${ch.charCodeAt(0)};`);
}
