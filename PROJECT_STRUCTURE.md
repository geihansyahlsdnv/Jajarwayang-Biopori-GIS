# Biopori GIS - Project Structure

## 📁 Folder Organization

```
biopori-gis/
├── 📄 Core Files
│   ├── index.html              # Main application interface
│   ├── script.js               # JavaScript logic & Firebase integration
│   ├── config.js               # Firebase configuration
│   ├── firebaseService.js      # Firebase Realtime Database service
│   ├── service-worker.js       # PWA service worker
│   ├── manifest.json           # PWA manifest
│   └── vercel.json             # Vercel deployment config
│
├── 🗺️ Data & Assets
│   ├── desa-boundary.geojson   # Desa Jajarwayang boundary polygon
│   ├── icons/                  # App icons (PWA)
│   │   └── icon-192x192.svg
│   ├── README.md               # Main documentation
│   └── .env.example            # Environment variables template
│
├── 📚 docs/                    # Documentation & Guides
│   ├── START_HERE.md           # Quick start guide
│   ├── QUICK_START.md          # Setup instructions
│   ├── AUTH_SETUP.md           # Google OAuth setup
│   ├── FIREBASE_SETUP.md       # Firebase configuration
│   ├── techspec.md             # Technical specification
│   └── ... (other docs)
│
├── 📦 venv/                    # Python virtual environment (dev only)
├── 🔨 build/                   # Build artifacts
├── 📦 dist/                    # Distribution build output
│
├── 🔧 Configuration
│   ├── .gitignore              # Git ignore rules
│   └── .env.example            # Environment template
│
└── 🎯 GitHub
    └── .git/                   # Version control
```

## 🚀 Quick Links

- **To start**: Read `docs/START_HERE.md`
- **Firebase config**: See `docs/FIREBASE_SETUP.md`
- **Auth setup**: See `docs/AUTH_SETUP.md`
- **Tech details**: See `docs/techspec.md`

## 📝 File Descriptions

### Core Application Files
| File | Purpose |
|------|---------|
| `index.html` | UI layout, form modals, map container |
| `script.js` | App logic, map handlers, data management |
| `config.js` | Firebase credentials & constants |
| `firebaseService.js` | Firebase CRUD operations wrapper |
| `service-worker.js` | PWA offline support |

### Data Files
| File | Purpose |
|------|---------|
| `desa-boundary.geojson` | Geospatial boundary for Desa Jajarwayang |
| `manifest.json` | PWA configuration |
| `.env.example` | Template for environment variables |

### Deployment
| File | Purpose |
|------|---------|
| `vercel.json` | Vercel deployment configuration |

## 🧹 Cleanup Status
- ✅ Removed Python cache (`__pycache__/`)
- ✅ Removed temporary files
- ✅ Organized documentation to `docs/` folder
- ✅ Clean `.gitignore` configuration

## 🎯 Development Workflow

1. **Local development**: Edit files in root directory
2. **Documentation**: Add docs to `docs/` folder
3. **Build/Deploy**: Output goes to `dist/` and `build/` folders
4. **Version control**: Git tracks changes (see `.gitignore`)

