/*
 * store.js
 * remembers the user's data in the browser with localStorage, so sign-in,
 * filters, bookings, reports and settings are still there after a refresh.
 * there is no server, so nothing leaves the user's own browser.
 */

const STORE_KEY = "studyspace-v2";

// what a brand new user starts with
function freshData() {
  return {
    user: null,        // set when someone signs in, e.g. { name, email, avatar, avatarColour }
    setupDone: false,  // true once they've picked their needs after sign-in

    // the find page and the book a room page each keep their own filters,
    // because what you need from a café isn't what you need from a room
    find: { filters: [], maxWalk: 10, sort: "best" },
    book: { filters: [], maxWalk: 60, sort: "best", groupSize: 2, day: 0 },

    bookings: pastBookings(), // a couple of old bookings, so the history isn't empty
    reports: {},              // busyness reports, keyed by space id

    settings: {
      accent: "teal",        // an id from ACCENTS
      theme: "light",        // "light", "dark" or "auto", which follows the device
      useLocation: true,     // pretend gps on, so the user is at GPS_PLACE
      startPlace: "nsb",     // where they are when location is off
      largeText: false,
      highContrast: false,
      reduceMotion: false,
      alerts: true,          // "filling up" alerts while walking
    },
  };
}

// two made-up bookings from last week, so my bookings has some history
function pastBookings() {
  return [
    { id: "past1", roomId: "room020", date: dateFromToday(-7), slot: "14:00", people: 4 },
    { id: "past2", roomId: "jsc105", date: dateFromToday(-3), slot: "11:00", people: 3 },
  ];
}

// the date a number of days from today, as text like "2026-11-16".
// text dates sort in the right order, which keeps comparing them simple
function dateFromToday(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// loads the saved data, or starts fresh if there's nothing saved yet
function loadData() {
  const fresh = freshData();
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if (!saved) return fresh;

    // merging with fresh data means any newer fields still get a default value
    return {
      ...fresh, ...saved,
      find: { ...fresh.find, ...saved.find },
      book: { ...fresh.book, ...saved.book },
      settings: { ...fresh.settings, ...saved.settings },
    };
  } catch (error) {
    // private browsing or blocked storage, so just use fresh data
    return fresh;
  }
}

// saves the current data. called after every change the user makes
function saveData() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  } catch (error) {
    // storage is blocked, so the app still works but forgets on refresh
  }
}

// the one copy of the user's data the whole app reads and changes
let data = loadData();
