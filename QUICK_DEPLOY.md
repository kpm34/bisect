# Quick Deploy to Vercel

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

## Step 2: Login to Vercel

```bash
vercel login
```

## Step 3: Deploy (First Time)

```bash
cd /Users/kashyapmaheshwari/Blender-Workspace/projects/unified-3d-creator
vercel
```

**When prompted:**
- Set up and deploy? → **Yes**
- Which scope? → **Your account**
- Link to existing project? → **No** (first time)
- Project name? → **unified-3d-creator**
- Directory? → **./** (press Enter)
- Override settings? → **No**

## Step 4: Add Environment Variables

After deployment, add your API keys:

```bash
vercel env add OPENAI_API_KEY production
vercel env add GOOGLE_GEMINI_API_KEY production
```

Or add them in Vercel dashboard:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add each variable

## Step 5: Deploy to Production

```bash
vercel --prod
```

## Step 6: Fetch Build Logs (If Build Fails)

```bash
# Get latest deployment logs
vercel logs --follow

# Or for specific deployment
vercel logs <deployment-url> --follow

# List all deployments
vercel ls
```

## Troubleshooting

### If build fails, check logs:
```bash
vercel logs --follow
```

### Common fixes:
1. **Missing dependencies** → Check `package.json`
2. **TypeScript errors** → Run `pnpm type-check` locally first
3. **Environment variables** → Ensure they're set in Vercel
4. **Build timeout** → Check for slow operations

### Test build locally first:
```bash
pnpm build
```

If local build works but Vercel fails, check:
- Environment variables
- Node.js version (should be 18+)
- Build command in `vercel.json`

