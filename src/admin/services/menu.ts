import {getBackend,type Result} from '../../lib/backend';
import {categoryRow,productRow,integer,text,optionsFromRows,priceInput,type ProductRow,type CategoryRow} from '../../lib/menu-model';
export type {ProductRow,CategoryRow};
function checked(result:Result){if(result.error)throw new Error('Operação não autorizada, registro alterado ou falha de conexão. Atualize e tente novamente');return result.data}
export async function listMenu(){const db=await getBackend();const access=await db.rpc('admin_context');if(access.error||!['owner','staff'].includes(String(access.data)))throw new Error('Sessão administrativa inválida');const [p,c]=await Promise.all([db.from('products').select('*').order('display_order'),db.from('categories').select('*').order('display_order')]);const pr=checked(p),cr=checked(c);if(!Array.isArray(pr)||!Array.isArray(cr))throw new Error('Resposta inválida');return{products:pr.map(productRow),categories:cr.map(categoryRow)}}
export async function availability(p:ProductRow,value:boolean){const db=await getBackend();checked(await db.rpc('set_product_availability',{product_id:p.id,available:value,expected_updated_at:p.updated_at}))}
export interface ProductInput{id?:string;new_id?:string;name:string;description:string;category_id:string;price:string;image_path:string;is_available:boolean;is_published:boolean;display_order:number;customization_options:unknown;updated_at?:string}
export async function saveProduct(input:ProductInput){
 const name=text(input.name.trim(),120);if(!name||!input.category_id)throw new Error('Informe nome e categoria');
 optionsFromRows(input.customization_options);
 const row={name,description:text(input.description),category_id:input.category_id,price_cents:priceInput(input.price),image_path:text(input.image_path,2048),is_available:input.is_available,is_published:input.is_published,display_order:integer(input.display_order,100000),customization_options:input.customization_options};
 if(!input.id&&!/^[a-f0-9-]{36}$/.test(input.new_id??''))throw new Error('Identificador de criação inválido');
 const db=await getBackend();const result=input.id?await db.from('products').update(row).eq('id',input.id).eq('updated_at',input.updated_at).select('id'):await db.from('products').insert({id:input.new_id,...row}).select('id');
 const saved=checked(result);if(!Array.isArray(saved)||saved.length!==1)throw new Error('O produto mudou em outra sessão. Atualize antes de editar');
}
export async function saveCategory(input:Omit<CategoryRow,'updated_at'> & {updated_at?:string},create:boolean){
 const name=text(input.name.trim(),100);if(!name||!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(input.slug))throw new Error('Informe nome e identificador válido para a categoria');
 const row={name,slug:input.slug,display_order:integer(input.display_order,100000),is_active:input.is_active};const db=await getBackend();
 const result=create?await db.from('categories').insert({id:input.id,...row}).select('id'):await db.from('categories').update(row).eq('id',input.id).eq('updated_at',input.updated_at).select('id');
 const saved=checked(result);if(!Array.isArray(saved)||saved.length!==1)throw new Error('A categoria mudou. Atualize antes de editar');
}
export async function uploadImage(file:File){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Use uma foto JPEG, PNG ou WebP');
 if(file.size>5242880)throw new Error('A foto deve ter no máximo 5 MB');
 const bitmap=await createImageBitmap(file).catch(()=>{throw new Error('Arquivo de imagem inválido')});
 if(bitmap.width*bitmap.height>24000000){bitmap.close();throw new Error('Use uma imagem com até 24 megapixels')}
 const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;const context=canvas.getContext('2d');if(!context){bitmap.close();throw new Error('Não foi possível preparar a foto')}context.drawImage(bitmap,0,0);bitmap.close();
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('Imagem inválida')),file.type,.9));
 file=new File([blob],'photo',{type:blob.type});if(file.size>5242880)throw new Error('A foto processada excede 5 MB');
 const body=new FormData();body.append('image',file);
 const db=await getBackend();const data=checked(await db.functions.invoke('menu-image',{body}));
 if(!data||typeof data!=='object'||!('path'in data)||typeof data.path!=='string'||!/^photos\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(data.path))throw new Error('Não foi possível confirmar o upload');return data.path;
}
export async function listAudit(){const db=await getBackend();const data=checked(await db.from('audit_logs').select('id,actor_user_id,action,entity_type,entity_id,previous_values,new_values,created_at').order('created_at',{ascending:false}).limit(200));if(!Array.isArray(data))throw new Error('Histórico indisponível');return data as Array<{id:number;actor_user_id:string|null;action:string;entity_type:string;entity_id:string;previous_values:unknown;new_values:unknown;created_at:string}>}
