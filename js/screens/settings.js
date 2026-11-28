function settingsScreen() {
  const s = data.settings;
  const user = data.user;
  const colourBlindType = s.colourBlindType === "default" ? "deuteranopia" : s.colourBlindType;

  return `<section class="page">
    ${pageHead("Settings")}

    <section data-tour="profile">
    <h2>${icon("user", 20)} Profile</h2>
    <div class="card group">
      <div class="row">
        ${avatar(user, 60)}
        <span class="list-text"><strong>${safe(user.name)}</strong><span class="muted">${safe(user.email)}</span></span>
        ${btn("Edit Picture", { size: "small", icon: "palette", onclick: "openAvatarPicker()" })}
      </div>
      <label class="row">
        <span>Display Name</span>
        <input class="input short" value="${safe(user.name)}" maxlength="40" onchange="setName(this.value)">
      </label>
      <div class="row">${btn("Sign Out", { kind: "danger", onclick: "askToSignOut()" })}</div>
    </div>

    </section>
    <section data-tour="appearance">
    <h2>${icon("palette", 20)} Appearance</h2>
    <div class="card group">
      <div class="row row-wrap">
        <span class="list-text"><strong>Accent Colour</strong><span class="muted small">${s.colourBlind
          ? "Turned off while Colour Blind Mode is on, which picks its own colours"
          : "Used for buttons, tabs and selected things"}</span></span>
        ${swatches(s.accent, "setAccent", s.colourBlind)}
      </div>
      <div class="row">
        <span class="list-text"><strong>Theme</strong><span class="muted small">Auto follows your device</span></span>
        ${segmented([{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "auto", label: "Auto" }],
          s.theme, v => `setTheme('${v}')`, "Theme")}
      </div>
    </div>

    </section>
    <section data-tour="location">
    <h2>${icon("location", 20)} Location</h2>
    <div class="card group">
      ${settingRow("useLocation", "Location Services", "Pretend GPS. Puts you at the New Science Building.")}
      ${s.useLocation ? "" : `<label class="row">
        <span>I'm Starting From</span>
        <select class="input short" onchange="setStartPlace(this.value)">
          ${PLACES.map(place => `<option value="${place.id}" ${s.startPlace === place.id ? "selected" : ""}>${place.name}</option>`).join("")}
        </select>
      </label>`}
    </div>

    </section>
    <section data-tour="accessibility">
    <h2>${icon("eye", 20)} Accessibility</h2>
    <div class="card group">
      ${settingRow("largeText", "Larger Text", "Makes all the text in the app bigger.")}
      ${settingRow("highContrast", "High Contrast", "Darker text and stronger borders.")}
      ${settingRow("reduceMotion", "Reduce Motion", "Turns off sliding and pulsing animations.")}
      ${settingRow("colourBlind", "Colour Blind Mode", "Alters colours based on different types of colour blindness.")} 
      <label class="row ${s.colourBlind ? "" : "row-off"}" for="colourBlindType">
        <strong>Colour Blind Type</strong>
        <select id="colourBlindType" class="input short" onchange="setColourBlindType(this.value)" ${s.colourBlind ? "" : "disabled"}>
          <option value="deuteranopia" ${colourBlindType === "deuteranopia" ? "selected" : ""}>Deuteranopia</option>
          <option value="protanopia" ${colourBlindType === "protanopia" ? "selected" : ""}>Protanopia</option>
          <option value="tritanopia" ${colourBlindType === "tritanopia" ? "selected" : ""}>Tritanopia</option>
        </select>
      </label>
    </div>

    </section>
    <section data-tour="notifications">
    <h2>${icon("bell", 20)} Notifications</h2>
    <div class="card group">
      ${settingRow("alerts", "Filling-Up Alerts", "Warns you on the way if a space gets busy, with a quieter one nearby.")}
    </div>
    </section>
    <section data-tour="help">
    <h2>${icon("list", 20)} Help</h2>
    <div class="card group">
      <a class="row link-row" href="#/FAQ"><span>FAQ</span>${icon("next", 18)}</a>
      <a class="row link-row" href="#/About"><span>About Us</span>${icon("next", 18)}</a>
    </div>
    </section>
    <section data-tour="about">
    <h2>${icon("info", 20)} About</h2>
    <div class="card group">
      <div class="row"><span>Made By</span><span class="muted">Group 17, CMP-6039A</span></div>
      <div class="row"><span>Map Data</span><span class="muted">© OpenStreetMap contributors</span></div>
      <a class="row link-row" href="#/terms"><span>Terms and Conditions</span>${icon("next", 18)}</a>
      <a class="row link-row" href="#/privacy"><span>Privacy Policy</span>${icon("next", 18)}</a>
      <div class="row row-buttons">
        ${btn("Replay the Tours", { icon: "refresh", onclick: "replayTours()" })}
        ${btn("Reset All App Data", { kind: "danger", onclick: "askToReset()" })}
      </div>
    </div>
    </section>
  </section>`;
}

function settingRow(name, title, description) {
  return `<div class="row">
    <span class="list-text"><strong>${title}</strong><span class="muted small">${description}</span></span>
    ${switchToggle(data.settings[name], title, `toggleSetting('${name}')`)}
  </div>`;
}

// colour picker. off greys it out, used for the accent while colour blind mode is on
function swatches(current, action, off = false) {
  return `<div class="swatches ${off ? "swatches-off" : ""}" role="group" aria-label="Colours">
    ${ACCENTS.map(colour => `<button class="swatch ${current === colour.id ? "on" : ""}" style="background:${colour.hex}"
      aria-label="${colour.label}" aria-pressed="${current === colour.id}" onclick="${action}('${colour.id}')" ${off ? "disabled" : ""}>
      ${current === colour.id ? icon("check", 16) : ""}</button>`).join("")}
  </div>`;
}

// profile picture modal
function avatarModal() {
  const user = data.user;
  return modalFrame({
    title: "Edit Picture",
    body: `<div class="avatar-preview">${avatar(user, 84)}</div>
      <h3>Picture</h3>
      <div class="avatar-grid">
        ${AVATAR_ICONS.map(name => `<button class="avatar-option ${(user.avatar || "initials") === name ? "on" : ""}"
          aria-label="${name}" aria-pressed="${(user.avatar || "initials") === name}" onclick="setAvatar('${name}')">
          ${name === "initials" ? `<strong>${initials(user.name)}</strong>` : icon(name, 24)}</button>`).join("")}
      </div>
      <h3>Colour</h3>
      ${swatches(user.avatarColour || "teal", "setAvatarColour")}`,
    footer: btn("Done", { kind: "primary", onclick: "closeModal()" }),
  });
}
