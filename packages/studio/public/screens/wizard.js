window.DRMStudio.screens.wizard = function (container, ctx) {
  const FEATURES = [
    { key: "fullProtection", label: "Full App Protection", hint: "Protect the entire window", checked: true },
    { key: "selectiveProtection", label: "Selective Protection", hint: "Protect only data-drm elements", checked: true },
    { key: "detectScreenRecording", label: "Detect Screen Recording", hint: "Watch for OBS, QuickTime, and similar", checked: true },
    { key: "detectSnippingTools", label: "Detect Snipping Tools", hint: "Watch for Snipping Tool, ShareX, Greenshot, PrintScreen", checked: true },
    { key: "invisibleMode", label: "Invisible Mode", hint: "Hide the app during screen shares", checked: true },
    { key: "dynamicWatermark", label: "Dynamic Watermark", hint: "Overlay a semi-transparent identity + timestamp watermark", checked: true },
    { key: "autoInvisibleMode", label: "Auto Invisible Mode", hint: "Automatically enable Invisible Mode when a meeting app is detected", checked: false },
  ];

  const state = {
    logoPath: undefined,
    targetDir: undefined,
  };

  function basename(value) {
    const parts = value.split(/[\\/]/).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : value;
  }

  const screen = document.createElement("div");
  screen.className = "screen";
  screen.innerHTML =
    '<div class="back-link" id="wizard-back">← Back</div>' +
    '<div class="screen-header">' +
    "<h1>Create a new app</h1>" +
    "<p>Wrap a website into a DRM-protected desktop app in a few clicks.</p>" +
    "</div>" +
    '<div class="card">' +
    '<div class="field">' +
    "<label>App name</label>" +
    '<input type="text" id="wizard-app-name" placeholder="My Secure Portal" value="My Secure Portal" />' +
    "</div>" +
    '<div class="field">' +
    "<label>Base URL of the website to wrap</label>" +
    '<input type="url" id="wizard-base-url" placeholder="https://example.com" />' +
    "</div>" +
    '<div class="field">' +
    "<label>Logo (optional)</label>" +
    '<div class="row" style="align-items: center;">' +
    '<button type="button" class="secondary" id="wizard-choose-logo" style="flex: 0 0 auto;">Choose Logo…</button>' +
    '<span id="wizard-logo-name" class="hint" style="flex: 0 1 auto; margin-top: 0; display: none;"></span>' +
    '<button type="button" class="link" id="wizard-clear-logo" style="flex: 0 0 auto; display: none;">Clear</button>' +
    "</div>" +
    "</div>" +
    '<div class="field">' +
    "<label>Where to create it</label>" +
    '<div class="row" style="align-items: center;">' +
    '<button type="button" class="secondary" id="wizard-choose-folder" style="flex: 0 0 auto;">Choose Folder…</button>' +
    '<span id="wizard-folder-name" class="hint" style="flex: 0 1 auto; margin-top: 0; display: none;"></span>' +
    "</div>" +
    "</div>" +
    '<div class="field">' +
    "<label>Protection features</label>" +
    '<div class="checkbox-list" id="wizard-features">' +
    FEATURES.map(function (feature) {
      return (
        '<label class="checkbox-item">' +
        '<input type="checkbox" data-feature="' +
        feature.key +
        '"' +
        (feature.checked ? " checked" : "") +
        " />" +
        "<div>" +
        '<div class="label">' +
        feature.label +
        "</div>" +
        '<div class="hint">' +
        feature.hint +
        "</div>" +
        "</div>" +
        "</label>"
      );
    }).join("") +
    "</div>" +
    "</div>" +
    '<div class="actions">' +
    '<button type="button" class="primary" id="wizard-submit">Create App</button>' +
    "</div>" +
    "</div>";

  container.appendChild(screen);

  const backLink = screen.querySelector("#wizard-back");
  const appNameInput = screen.querySelector("#wizard-app-name");
  const baseUrlInput = screen.querySelector("#wizard-base-url");
  const chooseLogoBtn = screen.querySelector("#wizard-choose-logo");
  const logoNameEl = screen.querySelector("#wizard-logo-name");
  const clearLogoBtn = screen.querySelector("#wizard-clear-logo");
  const chooseFolderBtn = screen.querySelector("#wizard-choose-folder");
  const folderNameEl = screen.querySelector("#wizard-folder-name");
  const featureInputs = Array.prototype.slice.call(screen.querySelectorAll("[data-feature]"));
  const submitBtn = screen.querySelector("#wizard-submit");

  backLink.addEventListener("click", function () {
    ctx.goTo("home");
  });

  function updateLogoDisplay() {
    if (state.logoPath) {
      logoNameEl.textContent = basename(state.logoPath);
      logoNameEl.style.display = "";
      clearLogoBtn.style.display = "";
    } else {
      logoNameEl.style.display = "none";
      clearLogoBtn.style.display = "none";
    }
  }

  function updateFolderDisplay() {
    if (state.targetDir) {
      folderNameEl.textContent = basename(state.targetDir);
      folderNameEl.style.display = "";
    } else {
      folderNameEl.style.display = "none";
    }
  }

  chooseLogoBtn.addEventListener("click", async function () {
    try {
      const filePath = await ctx.bridge.dialogs.chooseLogo();
      if (filePath) {
        state.logoPath = filePath;
        updateLogoDisplay();
      }
    } catch (error) {
      ctx.notify(error.message, "error");
    }
  });

  clearLogoBtn.addEventListener("click", function () {
    state.logoPath = undefined;
    updateLogoDisplay();
  });

  chooseFolderBtn.addEventListener("click", async function () {
    try {
      const dirPath = await ctx.bridge.dialogs.chooseDirectory();
      if (dirPath) {
        state.targetDir = dirPath;
        updateFolderDisplay();
      }
    } catch (error) {
      ctx.notify(error.message, "error");
    }
  });

  submitBtn.addEventListener("click", async function () {
    const appName = appNameInput.value.trim() || "My Secure Portal";
    const baseUrl = baseUrlInput.value.trim();

    try {
      new URL(baseUrl);
    } catch (error) {
      ctx.notify("Enter a valid URL, including https://", "error");
      return;
    }

    if (!state.targetDir) {
      ctx.notify("Choose a folder to create the app in.", "error");
      return;
    }

    const features = {};
    featureInputs.forEach(function (input) {
      features[input.dataset.feature] = input.checked;
    });
    features.watermarkOpacity = 0.12;

    const originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span>Creating…';

    try {
      const result = await ctx.bridge.project.scaffold({
        targetDir: state.targetDir,
        appName: appName,
        baseUrl: baseUrl,
        logoPath: state.logoPath,
        features: features,
      });

      ctx.state.project = { targetDir: result.targetDir, config: result.config };
      ctx.notify('"' + result.config.appName + '" is ready.', "success");
      if (result.logoError) {
        ctx.notify(result.logoError, "error");
      }
      ctx.goTo("dashboard");
    } catch (error) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
      ctx.notify(error.message, "error");
    }
  });
};
