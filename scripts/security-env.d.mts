import type {Plugin} from 'vite';
export function assertSafeEnv(values:Record<string,string|undefined>):void;
export function securityEnv():Plugin;
