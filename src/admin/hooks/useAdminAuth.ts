import {useCallback,useEffect,useRef,useState} from 'react';
import {backendConfigured,getBackend,type User} from '../../lib/backend';
export type Role='owner'|'staff';
type AuthState={stage:'loading'|'disabled'|'login'|'denied'|'mfa'|'ready';role?:Role;user?:User;message?:string};
export function useAdminAuth(){
 const [state,setState]=useState<AuthState>({stage:backendConfigured?'loading':'disabled'});const generation=useRef(0);
 const refresh=useCallback(async()=>{
  const ticket=++generation.current;
  const apply=(value:AuthState)=>{if(ticket===generation.current)setState(value)};
  if(!backendConfigured){apply({stage:'disabled'});return;}
  try{
   const db=await getBackend();const userResult=await db.auth.getUser();const user=userResult.data?.user;
   if(userResult.error||!user){apply({stage:'login'});return;}
   if(!user.email_confirmed_at){apply({stage:'denied',message:'Confirme seu e-mail pelo procedimento enviado pela cafeteria'});return;}
   const access=await db.rpc('my_admin_access');
   if(access.error||!['owner','staff'].includes(String(access.data))){apply({stage:'denied',message:'Acesso administrativo não autorizado'});return;}
   const level=await db.auth.mfa.getAuthenticatorAssuranceLevel();if(level.error)throw new Error();
   const role=access.data as Role;
   if(level.data.currentLevel!=='aal2'){apply({stage:'mfa',role,user});return;}
   const context=await db.rpc('admin_context');if(context.error||context.data!==role)throw new Error();
   apply({stage:'ready',role,user});
  }catch{apply({stage:'disabled',message:'Não foi possível validar o acesso. Verifique a integração e tente novamente'});}
 },[]);
 useEffect(()=>{let live=true;let unsubscribe=()=>{};let deferred:ReturnType<typeof setTimeout>|undefined;
  void refresh();
  if(backendConfigured)void getBackend().then(db=>{if(!live)return;unsubscribe=db.auth.onAuthStateChange(event=>{
   if(event==='SIGNED_OUT'){generation.current++;setState({stage:'login'});return;}
   // Never await another auth call inside the SDK event callback.
   clearTimeout(deferred);deferred=setTimeout(()=>{if(live)void refresh()},0);
  }).data.subscription.unsubscribe;}).catch(()=>{});
  const focus=()=>{void refresh()};const resume=(event:PageTransitionEvent)=>{if(event.persisted){setState({stage:'loading'});void refresh()}};const timer=setInterval(focus,30000);window.addEventListener('focus',focus);window.addEventListener('pageshow',resume);
  return()=>{live=false;generation.current++;clearTimeout(deferred);clearInterval(timer);window.removeEventListener('focus',focus);window.removeEventListener('pageshow',resume);unsubscribe()};
 },[refresh]);
 async function logout(){generation.current++;setState({stage:'login'});try{await(await getBackend()).auth.signOut({scope:'global'})}catch{/* Reload still clears in-memory credentials; remote revocation may need an operator. */}finally{window.location.replace('/admin/login')}}
 return{...state,refresh,logout};
}
