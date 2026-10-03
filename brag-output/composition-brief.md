# Hyperframes Composition Brief: DRM-Wrap

## Objective
Create a short, polished promo and launch brag video for DRM-Wrap desktop app.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20.0 seconds

## Source Material
- Project root: `/Users/besaoct/Desktop/drm-wrap`
- Primary files read: `README.md`, `package.json`, `packages/studio/public/index.html`, `packages/studio/public/app.js`, `packages/desktop-app/public/demo/index.html`, `tools/license-generator.html`
- Product name: DRM-Wrap
- Tagline / strongest claim: "Any website. Wrapped, watched, protected."
- Key UI or visual moments to show:
  - Real component screenshot of DRMWrap Studio Wizard (`04-wizard-setup.png`)
  - Real component screenshot of Security Settings (`06-dashboard-settings.png`)
  - Real component screenshot of Live Protected Web App with Forensic Watermarking (`07-protected-app-watermark.png`)
  - Real component screenshot of Live Build Terminal and Release Installers (`05-dashboard-build.png`)
  - Standalone Ed25519 WebCrypto License Authority (`08-license-generator-result.png`)
- Copy that must appear verbatim:
  - "Any website. Hardened into a native desktop app."
  - "Anti-Screen Capture • Meeting Screen-Share Cloaking • Ed25519 DRM"
  - "Wrap in seconds. Zero backend code."
  - "Total Capture Defense: Blinds OBS, Zoom, Teams & Screenshots"
  - "Build native installers. Distribute securely."
  - "Any website. Wrapped, watched, protected."

## Creative Direction
- Tone preset: `cinematic`
- Creative direction: "Fortified enterprise desktop engine launch — sleek, high-tech, and uncompromising."
- Interpretation: Deep space navy background (`#0a0f1e`), glassmorphism cards, glowing electric blue and emerald security accents, fast confident entrances with rock-solid settled holds for UI legibility.
- Angle: Software vendors and creators can package any website (Laravel, React, Next.js, Vue, Nuxt, HTML) into a native desktop app that actively blinds capture tools and enforces offline Ed25519 licensing with zero backend alterations.
- Hook: High-tech neon shield logo slams in with "Any website. Hardened into a native desktop app."
- Outro / punchline: "Any website. Wrapped, watched, protected." + GitHub repository link.
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals (use the captured component screenshots)
  - Blurry or flashing text

## Visual Identity
- Background: `#0a0f1e` with subtle radial gradients (`rgba(59, 130, 246, 0.15)`)
- Card & Chrome: `#121d33` / `#0d1526` with border `rgba(148, 163, 214, 0.18)`
- Accent Colors: `#3b82f6` (Electric Blue), `#34d399` (Security Emerald), `#a78bfa` (Crypto Violet)
- Text: `#f8fafc` (Primary White), `#94a3b8` (Muted Slate)
- Display font: `Inter`, system-ui, -apple-system, sans-serif
- Body font: `Inter`, system-ui, -apple-system, sans-serif
- Monospace font: `ui-monospace`, `JetBrains Mono`, monospace

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract:
1. Scene 1 — The Hook — 3.2s (0.00s - 3.20s): Shield mark reveal, hook headline, and security pill badges.
2. Scene 2 — The Studio Wizard — 4.3s (3.20s - 7.50s): DRMWrap Studio 3-step creation wizard screenshot in desktop window frame.
3. Scene 3 — Total Capture Defense — 4.5s (7.50s - 12.00s): Split showcase of Security Settings toggles + Live Protected App with dynamic forensic watermarking.
4. Scene 4 — 1-Click Packaging & Cryptography — 4.5s (12.00s - 16.50s): Live Build Terminal packaging `.dmg` & `.exe` installers + Ed25519 license authority.
5. Scene 5 — Outro / Call to Action — 3.5s (16.50s - 20.00s): Glowing shield emblem, final punchline, and repository link.

## Audio
- Audio role: Punchy modern electronic bed with crisp UI movement accents.
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3`
- Music treatment: Starts at 0.0s at volume 0.75, subtle swell into highlights, 1.5s smooth fade out at end.
- Music cue guidance: Tempo ~110 BPM. Target strong cues at 8.74s (Defense reveal), 13.11s (Build & Installers payoff), and 17.47s (Final Outro lock).
- Audio-reactive treatment: Subtle breathing on ambient background glow.
- Exact SFX: Copy selected UI swooshes/ticks into `assets/sfx/`.
- Audio files: `assets/music/` and `assets/sfx/`.

## Hyperframes Instructions
Build a standalone HTML5/CSS/JS Hyperframes composition in `brag-output/composition/`.
- Use `data-start` and `data-duration` on scene elements adhering to the Hyperframes timing specification.
- Embed real component screenshots from `assets/screenshots/` in beautiful macOS/desktop window mockups.
- Ensure all text passes WCAG contrast and settles with plenty of reading time.
- Validate with `npx hyperframes check` and render with `npx hyperframes render`.
