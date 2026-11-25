function findScreen(id, mode) {
  const prefs = data.find;
  const open = SPACES.filter(space => space.kind === "open");

  // best matches first, then the rest by how much they're missing
  const best = sortSpaces(open.filter(space => isBestMatch(space, prefs)), prefs);
  const others = sortSpaces(open.filter(space => !isBestMatch(space, prefs)), prefs)
    .sort((a, b) => reasonsNotMatched(a, prefs).length - reasonsNotMatched(b, prefs).length);

  const selected = id ? findSpace(id) : null;
  const going = selected && mode === "go";

  // plus a room if one was opened from my bookings
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

// best matches show a score, the rest show what they're missing
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

// suggests the change that helps most instead of just "nothing found"
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

// map key
function mapKey() {
  const rows = [["green", "Quiet"], ["amber", "Some Seats"], ["orange", "Busy"], ["red", "Full"], ["grey", "Not a Match"]];
  return `<div class="map-key" aria-hidden="true">
    ${rows.map(([colour, text]) => `<span><i class="key-dot stripe-${colour}"></i>${text}</span>`).join("")}
  </div>`;
}

// the card on the map

// lab 7 fix: icons have words, nothing relies on hover
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

// details card over the map
function spaceCard(space) {
  const missing = missingFilters(space, data.find);
  const isRoom = space.kind === "room";

  return `
    <header class="sheet-head">
      <div><h2>${space.name}</h2></div>
      ${busyTag(space, true)}
      ${btn("", { kind: "ghost", icon: "close", href: "#/find", ariaLabel: "Close" })}
    </header>
    ${facts([["building", space.building], ["walk", `${walkMins(space)} min walk`],
      isRoom ? ["people", `Fits ${space.capacity}`] : ["people", `${space.seats} seats`]])}
    <p class="small muted">${icon("refresh", 14)} ${updatedText(space)}</p>
    ${data.pending[space.id] ? notice("info", "Your update is being checked. It'll show here once it's approved.") : ""}

    ${!isRoom && data.find.filters.length
      ? notice(missing.length ? "warn" : "good", missing.length
        ? `Doesn't have: ${missing.map(f => f.label.toLowerCase()).join(", ")}`
        : "Has everything you asked for")
      : ""}

    <p>${space.about}</p>

    <div class="actions">
      ${btn("Directions", { kind: "primary", icon: "walk", href: `#/find/${space.id}/go` })}
      ${isRoom ? btn("Book This Room", { kind: "primary", icon: "calendarPlus", onclick: `startBooking('${space.id}')` }) : ""}
      ${btn("Update How Busy", { icon: "people", onclick: `openReport('${space.id}')` })}
      ${btn("Ask for an Update", { icon: "refresh", onclick: `askForUpdate('${space.id}')` })}
    </div>
    ${["orange", "red"].includes(busyLabel(space).colour) ? alternativeBox(space) : ""}
    ${featureList(space)}
    ${isRoom ? "" : scoreBreakdown(space)}`;
}

// when a space is busy, suggest the nearest quiet one
function alternativeBox(space) {
  const other = nearbyAlternative(space);
  if (!other) return "";
  return `<div class="notice notice-info alt">${icon("info", 18)}
    <span>It's busy here. <strong>${other.name}</strong> is quiet, and ${minsBetween(space, other)} min from ${space.name}.</span>
    ${btn("View", { size: "small", href: `#/find/${other.id}` })}
  </div>`;
}

// fake walk, then asks how busy it is when you arrive
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

// busyness report

// lab 7 fix: the confirmation stays until done is pressed, people weren't sure it had sent
function reportModal() {
  const space = findSpace(ui.report.id);

  if (ui.report.done) {
    const level = LEVELS[ui.report.level].label;
    const waiting = data.pending[space.id];
    return modalFrame({
      title: waiting ? "Thanks, Your Update Is Being Checked" : "Update Approved",
      iconName: waiting ? "clock" : "check",
      body: waiting
        ? `<p>A moderator is checking your update${waiting.photo ? " and photo" : ""}. ${space.name} will show as <strong>${level}</strong> once it's approved.</p>
          <p class="small muted">You can close this. We'll tell you when it's done. In this prototype the check is simulated.</p>`
        : `<p>${space.name} now shows as <strong>${level}</strong> for everyone.</p>`,
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
        </button>`).join("")}</div>
      ${photoPicker(space)}`,
    footer: `${btn("Cancel", { onclick: "closeModal()" })}
      ${btn("Send Update", { kind: "primary", onclick: "sendReport()", disabled: ui.report.level === null })}`,
  });
}

// optional photo, to back up the update. it's only ever shown on this device
function photoPicker(space) {
  const { photo, photoError } = ui.report;
  return `<h3>Photo (optional)</h3>
    <p class="small muted">A photo helps the moderator check your update. It isn't shared, but please avoid people's faces.</p>
    ${photo
      ? `<div class="photo-preview">
          <img src="${photo}" alt="Your photo of ${safe(space.name)}">
          ${btn("Remove Photo", { size: "small", icon: "close", onclick: "removePhoto()" })}
        </div>`
      : `<label class="btn btn-secondary photo-btn">${icon("camera", 18)}<span>Add a Photo</span>
          <input type="file" accept="image/*" onchange="addPhoto(this)">
        </label>`}
    <p class="error small" role="alert" ${photoError ? "" : "hidden"}>${photoError || ""}</p>`;
}
