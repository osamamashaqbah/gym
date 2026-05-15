@echo off
REM ============================================================
REM  Iron Forge Gym Management — Build Single-File EXE (Windows)
REM ============================================================
REM  Output: dist/IronForge.GymManagement.exe (~ 80–110 MB)
REM
REM  Prerequisites (build machine only — NOT needed on the target machine):
REM    - .NET SDK 8.0+        https://dotnet.microsoft.com/download
REM    - Node.js 18+          https://nodejs.org/
REM
REM  Usage:    build-exe.bat
REM ============================================================
setlocal enabledelayedexpansion

set "ROOT=%~dp0"
set "FRONTEND=%ROOT%frontend"
set "API=%ROOT%backend\src\GymManagement.Api"
set "WWWROOT=%API%\wwwroot"
set "OUTDIR=%ROOT%dist"

echo.
echo ==========================================================
echo  IRON FORGE  -  Building single-file Windows EXE
echo ==========================================================
echo.

REM ---------- 1. Build Angular ----------
echo [1/4] Installing frontend dependencies...
pushd "%FRONTEND%"
if not exist node_modules (
    call npm install --no-audit --no-fund || goto :err
) else (
    echo      node_modules present, skipping install.
)

echo [2/4] Building Angular production bundle...
call npm run build || goto :err
popd

REM ---------- 2. Copy Angular output into API wwwroot ----------
echo      Copying frontend into API wwwroot...
if exist "%WWWROOT%" rmdir /s /q "%WWWROOT%"
mkdir "%WWWROOT%"
xcopy /E /I /Y /Q "%FRONTEND%\dist\gym-frontend\browser\*" "%WWWROOT%\" >nul || goto :err

REM ---------- 3. Publish self-contained single-file .NET EXE ----------
echo [3/4] Publishing self-contained Windows EXE (this can take a minute)...
if exist "%OUTDIR%" rmdir /s /q "%OUTDIR%"
dotnet publish "%API%\GymManagement.Api.csproj" ^
    -c Release ^
    -r win-x64 ^
    --self-contained true ^
    -p:PublishSingleFile=true ^
    -p:IncludeNativeLibrariesForSelfExtract=true ^
    -p:EnableCompressionInSingleFile=true ^
    -p:DebugType=embedded ^
    -o "%OUTDIR%" || goto :err

REM ---------- 4. Cleanup PDB ----------
del /q "%OUTDIR%\*.pdb" 2>nul

echo [4/4] Done.
echo.
echo ==========================================================
echo  SUCCESS!
echo ==========================================================
echo.
echo  Output folder:  %OUTDIR%
echo  Run command:    %OUTDIR%\IronForge.GymManagement.exe
echo.
echo  The EXE is fully self-contained:
echo    * No .NET runtime required on the target machine
echo    * No Node.js required
echo    * No database server required (uses local SQLite file)
echo    * Just copy the entire 'dist' folder and double-click the exe
echo.
endlocal
exit /b 0

:err
echo.
echo ==========================================================
echo  BUILD FAILED. See log above for the cause.
echo ==========================================================
popd 2>nul
endlocal
exit /b 1
