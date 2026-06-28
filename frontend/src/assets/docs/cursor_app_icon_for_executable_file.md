# App icon for executable file
_Exported on 6/27/2026 at 21:39:47 PDT from Cursor (3.9.8)_

---

**User**

This app .exe file should have this icon @appicon.png 

---

**Cursor**

I'll trace how the Windows build sets the executable icon and wire it up to use `appicon.png`.


Wails only generates `icon.ico` from `appicon.png` when the `.ico` is missing — the existing default is likely still in use. I'll regenerate it and rebuild.


Done. `WinWatch.exe` is now built with the Inspector Gadget icon from `build/appicon.png`.

**What was wrong:** Wails only generates `build/windows/icon.ico` from `appicon.png` when that `.ico` file is missing. You had already updated `appicon.png`, but the old default `icon.ico` was still there, so the build kept using it.

**What I did:**
1. Removed the stale `build/windows/icon.ico`
2. Ran `wails build` — Wails regenerated `icon.ico` from your `appicon.png` and embedded it in the exe

The new `build/bin/WinWatch.exe` should show the correct icon.

**If Explorer still shows the old icon:** Windows caches exe icons aggressively. Try changing the folder view size, reopening the folder, or restarting Explorer. The icon on the file itself is updated.

**Next time you change `appicon.png`:** delete `build/windows/icon.ico` before running `pnpm build` / `wails build`, or replace `icon.ico` directly with your own `.ico` file.

