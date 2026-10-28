import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
import {imageType} from '../_shared/image.ts';
Deno.serve(async request=>{
 const origin=Deno.env.get('ADMIN_ALLOWED_ORIGIN');
 if(!origin||Deno.env.get('MENU_IMAGE_UPLOADS_ENABLED')!=='true')return new Response('Upload not configured',{status:503});
 if(request.headers.get('Origin')!==origin)return new Response('Forbidden',{status:403});
 const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin','Content-Type':'application/json','Cache-Control':'no-store'};
 const reply=(status:number,error:string)=>new Response(JSON.stringify({error}),{status,headers});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='POST')return reply(405,'Método não permitido');
 const authorization=request.headers.get('Authorization');if(!authorization?.startsWith('Bearer '))return reply(401,'Não autorizado');
 try{
  const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  if(!url||!anon||!secret)return reply(503,'Upload indisponível');
  const userClient=createClient(url,anon,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:user,error:authError}=await userClient.auth.getUser();if(authError||!user.user?.email_confirmed_at)return reply(401,'Não autorizado');
  const allowed=async()=>{const result=await userClient.rpc('admin_context');return !result.error&&result.data==='owner'};
  if(!await allowed())return reply(403,'Não autorizado');
  if(!request.headers.get('content-type')?.startsWith('multipart/form-data'))return reply(400,'Formato inválido');
  const reader=request.body?.getReader();if(!reader)return reply(400,'Arquivo ausente');let size=0;const chunks:Uint8Array[]=[];
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>6*1024*1024){await reader.cancel();return reply(413,'Arquivo muito grande')}chunks.push(value)}
  const body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length}
  const form=await new Request(request.url,{method:'POST',headers:{'Content-Type':request.headers.get('content-type')!},body}).formData();const file=form.get('image');
  if(!(file instanceof File))return reply(400,'Arquivo ausente');
  const bytes=new Uint8Array(await file.arrayBuffer());let type;try{type=imageType(bytes)}catch{return reply(400,'Imagem inválida, metadados não permitidos ou limite excedido')}
  if(file.type!==type.mime)return reply(400,'Tipo de arquivo incompatível');
  if(!await allowed())return reply(403,'Não autorizado');
  const path=`photos/${crypto.randomUUID()}.${type.extension}`;
  const storage=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const result=await storage.storage.from('menu-images').upload(path,bytes,{contentType:type.mime,upsert:false,cacheControl:'3600'});
  if(result.error)return reply(503,'Não foi possível salvar a imagem');
  return new Response(JSON.stringify({path}),{status:201,headers});
 }catch{return reply(503,'Não foi possível concluir o upload')}
});
