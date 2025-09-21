# Dev Server Restart Required

The package namespace has been changed from `@forms/` to `@skemya/`. To apply these changes, you need to restart your development server.

## Steps:

1. **Stop the current dev server** (Ctrl+C in the terminal where it's running)

2. **Run the restart script**:

   ```bash
   ./restart-dev.sh
   ```

   Or manually:

   ```bash
   # Clear Next.js cache
   rm -rf apps/builder/.next
   rm -rf apps/marketing/.next

   # Reinstall dependencies
   pnpm install

   # Start dev server
   pnpm dev
   ```

3. **Access the application**:
   - Marketing site: http://localhost:3000
   - Builder app: http://localhost:3001

## What Changed:

- ✅ Package namespace: `@forms/*` → `@skemya/*`
- ✅ Project branding: "Forms" → "Skemya"
- ✅ Logo: Star icon → Favicon (form document icon)
- ✅ Preview panel: Now slides in from the right and shifts content
- ✅ Header spacing: Fixed content overlap issue

All imports have been updated to use the new namespace.
