# ThermalDeck

Self-hosted thermal label UI for network printers (Intermec / ZPL).

## Synology (recommended)

GitHub Actions builds and publishes:

`ghcr.io/<your-username>/thermaldeck:latest`

### One-time on GitHub

1. Push this repo to GitHub (default branch `main`).
2. Wait for the **Build and publish Docker image** workflow to finish.
3. Repo → **Packages** → `thermaldeck` → Package settings → set visibility to **Public**  
   (or keep Private and add a GHCR pull token on the NAS).

### On the NAS

1. Create `/volume1/docker/thermaldeck` with:
   - `docker-compose.yml` (from this repo)
   - `.env` (copy from `.env.synology.example`, set `GHCR_OWNER`)
   - empty `data/` folder
2. `sudo chown -R 1001:1001 /volume1/docker/thermaldeck/data`
3. Container Manager → **Project** → Create from that folder → Start
4. Open `http://<nas-ip>:8080` and set the printer IP under Settings

Pull updates later: Project → **Build** / recreate (pulls `:latest`).

## Local development

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173  
- Backend: http://localhost:3001  

## Local Docker build

```bash
docker compose -f docker-compose.build.yml up --build -d
```
