import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {securityEnv} from './scripts/security-env.mjs';
export default defineConfig({ plugins: [securityEnv(), react(), tailwindcss()], resolve: { preserveSymlinks: true } });
