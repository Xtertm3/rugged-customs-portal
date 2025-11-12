# Deployment Guide for Rugged Customs Payment Portal

## Vercel Deployment

This project is configured for deployment on Vercel with Vite preset.

### Quick Deploy

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel
   ```

3. **For Production Deployment**:
   ```bash
   vercel --prod
   ```

### Manual Vercel Dashboard Deployment

1. Go to [https://vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Vercel will automatically detect the Vite framework
5. Click "Deploy"

### Configuration

The project includes a `vercel.json` file with the following configuration:
```json
{
  "framework": "vite"
}
```

### Build Settings

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Framework Preset**: Vite

### Environment Variables

No environment variables are currently required. The application uses IndexedDB for client-side storage.

### Post-Deployment

After deployment, your application will be available at:
- Development: `https://your-project-name.vercel.app`
- Production: Your custom domain (if configured)

### Local Development

```bash
npm install
npm run dev
```

### Production Build Test

```bash
npm run build
npm run preview
```

## Features

- ✅ White background with orange theme
- ✅ Professional UI design
- ✅ Responsive layout
- ✅ IndexedDB for data persistence
- ✅ PWA-ready with service worker
- ✅ Optimized Vite build
