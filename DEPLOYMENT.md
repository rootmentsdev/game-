# 🚀 Vercel Deployment Guide

## Frontend Deployment to Vercel

### Prerequisites:
- ✅ Your Snake and Ladder game is ready
- ✅ Backend is deployed at: `https://game-5fs1.onrender.com`
- ✅ Vercel account created

### Steps to Deploy:

#### 1. **Connect to Vercel:**
- Go to [vercel.com](https://vercel.com)
- Click "New Project"
- Import your GitHub repository
- Select the `frontend` repository

#### 2. **Build Configuration:**
- **Framework Preset**: `Vite`
- **Root Directory**: `./` (leave default)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### 3. **Socket Configuration:**
✅ **No environment variables needed!** The code automatically detects:
- `localhost` → connects to `http://localhost:3001` (development)
- Production domains → connects to `https://game-5fs1.onrender.com` (production)

#### 4. **Deploy:**
- Click "Deploy"
- Wait for build to complete
- Get your frontend URL (e.g., `https://snake-ladder-game.vercel.app`)

### Configuration Files Used:
- `vercel.json` - Deployment configuration
- `package.json` - Build scripts
- Auto-detection of backend URL based on domain

### Testing:
1. ✅ Frontend URL should work
2. ✅ Game should connect to `https://game-5fs1.onrender.com`
3. ✅ Multiplayer functionality should work
4. ✅ Real-time features should work across different users

### Troubleshooting:
- **Build fails**: Check `package.json` scripts
- **Socket connection fails**: Code auto-detects domain, should work automatically
- **CORS issues**: Check if backend allows your Vercel domain

### URLs:
- **Backend**: `https://game-5fs1.onrender.com`
- **Frontend**: `https://your-app-name.vercel.app`
