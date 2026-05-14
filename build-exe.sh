#!/usr/bin/env bash
# ============================================================
#  Iron Forge Gym Management — Build Single-File EXE
#  Cross-platform (Linux/macOS) helper that produces a Windows EXE.
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
FRONTEND="$ROOT/frontend"
API="$ROOT/backend/src/GymManagement.Api"
WWWROOT="$API/wwwroot"
OUT="$ROOT/dist"
RID="${RID:-win-x64}"   # override with: RID=linux-x64 ./build-exe.sh

echo
echo "=========================================================="
echo "  IRON FORGE  -  Building single-file EXE  (RID: $RID)"
echo "=========================================================="
echo

# 1. Frontend
echo "[1/4] Installing frontend dependencies..."
cd "$FRONTEND"
if [ ! -d node_modules ]; then
    npm install --no-audit --no-fund
else
    echo "      node_modules present, skipping install."
fi

echo "[2/4] Building Angular production bundle..."
npm run build

echo "      Copying frontend into API wwwroot..."
rm -rf "$WWWROOT"
mkdir -p "$WWWROOT"
cp -R "$FRONTEND/dist/gym-frontend/browser/." "$WWWROOT/"

# 2. Backend
echo "[3/4] Publishing self-contained EXE (this can take a minute)..."
rm -rf "$OUT"
dotnet publish "$API/GymManagement.Api.csproj" \
    -c Release \
    -r "$RID" \
    --self-contained true \
    -p:PublishSingleFile=true \
    -p:IncludeNativeLibrariesForSelfExtract=true \
    -p:EnableCompressionInSingleFile=true \
    -p:DebugType=embedded \
    -o "$OUT"

# 3. Cleanup
rm -f "$OUT"/*.pdb || true

echo "[4/4] Done."
echo
echo "=========================================================="
echo "  SUCCESS!"
echo "=========================================================="
echo
echo "  Output folder:  $OUT"
if [[ "$RID" == win-* ]]; then
    echo "  EXE:            $OUT/IronForge.GymManagement.exe"
else
    echo "  Binary:         $OUT/IronForge.GymManagement"
fi
echo
echo "  No runtime, Node.js, or DB server required on target."
echo
