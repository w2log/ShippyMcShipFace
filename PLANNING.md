# ThermalDeck — Planning Document
> Thermal label management webapp for Intermec PC43d
> Black minimalist design · React frontend · Node.js backend · Cloudflare Tunnel

---

## 1. Project Overview

A self-hosted web application that gives a clean, browser-based interface for managing an Intermec PC43d thermal label printer over a local network. The app is hosted on a home Debian/Ubuntu server, exposed to the internet via Cloudflare Tunnel (no open ports required), and optionally served via Cloudflare Pages for the frontend. It handles print settings, test label printing, PDF upload + intelligent label cropping via Claude Vision, and direct raw-socket printing.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (browser)                           │
│                  React SPA (Cloudflare Pages)                   │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTPS (API calls)
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│               Cloudflare Tunnel (cloudflared)                   │
│     Exposes home server backend publicly — no open ports        │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTP (localhost)
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│              Home Server — Debian/Ubuntu                        │
│         Node.js + Express Backend (port 3001)                   │
│                                                                 │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │  Print Router │  │  PDF Proc.   │  │   Claude Vision      │ │
│  │  (raw socket) │  │  (pdf2pic +  │  │   API Proxy          │ │
│  │  TCP 9100     │  │   sharp)     │  │   (label crop)       │ │
│  └───────┬───────┘  └──────────────┘  └──────────────────────┘ │
└──────────┼──────────────────────────────────────────────────────┘
           │ TCP/IP raw socket (port 9100)
           ▼
┌─────────────────────────────────────────────────────────────────┐
│           Intermec PC43d (networked, static LAN IP)             │
│           Printer Language: ZPL / IPL / DPL (configurable)      │
└─────────────────────────────────────────────────────────────────┘
```

### Hosting Summary

| Component | Where |
|---|---|
| React Frontend | Cloudflare Pages (free tier) |
| Backend API | Home server (Debian) via Cloudflare Tunnel |
| Cloudflare Tunnel | `cloudflared` daemon on home server |
| Printer communication | Raw TCP socket, LAN only (backend → printer) |
| PDF processing | Backend (Node.js + pdf2pic + sharp) |
| Label crop ML | Claude Vision API called from backend |

---

## 3. Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (pure black theme, custom config)
- **State**: Zustand (lightweight, no Redux overhead)
- **File upload**: react-dropzone
- **PDF preview**: react-pdf (pdfjs-dist)
- **HTTP client**: axios
- **Notifications**: sonner (minimal toast library)
- **Fonts**: `Space Mono` (monospace, utilitarian) + `DM Sans` (labels/body)

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js
- **PDF → image**: `pdf2pic` (wraps GraphicsMagick/Ghostscript)
- **Image processing**: `sharp` (crop, resize, convert to PNG)
- **Printer comms**: Native `net` module (raw TCP socket to port 9100)
- **Claude Vision**: `@anthropic-ai/sdk` (label region detection)
- **File handling**: `multer` (PDF upload), `tmp` (temp files)
- **Config persistence**: `lowdb` (simple JSON file DB — stores printer IP, language, DPI, darkness)
- **Process manager**: `pm2` (keeps backend alive, auto-restart)

### Infra
- **Tunnel**: `cloudflared` (Cloudflare Tunnel daemon)
- **Frontend host**: Cloudflare Pages (CI from GitHub)
- **Backend host**: Home Debian/Ubuntu server

---

## 4. Repository Structure

```
thermaldeck/
├── frontend/                  # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── TopBar.tsx
│   │   │   ├── printer/
│   │   │   │   ├── PrinterStatus.tsx    # live status pill
│   │   │   │   ├── SettingsPanel.tsx    # IP, language, DPI, darkness
│   │   │   │   └── LanguageDetect.tsx   # test-ping + detect language
│   │   │   ├── labels/
│   │   │   │   ├── TestLabelGrid.tsx    # USPS / UPS / FedEx cards
│   │   │   │   └── TestLabelPreview.tsx # preview modal
│   │   │   └── upload/
│   │   │       ├── DropZone.tsx
│   │   │       ├── CropPreview.tsx      # shows detected label region
│   │   │       └── PrintConfirm.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx            # printer status + quick actions
│   │   │   ├── Settings.tsx             # printer config
│   │   │   ├── TestLabels.tsx           # test label printing
│   │   │   └── PrintLabel.tsx           # upload → crop → print flow
│   │   ├── store/
│   │   │   └── printerStore.ts          # Zustand store
│   │   ├── api/
│   │   │   └── client.ts                # axios instance, base URL from env
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
├── backend/                   # Node.js + Express
│   ├── src/
│   │   ├── routes/
│   │   │   ├── printer.ts          # status, settings, detect-language
│   │   │   ├── testLabels.ts       # serve + print test labels
│   │   │   └── upload.ts           # PDF upload + crop + print
│   │   ├── services/
│   │   │   ├── printerSocket.ts    # raw TCP socket manager
│   │   │   ├── zpl.ts              # ZPL command builder
│   │   │   ├── ipl.ts              # IPL command builder
│   │   │   ├── dpl.ts              # DPL command builder
│   │   │   ├── pdfProcessor.ts     # pdf2pic + sharp pipeline
│   │   │   └── visionCrop.ts       # Claude Vision label detection
│   │   ├── config/
│   │   │   └── db.ts               # lowdb JSON config store
│   │   ├── testLabels/
│   │   │   ├── usps_sample.pdf
│   │   │   ├── ups_sample.pdf
│   │   │   └── fedex_sample.pdf
│   │   └── index.ts                # Express app entry
│   ├── data/
│   │   └── config.json             # persisted printer config (gitignored)
│   ├── ecosystem.config.js         # pm2 config
│   └── package.json
│
├── .env.example
└── README.md
```

---

## 5. Backend API Routes

### `GET /api/printer/status`
Attempts a TCP connection to the configured printer IP on port 9100.
Returns: `{ online: boolean, ip: string, language: string, dpi: number, darkness: number }`

### `GET /api/printer/settings`
Returns current saved config from `config.json`.

### `POST /api/printer/settings`
Saves printer settings.
Body: `{ ip: string, port: number, language: "ZPL"|"IPL"|"DPL", dpi: 203|300|600, darkness: number }`

### `POST /api/printer/detect-language`
Sends a minimal harmless probe command for each language in sequence (ZPL → IPL → DPL), checks for acknowledgment or timeout, returns best guess.
Returns: `{ detected: "ZPL"|"IPL"|"DPL"|"unknown" }`

### `GET /api/test-labels`
Returns metadata list of available test labels (carrier, name, description, previewUrl).

### `POST /api/test-labels/:carrier/print`
Loads the sample PDF for the given carrier (`usps` | `ups` | `fedex`), runs through pdfProcessor to render at correct DPI, sends rendered image to printer as raw raster via the configured language.

### `POST /api/upload/process`
- Accepts: multipart PDF file upload
- Runs pdfProcessor: renders all pages to PNG at 300 DPI
- Passes rendered images to Claude Vision to detect label region bounding box
- Returns: `{ pages: [{ pageNum, previewBase64, cropBox: { x, y, w, h } }] }`

### `POST /api/upload/print`
Body: `{ pageNum: number, cropBox: { x, y, w, h } }`  
Re-renders the page, applies the crop, resizes to 4"×6" at printer DPI, sends raw data to printer.

### `POST /api/upload/print-all`
Prints all detected label pages from a previously processed upload in sequence with a 2-second delay between jobs.

---

## 6. Printer Communication Layer

### Raw TCP Socket (port 9100)
All print jobs send raw printer language commands over a persistent-or-per-job TCP connection to the printer's IP on port 9100. This is the most reliable method — works with ZPL, IPL, DPL, and doesn't require a printer driver.

```
printerSocket.ts responsibilities:
  - connect(ip, port) → Promise<net.Socket>
  - send(socket, data: Buffer | string) → Promise<void>
  - ping(ip, port) → Promise<boolean>   (for status check)
  - disconnect(socket)
```

### Language Support

**ZPL (Zebra Printer Language)** — Most commonly cross-flashed onto Intermec printers
- Test command: `^XA^XZ` (start/end label — prints blank, confirms comms)
- Print raster: `^XA ^GFA,...data... ^XZ`
- Settings: `~SD` (darkness), `^PW` (print width), `^LL` (label length)

**IPL (Intermec Printer Language)** — Intermec native
- Test command: `<STX>E<ETX>` (query environment)  
- Print raster: PCX or raw bitmap via `<STX>L` commands
- Settings: `SET DARKNESS`, `SET MEDIA`, `SET SPEED`

**DPL (Datamax Printer Language)**
- Test command: `\x02L\x0D\x0Aq` (short label query)
- Print raster: DPL bitmap commands

The language detection endpoint cycles through these probes with a 1.5s timeout each and scores responses.

### Image → Printer Pipeline

```
PDF page → pdf2pic (300 DPI PNG) → sharp crop → sharp resize to 
label size in pixels at printer DPI → Convert to raw bitmap → 
Wrap in printer language raster command → TCP send
```

For ZPL, raster images are encoded as Z64 (base64 + CRC) or GRF hex.  
For IPL, images are sent as PCX format.  
For DPL, images are sent as raw bitmap with DPL header.

`sharp` handles all intermediate image ops (crop, resize, grayscale, threshold for clean B&W print output).

---

## 7. PDF Processing + Claude Vision Label Crop

### Step 1 — PDF Render
`pdf2pic` wraps Ghostscript to render each PDF page to PNG at 300 DPI. For a standard full-page label PDF (8.5"×11" or 4"×6"), this produces a high-fidelity raster image.

### Step 2 — Claude Vision Detection
The rendered PNG is passed to the Claude Vision API with this prompt:

```
You are analyzing a scanned shipping label document. 
Identify the bounding box of the primary shipping label region 
(the 4x6 inch label area containing barcode, addresses, and 
postage/tracking info). 

Return ONLY valid JSON:
{
  "labelFound": true,
  "confidence": 0.97,
  "cropBox": {
    "xPercent": 0.05,
    "yPercent": 0.10,
    "widthPercent": 0.90,
    "heightPercent": 0.55
  },
  "notes": "Label occupies upper portion of page with white margin"
}

If no label is found, return { "labelFound": false }.
Use percentage coordinates (0.0–1.0) relative to image dimensions.
```

Percentages are used so the result is resolution-independent.

### Step 3 — Crop & Resize
`sharp` applies the crop box, then resizes to exact 4"×6" at the printer's configured DPI:
- 203 DPI → 812×1218 px
- 300 DPI → 1200×1800 px

Output is a clean, print-ready grayscale PNG.

### Step 4 — Fallback
If Claude Vision confidence < 0.80 or `labelFound: false`, the UI shows the full page preview with a manual drag-to-crop interface (react-image-crop) so the user can define the region themselves before printing.

---

## 8. Frontend Pages & UX

### Design System
```css
--bg: #000000;
--surface: #0a0a0a;
--border: #1a1a1a;
--border-subtle: #111111;
--text-primary: #ffffff;
--text-secondary: #888888;
--text-muted: #444444;
--accent: #ffffff;
--accent-dim: #333333;
--success: #22c55e;
--warning: #f59e0b;
--error: #ef4444;
--radius: 2px;               /* sharp corners, minimal radius */
--font-mono: 'Space Mono';
--font-body: 'DM Sans';
```

All surfaces are near-black. Primary text is white. Accents are white-on-black only. Status indicators use tight color: green/amber/red. No gradients. No shadows (except subtle 1px borders). Monospace for all data, status, IP addresses, codes.

### Page: Dashboard
- Printer status card: large IP display, online/offline pill, language badge, DPI, darkness
- Quick-action buttons: "Print Test Label", "Upload & Print", "Settings"
- Last 5 print jobs log (timestamp, carrier/filename, status)
- Live ping — status refreshes every 10 seconds

### Page: Settings
- Printer IP address input
- Port (default 9100)
- Printer language dropdown (ZPL / IPL / DPL) + **"Auto-Detect" button**
  - Auto-detect sends probe commands and populates the dropdown with result
- DPI selector: 203 / 300 / 600
- Darkness slider: 0–30 (maps to printer darkness command)
- Print speed selector
- **"Send Test Pattern"** — prints a minimal alignment grid to verify settings
- Save button

### Page: Test Labels
Grid of cards — one per carrier:

| Card | Carrier | Description |
|---|---|---|
| USPS | Priority Mail | Standard 4×6 Priority label with barcode |
| UPS | Ground | UPS Ground sample with tracking |
| FedEx | FedEx Ground | FedEx Ground sample label |

Each card has:
- Carrier logo (SVG, white monochrome)
- Preview thumbnail (rendered from sample PDF)
- **"Preview"** button (modal with full label preview)
- **"Print"** button → sends to printer, shows success/error toast

### Page: Upload & Print
1. **Drop Zone** — drag-and-drop or click to upload PDF. Shows filename + page count on upload.
2. **Processing state** — spinner with "Analyzing label region…" while Vision API runs
3. **Crop Preview** — shows each detected page with:
   - Full page thumbnail
   - Detected crop region highlighted (white dashed border overlay)
   - Confidence percentage badge
   - Manual override: "Adjust Crop" opens drag-crop interface
4. **Print Controls**:
   - "Print Page X" per page
   - "Print All" (sequential)
   - Copies selector (1–10)
5. **Job status** — inline print progress

---

## 9. Cloudflare Setup

### Cloudflare Tunnel (`cloudflared`)
Exposes your home backend publicly with a stable HTTPS URL — no dynamic DNS, no port forwarding.

**Installation on home server:**
```bash
# Install cloudflared
curl -L --output cloudflared.deb \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# Authenticate (opens browser)
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create thermaldeck-backend

# Create config
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml << EOF
tunnel: <TUNNEL_ID>
credentials-file: /home/<user>/.cloudflared/<TUNNEL_ID>.json
ingress:
  - hostname: api.yourdomain.com
    service: http://localhost:3001
  - service: http_status:404
EOF

# Route DNS
cloudflared tunnel route dns thermaldeck-backend api.yourdomain.com

# Run as systemd service
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

You need a domain pointed to Cloudflare nameservers (free plan works). The tunnel will be accessible at `https://api.yourdomain.com`.

### Cloudflare Pages (Frontend)
- Push frontend to GitHub
- Connect repo to Cloudflare Pages
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://api.yourdomain.com`

The frontend calls `https://api.yourdomain.com/api/...` — Cloudflare Tunnel routes those to your local Express backend.

### API Security
Since the backend is public via Cloudflare Tunnel, add a simple shared API key:
- Backend: `express` middleware checks `Authorization: Bearer <secret>` header on all `/api/` routes
- Frontend: Injects the key via `VITE_API_KEY` env var (set in Cloudflare Pages dashboard)
- This keeps random internet traffic from hitting your printer

---

## 10. Development & Deployment

### Local Dev
```bash
# Backend
cd backend && npm install
npm run dev          # ts-node-dev, port 3001

# Frontend
cd frontend && npm install
npm run dev          # Vite dev server, port 5173
# Set VITE_API_BASE_URL=http://localhost:3001 in frontend/.env.local
```

### Production Deployment
```bash
# Backend — on home server
cd backend
npm run build        # tsc → dist/
pm2 start ecosystem.config.js
pm2 save && pm2 startup

# Frontend — via Cloudflare Pages CI
git push origin main  # auto-deploys
```

### pm2 ecosystem config
```javascript
// backend/ecosystem.config.js
module.exports = {
  apps: [{
    name: 'thermaldeck-backend',
    script: 'dist/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      ANTHROPIC_API_KEY: 'sk-...',
      API_SECRET: 'your-shared-secret'
    },
    watch: false,
    autorestart: true,
    max_memory_restart: '500M'
  }]
}
```

---

## 11. System Dependencies (Home Server)

```bash
# Required for pdf2pic (Ghostscript + GraphicsMagick)
sudo apt update
sudo apt install -y ghostscript graphicsmagick

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# pm2
sudo npm install -g pm2
```

---

## 12. Test Label Sources

Official sample/demo labels for each carrier:

| Carrier | Source | Notes |
|---|---|---|
| USPS | USPS Technical Guide (developer.usps.com) | Priority Mail IMb sample |
| UPS | UPS Developer Kit sample labels | Ground & Express available |
| FedEx | FedEx Developer Resource Center | Ground, Express, SmartPost |

These are stored as PDFs in `backend/src/testLabels/` — they go through the same pdf2pic → sharp → printer pipeline as user uploads, ensuring the test path is identical to the real path.

---

## 13. Build Phases

### Phase 1 — Core Infrastructure (Week 1)
- [ ] Repo setup, TypeScript configs, Tailwind black theme
- [ ] Express backend skeleton + CORS + API key middleware
- [ ] Printer socket service (connect, ping, send, disconnect)
- [ ] `GET /api/printer/status` working
- [ ] Settings page + config persistence (lowdb)
- [ ] Cloudflare Tunnel wired up and tested

### Phase 2 — Printer Language + Test Labels (Week 1-2)
- [ ] ZPL command builder (darkness, test pattern, raster print)
- [ ] IPL command builder
- [ ] DPL command builder
- [ ] Language auto-detect endpoint
- [ ] Test label PDFs added to repo
- [ ] `POST /api/test-labels/:carrier/print` working
- [ ] Test Labels page in frontend

### Phase 3 — PDF Upload + Vision Crop (Week 2)
- [ ] multer upload endpoint
- [ ] pdf2pic + sharp pipeline
- [ ] Claude Vision integration + prompt tuning
- [ ] Manual crop fallback (react-image-crop)
- [ ] Upload page UI (dropzone → preview → crop → print)

### Phase 4 — Polish (Week 3)
- [ ] Dashboard with print history
- [ ] Job status feedback (toasts + inline)
- [ ] Cloudflare Pages deployment + env vars
- [ ] README with setup instructions
- [ ] Error handling for printer offline, bad PDF, Vision API failure

---

## 14. Open Questions / Decisions Deferred

| Item | Notes |
|---|---|
| Printer language | User to confirm via front panel or web UI. App is configurable + auto-detects. |
| Claude Vision API key | User's existing key or new one — set as env var on backend |
| Domain for Cloudflare Tunnel | User needs a domain pointed to Cloudflare NS — free `.dev` or existing domain works |
| Print history persistence | lowdb JSON is fine for personal use; can upgrade to SQLite later |
| Multi-page PDFs with multiple labels | Phase 3 handles per-page detection; bulk print included |
