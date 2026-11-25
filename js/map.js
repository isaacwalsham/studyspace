// starting view, in metres
const HOME_VIEW = { x: 170, y: 230, w: 680, h: 340 };

// zoom limits, as visible width in metres
const MIN_WIDTH = 120;
const MAX_WIDTH = 1400;

// how far the map can be moved: campus, plus colney lane to the west
const BOUNDS = { left: -560, right: 1250, top: -330, bottom: 1200 };

// minor labels show below this width
const SHOW_ALL_NAMES = 480;

// drawing

// markers stay the same size on screen, scaleMarkers handles that
function drawMap({ spaces = [], selected = null, route = null }) {
  const view = ui.map;
  const start = startPlace();

  // walking route
  let routeLine = "";
  if (route) {
    const points = walkRoute(route).points.map(([x, y]) => `${x} ${y}`).join(" L");
    routeLine = `<path class="route" d="M${points}" vector-effect="non-scaling-stroke"/>`;
  }

  // building labels
  const names = LANDMARKS.map(place => marker(place.x, place.y,
    `<text class="place-label" text-anchor="middle">${place.name}</text>`, "", place.major ? "" : "minor")).join("");

  // grey first so coloured and selected pins sit on top
  const layer = space => (space.id === selected ? 2 : isBestMatch(space, data.find) ? 1 : 0);
  const ordered = [...spaces].sort((a, b) => layer(a) - layer(b));
  const pins = ordered.map(space => pin(space, space.id === selected)).join("");

  // user: blue dot with location on, pin otherwise
  const you = marker(start.x, start.y, data.settings.useLocation
    ? `<circle class="you-halo" r="16"/><circle class="you-dot" r="7"/>`
    : `<circle class="you-pin" r="8"/><text class="you-label" y="-14" text-anchor="middle">You</text>`);

  // walking dot, moved by moveWalker
  const walker = route ? marker(start.x, start.y, `<circle class="you-dot" r="9"/>`, `id="walker"`) : "";

  return `<svg id="map" class="map ${view.w < SHOW_ALL_NAMES ? "zoomed-in" : ""}" viewBox="${view.x} ${view.y} ${view.w} ${view.h}"
      preserveAspectRatio="xMidYMid meet" role="img" aria-label="Map of UEA campus. Drag to move, scroll to zoom.">
    <rect class="m-ground" x="-1000" y="-1000" width="3000" height="3000"/>
    <path class="m-green" d="${MAP.green}"/>
    <path class="m-pitch" d="${MAP.pitch}"/>
    <path class="m-water" d="${MAP.water}"/>
    <path class="m-green" d="${MAP.islands}"/>
    <path class="m-service" d="${MAP.service}"/>
    <path class="m-road" d="${MAP.road}"/>
    <path class="m-road" d="${MAP.lane}"/>
    <path class="m-path" d="${MAP.path}"/>
    <path class="m-building" d="${MAP.bld}"/>
    ${names}${routeLine}${pins}${you}${walker}
  </svg>`;
}

// data-x and data-y let scaleMarkers keep it a fixed size
function marker(x, y, inside, extra = "", extraClass = "") {
  return `<g class="marker ${extraClass}" data-x="${x}" data-y="${y}" transform="translate(${x} ${y})" ${extra}>${inside}</g>`;
}

// best matches are coloured and named, the rest small and grey. rooms are squares
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

// sizes and moving

// metres per screen pixel
function metresPerPixel(svg) {
  return 1 / svg.getScreenCTM().a;
}

// same size on screen at any zoom
function scaleMarkers(svg) {
  const k = metresPerPixel(svg);
  svg.querySelectorAll(".marker").forEach(group => {
    group.setAttribute("transform", `translate(${group.dataset.x} ${group.dataset.y}) scale(${k})`);
  });

  // labels only start or stop overlapping when the zoom changes
  if (svg.dataset.zoom !== k.toFixed(4)) {
    svg.dataset.zoom = k.toFixed(4);
    hideCrowdedLabels(svg);
  }
}

// hides labels that would cover another label or pin. the selected space goes
// first, then best matches by score, then building names
function hideCrowdedLabels(svg) {
  const box = element => element.getBoundingClientRect();
  const overlaps = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

  const pins = [...svg.querySelectorAll(".pin")].map(group => ({
    label: group.querySelector(".pin-label"),
    dot: box(group.querySelector(".pin-dot")),
    rank: group.querySelector(".selected") ? Infinity : matchScore(findSpace(group.dataset.id)),
  }));
  const named = pins.filter(pin => pin.label).sort((a, b) => b.rank - a.rank);
  const places = [...svg.querySelectorAll(".place-label")].map(label => ({ label, dot: null }));

  const shown = [];
  for (const { label, dot } of [...named, ...places]) {
    const area = box(label);
    if (!area.width) continue; // not drawn at this zoom
    const crowded = shown.some(other => overlaps(area, other))
      || pins.some(pin => pin.dot !== dot && overlaps(area, pin.dot));
    const keep = !crowded || label.classList.contains("selected");
    label.classList.toggle("crowded", !keep);
    if (keep) shown.push(area);
  }
}

// keeps what's on screen inside BOUNDS. if more than that fits on screen, it's centred
function keepInBounds(svg) {
  const v = ui.map;
  const box = svg.getBoundingClientRect();
  if (!box.width) return;
  const perPixel = Math.max(v.w / box.width, v.h / box.height);
  // a card covers the bottom of the map, so allow that much further down
  const sheet = $(".sheet");
  const bottom = BOUNDS.bottom + (sheet ? sheet.offsetHeight * perPixel : 0);
  const limit = (middle, seen, low, high) => seen >= high - low
    ? (low + high) / 2
    : Math.min(high - seen / 2, Math.max(low + seen / 2, middle));

  v.x = limit(v.x + v.w / 2, box.width * perPixel, BOUNDS.left, BOUNDS.right) - v.w / 2;
  v.y = limit(v.y + v.h / 2, box.height * perPixel, BOUNDS.top, bottom) - v.h / 2;
}

// applies ui.map to the svg
function applyView(svg) {
  keepInBounds(svg);
  const v = ui.map;
  svg.setAttribute("viewBox", `${v.x} ${v.y} ${v.w} ${v.h}`);
  svg.classList.toggle("zoomed-in", v.w < SHOW_ALL_NAMES);
  scaleMarkers(svg);
}

// zoom around a point so it stays under the cursor. factor > 1 zooms out
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

// + and - buttons
function zoomButton(factor) {
  const svg = $("#map");
  const box = svg.getBoundingClientRect();
  zoomAt(svg, box.left + box.width / 2, box.top + box.height / 2, factor);
}

// back to the whole campus
function resetMapView() {
  ui.map = { ...HOME_VIEW };
  applyView($("#map"));
}

// reduce motion, from settings or the device
function motionOff() {
  return data.settings.reduceMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// slides the map so the space sits above the details card
function panTo(space) {
  const svg = $("#map");
  if (!svg || !svg.clientWidth) return;
  const from = { ...ui.map };

  // zoom in to 420m wide at most
  const w = Math.min(from.w, 420);
  const h = from.h * (w / from.w);

  const box = svg.getBoundingClientRect();
  const perPixel = Math.max(w / box.width, h / box.height);
  const visibleHeight = box.height * perPixel;

  // 28% down so the card doesn't cover it
  slideMap(svg, { w, h, x: space.x - w / 2, y: space.y + visibleHeight * 0.22 - h / 2 });
}

// fits the whole route into the part of the map above the directions card
function fitRoute(space) {
  const svg = $("#map");
  if (!svg || !svg.clientWidth) return;
  const points = walkRoute(space).points;
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys);

  // the space we have, in pixels: below the zoom buttons and above the card,
  // with room around it for pins and labels
  const box = svg.getBoundingClientRect();
  const sheet = $(".sheet");
  const covered = sheet ? sheet.offsetHeight + 40 : 0;
  const roomTop = $(".map-controls").offsetHeight + 50;
  const roomBottom = box.height - covered - 30;
  const perPixel = Math.max((right - left) / Math.max(1, box.width - 160),
    (bottom - top) / Math.max(80, roomBottom - roomTop));

  const shape = ui.map.h / ui.map.w;
  const perWidth = Math.max(1 / box.width, shape / box.height);
  const w = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, perPixel / perWidth));
  const h = w * shape;

  // put the middle of the route in the middle of that space
  const offset = (roomTop + roomBottom) / 2 - box.height / 2;
  slideMap(svg, { w, h, x: (left + right) / 2 - w / 2, y: (top + bottom) / 2 - offset * w * perWidth - h / 2 });
}

// moves to a new view, smoothly unless motion is off
function slideMap(svg, to) {
  const from = { ...ui.map };
  if (motionOff()) {
    ui.map = to;
    applyView(svg);
    return;
  }

  const started = performance.now();
  function step(now) {
    const t = Math.min(1, (now - started) / 350);
    const ease = 1 - Math.pow(1 - t, 3); // ease out
    for (const key of ["x", "y", "w", "h"]) ui.map[key] = from[key] + (to[key] - from[key]) * ease;
    if (!document.body.contains(svg)) return; // the screen changed, so stop
    applyView(svg);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// mouse, touch and keyboard

// drag, pinch, wheel, tap and keyboard
function setupMap() {
  const svg = $("#map");
  if (!svg) return;
  applyView(svg);

  const pointers = new Map(); // fingers or mouse currently down
  let moved = 0;              // to tell a drag from a tap
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

    // capture once it's a real drag
    if (moved > 4 && !svg.hasPointerCapture(event.pointerId)) {
      svg.setPointerCapture(event.pointerId);
      svg.classList.add("dragging");
    }

    if (pointers.size === 1) {
      // one pointer: pan
      const perPixel = metresPerPixel(svg);
      ui.map.x -= (now.x - old.x) * perPixel;
      ui.map.y -= (now.y - old.y) * perPixel;
      applyView(svg);
    } else if (pointers.size === 2) {
      // two fingers: pinch zoom
      const other = [...pointers.entries()].find(([id]) => id !== event.pointerId)[1];
      const gapBefore = Math.hypot(old.x - other.x, old.y - other.y);
      const gapAfter = Math.hypot(now.x - other.x, now.y - other.y);
      if (gapAfter > 0) zoomAt(svg, (now.x + other.x) / 2, (now.y + other.y) / 2, gapBefore / gapAfter);
    }
  });

  // barely moved means it was a tap
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

  // wheel or trackpad zoom
  svg.addEventListener("wheel", event => {
    event.preventDefault(); // stops the page scrolling instead
    zoomAt(svg, event.clientX, event.clientY, Math.exp(event.deltaY * 0.0015));
  }, { passive: false });

  // enter or space opens a focused pin
  svg.addEventListener("keydown", event => {
    const hit = event.target.closest(".pin");
    if (hit && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      go(`#/find/${hit.dataset.id}`);
    }
  });
}

// keep markers the right size on resize
window.addEventListener("resize", () => {
  const svg = $("#map");
  if (svg) applyView(svg);
});
