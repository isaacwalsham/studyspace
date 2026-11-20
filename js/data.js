// filters

// test checks a space. forRooms means it shows on book a room too
const FILTERS = [
  { id: "quiet",       label: "Quiet",                   icon: "quiet",   forRooms: true,  test: s => s.noise <= 2 },
  { id: "foodAllowed", label: "Food Allowed",            icon: "food",    forRooms: false, test: s => s.foodAllowed },
  { id: "foodNearby",  label: "Food Nearby",             icon: "coffee",  forRooms: false, test: s => s.foodNearbyMin <= 3 },
  { id: "sockets",     label: "Sockets",                 icon: "plug",    forRooms: true,  test: s => s.sockets },
  { id: "natural",     label: "Natural Light",           icon: "sun",     forRooms: true,  test: s => s.lighting === "Natural" },
  { id: "lowFoot",     label: "Not Many People Passing", icon: "steps",   forRooms: false, test: s => s.footfall === "Low" },
  { id: "screen",      label: "Shared Screen",           icon: "monitor", forRooms: true,  test: s => s.screen },
  { id: "whiteboard",  label: "Whiteboard",              icon: "pen",     forRooms: true,  test: s => s.whiteboard },
  { id: "access",      label: "Step-Free Entrance",      icon: "access",  forRooms: true,  test: s => s.accessible },
];

// busy goes from 0 empty to 1 full
const LEVELS = [
  { label: "Empty",      busy: 0.1 },
  { label: "Quiet",      busy: 0.3 },
  { label: "Some Seats", busy: 0.55 },
  { label: "Busy",       busy: 0.8 },
  { label: "Full",       busy: 0.97 },
];

// open study spaces

// noise is 1 silent to 5 loud
const SPACES = [
  // library
  { id: "lib2", name: "Silent Study, Floor 2", building: "Library", kind: "open", x: 735, y: 458,
    busy: 0.15, seats: 80, updatedMin: 4, noise: 1, foodAllowed: false, foodNearbyMin: 2, sockets: true,
    lighting: "Natural", footfall: "Medium", screen: false, whiteboard: false, accessible: true,
    hours: "Open 24 hours", about: "Long rows of desks by the windows. Silence is enforced." },
  { id: "lib1", name: "Quiet Study, Floor 1", building: "Library", kind: "open", x: 744, y: 468,
    busy: 0.45, seats: 120, updatedMin: 7, noise: 2, foodAllowed: false, foodNearbyMin: 2, sockets: true,
    lighting: "Bright", footfall: "Medium", screen: false, whiteboard: false, accessible: true,
    hours: "Open 24 hours", about: "Big open floor with desks and soft chairs. Whispering is fine." },
  { id: "lib0", name: "Library Ground Floor", building: "Library", kind: "open", x: 726, y: 474,
    busy: 0.7, seats: 90, updatedMin: 3, noise: 3, foodAllowed: true, foodNearbyMin: 0, sockets: true,
    lighting: "Natural", footfall: "High", screen: true, whiteboard: true, accessible: true,
    hours: "Open 24 hours", about: "Group tables and PCs by the café. Talking allowed." },

  // west of campus, near the new science building
  { id: "julian", name: "Julian Study Centre", building: "Julian Study Centre", kind: "open", x: 270, y: 323,
    busy: 0.4, seats: 60, updatedMin: 9, noise: 2, foodAllowed: false, foodNearbyMin: 6, sockets: true,
    lighting: "Bright", footfall: "Medium", screen: false, whiteboard: false, accessible: true,
    hours: "Open until 21:00", about: "Open-plan study floor next to the New Science Building. Quiet but bright." },
  { id: "newsci", name: "New Science Atrium", building: "New Science Building", kind: "open", x: 222, y: 352,
    busy: 0.3, seats: 35, updatedMin: 15, noise: 3, foodAllowed: true, foodNearbyMin: 1, sockets: true,
    lighting: "Natural", footfall: "High", screen: false, whiteboard: false, accessible: true,
    hours: "Open until 19:00", about: "Tall glass atrium with high tables. Handy between lectures." },
  { id: "efry", name: "Elizabeth Fry Study Area", building: "Elizabeth Fry Building", kind: "open", x: 367, y: 380,
    busy: 0.2, seats: 24, updatedMin: 18, noise: 2, foodAllowed: false, foodNearbyMin: 4, sockets: true,
    lighting: "Natural", footfall: "Low", screen: false, whiteboard: false, accessible: true,
    hours: "Open until 18:00", about: "A small, calm corner with window desks. Easy to miss." },
  { id: "tpsc", name: "Thomas Paine Atrium", building: "Thomas Paine Study Centre", kind: "open", x: 412, y: 334,
    busy: 0.55, seats: 70, updatedMin: 6, noise: 3, foodAllowed: true, foodNearbyMin: 1, sockets: true,
    lighting: "Natural", footfall: "Medium", screen: false, whiteboard: false, accessible: true,
    hours: "Open until 21:00", about: "Bright atrium with booths and a coffee bar." },
  { id: "queens", name: "Queen's Study Hub", building: "Queen's Building", kind: "open", x: 417, y: 406,
    busy: 0.25, seats: 30, updatedMin: 22, noise: 2, foodAllowed: false, foodNearbyMin: 5, sockets: true,
    lighting: "Soft", footfall: "Low", screen: true, whiteboard: true, accessible: true,
    hours: "Open until 18:00", about: "Quiet room with booths, mainly used by health students." },
  { id: "sainsbury", name: "Sainsbury Centre Café", building: "Sainsbury Centre", kind: "open", x: 335, y: 519,
    busy: 0.35, seats: 40, updatedMin: 12, noise: 3, foodAllowed: true, foodNearbyMin: 0, sockets: false,
    lighting: "Natural", footfall: "Medium", screen: false, whiteboard: false, accessible: true,
    hours: "Open until 17:00", about: "Café tables with a view over the lake. Not many sockets." },

  // middle of campus
  { id: "zicer", name: "ZICER Open Study", building: "ZICER", kind: "open", x: 525, y: 367,
    busy: 0.6, seats: 45, updatedMin: 8, noise: 2, foodAllowed: false, foodNearbyMin: 4, sockets: true,
    lighting: "Natural", footfall: "Low", screen: true, whiteboard: false, accessible: true,
    hours: "Open until 20:00", about: "Desks under a big glass roof, with PCs along one wall." },
  { id: "cmp", name: "CMP IT Lab 0.03", building: "Computing (CMP)", kind: "open", x: 526, y: 420,
    busy: 0.85, seats: 40, updatedMin: 20, noise: 3, foodAllowed: false, foodNearbyMin: 5, sockets: true,
    lighting: "Bright", footfall: "Medium", screen: true, whiteboard: true, accessible: true,
    hours: "Open until 21:00", about: "Lab PCs with specialist software. Often used for module sessions." },
  { id: "lsb", name: "Lawrence Stenhouse Café", building: "Lawrence Stenhouse Building", kind: "open", x: 466, y: 426,
    busy: 0.5, seats: 30, updatedMin: 10, noise: 4, foodAllowed: true, foodNearbyMin: 0, sockets: true,
    lighting: "Natural", footfall: "High", screen: false, whiteboard: false, accessible: true,
    hours: "Open until 16:00", about: "Busy café on the teaching wall. Good coffee, a bit noisy." },
  { id: "meadow", name: "Meadow Building Lounge", building: "Meadow Building", kind: "open", x: 631, y: 410,
    busy: 0.1, seats: 20, updatedMin: 35, noise: 2, foodAllowed: true, foodNearbyMin: 3, sockets: true,
    lighting: "Natural", footfall: "Low", screen: false, whiteboard: false, accessible: false,
    hours: "Open until 18:00", about: "Sofas and low tables. Up a flight of stairs, no lift." },

  // east of campus, by the square and union house
  { id: "su", name: "Union House Seating", building: "Union House", kind: "open", x: 770, y: 387,
    busy: 0.7, seats: 120, updatedMin: 3, noise: 4, foodAllowed: true, foodNearbyMin: 0, sockets: false,
    lighting: "Natural", footfall: "High", screen: false, whiteboard: false, accessible: true,
    hours: "Open until 23:00", about: "Busy social space with music and food outlets. Good for a quick sit-down." },
  { id: "hive", name: "The Hive Café", building: "Union House", kind: "open", x: 752, y: 410,
    busy: 0.95, seats: 90, updatedMin: 2, noise: 5, foodAllowed: true, foodNearbyMin: 0, sockets: true,
    lighting: "Natural", footfall: "High", screen: false, whiteboard: false, accessible: true,
    hours: "Open until 18:00", about: "Café seating, very busy around lunchtime." },
  { id: "square", name: "The Square Steps", building: "The Square", kind: "open", x: 699, y: 437,
    busy: 0.1, seats: 50, updatedMin: 30, noise: 3, foodAllowed: true, foodNearbyMin: 1, sockets: false,
    lighting: "Natural", footfall: "High", screen: false, whiteboard: false, accessible: true,
    hours: "Outdoors, weather permitting", about: "Outdoor concrete steps. Wet after rain and not great for laptops." },
  { id: "arts", name: "Arts 2 Study Corridor", building: "Arts 2", kind: "open", x: 737, y: 292,
    busy: 0.3, seats: 25, updatedMin: 14, noise: 2, foodAllowed: false, foodNearbyMin: 4, sockets: true,
    lighting: "Soft", footfall: "Low", screen: false, whiteboard: false, accessible: true,
    hours: "Open until 20:00", about: "Window desks along a quiet corridor, away from the crowds." },
  { id: "sportspark", name: "Sportspark Café", building: "Sportspark", kind: "open", x: 752, y: 95,
    busy: 0.2, seats: 50, updatedMin: 25, noise: 3, foodAllowed: true, foodNearbyMin: 0, sockets: true,
    lighting: "Bright", footfall: "Medium", screen: false, whiteboard: false, accessible: true,
    hours: "Open until 21:00", about: "Café overlooking the pool. A long walk, but almost always has seats." },

  // bookable rooms

  // booked by the hour
  { id: "pods", name: "Study Pod", building: "Library", kind: "room", capacity: 1, x: 748, y: 476,
    busy: 0.6, seats: 10, updatedMin: 6, noise: 1, sockets: true, lighting: "Soft", footfall: "Low",
    screen: false, whiteboard: false, accessible: true, hours: "Bookable 09:00 to 21:00",
    about: "Small pod with a door and one PC, away from the stairs." },
  { id: "lib205", name: "Media Room 2.05", building: "Library", kind: "room", capacity: 3, x: 730, y: 456,
    busy: 0.3, seats: 3, updatedMin: 11, noise: 2, sockets: true, lighting: "Soft", footfall: "Low",
    screen: true, whiteboard: false, accessible: true, hours: "Bookable 09:00 to 21:00",
    about: "Small room with a big screen, for editing or watching recordings together." },
  { id: "room112", name: "Group Room 1.12", building: "Library", kind: "room", capacity: 2, x: 742, y: 448,
    busy: 0.2, seats: 2, updatedMin: 15, noise: 2, sockets: true, lighting: "Natural", footfall: "Low",
    screen: false, whiteboard: false, accessible: true, hours: "Bookable 09:00 to 21:00",
    about: "Small two-person room with a desk and a window." },
  { id: "room020", name: "Group Room 0.20", building: "Library", kind: "room", capacity: 6, x: 722, y: 452,
    busy: 0.5, seats: 6, updatedMin: 10, noise: 3, sockets: true, lighting: "Bright", footfall: "Low",
    screen: true, whiteboard: true, accessible: true, hours: "Bookable 09:00 to 21:00",
    about: "Enclosed room with a wall monitor and a whiteboard. Talking allowed." },
  { id: "room021", name: "Group Room 0.21", building: "Library", kind: "room", capacity: 8, x: 716, y: 470,
    busy: 0.1, seats: 8, updatedMin: 25, noise: 3, sockets: true, lighting: "Natural", footfall: "Low",
    screen: true, whiteboard: true, accessible: true, hours: "Bookable 09:00 to 21:00",
    about: "Large room with a big table, two screens and a whiteboard wall." },
  { id: "jsc105", name: "JSC Group Room 1.05", building: "Julian Study Centre", kind: "room", capacity: 4, x: 285, y: 312,
    busy: 0.3, seats: 4, updatedMin: 12, noise: 3, sockets: true, lighting: "Bright", footfall: "Low",
    screen: true, whiteboard: false, accessible: true, hours: "Bookable 09:00 to 21:00",
    about: "Four seats round a table, with a wall screen you can plug a laptop into." },
  { id: "jsc202", name: "JSC Group Room 2.02", building: "Julian Study Centre", kind: "room", capacity: 6, x: 260, y: 330,
    busy: 0.2, seats: 6, updatedMin: 16, noise: 2, sockets: true, lighting: "Natural", footfall: "Low",
    screen: true, whiteboard: true, accessible: true, hours: "Bookable 09:00 to 21:00",
    about: "Top-floor room with big windows, a screen and a whiteboard." },
  { id: "tpsc101", name: "TPSC Seminar Room 1.01", building: "Thomas Paine Study Centre", kind: "room", capacity: 12, x: 404, y: 342,
    busy: 0.1, seats: 12, updatedMin: 30, noise: 3, sockets: true, lighting: "Natural", footfall: "Low",
    screen: true, whiteboard: true, accessible: true, hours: "Bookable 09:00 to 21:00",
    about: "Seminar room for bigger groups, with a projector and movable tables." },
  { id: "zicer013", name: "ZICER Group Room 0.13", building: "ZICER", kind: "room", capacity: 4, x: 518, y: 374,
    busy: 0.4, seats: 4, updatedMin: 9, noise: 2, sockets: true, lighting: "Natural", footfall: "Low",
    screen: false, whiteboard: true, accessible: true, hours: "Bookable 09:00 to 21:00",
    about: "Quiet four-person room with a whiteboard wall." },
  { id: "queens104", name: "Queen's Group Room 1.04", building: "Queen's Building", kind: "room", capacity: 6, x: 422, y: 400,
    busy: 0.2, seats: 6, updatedMin: 20, noise: 2, sockets: true, lighting: "Soft", footfall: "Low",
    screen: true, whiteboard: true, accessible: false, hours: "Bookable 09:00 to 18:00",
    about: "Practice room with a screen. First floor, stairs only." },
  { id: "cmp103", name: "CMP Project Room 1.03", building: "Computing (CMP)", kind: "room", capacity: 5, x: 532, y: 428,
    busy: 0.6, seats: 5, updatedMin: 8, noise: 3, sockets: true, lighting: "Bright", footfall: "Medium",
    screen: true, whiteboard: true, accessible: true, hours: "Bookable 09:00 to 21:00",
    about: "Project room with two monitors and a whiteboard, near the CMP labs." },
  { id: "arts103", name: "Arts Seminar Room 1.03", building: "Arts 2", kind: "room", capacity: 10, x: 742, y: 298,
    busy: 0.2, seats: 10, updatedMin: 40, noise: 2, sockets: false, lighting: "Natural", footfall: "Low",
    screen: true, whiteboard: true, accessible: true, hours: "Bookable 09:00 to 21:00",
    about: "Classic seminar room with a big table. Bring a charged laptop." },
];

// places on the map

// map labels. minor ones only show zoomed in
const LANDMARKS = [
  { name: "New Science Building", x: 215, y: 375, major: true },
  { name: "Julian Study Centre", x: 270, y: 300, major: true },
  { name: "Thomas Paine", x: 412, y: 318 },
  { name: "Elizabeth Fry", x: 367, y: 398 },
  { name: "Queen's Building", x: 417, y: 424 },
  { name: "Sainsbury Centre", x: 335, y: 545, major: true },
  { name: "ZICER", x: 525, y: 350 },
  { name: "Computing (CMP)", x: 526, y: 446, major: true },
  { name: "Meadow Building", x: 631, y: 428 },
  { name: "Library", x: 735, y: 500, major: true },
  { name: "Union House", x: 790, y: 372, major: true },
  { name: "Arts 2", x: 737, y: 276 },
  { name: "Sportspark", x: 752, y: 72, major: true },
  { name: "Norfolk Terrace", x: 512, y: 505 },
];

// start points for the fake location setting
const PLACES = [
  { id: "nsb",      name: "New Science Building", x: 216, y: 343 },
  { id: "jsc",      name: "Julian Study Centre",  x: 280, y: 300 },
  { id: "tpsc",     name: "Thomas Paine Study Centre", x: 412, y: 330 },
  { id: "queens",   name: "Queen's Building",     x: 417, y: 410 },
  { id: "cmp",      name: "Computing (CMP)",      x: 526, y: 440 },
  { id: "norfolk",  name: "Norfolk Terrace",      x: 512, y: 489 },
  { id: "library",  name: "Library",              x: 740, y: 490 },
  { id: "union",    name: "Union House",          x: 790, y: 380 },
  { id: "arts",     name: "Arts 2",               x: 737, y: 290 },
  { id: "sport",    name: "Sportspark",           x: 752, y: 110 },
];

// fake gps position
const GPS_PLACE = "nsb";

// choices

// "any" is just a big number
const WALK_OPTIONS = [
  { min: 5,  label: "5 min" },
  { min: 10, label: "10 min" },
  { min: 15, label: "15 min" },
  { min: 60, label: "Any" },
];

// rooms sort by free times instead of busyness
const SORTS = [
  { id: "best",    label: "Best Match",  roomLabel: "Best Match" },
  { id: "nearest", label: "Nearest",     roomLabel: "Nearest" },
  { id: "free",    label: "Least Busy",  roomLabel: "Most Free Times" },
];

// booking times, one hour each
const SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

// accent options, the shades are in the css
const ACCENTS = [
  { id: "teal",   label: "Teal",   hex: "#0b7a75" },
  { id: "blue",   label: "Blue",   hex: "#2b6cb0" },
  { id: "purple", label: "Purple", hex: "#6b46c1" },
  { id: "pink",   label: "Pink",   hex: "#b83280" },
  { id: "orange", label: "Orange", hex: "#c05621" },
  { id: "green",  label: "Green",  hex: "#2f855a" },
];

// profile picture options
const AVATAR_ICONS = ["initials", "book", "coffee", "laptop", "headphones", "star", "leaf", "moon"];
