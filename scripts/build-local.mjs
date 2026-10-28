// Loads Vite directly when Windows sandbox restrictions prevent config bundling.
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {securityEnv} from './security-env.mjs';
await build({configFile:false,plugins:[securityEnv(),react(),tailwindcss()],resolve:{preserveSymlinks:true}});
