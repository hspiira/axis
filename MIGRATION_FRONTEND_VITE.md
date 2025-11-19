# Vite + React Frontend Migration Guide

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Setup](#project-setup)
4. [Routing Configuration](#routing-configuration)
5. [Authentication](#authentication)
6. [API Integration](#api-integration)
7. [Component Migration](#component-migration)
8. [State Management](#state-management)
9. [Styling](#styling)
10. [Build & Deployment](#build--deployment)

---

## Overview

This guide covers migrating the AXIS EAP System frontend from **Next.js App Router** to **Vite + React + React Router**.

### Current Frontend Stack
- Framework: Next.js 15 (App Router)
- UI: React 18.2.0, Radix UI, shadcn/ui
- Styling: Tailwind CSS 4.1.7
- State: TanStack React Query 5.76.1
- Theme: next-themes
- Icons: Lucide React

### Target Frontend Stack
- Build Tool: Vite 5.x
- Framework: React 18.3.1
- Router: React Router 6.x
- UI: Radix UI, shadcn/ui (same)
- Styling: Tailwind CSS 4.x (same)
- State: TanStack React Query 5.x (same)
- Auth: MSAL (Microsoft Authentication Library)

---

## Technology Stack

### Core Dependencies

```json
{
  "name": "axis-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css,md}\""
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.22.0",
    "@tanstack/react-query": "^5.76.1",
    "@azure/msal-browser": "^3.7.0",
    "@azure/msal-react": "^2.0.0",
    "axios": "^1.6.5",
    "zod": "^3.24.4",
    "react-hook-form": "^7.49.3",
    "@hookform/resolvers": "^3.3.4",

    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-popover": "^1.1.2",
    "@radix-ui/react-switch": "^1.1.1",

    "tailwindcss": "^4.1.7",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.0",
    "lucide-react": "^0.510.0",
    "sonner": "^2.0.3",
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.11",
    "vite-tsconfig-paths": "^4.3.1",
    "eslint": "^8.56.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^3.2.4",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0"
  }
}
```

---

## Project Setup

### Step 1: Create Vite Project

```bash
# Create Vite project with React + TypeScript
npm create vite@latest axis-frontend -- --template react-ts
cd axis-frontend

# Install dependencies
npm install

# Install additional dependencies
npm install react-router-dom @tanstack/react-query @azure/msal-browser @azure/msal-react axios zod react-hook-form @hookform/resolvers

# Install Radix UI components (same as current project)
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-popover @radix-ui/react-switch @radix-ui/react-toast @radix-ui/react-slot

# Install utilities
npm install clsx tailwind-merge lucide-react sonner date-fns

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install dev tools
npm install -D vite-tsconfig-paths prettier eslint
```

### Step 2: Project Structure

```
axis-frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Root component
│   ├── router.tsx            # React Router configuration
│   ├── vite-env.d.ts
│   ├── api/                  # API layer
│   │   ├── axios.ts          # Axios instance with interceptors
│   │   ├── auth.ts           # Auth API
│   │   ├── clients.ts        # Clients API
│   │   ├── contracts.ts      # Contracts API
│   │   ├── staff.ts          # Staff API
│   │   └── ...
│   ├── components/           # React components
│   │   ├── ui/               # shadcn/ui components (migrate from Next.js)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Layout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── auth/
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── LoginButton.tsx
│   │   │   └── UserMenu.tsx
│   │   ├── clients/
│   │   │   ├── ClientList.tsx
│   │   │   ├── ClientCard.tsx
│   │   │   ├── ClientForm.tsx
│   │   │   └── ClientDetails.tsx
│   │   └── ...
│   ├── pages/                # Page components
│   │   ├── DashboardPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── clients/
│   │   │   ├── ClientsPage.tsx
│   │   │   ├── ClientDetailPage.tsx
│   │   │   └── ClientCreatePage.tsx
│   │   ├── contracts/
│   │   │   └── ...
│   │   └── ...
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useClients.ts
│   │   ├── useContracts.ts
│   │   └── ...
│   ├── contexts/             # React contexts
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── lib/                  # Utilities
│   │   ├── utils.ts          # cn() and other utilities
│   │   ├── constants.ts
│   │   └── validation.ts
│   ├── types/                # TypeScript types
│   │   ├── api.ts
│   │   ├── client.ts
│   │   ├── contract.ts
│   │   ├── auth.ts
│   │   └── ...
│   └── styles/
│       └── globals.css       # Global styles
├── .env
├── .env.example
├── index.html
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.json
├── .prettierrc
└── package.json
```

### Step 3: Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths() // Enables path aliases from tsconfig.json
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // Proxy API requests to Django backend
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Code splitting for better performance
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs'
          ],
          'query-vendor': ['@tanstack/react-query'],
          'msal-vendor': ['@azure/msal-browser', '@azure/msal-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
```

### Step 4: TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Step 5: Tailwind Configuration

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
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
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
```

```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 20 14.3% 4.1%;
    --card: 0 0% 100%;
    --card-foreground: 20 14.3% 4.1%;
    --popover: 0 0% 100%;
    --popover-foreground: 20 14.3% 4.1%;
    --primary: 24 9.8% 10%;
    --primary-foreground: 60 9.1% 97.8%;
    --secondary: 60 4.8% 95.9%;
    --secondary-foreground: 24 9.8% 10%;
    --muted: 60 4.8% 95.9%;
    --muted-foreground: 25 5.3% 44.7%;
    --accent: 60 4.8% 95.9%;
    --accent-foreground: 24 9.8% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 60 9.1% 97.8%;
    --border: 20 5.9% 90%;
    --input: 20 5.9% 90%;
    --ring: 20 14.3% 4.1%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 20 14.3% 4.1%;
    --foreground: 60 9.1% 97.8%;
    --card: 20 14.3% 4.1%;
    --card-foreground: 60 9.1% 97.8%;
    --popover: 20 14.3% 4.1%;
    --popover-foreground: 60 9.1% 97.8%;
    --primary: 60 9.1% 97.8%;
    --primary-foreground: 24 9.8% 10%;
    --secondary: 12 6.5% 15.1%;
    --secondary-foreground: 60 9.1% 97.8%;
    --muted: 12 6.5% 15.1%;
    --muted-foreground: 24 5.4% 63.9%;
    --accent: 12 6.5% 15.1%;
    --accent-foreground: 60 9.1% 97.8%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 60 9.1% 97.8%;
    --border: 12 6.5% 15.1%;
    --input: 12 6.5% 15.1%;
    --ring: 24 5.7% 82.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Step 6: Environment Variables

```bash
# .env.example
VITE_API_URL=http://localhost:8000/api
VITE_MICROSOFT_CLIENT_ID=your-client-id
VITE_MICROSOFT_TENANT_ID=your-tenant-id
VITE_MICROSOFT_REDIRECT_URI=http://localhost:3000/auth/callback
```

---

## Routing Configuration

### React Router Setup

```typescript
// src/router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ClientsPage } from '@/pages/clients/ClientsPage';
import { ClientDetailPage } from '@/pages/clients/ClientDetailPage';
import { ClientCreatePage } from '@/pages/clients/ClientCreatePage';
import { ContractsPage } from '@/pages/contracts/ContractsPage';
import { ContractDetailPage } from '@/pages/contracts/ContractDetailPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'clients',
        children: [
          { index: true, element: <ClientsPage /> },
          { path: 'new', element: <ClientCreatePage /> },
          { path: ':clientId', element: <ClientDetailPage /> },
        ],
      },
      {
        path: 'contracts',
        children: [
          { index: true, element: <ContractsPage /> },
          { path: ':contractId', element: <ContractDetailPage /> },
        ],
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
```

```typescript
// src/App.tsx
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from '@/lib/msal';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'sonner';
import { router } from '@/router';
import '@/styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <RouterProvider router={router} />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </MsalProvider>
  );
}
```

```typescript
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

---

## Authentication

### MSAL Configuration

```typescript
// src/lib/msal.ts
import { PublicClientApplication, LogLevel } from '@azure/msal-browser';

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MICROSOFT_TENANT_ID}`,
    redirectUri: import.meta.env.VITE_MICROSOFT_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
        }
      },
    },
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const loginRequest = {
  scopes: ['User.Read', 'email', 'profile'],
};
```

### Auth Context

```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '@/lib/msal';
import apiClient from '@/api/axios';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { instance, accounts } = useMsal();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');

      if (token && accounts.length > 0) {
        try {
          // Fetch user profile from backend
          const response = await apiClient.get('/auth/me/');
          setUser(response.data);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, [accounts]);

  const login = async () => {
    try {
      setLoading(true);

      // Login with Microsoft
      const response = await instance.loginPopup(loginRequest);

      // Send ID token to backend
      const { data } = await apiClient.post('/auth/login/microsoft/', {
        code: response.idToken,
      });

      // Store tokens
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);

      // Set user
      setUser(data.user);

      toast.success('Logged in successfully');
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error(error.response?.data?.error || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Notify backend
      await apiClient.post('/auth/logout/');

      // Clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

      // Logout from MSAL
      await instance.logoutPopup();

      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Protected Route Component

```typescript
// src/components/auth/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
```

### Login Page

```typescript
// src/pages/LoginPage.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const LoginPage = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    try {
      await login();
      navigate('/dashboard');
    } catch (error) {
      // Error already handled in login function
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Welcome to AXIS EAP</CardTitle>
          <CardDescription>Sign in with your Microsoft account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Signing in...' : 'Sign in with Microsoft'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
```

---

## API Integration

### Axios Instance with Interceptors

```typescript
// src/api/axios.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401, refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Refresh the token
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/token/refresh/`,
          { refresh: refreshToken }
        );

        const { access } = response.data;

        // Update stored token
        localStorage.setItem('access_token', access);

        // Update request header
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }

        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action');
    } else if (error.response?.status === 404) {
      toast.error('Resource not found');
    } else if (error.response?.status === 500) {
      toast.error('Server error. Please try again later');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### API Services

```typescript
// src/api/clients.ts
import apiClient from './axios';
import type { Client, CreateClientInput, UpdateClientInput, PaginatedResponse } from '@/types/client';

export const clientsApi = {
  /**
   * List clients with pagination and filters
   */
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    industryId?: string;
    isVerified?: boolean;
    ordering?: string;
  }): Promise<PaginatedResponse<Client>> => {
    const { data } = await apiClient.get('/clients/', { params });
    return data;
  },

  /**
   * Get single client by ID
   */
  get: async (id: string): Promise<Client> => {
    const { data } = await apiClient.get(`/clients/${id}/`);
    return data;
  },

  /**
   * Create new client
   */
  create: async (input: CreateClientInput): Promise<Client> => {
    const { data } = await apiClient.post('/clients/', input);
    return data;
  },

  /**
   * Update existing client
   */
  update: async (id: string, input: UpdateClientInput): Promise<Client> => {
    const { data } = await apiClient.patch(`/clients/${id}/`, input);
    return data;
  },

  /**
   * Delete client
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/clients/${id}/`);
  },

  /**
   * Verify client
   */
  verify: async (id: string): Promise<Client> => {
    const { data } = await apiClient.post(`/clients/${id}/verify/`);
    return data;
  },

  /**
   * Get client statistics
   */
  stats: async (id: string): Promise<any> => {
    const { data } = await apiClient.get(`/clients/${id}/stats/`);
    return data;
  },
};
```

### React Query Hooks

```typescript
// src/hooks/useClients.ts
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { clientsApi } from '@/api/clients';
import { toast } from 'sonner';
import type { Client, CreateClientInput, UpdateClientInput } from '@/types/client';

/**
 * Hook to fetch clients list
 */
export const useClients = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  industryId?: string;
  isVerified?: boolean;
}) => {
  return useQuery({
    queryKey: ['clients', params],
    queryFn: () => clientsApi.list(params),
  });
};

/**
 * Hook to fetch single client
 */
export const useClient = (id: string, options?: Omit<UseQueryOptions<Client>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => clientsApi.get(id),
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook to create client
 */
export const useCreateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientInput) => clientsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create client');
    },
  });
};

/**
 * Hook to update client
 */
export const useUpdateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientInput }) =>
      clientsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients', variables.id] });
      toast.success('Client updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update client');
    },
  });
};

/**
 * Hook to delete client
 */
export const useDeleteClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete client');
    },
  });
};

/**
 * Hook to verify client
 */
export const useVerifyClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientsApi.verify(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients', id] });
      toast.success('Client verified successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to verify client');
    },
  });
};
```

### TypeScript Types

```typescript
// src/types/client.ts
export interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  billing_address?: string | null;
  tax_id?: string | null;
  contact_person?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  industry?: {
    id: string;
    name: string;
    code?: string;
  } | null;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  preferred_contact_method?: 'EMAIL' | 'PHONE' | 'SMS' | 'WHATSAPP' | 'OTHER' | null;
  timezone?: string | null;
  is_verified: boolean;
  notes?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateClientInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  billing_address?: string | null;
  tax_id?: string | null;
  contact_person?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  industry?: string;
  preferred_contact_method?: 'EMAIL' | 'PHONE' | 'SMS' | 'WHATSAPP' | 'OTHER' | null;
  timezone?: string | null;
  notes?: string | null;
  metadata?: Record<string, any>;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  is_verified: boolean;
}

export type UpdateClientInput = Partial<CreateClientInput>;

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}
```

---

## Component Migration

### Example: Clients Page

```typescript
// src/pages/clients/ClientsPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search } from 'lucide-react';

export const ClientsPage = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useClients({
    search,
    status,
    page,
    limit: 10,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Failed to load clients</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage your client organizations</p>
        </div>
        <Button asChild>
          <Link to="/clients/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Client
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Client List */}
      <div className="grid gap-4">
        {data?.data.map((client) => (
          <Link key={client.id} to={`/clients/${client.id}`}>
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{client.name}</CardTitle>
                    <CardDescription>{client.email}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        client.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                          : client.status === 'INACTIVE'
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                      }`}
                    >
                      {client.status}
                    </span>
                    {client.is_verified && (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p>{client.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Industry</p>
                    <p>{client.industry?.name || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {data && data.pagination.pages > 1 && (
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {data.pagination.pages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={page === data.pagination.pages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
```

### Layout Component

```typescript
// src/components/layout/Layout.tsx
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
```

---

## State Management

### Theme Context

```typescript
// src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme;
    return stored || 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

---

## Styling

Your existing Tailwind CSS styles and shadcn/ui components can be migrated 1:1 from Next.js to Vite. The `cn()` utility function remains the same:

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Build & Deployment

### Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Summary

This frontend migration guide covers:

1. ✅ **Project Setup**: Vite project with TypeScript
2. ✅ **Routing**: React Router 6 configuration
3. ✅ **Authentication**: MSAL integration with JWT
4. ✅ **API Integration**: Axios + React Query hooks
5. ✅ **Component Migration**: 1:1 migration from Next.js
6. ✅ **State Management**: Context API for auth and theme
7. ✅ **Styling**: Tailwind CSS 4 (same as current)
8. ✅ **Deployment**: Docker with Nginx

**Key Differences from Next.js:**
- ✅ Client-side only (no SSR)
- ✅ Faster development server
- ✅ Simpler build configuration
- ✅ Manual routing with React Router
- ✅ Explicit API calls (no automatic data fetching)

**Migration Effort**: LOW - Most components work as-is with minimal changes!
