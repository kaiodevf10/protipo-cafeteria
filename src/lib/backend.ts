/** Narrow SDK boundary. Authentication is performed only by the official SDK/provider. */
export interface Result<T=unknown>{data:T;error:{message:string;code?:string}|null}
export interface User{id:string;email?:string;email_confirmed_at?:string}
export interface Factor{id:string;status:string;factor_type:string}
export interface Query extends PromiseLike<Result>{select(columns?:string):Query;eq(key:string,value:unknown):Query;order(key:string,options?:{ascending:boolean}):Query;limit(count:number):Query;insert(value:unknown):Query;update(value:unknown):Query}
export interface Backend{
 from(table:string):Query;
 rpc(name:string,args?:Record<string,unknown>):PromiseLike<Result>;
 functions:{invoke(name:string,options:{body:unknown}):Promise<Result>};
 auth:{
  getUser():Promise<Result<{user:User|null}>>;
  signInWithPassword(values:{email:string;password:string}):Promise<Result>;
  signOut(options?:{scope:'global'|'local'}):Promise<{error:unknown}>;
  resetPasswordForEmail(email:string,options:{redirectTo:string}):Promise<Result>;
  updateUser(values:{password:string}):Promise<Result>;
  onAuthStateChange(callback:(event:string,session:unknown)=>void):{data:{subscription:{unsubscribe():void}}};
  mfa:{getAuthenticatorAssuranceLevel():Promise<Result<{currentLevel:string|null}>>;listFactors():Promise<Result<{totp:Factor[];all:Factor[]}>>;enroll(values:{factorType:'totp';friendlyName:string}):Promise<Result<{id:string;totp:{qr_code:string;secret:string}}>>;challengeAndVerify(values:{factorId:string;code:string}):Promise<Result>;unenroll(values:{factorId:string}):Promise<Result>}
 }
}
const env={VITE_SUPABASE_URL:import.meta.env?.VITE_SUPABASE_URL,VITE_SUPABASE_PUBLISHABLE_KEY:import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY,VITE_PUBLIC_ORIGIN:import.meta.env?.VITE_PUBLIC_ORIGIN,VITE_ADMIN_PASSWORD_RECOVERY:import.meta.env?.VITE_ADMIN_PASSWORD_RECOVERY};
export const backendConfigured=Boolean(env.VITE_SUPABASE_URL&&env.VITE_SUPABASE_PUBLISHABLE_KEY);
export const recoveryEnabled=env.VITE_ADMIN_PASSWORD_RECOVERY==='true';
export const publicOrigin=env.VITE_PUBLIC_ORIGIN??'';
export const backendUrl=env.VITE_SUPABASE_URL??'';
// Missing dependency yields an empty glob and an explicit disabled state, never a fake SDK.
const sdkModules=import.meta.glob('/node_modules/@supabase/supabase-js/dist/index.mjs');
let client:Promise<Backend>|undefined;
export function getBackend():Promise<Backend>{
 if(!backendConfigured)return Promise.reject(new Error('Integração Supabase não configurada'));
 return client??=create();
}
async function create():Promise<Backend>{
 const url=new URL(backendUrl);
 if(url.protocol!=='https:'&&!(import.meta.env.DEV&&['localhost','127.0.0.1'].includes(url.hostname)))throw new Error('URL Supabase inválida');
 const key=env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
 if(!key.startsWith('sb_publishable_'))throw new Error('Configure uma chave pública publishable do Supabase');
 const load=Object.values(sdkModules)[0];
 if(!load)throw new Error('SDK oficial Supabase não instalado — consulte ADMIN_SETUP');
 const sdk=await load() as {createClient?:(url:string,key:string,options:unknown)=>Backend};
 if(typeof sdk.createClient!=='function')throw new Error('SDK Supabase incompatível');
 const privateFetch:typeof fetch=(input,init)=>fetch(input,{...init,credentials:'omit',cache:'no-store'});
 return sdk.createClient(backendUrl,key,{global:{fetch:privateFetch},auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:true,flowType:'implicit'}});
}
export function recoveryRedirect(){
 const url=new URL(publicOrigin);
 if(url.origin!==window.location.origin||url.pathname!=='/'||url.search||url.hash)throw new Error('Origem de recuperação não autorizada');
 if(url.protocol!=='https:'&&!(import.meta.env.DEV&&url.hostname==='localhost'))throw new Error('Recuperação exige HTTPS');
 return url.origin+'/admin/conta';
}
