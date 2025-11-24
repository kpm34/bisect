# Vercel Deployment & Debug Guide

## Quick Start

### 1. Push to GitHub First

```bash
cd /Users/kashyapmaheshwari/Blender-Workspace/projects/unified-3d-creator

# Create GitHub repo at https://github.com/new
# Then:
git remote add origin https://github.com/YOUR_USERNAME/unified-3d-creator.git
git push -u origin main
```

### 2. Install Vercel CLI

```bash
npm install -g vercel
```

### 3. Login to Vercel

```bash
vercel login
```

### 4. Deploy to Vercel

**Option A: Deploy via CLI (Recommended for debugging)**
```bash
cd /Users/kashyapmaheshwari/Blender-Workspace/projects/unified-3d-creator
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? **Your account**
- Link to existing project? **No** (first time)
- Project name? **unified-3d-creator**
- Directory? **./** (current directory)
- Override settings? **No**

**Option B: Use the script**
```bash
./deploy-and-debug.sh
```

### 5. Add Environment Variables

After first deployment, add environment variables:

```bash
vercel env add OPENAI_API_KEY
vercel env add GOOGLE_GEMINI_API_KEY
# Or
vercel env add GEMINI_API_KEY
```

Or add them in Vercel dashboard:
1. Go to your project settings
2. Environment Variables
3. Add each variable for Production, Preview, and Development

### 6. Redeploy with Environment Variables

```bash
vercel --prod
```

## Debugging Build Failures

### Fetch Build Logs

**Get logs for latest deployment:**
```bash
vercel logs --follow
```

**Get logs for specific deployment:**
```bash
vercel logs <deployment-url> --follow
```

**List all deployments:**
```bash
vercel ls
```

**Get build output:**
```bash
vercel inspect <deployment-url>
```

### Common Build Issues & Fixes

#### 1. Module Not Found Errors
```bash
# Check if dependencies are installed
pnpm install

# Check if build works locally
pnpm build
```

#### 2. TypeScript Errors
```bash
# Check TypeScript errors locally
pnpm type-check

# Fix errors before deploying
```

#### 3. Environment Variable Issues
```bash
# List environment variables
vercel env ls

# Pull environment variables locally (for testing)
vercel env pull .env.local
```

#### 4. Build Timeout
- Check `vercel.json` for build settings
- May need to increase build timeout in Vercel dashboard
- Check for large files or slow operations

#### 5. Memory Issues
- Check for memory leaks in build process
- May need to optimize large files
- Check `next.config.mjs` for memory settings

## Useful Vercel CLI Commands

```bash
# Check deployment status
vercel inspect <deployment-url>

# View project info
vercel project ls

# View domains
vercel domains ls

# Pull environment variables
vercel env pull .env.local

# Remove deployment
vercel remove <deployment-url>

# View real-time logs
vercel logs --follow

# Deploy to production
vercel --prod

# Deploy preview
vercel
```

## Debugging Workflow

1. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

2. **If build fails, fetch logs:**
   ```bash
   vercel logs --follow
   ```

3. **Fix issues locally:**
   ```bash
   # Test build locally
   pnpm build
   
   # Fix errors
   # Test again
   ```

4. **Commit and push fixes:**
   ```bash
   git add .
   git commit -m "Fix build errors"
   git push
   ```

5. **Redeploy:**
   ```bash
   vercel --prod
   ```

## Check Build Configuration

Verify `vercel.json` is correct:
```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

## Monitor Builds

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Build Logs:** Available in dashboard for each deployment
- **Real-time:** Use `vercel logs --follow` for live logs

## Troubleshooting

### Build hangs or times out
- Check for infinite loops in code
- Check for large file processing
- Verify dependencies are correct

### Type errors in build
- Run `pnpm type-check` locally first
- Fix all TypeScript errors before deploying
- Check `tsconfig.json` settings

### Missing dependencies
- Ensure `package.json` has all required packages
- Check `pnpm-lock.yaml` is committed
- Verify Node.js version (should be 18+)

### Environment variables not working
- Ensure variables are set in Vercel dashboard
- Check variable names match code exactly
- Redeploy after adding variables

## Quick Debug Script

Use the provided script:
```bash
./fetch-logs.sh <deployment-url>
```

Or manually:
```bash
vercel logs <deployment-url> --follow
```

