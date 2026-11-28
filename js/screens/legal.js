// terms and privacy pages, laid out like the physique pilot legal pages:
// title block, numbered contents, then numbered sections. they can be
// opened before signing in, from the sign in screen

function termsScreen() {
  return legalPage("Terms and Conditions", TERMS, `Read the <a class="text-link" href="#/privacy">Privacy Policy</a> to see what's kept about you.`);
}

function privacyScreen() {
  return legalPage("Privacy Policy", PRIVACY, `Read the <a class="text-link" href="#/terms">Terms and Conditions</a> for the rules on using StudySpace.`);
}

// sections come from data.js
function legalPage(title, sections, otherPage) {
  // back goes to settings if signed in, otherwise to sign in
  const back = data.user ? btn("Settings", { kind: "ghost", icon: "back", href: "#/settings" })
    : btn("Sign In", { kind: "ghost", icon: "back", href: "#/find" });

  return `<section class="page full legal">
    ${back}
    <header class="legal-head">
      <p class="step">Legal</p>
      <h1>${title}</h1>
      <p class="legal-meta"><strong>Effective date:</strong> ${LEGAL_DATE} · <strong>Last updated:</strong> ${LEGAL_DATE}</p>
    </header>

    <nav class="legal-contents" aria-label="Contents">
      <p class="legal-contents-title">Contents</p>
      <ol>${sections.map((section, index) => `<li>
        <button class="link-btn" onclick="scrollToSection('${section.id}')">
          <span class="legal-num">${String(index + 1).padStart(2, "0")}</span>${section.title}
        </button>
      </li>`).join("")}</ol>
    </nav>

    ${sections.map((section, index) => legalSection(section, index + 1)).join("")}

    <p class="legal-foot">${otherPage}</p>
    <p class="legal-made">Group 17 · CMP-6039A Human Computer Interaction · University of East Anglia</p>
  </section>`;
}

// heading on the left, writing on the right on wide screens
function legalSection(section, number) {
  const point = item => Array.isArray(item) ? `<strong>${item[0]}</strong> ${item[1]}` : item;
  return `<section class="legal-section" id="${section.id}">
    <h2><span class="legal-num">${String(number).padStart(2, "0")}</span>${section.title}</h2>
    <div class="legal-body">
      ${(section.text || []).map(text => `<p>${text}</p>`).join("")}
      ${section.points ? `<ul>${section.points.map(item => `<li>${point(item)}</li>`).join("")}</ul>` : ""}
      ${section.table ? legalTable(section.table) : ""}
      ${section.note ? `<p class="legal-note">${section.note}</p>` : ""}
    </div>
  </section>`;
}

function legalTable({ head, rows }) {
  return `<table class="legal-table">
    <thead><tr>${head.map(cell => `<th>${cell}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
  </table>`;
}

// the contents use buttons, not #links, because the address is used for the screens
function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: motionOff() ? "auto" : "smooth" });
}
