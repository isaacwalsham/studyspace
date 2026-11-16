/*
 * screens/book.js
 * booking a room. the controls run along the top, the rooms fill the width
 * as cards, and picking a room slides the cards to the left and opens a
 * panel on the right with its details and times, where you can book it.
 *   #/book            all rooms
 *   #/book/room020    the same, with room 0.20's panel open
 * on phones, the panel slides in over the whole screen instead.
 */

// lab 7 fix: booking has its own tab, separate from open seating. you say
// how many people first, and rooms that are too small are hidden
function bookScreen(id) {
  const prefs = data.book;
  const rooms = SPACES.filter(space => space.kind === "room");
  const fits = rooms.filter(room => room.capacity >= prefs.groupSize);
  const selected = id ? findSpace(id) : null;
  const open = selected && selected.kind === "room";

  const best = sortSpaces(fits.filter(room => isBestMatch(room, prefs)), prefs);
  const others = sortSpaces(fits.filter(room => !isBestMatch(room, prefs)), prefs);

  return `<section class="page full">
    ${pageHead("Book a Room")}

    <div class="card controls">
      <div class="control">
        <span class="control-label">People</span>
        ${groupStepper()}
      </div>
      <div class="control control-grow">
        <span class="control-label">Day</span>
        ${dayPicker()}
      </div>
      <div class="control control-tools">
        <span class="control-label">Refine</span>
        ${toolbarButtons("book")}
      </div>
    </div>
    ${activeFilters("book")}

    <div class="book-layout ${open ? "has-panel" : ""}">
      <div class="book-list">
        <h2 class="list-head">Best Matches ${badge(best.length)}</h2>
        ${best.length
          ? `<div class="room-grid">${best.map(room => roomCard(room, false, id)).join("")}</div>`
          : emptyState({ iconName: "calendar", title: "No Rooms Have Everything You Asked For", text: "Try another day, or turn off a filter." })}

        ${others.length ? `<h2 class="list-head">Other Rooms ${badge(others.length)}</h2>
          <div class="room-grid">${others.map(room => roomCard(room, true, id)).join("")}</div>` : ""}
      </div>

      ${open ? roomPanel(selected) : ""}
    </div>
  </section>`;
}

// the minus and plus buttons for group size
function groupStepper() {
  const size = data.book.groupSize;
  return `<div class="stepper">
    ${btn("", { icon: "minus", onclick: "setGroupSize(-1)", disabled: size <= 1, ariaLabel: "Fewer people" })}
    <strong aria-live="polite">${size}</strong>
    ${btn("", { icon: "plus", onclick: "setGroupSize(1)", disabled: size >= 12, ariaLabel: "More people" })}
  </div>`;
}

// today and the next four days, as joined buttons. each one looks like a
// tiny calendar page, the day name over the date, so all five fit on a phone
function dayPicker() {
  return `<div class="day-picker">${segmented(bookingDays().map(day => ({
    value: day.offset,
    label: `<small>${day.offset === 0 ? "Today" : day.weekday}</small><strong>${day.number}</strong>`,
  })), data.book.day, v => `setBookDay(${v})`, "Day")}</div>`;
}

// a strip of twelve blocks, one per hour from 09:00, showing which are free.
// it lets you see at a glance when a room is free, without opening it
function slotStrip(room) {
  const date = bookDate();
  const blocks = SLOTS.map(slot => `<i class="strip-${slotState(room, date, slot)}" title="${slot}"></i>`).join("");
  return `<span class="strip-wrap">
    <span class="strip" aria-hidden="true">${blocks}</span>
    <span class="strip-labels"><span>09:00</span><span>${plural(freeSlots(room, date).length, "free time")}</span><span>21:00</span></span>
  </span>`;
}

// one room, as a card. data-flip lets the card slide to its new place
// when the panel opens, see flipCards in app.js
function roomCard(room, showReasons, selectedId) {
  const reasons = showReasons ? reasonsNotMatched(room, data.book) : [];

  return `<button class="card room-card ${room.id === selectedId ? "selected" : ""}" data-flip="${room.id}"
      onclick="go('#/book/${room.id}')" aria-label="${safe(room.name)}">
    <span class="room-card-top">
      <span class="room-icon">${icon("door")}</span>
      <span class="list-text">
        <strong>${room.name}</strong>
        <span class="muted">${room.building} · ${walkMins(room)} min walk</span>
      </span>
      ${showReasons ? "" : scoreTag(room)}
    </span>
    ${facts([
      ["people", `Fits ${room.capacity}`],
      ...(room.screen ? [["monitor", "Screen"]] : []),
      ...(room.whiteboard ? [["pen", "Whiteboard"]] : []),
    ])}
    ${reasons.length ? `<span class="reasons">${icon("alert", 14)} ${reasons.join(", ")}</span>` : ""}
    ${slotStrip(room)}
  </button>`;
}

// the panel on the right: everything about one room, and booking it
function roomPanel(room) {
  const date = bookDate();
  const tooSmall = room.capacity < data.book.groupSize;
  const words = { taken: "Taken", mine: "Yours", past: "Past" };

  const slots = SLOTS.map(slot => {
    const state = slotState(room, date, slot);
    const chosen = ui.slot === slot;
    return `<button class="slot slot-${state} ${chosen ? "on" : ""}" ${state === "free" ? "" : "disabled"} aria-pressed="${chosen}"
      onclick="pickSlot('${slot}')">${slot}${words[state] ? `<small>${words[state]}</small>` : ""}</button>`;
  }).join("");

  // ui.entering is true only on the render where the panel first opens, so
  // the slide-in animation doesn't replay every time a time is picked
  return `<aside class="detail-panel ${ui.entering ? "enter" : ""}" aria-label="${safe(room.name)}">
    <header class="panel-head">
      ${btn("", { kind: "ghost", icon: "back", href: "#/book", ariaLabel: "Back to all rooms" })}
      <div>
        <h2>${room.name}</h2>
        ${facts([["building", room.building], ["people", `Fits ${room.capacity}`], ["walk", `${walkMins(room)} min walk`]])}
      </div>
      ${btn("", { kind: "ghost", icon: "close", href: "#/book", ariaLabel: "Close" })}
    </header>

    <div class="panel-body">
      <p>${room.about}</p>
      ${featureList(room)}
      ${scoreBreakdown(room)}
      ${btn("See on Map", { kind: "ghost", icon: "map", href: `#/find/${room.id}` })}

      <h3>Day</h3>
      ${dayPicker()}

      <h3>Time</h3>
      ${tooSmall ? notice("warn", `This room only fits ${room.capacity}. Pick a bigger room or fewer people.`) : ""}
      <div class="slots">${slots}</div>
      <div class="slot-key">
        <span><i class="strip-free"></i>Free</span><span><i class="strip-taken"></i>Taken</span>
        <span><i class="strip-mine"></i>Yours</span><span><i class="strip-past"></i>Past</span>
      </div>
    </div>

    <footer class="panel-foot">
      <span>${ui.slot
        ? `<strong>${dateLabel(date)}, ${ui.slot} to ${endTime(ui.slot)}</strong><br><span class="muted small">${people(data.book.groupSize)}</span>`
        : `<span class="muted">Pick a time to book</span>`}</span>
      ${btn("Book This Time", { kind: "primary", icon: "check", onclick: `askToBook('${room.id}')`, disabled: !ui.slot || tooSmall })}
    </footer>
  </aside>`;
}
