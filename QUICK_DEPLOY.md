# Quick Deploy to Vercel

## Important

**Bisect is already configured on Vercel. Do NOT create a new project.**

- **Vercel Project**: `bisect`
- **Domain**: bisect.app
- **Auto-deploy**: Pushes to `main` auto-deploy to production

---

## Deploy to Production

```bash
cd /Users/kashyapmaheshwari/Blender-Workspace/projects/Bisect
vercel --prod
```

That's it! The project is already linked.

---

## First Time Setup (If Needed)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Link to Existing Project

```bash
cd /Users/kashyapmaheshwari/Blender-Workspace/projects/Bisect
vercel link
```

**When prompted:**
- Link to existing project? → **Yes**
- Which project? → **bisect**

---

## Environment Variables

The following should already be configured in Vercel:

```
OPENAI_API_KEY              # GPT-4o for 3D scene editing
GOOGLE_GEMINI_API_KEY       # Gemini for textures & SVG
NEXT_PUBLIC_SUPABASE_URL    # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase anon key
ANTHROPIC_API_KEY           # Claude (optional)
OPENROUTER_API_KEY          # Multi-model (optional)
```

To add or update:
```bash
vercel env add VARIABLE_NAME production
```

Or use the dashboard: Vercel → bisect → Settings → Environment Variables

---

## Troubleshooting

### Check build logs:
```bash
vercel logs --follow
```

### List deployments:
```bash
vercel ls
```

### Test build locally first:
```bash
pnpm build
```

### Common issues:

| Issue | Fix |
|-------|-----|
| Missing dependencies | Run `pnpm install` |
| TypeScript errors | Run `pnpm tsc --noEmit` locally |
| Environment variables | Check Vercel dashboard |
| Build timeout | Check for slow operations |

---

## Development Workflow

```bash
# Start dev server
pnpm dev

# Run type check
pnpm tsc --noEmit

# Run lint
pnpm lint

# Build locally
pnpm build

# Deploy when ready
vercel --prod
```

---

*Last updated: Nov 30, 2025*
