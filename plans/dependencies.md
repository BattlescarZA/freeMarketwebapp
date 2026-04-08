# VibeFinance - Complete Dependencies List

## Core Dependencies

```json
{
  "name": "vibefinance",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,md}\"",
    "type-check": "tsc --noEmit",
    "prepare": "husky install"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    
    "@tanstack/react-query": "^5.51.1",
    "@tanstack/react-query-devtools": "^5.51.1",
    "@tanstack/react-router": "^1.45.0",
    "@tanstack/router-devtools": "^1.45.0",
    
    "@supabase/supabase-js": "^2.43.5",
    
    "zustand": "^4.5.4",
    "immer": "^10.1.1",
    
    "react-hook-form": "^7.52.1",
    "zod": "^3.23.8",
    "@hookform/resolvers": "^3.9.0",
    
    "recharts": "^2.12.7",
    
    "lucide-react": "^0.400.0",
    
    "date-fns": "^3.6.0",
    
    "sonner": "^1.5.0",
    "react-hot-toast": "^2.4.1",
    
    "cmdk": "^1.0.0",
    
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.4.0",
    
    "@radix-ui/react-dialog": "^1.1.1",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-select": "^2.1.1",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.2",
    "@radix-ui/react-popover": "^1.1.1",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-checkbox": "^1.1.1",
    
    "vaul": "^0.9.1",
    
    "papaparse": "^5.4.1",
    "@types/papaparse": "^5.3.14"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@types/node": "^20.14.10",
    
    "@vitejs/plugin-react-swc": "^3.7.0",
    "vite": "^6.0.0",
    
    "typescript": "^5.5.3",
    
    "tailwindcss": "^4.0.0",
    "postcss": "^8.4.39",
    "autoprefixer": "^10.4.19",
    
    "@typescript-eslint/eslint-plugin": "^7.16.1",
    "@typescript-eslint/parser": "^7.16.1",
    "eslint": "^9.7.0",
    "eslint-plugin-react": "^7.34.4",
    "eslint-plugin-react-hooks": "^4.6.2",
    "eslint-plugin-react-refresh": "^0.4.8",
    
    "prettier": "^3.3.3",
    "prettier-plugin-tailwindcss": "^0.6.5",
    
    "husky": "^9.1.1",
    "lint-staged": "^15.2.7",
    
    "vite-plugin-pwa": "^0.20.0",
    "workbox-window": "^7.1.0"
  }
}
```

---

## Installation Order

### 1. Create Vite Project
```bash
npm create vite@latest vibefinance -- --template react-ts
cd vibefinance
npm install
```

### 2. Install Tailwind CSS
```bash
npm install -D tailwindcss@next postcss autoprefixer
npx tailwindcss init -p
```

### 3. Install shadcn/ui
```bash
npx shadcn-ui@latest init
```

**Configuration Prompts:**
- TypeScript: Yes
- Style: Default
- Base color: Slate
- CSS variables: Yes
- Tailwind config location: tailwind.config.ts
- Components location: src/components/ui
- Utils location: src/lib/utils
- React Server Components: No
- Write config: Yes

### 4. Install shadcn/ui Components (as needed)
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add select
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add scroll-area
```

### 5. Install TanStack Ecosystem
```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install @tanstack/react-router @tanstack/router-devtools
npm install -D @tanstack/router-vite-plugin
```

### 6. Install State Management
```bash
npm install zustand immer
```

### 7. Install Form Management
```bash
npm install react-hook-form zod @hookform/resolvers
```

### 8. Install Charting
```bash
npm install recharts
```

### 9. Install UI Libraries
```bash
npm install lucide-react sonner react-hot-toast cmdk vaul
```

### 10. Install Utilities
```bash
npm install date-fns clsx tailwind-merge class-variance-authority
npm install papaparse
npm install -D @types/papaparse
```

### 11. Install Supabase
```bash
npm install @supabase/supabase-js
```

### 12. Install Dev Tools
```bash
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh
npm install -D prettier prettier-plugin-tailwindcss
npm install -D husky lint-staged
```

### 13. Initialize Husky
```bash
npm run prepare
npx husky add .husky/pre-commit "npx lint-staged"
```

---

## Configuration Files

### `tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: {
          DEFAULT: 'hsl(142.1 76.2% 36.3%)',
          foreground: 'hsl(142.1 76.2% 96%)',
        },
        warning: {
          DEFAULT: 'hsl(38 92% 50%)',
          foreground: 'hsl(48 96% 89%)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter var', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
```

### `vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'tanstack-vendor': ['@tanstack/react-query', '@tanstack/react-router'],
          'ui-vendor': ['lucide-react', 'recharts'],
        },
      },
    },
  },
});
```

### `.eslintrc.cjs`
```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
```

### `.prettierrc`
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### `lint-staged.config.js`
```javascript
module.exports = {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{css,md}': ['prettier --write'],
};
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## Environment Variables

### `.env.example`
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Polygon.io
VITE_POLYGON_API_KEY=your_polygon_api_key

# App
VITE_APP_URL=http://localhost:3000
VITE_APP_NAME=VibeFinance
```

### `.env.local` (Create this file)
```env
# Copy from .env.example and fill in your actual keys
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_POLYGON_API_KEY=
VITE_APP_URL=http://localhost:3000
VITE_APP_NAME=VibeFinance
```

---

## Git Configuration

### `.gitignore`
```
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Dependencies
node_modules
dist
dist-ssr
*.local

# Editor directories
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Environment variables
.env.local
.env.*.local

# Build outputs
build

# Testing
coverage

# Misc
.eslintcache
.turbo
```

---

## VSCode Extensions (Recommended)

### `.vscode/extensions.json`
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "dsznajder.es7-react-js-snippets",
    "antfu.vite"
  ]
}
```

---

## Package Manager

Recommended: **npm** (comes with Node.js)

Alternative: **pnpm** (faster, more efficient)
```bash
npm install -g pnpm
pnpm install
```

---

## Node Version

Recommended: **Node.js 20.x LTS**

Check version:
```bash
node --version
npm --version
```

Use nvm (Node Version Manager):
```bash
nvm install 20
nvm use 20
```

---

## Quick Start Commands

```bash
# 1. Clone/create project
npm create vite@latest vibefinance -- --template react-ts
cd vibefinance

# 2. Install all dependencies (use the full package.json above)
npm install

# 3. Initialize shadcn/ui
npx shadcn-ui@latest init

# 4. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# 5. Start development server
npm run dev

# 6. Open browser
# Navigate to http://localhost:3000
```

---

## Troubleshooting

### Port already in use
```bash
# Change port in vite.config.ts or:
npm run dev -- --port 3001
```

### Module not found errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors
```bash
# Run type check
npm run type-check

# Clear TypeScript cache
rm -rf node_modules/.vite
```

### Tailwind not working
```bash
# Verify Tailwind is imported in src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

**Last Updated:** 2026-04-08  
**Status:** Dependencies defined - Ready for installation
