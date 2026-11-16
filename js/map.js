/*
 * map.js
 * draws the campus map as an svg picture and makes it move: drag to pan,
 * scroll or pinch to zoom, and tap a pin to open that space.
 *
 * the map is measured in metres. the svg "viewBox" says which part of the
 * campus is on screen, as x, y, width and height. panning changes x and y,
 * zooming changes width and height. ui.map in app.js remembers it.
 * the map's colours are set in style.css, so they change with dark mode.
 */

// the part of the campus shown when the app opens, in metres
const HOME_VIEW = { x: 170, y: 230, w: 680, h: 340 };

// how far in and out the map can zoom, as the width shown in metres
const MIN_WIDTH = 120;
const MAX_WIDTH = 1400;

// below this width, in metres, the smaller building names appear
const SHOW_ALL_NAMES = 480;

// ---------------------------------------------------------------- drawing

// builds the map. pins, labels and dots are drawn at a fixed size in screen
// pixels, so they don't grow huge when zoomed in. scaleMarkers sorts that out
//   spaces    which spaces get a pin
//   selected  the open space's id, drawn bigger with a ring round it
//   route     a space to draw the walking route to
function drawMap({ spaces = [], selected = null, route = null }) {
  const view = ui.map;
  const start = startPlace();

  // the walking route is a bent line from the user to the space
  let routeLine = "";
  if (route) {
    const bend = routeBend(route);
    routeLine = `<path class="route" d="M${start.x} ${start.y} L${bend[0]} ${bend[1]} L${route.x} ${route.y}"
      vector-effect="non-scaling-stroke"/>`;
  }

  // building names. the "major" ones always show, the rest when zoomed in
  const names = LANDMARKS.map(place => marker(place.x, place.y,
    `<text class="place-label" text-anchor="middle">${place.name}</text>`, "", place.major ? "" : "minor")).join("");

  // grey pins are drawn first, then coloured ones, then the selected one, so it's on top
  const layer = space => (space.id === selected ? 2 : isBestMatch(space, data.find) ? 1 : 0);
  const ordered = [...spaces].sort((a, b) => layer(a) - layer(b));
  const pins = ordered.map(space => pin(space, space.id === selected)).join("");

  // the user: a blue dot with location on, or a dark pin on the place they picked
  const you = marker(start.x, start.y, data.settings.useLocation
    ? `<circle class="you-halo" r="16"/><circle class="you-dot" r="7"/>`
    : `<circle class="you-pin" r="8"/><text class="you-label" y="-14" text-anchor="middle">You</text>`);

  // the walking dot, moved along the route by moveWalker in app.js
  const walker = route ? marker(start.x, start.y, `<circle class="you-dot" r="9"/>`, `id="walker"`) : "";

  return `<svg id="map" class="map ${view.w < SHOW_ALL_NAMES ? "zoomed-in" : ""}" viewBox="${view.x} ${view.y} ${view.w} ${view.h}"
      preserveAspectRatio="xMidYMid meet" role="img" aria-label="Map of UEA campus. Drag to move, scroll to zoom.">
    <rect class="m-ground" x="-1000" y="-1000" width="3000" height="3000"/>
    <path class="m-green" d="${MAP.green}"/>
    <path class="m-pitch" d="${MAP.pitch}"/>
    <path class="m-water" d="${MAP.water}"/>
    <path class="m-service" d="${MAP.service}"/>
    <path class="m-road" d="${MAP.road}"/>
    <path class="m-path" d="${MAP.path}"/>
    <path class="m-building" d="${MAP.bld}"/>
    ${names}${routeLine}${pins}${you}${walker}
  </svg>`;
}

// wraps something in a group placed at x, y on the map. data-x and data-y
// let scaleMarkers keep it the same size on screen at any zoom.
// extra adds more attributes, and extraClass adds more class names
function marker(x, y, inside, extra = "", extraClass = "") {
  return `<g class="marker ${extraClass}" data-x="${x}" data-y="${y}" transform="translate(${x} ${y})" ${extra}>${inside}</g>`;
}

// one pin. best matches are coloured by busyness and named. the rest are
// small and grey. the selected one is bigger, with a ring and its name.
// rooms are drawn as rounded squares, so they look different from open seating
function pin(space, isSelected) {
  const label = busyLabel(space);
  const match = isBestMatch(space, data.find);
  const colour = match || isSelected ? label.colour : "grey";
  const size = isSelected ? 13 : match ? 10 : 7;
  const shape = space.kind === "room"
    ? `<rect class="pin-dot" x="${-size}" y="${-size}" width="${size * 2}" height="${size * 2}" rx="4"/>`
    : `<circle class="pin-dot" r="${size}"/>`;

  return marker(space.x, space.y, `
    ${isSelected ? `<circle class="pin-ring" r="24"/>` : ""}
    ${shape}
    ${match || isSelected ? `<text class="pin-label ${isSelected ? "selected" : ""}" y="${-size - 7}" text-anchor="middle">${safe(space.name)}</text>` : ""}`,
    `data-id="${space.id}" tabindex="0" role="button" aria-label="${safe(space.name)}, ${label.text}"`,
    `pin pin-${colour}`);
}

// the corner of the walking route, so it looks like it follows a path
function routeBend(space) {
  const start = startPlace();
  return [(start.x + space.x) / 2, start.y + 30];
}

// ---------------------------------------------------------------- sizes and moving

// how many map metres one screen pixel covers right now
function metresPerPixel(svg) {
  return 1 / svg.getScreenCTM().a;
}

// keeps every pin, label and dot the same size on screen at any zoom level
function scaleMarkers(svg) {
  const k = metresPerPixel(svg);
  svg.querySelectorAll(".marker").forEach(group => {
    group.setAttribute("transform", `translate(${group.dataset.x} ${group.dataset.y}) scale(${k})`);
  });
}

// puts ui.map onto the svg, then fixes the marker sizes and building names
function applyView(svg) {
  const v = ui.map;
  svg.setAttribute("viewBox", `${v.x} ${v.y} ${v.w} ${v.h}`);
  svg.classList.toggle("zoomed-in", v.w < SHOW_ALL_NAMES);
  scaleMarkers(svg);
}

// zooms by a factor around a point on the screen, so the spot under the
// mouse or fingers stays still. factor above 1 zooms out, below 1 zooms in
function zoomAt(svg, clientX, clientY, factor) {
  const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, ui.map.w * factor));
  factor = newWidth / ui.map.w;

  // the map point under the cursor
  const p = new DOMPoint(clientX, clientY).matrixTransform(svg.getScreenCTM().inverse());

  ui.map.x = p.x - (p.x - ui.map.x) * factor;
  ui.map.y = p.y - (p.y - ui.map.y) * factor;
  ui.map.w *= factor;
  ui.map.h *= factor;
  applyView(svg);
}

// zooms around the middle of the map, for the + and − buttons
function zoomButton(factor) {
  const svg = $("#map");
  const box = svg.getBoundingClientRect();
  zoomAt(svg, box.left + box.width / 2, box.top + box.height / 2, factor);
}

// goes back to the starting view of the whole campus
function resetMapView() {
  ui.map = { ...HOME_VIEW };
  applyView($("#map"));
}

// true if animations should be skipped, from settings or the device
function motionOff() {
  return data.settings.reduceMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// smoothly moves the map so a space sits in the top part of the map,
// above the details card. it also zooms in a little if zoomed far out
function panTo(space) {
  const svg = $("#map");
  if (!svg) return;
  const from = { ...ui.map };

  // zoom in to at most 420 metres wide, keeping the same shape
  const w = Math.min(from.w, 420);
  const h = from.h * (w / from.w);

  // how much of the map is visible on screen, in metres, at the new zoom
  const box = svg.getBoundingClientRect();
  const perPixel = Math.max(w / box.width, h / box.height);
  const visibleHeight = box.height * perPixel;

  // put the space 28% down the visible map, so the card doesn't cover it
  const to = { w, h, x: space.x - w / 2, y: space.y + visibleHeight * 0.22 - h / 2 };

  if (motionOff()) {
    ui.map = to;
    applyView(svg);
    return;
  }

  // slide there over 350 milliseconds
  const started = performance.now();
  function step(now) {
    const t = Math.min(1, (now - started) / 350);
    const ease = 1 - Math.pow(1 - t, 3); // starts fast, ends slow
    for (const key of ["x", "y", "w", "h"]) ui.map[key] = from[key] + (to[key] - from[key]) * ease;
    if (!document.body.contains(svg)) return; // the screen changed, so stop
    applyView(svg);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ---------------------------------------------------------------- mouse, touch and keyboard

// called after the find screen is drawn, to make the map respond
function setupMap() {
  const svg = $("#map");
  if (!svg) return;
  scaleMarkers(svg);

  const pointers = new Map(); // every finger or mouse button pressed on the map
  let moved = 0;              // how far it's been dragged, to tell a drag from a tap
  let pressedPin = null;      // the pin the press started on, if any

  svg.addEventListener("pointerdown", event => {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    moved = 0;
    const hit = event.target.closest(".pin");
    pressedPin = hit ? hit.dataset.id : null;
  });

  svg.addEventListener("pointermove", event => {
    const old = pointers.get(event.pointerId);
    if (!old) return;
    const now = { x: event.clientX, y: event.clientY };
    pointers.set(event.pointerId, now);
    moved += Math.abs(now.x - old.x) + Math.abs(now.y - old.y);

    // once it's clearly a drag, keep getting moves even outside the map
    if (moved > 4 && !svg.hasPointerCapture(event.pointerId)) {
      svg.setPointerCapture(event.pointerId);
      svg.classList.add("dragging");
    }

    if (pointers.size === 1) {
      // one finger or the mouse: drag the map along with it
      const perPixel = metresPerPixel(svg);
      ui.map.x -= (now.x - old.x) * perPixel;
      ui.map.y -= (now.y - old.y) * perPixel;
      applyView(svg);
    } else if (pointers.size === 2) {
      // two fingers: pinch. compare the gap between them before and after
      const other = [...pointers.entries()].find(([id]) => id !== event.pointerId)[1];
      const gapBefore = Math.hypot(old.x - other.x, old.y - other.y);
      const gapAfter = Math.hypot(now.x - other.x, now.y - other.y);
      if (gapAfter > 0) zoomAt(svg, (now.x + other.x) / 2, (now.y + other.y) / 2, gapBefore / gapAfter);
    }
  });

  // lifting the finger or mouse. if it barely moved, it was a tap
  const lift = event => {
    pointers.delete(event.pointerId);
    svg.classList.remove("dragging");
    if (event.type === "pointerup" && moved <= 4 && pointers.size === 0) {
      // tapping a pin opens it, tapping empty map closes the card
      if (pressedPin) go(`#/find/${pressedPin}`);
      else if (currentRoute().id) go("#/find");
    }
  };
  svg.addEventListener("pointerup", lift);
  svg.addEventListener("pointercancel", lift);

  // mouse wheel or trackpad: zoom around the cursor
  svg.addEventListener("wheel", event => {
    event.preventDefault(); // stops the page scrolling instead
    zoomAt(svg, event.clientX, event.clientY, Math.exp(event.deltaY * 0.0015));
  }, { passive: false });

  // keyboard: enter or space on a focused pin opens it
  svg.addEventListener("keydown", event => {
    const hit = event.target.closest(".pin");
    if (hit && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      go(`#/find/${hit.dataset.id}`);
    }
  });
}

// when the window changes size, keep the markers the right size
window.addEventListener("resize", () => {
  const svg = $("#map");
  if (svg) scaleMarkers(svg);
});
