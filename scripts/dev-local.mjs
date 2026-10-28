import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {securityEnv} from './security-env.mjs';
const server=await createServer({configFile:false,plugins:[securityEnv(),react(),tailwindcss()],resolve:{preserveSymlinks:true},server:{host:'127.0.0.1'}});
await server.listen();server.printUrls();
