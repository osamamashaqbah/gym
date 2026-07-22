# Iron Forge Gym Management — Desktop App

Electron wrapper that bundles the Angular frontend and a self-contained
.NET backend (SQLite, no external services required) into one Windows
desktop app.

## How it works

- `main.js` spawns the published `GymManagement.Api.exe` on `127.0.0.1:5080`
  (SQLite database stored per-user under `%LOCALAPPDATA%\GymManagement`).
- A tiny built-in static server serves the Angular build on
  `127.0.0.1:4300` and proxies `/api/*` requests to the backend.
- A single `BrowserWindow` loads `http://127.0.0.1:4300`.

## Build steps

```bash
# 1. Build the Angular frontend
cd frontend && npm run build

# 2. Publish the backend as a self-contained win-x64 exe
cd backend/src/GymManagement.Api
dotnet publish -c Release -r win-x64 --self-contained true \
  -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true \
  -o ../../../desktop/resources/backend

# 3. Copy the Angular build output into desktop/resources/frontend
cp -r frontend/dist/gym-frontend/browser/. desktop/resources/frontend/

# 4. Install desktop deps and package
cd desktop
npm install
npm run dist:packager   # electron-packager (no admin/Developer Mode needed)
# or: npm run dist       # electron-builder (needs Windows Developer Mode
#                           enabled, or an elevated shell, to build NSIS/portable)
```

The runnable app lands in `desktop/dist-packager/Iron Forge Gym Management-win32-x64/`.
