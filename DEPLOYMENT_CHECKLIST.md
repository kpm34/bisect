# Deployment Checklist

## Build Fixes Applied ✅

1. ✅ Fixed MaterialSelector to use local material manifest instead of Appwrite
2. ✅ Fixed scenePersistence import path (`@/utils/scenePersistence` → `./utils/scenePersistence`)
3. ✅ Added `react-arborist` dependency
4. ✅ Fixed vector component import paths (`../../lib/types/types` → `../lib/types/types`)
5. ✅ Fixed vector geometry/services import paths
6. ✅ Fixed Gemini import (`@google/genai` → `@google/generative-ai`)
7. ✅ Added `imagetracerjs` dependency
8. ✅ Fixed textures page imports to point to `matcap-&-pbr-genai/` subdirectory
9. ✅ Added `'use client'` directive to textures page
10. ✅ Fixed JSX structure in textures page

## Remaining Issues

The build may still have issues with:
- Missing dependencies in `matcap-&-pbr-genai/` subdirectory (it has its own package.json)
- Potential import conflicts between main project and subdirectory

## Next Steps for Deployment

1. **Test Build Locally**
   ```bash
   pnpm build
   ```

2. **Initialize Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Unified 3D Creator merge"
   ```

3. **Create GitHub Repository**
   - Create new repo on GitHub
   - Add remote: `git remote add origin <repo-url>`
   - Push: `git push -u origin main`

4. **Deploy to Vercel**
   - Connect GitHub repo to Vercel
   - Vercel will auto-detect Next.js
   - Add environment variables:
     - `OPENAI_API_KEY`
     - `GOOGLE_GEMINI_API_KEY` (or `GEMINI_API_KEY`)
     - `ANTHROPIC_API_KEY` (optional)
     - `OPENROUTER_API_KEY` (optional)

5. **Create vercel.json** (optional, for custom config)
   ```json
   {
     "buildCommand": "pnpm build",
     "devCommand": "pnpm dev",
     "installCommand": "pnpm install",
     "framework": "nextjs",
     "regions": ["iad1"]
   }
   ```

## Environment Variables Needed

Create `.env.local` (or set in Vercel):
```bash
# OpenAI (for 3D scene editing)
OPENAI_API_KEY=your_key_here

# Google Gemini (for textures & SVG)
GOOGLE_GEMINI_API_KEY=your_key_here
# OR
GEMINI_API_KEY=your_key_here

# Anthropic Claude (optional, for complex reasoning)
ANTHROPIC_API_KEY=your_key_here

# OpenRouter (optional, for multi-model access)
OPENROUTER_API_KEY=your_key_here
```

## Potential Build Issues

1. **matcap-&-pbr-genai subdirectory**: This has its own `node_modules` and `package.json`. May need to:
   - Move components to main project, OR
   - Configure Next.js to handle nested dependencies

2. **Large file sizes**: IndexedDB storage may hit limits in browser
   - Consider adding file size warnings
   - Add compression for scene files

3. **API routes**: Check if `/api/materials` route exists (MaterialSelector tries to fetch from it)

## Quick Test Commands

```bash
# Check for TypeScript errors
pnpm type-check

# Check for linting errors  
pnpm lint

# Build for production
pnpm build

# Start production server
pnpm start
```

