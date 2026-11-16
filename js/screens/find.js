/*
 * screens/find.js
 * the find screen: filters, sort and results on the left, a big map on the
 * right. tapping a result or a pin slides a card up over the map.
 *   #/find            just the map and results
 *   #/find/lib2       with lib2's card open
 *   #/find/lib2/go    directions to lib2
 */

function findScreen(id, mode) {
  const prefs = data.find;
  const open = SPACES.filter(space => space.kind === "open");

  // step 1: split into best matches and the rest. step 2: sort each group.
  // the rest are also ordered by how many things they miss, fewest first
  const best = sortSpaces(open.filter(space => isBestMatch(space, prefs)), prefs);
  const others = sortSpaces(open.filter(space => !isBestMatch(space, prefs)), prefs)
    .sort((a, b) => reasonsNotMatched(a, prefs).length - reasonsNotMatched(b, prefs).length);

  const selected = id ? findSpace(id) : null;
  const going = selected && mode === "go";

  // the map shows open spaces, plus a room if one is opened from my bookings
  const onMap = selected && selected.kind === "room" ? [...open, selected] : open;

  return `
  <div class="find show-${ui.findView}">
    <div class="view-switch">
      ${segmented([{ value: "list", label: `${icon("list", 18)} List` }, { value: "map", label: `${icon("map", 18)} Map` }],
        ui.findView, v => `setFindView('${v}')`, "Show list or map")}
    </div>

    <aside class="find-panel" id="find-panel">
      <div class="panel-top">${toolbar("find")}</div>

      <section aria-label="Results">
        <h2>Best Matches ${badge(best.length)}</h2>
        ${best.length ? best.map(space => resultCard(space, false, id)).join("") : noMatches(open)}

        <h2>Other Spaces ${badge(others.length)}</h2>
        ${others.map(space => resultCard(space, true, id)).join("")}

        <div class="panel-foot">${btn("Need a Room for a Group? Book a Room", { kind: "ghost", icon: "calendarPlus", href: "#/book" })}</div>
      </section>
    </aside>

    <section class="find-map" aria-label="Map">
      ${drawMap({ spaces: onMap, selected: id, route: going ? selected : null })}
      <div class="map-controls">
        ${btn("", { icon: "plus", onclick: "zoomButton(0.7)", ariaLabel: "Zoom in" })}
        ${btn("", { icon: "minus", onclick: "zoomButton(1.4)", ariaLabel: "Zoom out" })}
        ${btn("", { icon: "target", onclick: "resetMapView()", ariaLabel: "Show the whole campus" })}
      </div>
      ${mapKey()}
      <p class="map-credit">© OpenStreetMap contributors</p>
      ${selected ? `<div class="sheet ${ui.entering ? "enter" : ""}" role="region" aria-label="${safe(selected.name)}">${going ? directionsCard(selected) : spaceCard(selected)}</div>` : ""}
    </section>
  </div>`;
}

// one result in the list. best matches show their score, the others show
// what they're missing. the open one is highlighted, to match its pin
function resultCard(space, showReasons, selectedId) {
  const label = busyLabel(space);
  const reasons = showReasons ? reasonsNotMatched(space, data.find) : [];
  return `<button class="card list-card ${space.id === selectedId ? "selected" : ""}" onclick="go('#/find/${space.id}')">
    <span class="stripe stripe-${label.colour}" aria-hidden="true"></span>
    <span class="list-text">
      <strong>${space.name}</strong>
      <span class="muted">${space.building} · ${walkMins(space)} min walk</span>
      ${reasons.length ? `<span class="reasons">${icon("alert", 14)} ${reasons.join(", ")}</span>` : ""}
    </span>
    <span class="list-side">${busyTag(space)}${showReasons ? "" : scoreTag(space)}</span>
  </button>`;
}

// shown when no space meets every filter. it suggests the one change that
// would help most, instead of just saying "nothing found"
function noMatches(spaces) {
  const drop = filterToDrop(spaces, data.find);
  const further = WALK_OPTIONS.find(option => option.min > data.find.maxWalk);
  return emptyState({
    iconName: "search",
    title: "Nothing Has Everything You Asked For",
    text: "Try one of these:",
    actions: `${drop ? btn(`Turn Off "${drop.filter.label}" (${plural(drop.count, "Space")})`, { onclick: `toggleFilter('find', '${drop.filter.id}')` }) : ""}
      ${further ? btn(further.label === "Any" ? "Walk Any Distance" : `Walk Up to ${further.label}`, { onclick: `setWalk('find', ${further.min})` }) : ""}`,
  });
}

// the colour key in the corner of the map
function mapKey() {
  const rows = [["green", "Quiet"], ["amber", "Some Seats"], ["orange", "Busy"], ["red", "Full"], ["grey", "Not a Match"]];
  return `<div class="map-key" aria-hidden="true">
    ${rows.map(([colour, text]) => `<span><i class="key-dot stripe-${colour}"></i>${text}</span>`).join("")}
  </div>`;
}

// ---------------------------------------------------------------- the card on the map

// the features of a space, as icons with words.
// lab 7 fix: nothing depends on hovering, which phones can't do
function featureList(space) {
  const features = [
    ["quiet", ["Silent", "Quiet", "Some Talking", "Chatty", "Loud"][space.noise - 1]],
    ["plug", space.sockets ? "Sockets" : "No Sockets"],
    ...(space.kind === "open" ? [["food", space.foodAllowed ? "Food Allowed" : "No Food"]] : []),
    ["sun", `${space.lighting} Light`],
    ["monitor", space.screen ? "Shared Screen" : "No Screen"],
    ["pen", space.whiteboard ? "Whiteboard" : "No Whiteboard"],
    ["access", space.accessible ? "Step-Free" : "Stairs Only"],
    ["clock", space.hours],
  ];
  return `<ul class="features">${features.map(([name, text]) => `<li>${icon(name, 16)} ${text}</li>`).join("")}</ul>`;
}

// the details of one space, in the card that slides up over the map
function spaceCard(space) {
  const missing = missingFilters(space, data.find);
  const isRoom = space.kind === "room";

  return `
    <header class="sheet-head">
      <div>
        <h2>${space.name}</h2>
        ${facts([["building", space.building], ["walk", `${walkMins(space)} min walk`],
          isRoom ? ["people", `Fits ${space.capacity}`] : ["people", `${space.seats} seats`]])}
      </div>
      ${busyTag(space, true)}
      ${btn("", { kind: "ghost", icon: "close", href: "#/find", ariaLabel: "Close" })}
    </header>
    <p class="small muted">${icon("refresh", 14)} ${updatedText(space)}</p>

    ${!isRoom && data.find.filters.length
      ? notice(missing.length ? "warn" : "good", missing.length
        ? `Doesn't have: ${missing.map(f => f.label.toLowerCase()).join(", ")}`
        : "Has everything you asked for")
      : ""}

    <p>${space.about}</p>
    ${featureList(space)}
    ${isRoom ? "" : scoreBreakdown(space)}

    <div class="actions">
      ${btn("Directions", { kind: "primary", icon: "walk", href: `#/find/${space.id}/go` })}
      ${isRoom ? btn("Book This Room", { kind: "primary", icon: "calendarPlus", onclick: `startBooking('${space.id}')` }) : ""}
      ${btn("Update How Busy", { icon: "people", onclick: `openReport('${space.id}')` })}
      ${btn("Ask for an Update", { icon: "refresh", onclick: `askForUpdate('${space.id}')` })}
    </div>
    ${["orange", "red"].includes(busyLabel(space).colour) ? alternativeBox(space) : ""}`;
}

// when a space is busy, suggest the nearest quiet one
function alternativeBox(space) {
  const other = nearbyAlternative(space);
  if (!other) return "";
  return `<div class="notice notice-info alt">${icon("info", 18)}
    <span>It's busy here. <strong>${other.name}</strong> is quiet and ${walkMins(other)} min away.</span>
    ${btn("View", { size: "small", href: `#/find/${other.id}` })}
  </div>`;
}

// the card while getting directions. the walk is pretend: the blue dot moves
// along the route, then it asks how busy the space is when you arrive
function directionsCard(space) {
  const walking = ui.walk && ui.walk.id === space.id;
  const arrived = walking && ui.walk.progress >= 1;

  if (arrived) {
    return `
      <header class="sheet-head">
        <div><h2>${icon("check", 22)} You've Arrived</h2><p class="muted">${space.name}</p></div>
        ${btn("", { kind: "ghost", icon: "close", href: `#/find/${space.id}`, ariaLabel: "Close" })}
      </header>
      <p>How busy is it right now? Your answer helps everyone else.</p>
      <div class="actions">
        ${btn("Update How Busy", { kind: "primary", icon: "people", onclick: `openReport('${space.id}')` })}
        ${btn("Not Now", { href: `#/find/${space.id}` })}
      </div>`;
  }

  return `
    <header class="sheet-head">
      <div>
        <h2>Directions to ${space.name}</h2>
        <p class="muted" id="walk-status">From ${startPlace().name} · ${walkMins(space)} min walk</p>
      </div>
      ${btn("", { kind: "ghost", icon: "close", href: `#/find/${space.id}`, ariaLabel: "Back to details" })}
    </header>
    <div class="progress" aria-hidden="true"><span id="walk-bar" style="width:${walking ? ui.walk.progress * 100 : 0}%"></span></div>
    <div class="actions">
      ${btn(walking ? "Walking…" : "Start Walking (Simulated)", { kind: "primary", icon: "walk", onclick: `startWalk('${space.id}')`, disabled: walking })}
      ${btn("Back to Details", { href: `#/find/${space.id}` })}
    </div>`;
}

// ---------------------------------------------------------------- busyness report

// the busyness report modal. it has two steps: pick a level, then a
// confirmation that stays until the user presses done.
// lab 7 fix: before, the popup closed straight away, so people weren't sure it worked
function reportModal() {
  const space = findSpace(ui.report.id);

  if (ui.report.done) {
    return modalFrame({
      title: "Thanks, Update Sent",
      iconName: "check",
      body: `<p>${space.name} now shows as <strong>${LEVELS[ui.report.level].label}</strong> for everyone.</p>`,
      footer: `${btn("Undo", { onclick: "undoReport()" })}
        ${btn("Change My Answer", { onclick: "changeReport()" })}
        ${btn("Done", { kind: "primary", onclick: "closeModal()" })}`,
    });
  }

  return modalFrame({
    title: `How Busy Is ${space.name}?`,
    body: `<p class="muted">Pick what you can see right now.</p>
      <div class="levels">${LEVELS.map((level, index) =>
        `<button class="tile ${ui.report.level === index ? "on" : ""}" aria-pressed="${ui.report.level === index}" onclick="pickLevel(${index})">
          <i class="key-dot stripe-${["green", "green", "amber", "orange", "red"][index]}"></i><span>${level.label}</span>
          ${ui.report.level === index ? icon("check", 18) : ""}
        </button>`).join("")}</div>`,
    footer: `${btn("Cancel", { onclick: "closeModal()" })}
      ${btn("Send Update", { kind: "primary", onclick: "sendReport()", disabled: ui.report.level === null })}`,
  });
}
