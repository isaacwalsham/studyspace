// filters

// noise 1 to 5 in words
const NOISE = ["Silent", "Quiet", "Some Talking", "Chatty", "Loud"];

// test checks a space. forRooms means it shows on book a room too.
// missing is what the warning says when a space doesn't pass
const FILTERS = [
  { id: "quiet",       label: "Quiet",                   icon: "quiet",   forRooms: true,  test: s => s.noise <= 2,
    missing: s => NOISE[s.noise - 1].toLowerCase() },
  { id: "foodAllowed", label: "Food Allowed",            icon: "food",    forRooms: false, test: s => s.foodAllowed,
    missing: () => "food not allowed" },
  { id: "foodNearby",  label: "Food Nearby",             icon: "coffee",  forRooms: false, test: s => s.foodNearbyMin <= 3,
    missing: s => `nearest food is ${s.foodNearbyMin} min away` },
  { id: "sockets",     label: "Sockets",                 icon: "plug",    forRooms: true,  test: s => s.sockets,
    missing: () => "no sockets" },
  { id: "natural",     label: "Natural Light",           icon: "sun",     forRooms: true,  test: s => s.lighting === "Natural",
    missing: () => "no natural light" },
  { id: "lowFoot",     label: "Not Many People Passing", icon: "steps",   forRooms: false, test: s => s.footfall === "Low",
    missing: s => s.footfall === "High" ? "lots of people passing" : "some people passing" },
  { id: "screen",      label: "Shared Screen",           icon: "monitor", forRooms: true,  test: s => s.screen,
    missing: () => "no shared screen" },
  { id: "whiteboard",  label: "Whiteboard",              icon: "pen",     forRooms: true,  test: s => s.whiteboard,
    missing: () => "no whiteboard" },
  { id: "access",      label: "Step-Free Entrance",      icon: "access",  forRooms: true,  test: s => s.accessible,
    missing: () => "stairs only" },
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

  // more spread out, and more varied
  { id: "tec", name: "Enterprise Centre Atrium", building: "The Enterprise Centre", kind: "open", x: 663, y: -41,
    busy: 0.25, seats: 48, updatedMin: 13, noise: 2, foodAllowed: true, foodNearbyMin: 1, sockets: true,
    lighting: "Natural", footfall: "Low", screen: true, whiteboard: true, accessible: true,
    hours: "Open until 18:00", about: "Timber atrium with long tables and a small café. A walk from the Square, so it's rarely full." },
  { id: "earlham", name: "Earlham Park Café", building: "Earlham Park", kind: "open", x: 360, y: -125,
    busy: 0.6, seats: 36, updatedMin: 28, noise: 4, foodAllowed: true, foodNearbyMin: 0, sockets: false,
    lighting: "Natural", footfall: "High", screen: false, whiteboard: false, accessible: true,
    hours: "Open until 16:00", about: "Park café with outdoor tables. Families and dog walkers at weekends." },
  { id: "blackdale", name: "Blackdale Common Room", building: "Blackdale Building", kind: "open", x: 1065, y: 74,
    busy: 0.45, seats: 28, updatedMin: 11, noise: 3, foodAllowed: true, foodNearbyMin: 2, sockets: true,
    lighting: "Soft", footfall: "Medium", screen: true, whiteboard: false, accessible: true,
    hours: "Open 24 hours", about: "Sofas, a TV and a kitchenette. Handy late at night if you live on this side of campus." },
  { id: "music", name: "Music Centre Foyer", building: "Music Centre", kind: "open", x: 820, y: 464,
    busy: 0.35, seats: 16, updatedMin: 19, noise: 5, foodAllowed: true, foodNearbyMin: 3, sockets: true,
    lighting: "Bright", footfall: "Low", screen: false, whiteboard: false, accessible: true,
    hours: "Open until 20:00", about: "A few tables outside the practice rooms. Expect to hear rehearsals." },
  { id: "multifaith", name: "Multifaith Centre Quiet Room", building: "Multifaith Centre", kind: "open", x: 717, y: 355,
    busy: 0.05, seats: 10, updatedMin: 42, noise: 1, foodAllowed: false, foodNearbyMin: 3, sockets: false,
    lighting: "Soft", footfall: "Low", screen: false, whiteboard: false, accessible: true,
    hours: "Open until 19:00", about: "Small, silent and calm. For reading rather than laptops." },
  { id: "arts1", name: "Arts 1 Reading Room", building: "Arts 1", kind: "open", x: 716, y: 315,
    busy: 0.78, seats: 22, updatedMin: 5, noise: 1, foodAllowed: false, foodNearbyMin: 4, sockets: true,
    lighting: "Natural", footfall: "Low", screen: false, whiteboard: false, accessible: false,
    hours: "Open until 19:00", about: "Silent room lined with bookshelves. Up one flight of stairs." },
  { id: "chem", name: "Chemistry Breakout Booths", building: "Chemistry & Pharmacy", kind: "open", x: 610, y: 376,
    busy: 0.65, seats: 24, updatedMin: 9, noise: 3, foodAllowed: false, foodNearbyMin: 5, sockets: true,
    lighting: "Bright", footfall: "Medium", screen: true, whiteboard: true, accessible: true,
    hours: "Open until 18:00", about: "Four-person booths with screens, between the labs and the teaching wall." },
  { id: "edu", name: "Education Study Room", building: "Education (EDU)", kind: "open", x: 476, y: 378,
    busy: 0.2, seats: 18, updatedMin: 24, noise: 2, foodAllowed: false, foodNearbyMin: 4, sockets: true,
    lighting: "Soft", footfall: "Low", screen: false, whiteboard: true, accessible: true,
    hours: "Open until 18:00", about: "Round tables and a whiteboard wall. Good for planning with a friend." },
  { id: "norfolk", name: "Norfolk Terrace Common Room", building: "Norfolk Terrace", kind: "open", x: 512, y: 489,
    busy: 0.92, seats: 14, updatedMin: 7, noise: 4, foodAllowed: true, foodNearbyMin: 6, sockets: true,
    lighting: "Natural", footfall: "Medium", screen: true, whiteboard: false, accessible: false,
    hours: "Open 24 hours", about: "Small common room in the ziggurats, with a great view. Steps only." },
  { id: "lake", name: "Lakeside Benches", building: "UEA Broad", kind: "open", x: 649, y: 671,
    busy: 0.1, seats: 12, updatedMin: 55, noise: 1, foodAllowed: true, foodNearbyMin: 6, sockets: false,
    lighting: "Natural", footfall: "Low", screen: false, whiteboard: false, accessible: false,
    hours: "Outdoors, weather permitting", about: "Benches by the water, for reading on a dry day. The path is uneven." },

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
  { name: "Enterprise Centre", x: 663, y: -15, major: true },
  { name: "Earlham Park", x: 360, y: -100 },
  { name: "Blackdale", x: 1065, y: 100, major: true },
  { name: "Music Centre", x: 820, y: 488 },
  { name: "Arts 1", x: 716, y: 338 },
  { name: "Chemistry", x: 610, y: 400 },
  { name: "UEA Broad", x: 662, y: 766, major: true },
  { name: "Colney Lane", x: -432, y: 430, major: true },
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

// page tours. each page has its own, shown the first time it's opened.
// target is the part of the screen the outline is drawn around. on find,
// view is which half to show on phones, as they only show the list or the map
const TOURS = {
  find: [
    { target: ".panel-top", view: "list", title: "Filters and Sort",
      text: "Tell us what you need, like sockets or quiet, and how far you'll walk. Every filter that's on shows as a chip underneath. Tap one to remove it." },
    { target: "#find-panel .list-card", view: "list", title: "Your Results",
      text: "Each space shows how busy it is and its match score out of 100. Best Matches have everything you asked for. Other Spaces, further down, says what each one is missing." },
    { target: ".map-key", view: "map", title: "The Map",
      text: "Every open space is a pin on the map, coloured by how busy it is. This key says what each colour means. Tap a pin for details and directions." },
    { target: "#tabs", view: "list", title: "The Rest of the App",
      text: "Book a group room, see your bookings, or change your settings, where you'll also find the FAQ. The first time you open each page, we'll show you round it too." },
  ],
  book: [
    { target: '[data-tour="people"]', title: "How Many People",
      text: "Start with the size of your group. Rooms too small for it are hidden." },
    { target: '[data-tour="day"]', title: "Pick a Day",
      text: "Today or any of the next four days. The rooms update to show that day's free times." },
    { target: '[data-tour="refine"]', title: "Filters and Sort",
      text: "The same as on Find. Say what the room needs, like a screen, and sort by best match, nearest or most free times." },
    { target: ".room-card", title: "Rooms",
      text: "Each room shows its match score, what it has, and a strip of the day's hours with how many are free. Tap a room to pick a time and book it." },
  ],
  bookings: [
    { target: '[data-tour="upcoming"]', title: "Coming Up",
      text: "Rooms you've booked, soonest first. When you book a room it shows here." },
    { target: '[data-tour="upcoming"] .booking-actions', title: "Directions and Cancel",
      text: "Get walking directions to the room, or cancel any time before it starts. Cancelling can be undone." },
    { target: '[data-tour="past"] .booking', title: "Past Bookings",
      text: "Rooms you've used before. Book Again opens the same room so you can pick a new time." },
  ],
  settings: [
    { target: '[data-tour="profile"]', title: "Your Profile",
      text: "Change your picture and the name people see, or sign out." },
    { target: '[data-tour="appearance"]', title: "Appearance",
      text: "Pick an accent colour, and a light, dark or automatic theme." },
    { target: '[data-tour="accessibility"]', title: "Accessibility",
      text: "Larger text, high contrast, less motion, and colours for colour blindness." },
    { target: '[data-tour="help"]', title: "Help",
      text: "Answers to common questions, and about the team who made StudySpace." },
    { target: '[data-tour="about"]', title: "About",
      text: "Read the terms and privacy policy, replay these tours, or reset the app to start again." },
  ],
};

// short help for each task. opens by itself the first time, then from the ? button
const TIPS = {
  book: { title: "Booking a Room",
    text: "Pick a free time, then press Book This Time. You'll see a summary to check first, and you can undo or cancel it in My Bookings." },
  report: { title: "Updating How Busy",
    text: "A moderator checks your update for a few seconds before everyone sees it. You can undo it or change your answer at any point." },
  directions: { title: "Getting There",
    text: "The line on the map is the walking route. Press Start Walking to follow it. If the space fills up on the way, we'll suggest a quieter one." },
};

// terms and privacy, made up for the prototype but true about what it does.
// laid out like a real legal page: numbered sections, each with any of
// text (paragraphs), points (a list), table and note (a highlighted box).
// a point is plain text, or [bold start, rest of the sentence]
const LEGAL_DATE = "28 November 2026";

const TERMS = [
  { id: "introduction", title: "Introduction",
    text: [
      "These Terms and Conditions (\"Terms\") cover your use of StudySpace (the \"App\"), a prototype made by Group 17 for CMP-6039A Human Computer Interaction at the University of East Anglia (\"we\", \"us\", \"our\").",
      "By signing in you agree to these Terms and our Privacy Policy. If you don't agree, please don't use the App.",
    ],
    note: "StudySpace is a student prototype, not a real UEA service. Busyness, seats and free times are made up, and bookings and updates are pretend." },
  { id: "definitions", title: "Definitions",
    points: [
      ["\"Space\"", "means an open study area anyone can use without booking."],
      ["\"Room\"", "means a group room or study pod that has to be booked."],
      ["\"Booking\"", "means one hour in a Room, held for you and your group."],
      ["\"Update\"", "means a report from you of how busy a Space is right now."],
    ] },
  { id: "eligibility", title: "Who Can Use It",
    text: ["The App is for UEA students and staff. You sign in with your UEA email, ending in @uea.ac.uk."],
    points: ["In this prototype no account is made and no password is checked.", "Your name in the App is the part of your email before the @, and you can change it in Settings."] },
  { id: "finding", title: "Finding Spaces",
    points: [
      ["Busyness.", "Shown as a word and a colour, from people's Updates. In this prototype it's made up."],
      ["Match score.", "Out of 100, from free seats, walking time and how recent the busyness is. Each Space shows how its score is worked out."],
      ["Walk times.", "Follow the campus footpaths, but they're only a guide."],
    ] },
  { id: "bookings", title: "Booking Rooms",
    text: ["You agree to:"],
    points: [
      "Only book a Room your group will use",
      "Cancel in My Bookings if you can't make it, so someone else can use the Room",
      "Leave the Room on time for the next Booking",
    ] },
  { id: "updates", title: "Busyness Updates",
    points: [
      ["Be accurate.", "Only report what you can see right now."],
      ["Photos are optional.", "If you add one, avoid people's faces."],
      ["Every Update is checked.", "A moderator checks it before anyone sees it, and removes Updates that look wrong. In this prototype the moderator is simulated."],
    ] },
  { id: "acceptable-use", title: "Acceptable Use",
    text: ["You must not:"],
    points: [
      "Send false Updates, or lots of Updates to change a Space's busyness",
      "Book Rooms to stop other people using them",
      "Try to break, overload or copy the App",
    ] },
  { id: "responsibility", title: "Our Responsibility to You",
    text: ["The App is a prototype for testing ideas. We can't promise a Space will be free or as busy as shown, so please don't rely on it for anything important, like an exam."] },
  { id: "changes", title: "Changes to These Terms",
    text: ["We may change these Terms. If we do, the date at the top of this page changes too."] },
  { id: "contact", title: "Contact Us",
    text: ["Questions about these Terms go to Group 17, CMP-6039A Human Computer Interaction, University of East Anglia."] },
];

const PRIVACY = [
  { id: "introduction", title: "Introduction",
    text: ["This Privacy Policy explains what StudySpace (the \"App\") keeps about you, where, and how to delete it. The App is a prototype made by Group 17 for CMP-6039A Human Computer Interaction at the University of East Anglia (\"we\", \"us\")."],
    note: "In this prototype, everything you enter stays in your browser on this device. Nothing is sent to us or anyone else." },
  { id: "what-we-keep", title: "What We Keep",
    table: {
      head: ["What", "Why"],
      rows: [
        ["Your UEA email and display name", "To show who's signed in"],
        ["Your profile picture and colour", "To show on your profile"],
        ["Your Bookings", "To show them in My Bookings and stop double bookings"],
        ["Your busyness Updates", "To show them on the Space until they're out of date"],
        ["Your filters and settings", "So the App stays how you left it"],
      ],
    } },
  { id: "what-we-dont-keep", title: "What We Don't Keep",
    points: [
      ["Your password.", "It isn't checked or saved anywhere."],
      ["Photos.", "A photo you add to an Update is only shown on your screen while you send it, then thrown away."],
      ["Your real location.", "The App never asks your device where you are."],
    ] },
  { id: "where", title: "Where It's Kept",
    points: [
      "Only in your browser's storage (localStorage) on this device",
      "Nothing is sent to a server, so we can't see it",
      "The map is built into the App from OpenStreetMap data, so opening it doesn't contact any map service",
    ] },
  { id: "location", title: "Location",
    text: ["Location is simulated. Walk times start from the New Science Building, or from the place you pick in Settings → Location."] },
  { id: "how-long", title: "How Long We Keep It",
    text: ["Until you delete it. Signing out keeps your Bookings and settings on this device, so they're there when you sign back in."] },
  { id: "deleting", title: "Deleting Your Data",
    points: [
      ["In the App.", "Settings → About → Reset All App Data deletes everything and signs you out. It can't be undone."],
      ["In your browser.", "Clearing this site's data does the same."],
    ] },
  { id: "rights", title: "Your Rights",
    text: ["If the App became a real UEA service, it would follow UK GDPR. You could then ask to see, correct or delete your data, or object to how it's used, at any time."] },
  { id: "contact", title: "Contact Us",
    text: ["Questions about this policy go to Group 17, CMP-6039A Human Computer Interaction, University of East Anglia."] },
];
