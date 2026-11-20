// starting view, in metres
const HOME_VIEW = { x: 170, y: 230, w: 680, h: 340 };

// zoom limits, as visible width in metres
const MIN_WIDTH = 120;
const MAX_WIDTH = 1400;

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
    <path class="m-service" d="${MAP.service}"/>
    <path class="m-road" d="${MAP.road}"/>
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
}

// applies ui.map to the svg
function applyView(svg) {
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
  if (!svg) return;
  const from = { ...ui.map };

  // zoom in to 420m wide at most
  const w = Math.min(from.w, 420);
  const h = from.h * (w / from.w);

  const box = svg.getBoundingClientRect();
  const perPixel = Math.max(w / box.width, h / box.height);
  const visibleHeight = box.height * perPixel;

  // 28% down so the card doesn't cover it
  const to = { w, h, x: space.x - w / 2, y: space.y + visibleHeight * 0.22 - h / 2 };

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
  scaleMarkers(svg);

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
  if (svg) scaleMarkers(svg);
});
