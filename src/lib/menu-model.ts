import type {OptionGroup,Product} from '../types';
import {backendUrl} from './backend';
export interface CategoryRow{id:string;name:string;slug:string;display_order:number;is_active:boolean;updated_at:string}
export interface ProductRow{id:string;name:string;description:string;category_id:string;price_cents:number;image_path:string;is_available:boolean;is_published:boolean;display_order:number;customization_options:unknown;updated_at:string}
export function object(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Dados inválidos');return value as Record<string,unknown>}
export function text(value:unknown,max=1000):string{if(typeof value!=='string'||value.length>max)throw new Error('Texto inválido');return value}
export function integer(value:unknown,max=100000000):number{if(typeof value!=='number'||!Number.isSafeInteger(value)||value<0||value>max)throw new Error('Número inválido');return value}
export function boolean(value:unknown):boolean{if(typeof value!=='boolean')throw new Error('Estado inválido');return value}
export function optionsFromRows(value:unknown):OptionGroup[]{
 if(!Array.isArray(value)||value.length>12)throw new Error('Personalizações inválidas');
 const ids=new Set<string>();
 return value.map(v=>{const g=object(v),id=text(g.id,64);if(ids.has(id)||['__proto__','constructor','prototype'].includes(id))throw new Error('Identificador de opção inválido');ids.add(id);
  if(!Array.isArray(g.choices)||!g.choices.length||g.choices.length>30)throw new Error('Escolhas inválidas');const choices=new Set<string>();
  return {id,name:text(g.name,100),required:g.required===undefined?false:boolean(g.required),multiple:g.multiple===undefined?false:boolean(g.multiple),choices:g.choices.map(v=>{const c=object(v),id=text(c.id,64);if(choices.has(id))throw new Error('Escolha duplicada');choices.add(id);return{id,label:text(c.label,100),price:integer(c.price_cents)/100}})};
 });
}
export function optionsToRows(options:OptionGroup[]=[]){return options.map(g=>({...g,choices:g.choices.map(({price,...c})=>({...c,price_cents:integer(Math.round(price*100))}))}))}
export function categoryRow(value:unknown):CategoryRow{const r=object(value);return {id:text(r.id,80),name:text(r.name,100),slug:text(r.slug,120),display_order:integer(r.display_order,100000),is_active:boolean(r.is_active),updated_at:text(r.updated_at,80)}}
export function productRow(value:unknown):ProductRow{const r=object(value);optionsFromRows(r.customization_options);return{id:text(r.id,80),name:text(r.name,120),description:text(r.description),category_id:text(r.category_id,80),price_cents:integer(r.price_cents),image_path:text(r.image_path,2048),is_available:boolean(r.is_available),is_published:boolean(r.is_published),display_order:integer(r.display_order,100000),customization_options:r.customization_options,updated_at:text(r.updated_at,80)}}
export function imageUrl(path:string){
 if(/^https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9-]+\?[a-zA-Z0-9=&._%-]+$/.test(path))return path;
 if(!/^photos\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(path))throw new Error('Imagem inválida');
 return backendUrl+'/storage/v1/object/public/menu-images/'+path;
}
export function toProduct(row:ProductRow,categories:CategoryRow[]):Product{
 const category=categories.find(c=>c.id===row.category_id);if(!category)throw new Error('Categoria inválida');
 const options=optionsFromRows(row.customization_options);
 return{id:row.id,name:row.name,description:row.description,category:category.name,price:row.price_cents/100,image:imageUrl(row.image_path),available:row.is_available,options:options.length?options:undefined};
}
export function priceInput(value:string):number{
 if(!/^\d{1,7}([.,]\d{1,2})?$/.test(value.trim()))throw new Error('Informe um preço válido, com até duas casas decimais');
 const [whole,decimal='']=value.trim().replace(',','.').split('.');return integer(Number(whole)*100+Number(decimal.padEnd(2,'0')));
}
export function validSelections(product:Product,selections:Record<string,string[]>):boolean{
 const groups=product.options??[];
 return Object.keys(selections).every(id=>groups.some(g=>g.id===id))&&groups.every(g=>{
  const values=selections[g.id]??[];return Array.isArray(values)&&new Set(values).size===values.length&&(!g.required||values.length>0)&&(g.multiple||values.length<=1)&&values.every(id=>g.choices.some(c=>c.id===id));
 });
}
export function parseSnapshot(value:unknown):Product|undefined{
 try{const p=object(value);const price=integer(Math.round(Number(p.price)*100))/100;
  const image=text(p.image,2048);const url=new URL(image);
  if(url.protocol!=='https:'||!(url.hostname==='images.unsplash.com'||(backendUrl&&image.startsWith(backendUrl+'/storage/v1/object/public/menu-images/photos/'))))return;
  const options=p.options===undefined?undefined:optionsFromRows(optionsToRows(p.options as OptionGroup[]));
  return{id:text(p.id,80),name:text(p.name,120),description:text(p.description),category:text(p.category,100),price,image,available:boolean(p.available),options};
 }catch{return undefined}
}
