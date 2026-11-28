// page tours

// the first time a page is opened its tour starts. called from render once
// the page is drawn, so the parts it points at are on screen
function maybeStartTour(screen) {
  if (ui.tour || !TOURS[screen] || data.toursSeen.includes(screen)) return false;
  // a page with nothing to show, e.g. no past bookings, skips that step
  const steps = TOURS[screen].filter(step => document.querySelector(step.target));
  if (!steps.length) return false;
  ui.tour = { screen, steps, step: 0 };
  return true;
}

// replay from settings: every page's tour shows again, starting with find
function replayTours() {
  data.toursSeen = [];
  saveData();
  go("#/find");
}

// on phones find shows the list or the map, so show the half the step is about
function showTourView() {
  const view = ui.tour.steps[ui.tour.step].view;
  if (view && isNarrow() && ui.findView !== view) {
    ui.findView = view;
    render();
  }
}

// change is 1 for next, -1 for back
function moveTour(change) {
  ui.tour.step += change;
  if (ui.tour.step >= ui.tour.steps.length) return endTour();
  showTourView();
  drawTour();
  focusTour();
}

// finishing and skipping both mean this page's tour won't show again
function endTour() {
  data.toursSeen.push(ui.tour.screen);
  saveData();
  const onFind = ui.tour.screen === "find";
  ui.tour = null;
  if (onFind && isNarrow()) ui.findView = "list";
  render();
  window.scrollTo(0, 0); // long pages scrolled to the last step
  if (onFind) showToast("You can replay the tours any time in Settings");
}

// keyboard users land on the main button each step
function focusTour() {
  const next = $("#tour-next");
  if (next) next.focus();
}

// called at the end of every render. dims the screen, leaves a hole around
// the step's target and puts the card next to it
function drawTour() {
  const box = $("#tour");
  box.hidden = !ui.tour;
  if (!ui.tour) return;

  // the card is redrawn, so put focus back if it was in the card
  const hadFocus = box.contains(document.activeElement);
  const { steps, step } = ui.tour;
  const last = step === steps.length - 1;
  box.innerHTML = `<div class="tour-hole" id="tour-hole"></div>
    <div class="tour-card" id="tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <p class="step">${step + 1} of ${steps.length}</p>
      <h2 id="tour-title">${steps[step].title}</h2>
      <p>${steps[step].text}</p>
      <div class="tour-dots" aria-hidden="true">${steps.map((s, i) => `<i class="${i === step ? "on" : ""}"></i>`).join("")}</div>
      <footer class="tour-foot">
        ${last ? "<span></span>" : btn("Skip Tour", { kind: "ghost", onclick: "endTour()" })}
        <span class="tour-buttons">
          ${step > 0 ? btn("Back", { onclick: "moveTour(-1)" }) : ""}
          ${btn(last ? "Done" : "Next", { kind: "primary", onclick: "moveTour(1)", id: "tour-next" })}
        </span>
      </footer>
    </div>`;
  placeTour();
  if (hadFocus) focusTour();
}

// works out where the hole and the card go from where the target is on screen
function placeTour() {
  const hole = $("#tour-hole");
  const card = $("#tour-card");
  if (!hole || !card) return;
  const target = document.querySelector(ui.tour.steps[ui.tour.step].target);
  const gap = 6;   // space between the target and the outline
  const edge = 16; // keep the card this far from the screen edge

  // bring it into view, e.g. a result further down the list
  target.scrollIntoView({ block: "nearest" });
  let rect = target.getBoundingClientRect();

  // on long pages like settings, scroll so it sits just under the top bar,
  // not hidden behind it or the tabs. the bars themselves never move
  const header = $(".top-bar").getBoundingClientRect().bottom;
  const tabs = isNarrow() ? $("#tabs").offsetHeight : 0;
  const hidden = rect.top < header + 8 || rect.bottom > innerHeight - tabs - 8;
  if (hidden && !target.closest(".top-bar, #tabs")) {
    window.scrollBy(0, rect.top - header - 16);
    rect = target.getBoundingClientRect();
  }

  // the outline follows the target's own corners, so the tabs get a pill
  const corner = parseFloat(getComputedStyle(target).borderTopLeftRadius) || 12;
  hole.style.borderRadius = `${corner + gap}px`;

  // the outline is kept on screen, so targets touching the edge still show all of it
  const holeLeft = Math.max(rect.left - gap, 3);
  const holeTop = Math.max(rect.top - gap, 3);
  hole.style.left = `${holeLeft}px`;
  hole.style.top = `${holeTop}px`;
  hole.style.width = `${Math.min(rect.right + gap, innerWidth - 3) - holeLeft}px`;
  hole.style.height = `${Math.min(rect.bottom + gap, innerHeight - 3) - holeTop}px`;

  // below the target if it fits, then above, otherwise inside it at the bottom
  const height = card.offsetHeight;
  const space = 14; // between the outline and the card
  let top;
  if (rect.bottom + gap + space + height < innerHeight - edge) top = rect.bottom + gap + space;
  else if (rect.top - gap - space - height > edge) top = rect.top - gap - space - height;
  else top = Math.min(rect.bottom, innerHeight) - height - edge * 2;

  // centred under the target, but never off the side of the screen
  const middle = rect.left + rect.width / 2 - card.offsetWidth / 2;
  const left = Math.min(Math.max(middle, edge), innerWidth - card.offsetWidth - edge);
  card.style.top = `${Math.max(top, edge)}px`;
  card.style.left = `${left}px`;

  // the little arrow points at the middle of the target
  const pointsUp = top > rect.bottom;
  const pointsDown = top + height < rect.top;
  card.dataset.arrow = pointsUp ? "up" : pointsDown ? "down" : "none";
  const arrowX = Math.min(Math.max(rect.left + rect.width / 2 - left, 24), card.offsetWidth - 24);
  card.style.setProperty("--arrow-x", `${arrowX}px`);
}

// keep it lined up when the window changes size or the page scrolls
window.addEventListener("resize", () => { if (ui.tour) placeTour(); });
window.addEventListener("scroll", () => { if (ui.tour) placeTour(); });

// arrow keys move through the tour. escape is handled in app.js
document.addEventListener("keydown", event => {
  if (!ui.tour) return;
  if (event.key === "ArrowRight") moveTour(1);
  else if (event.key === "ArrowLeft" && ui.tour.step > 0) moveTour(-1);
});


// help for each task

// lab 7 heuristic fix: help opens on tap, not hover, so it works on touch screens
function helpButton(id) {
  const open = tipOpen(id);
  return `<button class="help-btn" aria-expanded="${open}" aria-label="Help with ${TIPS[id].title.toLowerCase()}"
    onclick="toggleTip('${id}')">?</button>`;
}

// the tip itself, only drawn while it's open
function helpTip(id) {
  if (!tipOpen(id)) return "";
  return `<div class="tip" role="note">
    ${icon("info", 18)}
    <span><strong>${TIPS[id].title}</strong><br>${TIPS[id].text}</span>
    ${btn("Got It", { size: "small", onclick: `closeTip('${id}')` })}
  </div>`;
}

// open if the ? was pressed, or the first time this task is done
function tipOpen(id) {
  return ui.tip === id || !data.seenTips.includes(id);
}

function toggleTip(id) {
  if (tipOpen(id)) return closeTip(id);
  ui.tip = id;
  render();
}

// closing it counts as seen, so it doesn't open by itself again
function closeTip(id) {
  if (!data.seenTips.includes(id)) data.seenTips.push(id);
  ui.tip = null;
  saveData();
  render();
}
