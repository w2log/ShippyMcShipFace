# ThermalDeck

Self-hosted thermal label UI for network printers (Intermec / ZPL).

## Synology (recommended)

GitHub Actions publishes:

`ghcr.io/w2log/thermaldeck:latest`

**Do not** use Container Manager → Image → Add from URL. Synology rejects GHCR there (`Invalid Docker Repo URL`).

### One-time on GitHub

1. After the workflow succeeds, open the `thermaldeck` package → **Package settings** → set visibility to **Public** (easiest), **or** keep private and `docker login ghcr.io` on the NAS with a PAT that has `read:packages`.

### On the NAS

1. Create `/volume1/docker/thermaldeck` containing:
   - `docker-compose.yml` (from this repo)
   - empty `data/` folder
2. `sudo chown -R 1001:1001 /volume1/docker/thermaldeck/data`
3. Container Manager → **Project** → **Create** → select that folder → Start  
   (Project uses Docker’s pull, which works with GHCR.)
4. Open `http://<nas-ip>:8080` and set the printer IP under Settings

Updates later: Project → **Build** / recreate (pulls `:latest`).

### SSH fallback (if Project still cannot pull)

```bash
sudo docker pull ghcr.io/w2log/thermaldeck:latest
```

Then create the Project; it will reuse the local image.

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
