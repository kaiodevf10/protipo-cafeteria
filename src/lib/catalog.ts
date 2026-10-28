import {backendConfigured,getBackend} from './backend';
import {categories,products,replaceCatalog} from '../data/products';
import {categoryRow,productRow,toProduct,validSelections} from './menu-model';
import type {CartItem,Product} from '../types';
type Status='preview'|'loading'|'ready'|'error';
let status:Status=backendConfigured?'loading':'preview';
const listeners=new Set<()=>void>();
let pending:Promise<Product[]>|undefined;
export const catalogStatus=()=>status;
export const onCatalogChange=(callback:()=>void)=>{listeners.add(callback);return()=>{listeners.delete(callback)}};
const emit=()=>listeners.forEach(callback=>callback());
export function refreshCatalog():Promise<Product[]>{
 if(!backendConfigured)return Promise.reject(new Error('Finalização indisponível: a fonte oficial do cardápio ainda não foi configurada'));
 return pending??=load().finally(()=>{pending=undefined});
}
async function load(){
 try{
  const db=await getBackend();
  const [c,p]=await Promise.all([db.from('categories').select('*').eq('is_active',true).order('display_order'),db.from('products').select('*').eq('is_published',true).order('display_order')]);
  if(c.error||p.error||!Array.isArray(c.data)||!Array.isArray(p.data))throw new Error('Catálogo indisponível');
  const categoryRows=c.data.map(categoryRow),ids=new Set(categoryRows.map(c=>c.id));
  const current=p.data.map(productRow).filter(p=>ids.has(p.category_id)).map(p=>toProduct(p,categoryRows));
  replaceCatalog(current,categoryRows.map(c=>c.name));status='ready';emit();return current;
 }catch{status='error';replaceCatalog([],[]);emit();throw new Error('Não foi possível verificar o cardápio agora, tente novamente');}
}
export function initializeCatalog(){
 if(!backendConfigured)return()=>{};
 replaceCatalog([],[]);void refreshCatalog().catch(()=>{});
 const timer=window.setInterval(()=>{void refreshCatalog().catch(()=>{})},30000);
 const focus=()=>{void refreshCatalog().catch(()=>{})};window.addEventListener('focus',focus);
 return()=>{clearInterval(timer);window.removeEventListener('focus',focus)};
}
export async function verifyCart(items:CartItem[]){
 if(!items.length)throw new Error('Carrinho vazio');
 const previous=items.map(item=>({...item,productSnapshot:item.productSnapshot??products.find(p=>p.id===item.productId)}));
 if(pending)await pending;
 const current=await refreshCatalog();return{issues:cartIssues(previous,current),products:current};
}
export function cartIssues(items:CartItem[],current:Product[]){
 const issues:string[]=[];
 for(const item of items){
  const before=item.productSnapshot;
  const after=current.find(p=>p.id===item.productId);
  if(!after||!after.available){issues.push(`${before?.name??'Produto'} não está disponível para pedido`);continue;}
  if(!validSelections(after,item.selections)){issues.push(`Revise as personalizações de ${after.name}, remova o item e adicione novamente`);continue;}
  if(!before||before.price!==after.price||JSON.stringify(before.options)!==JSON.stringify(after.options))issues.push(`Os valores ou opções de ${after.name} mudaram, revise o carrinho`);
 }
 return issues;
}
export {categories,products};
