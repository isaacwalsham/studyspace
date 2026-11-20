// fake sign in, any @uea.ac.uk email works
function signInScreen() {
  return `<section class="page narrow centre">
    <div class="logo-big">${logo(52)}</div>
    <h1>StudySpace</h1>
    <p class="tagline">Find your perfect study space.</p>

    <form class="card form" onsubmit="signIn(event)">
      <label>UEA Email
        <input id="email" class="input" type="email" autocomplete="email" placeholder="abc12xyz@uea.ac.uk" required>
      </label>
      <label>Password
        <input id="password" class="input" type="password" autocomplete="current-password" required>
      </label>
      <p id="sign-in-error" class="error" role="alert" hidden></p>
      ${btn("Sign In", { kind: "primary", wide: true })}
    </form>
  </section>`;
}

// first time setup: needs and walking distance
function setupScreen() {
  const prefs = data.find;
  return `<section class="page narrow centre">
    <p class="step">Step 2 of 2</p>
    <h1>What Do You Need From a Study Space?</h1>
    <p class="muted">Pick as many as you like. You can change these any time.</p>

    <div class="tile-grid left">${FILTERS.map(filter => {
      const on = prefs.filters.includes(filter.id);
      return `<button class="tile ${on ? "on" : ""}" aria-pressed="${on}" onclick="toggleFilter('find', '${filter.id}')">
        ${icon(filter.icon)}<span>${filter.label}</span>${on ? icon("check", 18) : ""}
      </button>`;
    }).join("")}</div>

    <h2 class="centre-h2">How Far Will You Walk?</h2>
    ${segmented(WALK_OPTIONS.map(o => ({ value: o.min, label: o.label })), prefs.maxWalk, v => `setWalk('find', ${v})`, "Walking distance")}

    ${btn("Show Me Spaces", { kind: "primary", wide: true, onclick: "finishSetup()" })}
  </section>`;
}
