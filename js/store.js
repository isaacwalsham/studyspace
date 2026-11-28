const STORE_KEY = "studyspace-v2";

// what a brand new user starts with
function freshData() {
  return {
    user: null,        // set on sign in
    setupDone: false,  // picked their needs after sign in
    toursSeen: [],     // pages whose tour has been seen or skipped
    seenTips: [],      // task tips already closed, ids from TIPS

    // find and book a room keep separate filters
    find: { filters: [], maxWalk: 10, sort: "best" },
    book: { filters: [], maxWalk: 60, sort: "best", groupSize: 2, day: 0 },

    bookings: pastBookings(),
    reports: {},              // by space id
    pending: {},              // updates waiting to be checked, by space id

    settings: {
      accent: "teal",        // an id from ACCENTS
      theme: "light",        // light, dark or auto
      useLocation: true,     // fake gps
      startPlace: "nsb",     // used when location is off
      largeText: false,
      highContrast: false,
      reduceMotion: false,
      colourBlind: false,
      colourBlindType: "deuteranopia",
      alerts: true,          // filling up alerts
    },
  };
}

// two fake past bookings so the past list isn't empty
function pastBookings() {
  return [
    { id: "past1", roomId: "room020", date: dateFromToday(-7), slot: "14:00", people: 4 },
    { id: "past2", roomId: "jsc105", date: dateFromToday(-3), slot: "11:00", people: 3 },
  ];
}

// date n days from today as "2026-11-16", which sorts properly as text
function dateFromToday(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// saved data, or fresh if there's none
function loadData() {
  const fresh = freshData();
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if (!saved) return fresh;

    // merge so new fields get defaults
    return {
      ...fresh, ...saved,
      find: { ...fresh.find, ...saved.find },
      book: { ...fresh.book, ...saved.book },
      settings: { ...fresh.settings, ...saved.settings },
    };
  } catch (error) {
    // storage blocked, start fresh
    return fresh;
  }
}

// called after every change
function saveData() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  } catch (error) {
    // storage blocked, it just won't remember
  }
}

let data = loadData();
