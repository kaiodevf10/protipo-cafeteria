import {loadEnv} from 'vite';
import {existsSync} from 'node:fs';
export function assertSafeEnv(values){
 for(const [name,value] of Object.entries(values)){
  if(!value)continue;
  if(/SECRET|SERVICE_ROLE|(?:^|_)PASSWORD$/i.test(name)||value.startsWith('sb_secret_'))throw new Error('Credencial privada detectada em variável pública; remova-a antes de compilar');
  if(value.split('.').length===3){try{const jwt=JSON.parse(Buffer.from(value.split('.')[1],'base64url').toString());if(jwt.role==='service_role')throw new Error('PRIVATE_KEY')}catch(e){if(e.message==='PRIVATE_KEY')throw new Error('JWT privilegiado detectado em variável pública')}}
 }
 const url=values.VITE_SUPABASE_URL,key=values.VITE_SUPABASE_PUBLISHABLE_KEY;
 if(Boolean(url)!==Boolean(key))throw new Error('Configure URL e chave pública juntas; configuração parcial não é permitida');
 if(key&&!key.startsWith('sb_publishable_'))throw new Error('Use a chave publishable, nunca uma chave secreta');
 if(url){const parsed=new URL(url);if(parsed.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(parsed.hostname))throw new Error('Supabase exige HTTPS')}
}
export function securityEnv(){return{name:'cafe-safe-env',configResolved(config){const values=loadEnv(config.mode,config.root,'VITE_');assertSafeEnv(values);if(config.command==='build'&&values.VITE_SUPABASE_URL&&!existsSync('node_modules/@supabase/supabase-js/dist/index.mjs'))throw new Error('Instale o SDK oficial antes de compilar uma implantação integrada')}}}
