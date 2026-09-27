(function () {
  function renderLicenseScreen(container, ctx) {
    const wrap = document.createElement("div");
    wrap.className = "center-screen";

    const card = document.createElement("div");
    card.className = "card";
    card.style.maxWidth = "420px";
    card.style.width = "100%";

    const heading = document.createElement("h1");
    heading.textContent = "Activate DRMWrap";
    heading.style.margin = "0 0 8px";
    heading.style.fontSize = "20px";

    const intro = document.createElement("p");
    intro.textContent = "Enter the license key you received to start building desktop apps.";
    intro.style.margin = "0 0 20px";
    intro.style.color = "var(--text-muted)";
    intro.style.fontSize = "13px";
    intro.style.lineHeight = "1.6";

    const field = document.createElement("div");
    field.className = "field";

    const label = document.createElement("label");
    label.textContent = "License key";

    const textarea = document.createElement("textarea");
    textarea.rows = 3;
    textarea.placeholder = "Paste your license key here";
    textarea.style.width = "100%";
    textarea.style.padding = "10px 12px";
    textarea.style.borderRadius = "8px";
    textarea.style.border = "1px solid var(--border-strong)";
    textarea.style.background = "var(--bg-elevated)";
    textarea.style.color = "var(--text)";
    textarea.style.fontSize = "13px";
    textarea.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    textarea.style.resize = "vertical";

    field.appendChild(label);
    field.appendChild(textarea);

    const actions = document.createElement("div");
    actions.className = "actions";

    const activateButton = document.createElement("button");
    activateButton.className = "primary";
    activateButton.textContent = "Activate";
    actions.appendChild(activateButton);

    const footer = document.createElement("p");
    footer.textContent = "Don't have a key? Contact whoever sent you DRMWrap.";
    footer.style.color = "var(--text-muted)";
    footer.style.fontSize = "12px";
    footer.style.marginTop = "20px";
    footer.style.marginBottom = "0";

    activateButton.addEventListener("click", async () => {
      const key = textarea.value.trim();
      if (!key) {
        ctx.notify("Enter a license key first.", "error");
        return;
      }

      activateButton.disabled = true;
      const originalLabel = activateButton.textContent;
      activateButton.textContent = "";
      const spinner = document.createElement("span");
      spinner.className = "spinner";
      activateButton.appendChild(spinner);
      activateButton.appendChild(document.createTextNode("Activating…"));

      try {
        const result = await ctx.bridge.license.activate(key);
        if (result.valid) {
          ctx.state.license = result;
          ctx.notify("License activated.", "success");
          ctx.goTo("home");
          return;
        }
        ctx.notify(result.reason, "error");
      } catch (error) {
        ctx.notify(error.message, "error");
      }

      activateButton.disabled = false;
      activateButton.textContent = originalLabel;
    });

    card.appendChild(heading);
    card.appendChild(intro);
    card.appendChild(field);
    card.appendChild(actions);
    card.appendChild(footer);
    wrap.appendChild(card);
    container.appendChild(wrap);
  }

  function renderHomeScreen(container, ctx) {
    const screen = document.createElement("div");
    screen.className = "screen";

    const payload = (ctx.state.license && ctx.state.license.payload) || {};

    const header = document.createElement("div");
    header.className = "screen-header";

    const headingRow = document.createElement("div");
    headingRow.style.display = "flex";
    headingRow.style.alignItems = "center";
    headingRow.style.gap = "10px";
    headingRow.style.marginBottom = "6px";

    const heading = document.createElement("h1");
    heading.style.margin = "0";
    heading.style.fontSize = "22px";
    heading.textContent = "Welcome back, " + (payload.customer || "there");

    const pill = document.createElement("span");
    pill.className = "pill neutral";
    pill.textContent = (payload.tier || "").toUpperCase() + " LICENSE";

    headingRow.appendChild(heading);
    headingRow.appendChild(pill);
    header.appendChild(headingRow);

    if (payload.domain) {
      const domainLine = document.createElement("p");
      domainLine.textContent = "Locked to " + payload.domain;
      header.appendChild(domainLine);
    }

    const row = document.createElement("div");
    row.className = "row";

    const createCard = document.createElement("div");
    createCard.className = "card";

    const createHeading = document.createElement("h3");
    createHeading.style.margin = "0 0 8px";
    createHeading.style.fontSize = "16px";
    createHeading.textContent = "Create New App";

    const createDesc = document.createElement("p");
    createDesc.style.margin = "0 0 16px";
    createDesc.style.color = "var(--text-muted)";
    createDesc.style.fontSize = "13px";
    createDesc.style.lineHeight = "1.6";
    createDesc.textContent = "Turn any website into a DRM-protected desktop app in a few guided steps.";

    const createButton = document.createElement("button");
    createButton.className = "primary";
    createButton.textContent = "Create New App";
    createButton.addEventListener("click", () => ctx.goTo("wizard"));

    createCard.appendChild(createHeading);
    createCard.appendChild(createDesc);
    createCard.appendChild(createButton);

    const openCard = document.createElement("div");
    openCard.className = "card";

    const openHeading = document.createElement("h3");
    openHeading.style.margin = "0 0 8px";
    openHeading.style.fontSize = "16px";
    openHeading.textContent = "Open Existing Project";

    const openDesc = document.createElement("p");
    openDesc.style.margin = "0 0 16px";
    openDesc.style.color = "var(--text-muted)";
    openDesc.style.fontSize = "13px";
    openDesc.style.lineHeight = "1.6";
    openDesc.textContent = "Resume work on a desktop app project you already created.";

    const openButton = document.createElement("button");
    openButton.className = "secondary";
    openButton.textContent = "Open Existing Project";
    openButton.addEventListener("click", async () => {
      let targetDir;
      try {
        targetDir = await ctx.bridge.dialogs.chooseExistingProject();
      } catch (error) {
        ctx.notify(error.message, "error");
        return;
      }
      if (!targetDir) {
        return;
      }
      try {
        const config = await ctx.bridge.project.loadConfig(targetDir);
        ctx.state.project = { targetDir, config };
        ctx.goTo("dashboard");
      } catch (error) {
        ctx.notify("Not a drm-wrap project: " + error.message, "error");
      }
    });

    openCard.appendChild(openHeading);
    openCard.appendChild(openDesc);
    openCard.appendChild(openButton);

    row.appendChild(createCard);
    row.appendChild(openCard);

    const licenseDetailsButton = document.createElement("button");
    licenseDetailsButton.className = "link";
    licenseDetailsButton.textContent = "License details";
    licenseDetailsButton.style.marginTop = "24px";
    licenseDetailsButton.addEventListener("click", () => {
      ctx.goTo("licenseDetails");
    });

    screen.appendChild(header);
    screen.appendChild(row);
    screen.appendChild(licenseDetailsButton);
    container.appendChild(screen);
  }

  window.DRMStudio.screens.license = renderLicenseScreen;
  window.DRMStudio.screens.home = renderHomeScreen;
})();
