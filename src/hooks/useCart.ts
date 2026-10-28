import {useEffect,useState} from 'react';
import type {CartItem,Product} from '../types';
import {products} from '../data/products';
import {parseSnapshot,validSelections} from '../lib/menu-model';
export const storageKey='vitorino-cart-v1';
export function useCart(){
 const [items,setItems]=useState<CartItem[]>(()=>{try{
  const saved:unknown=JSON.parse(localStorage.getItem(storageKey)??'[]');if(!Array.isArray(saved))return[];
  return saved.filter((i):i is CartItem=>Boolean(i&&typeof i==='object'&&typeof i.productId==='string'&&typeof i.key==='string'&&typeof i.notes==='string'&&i.notes.length<=400&&Number.isInteger(i.quantity)&&i.quantity>0&&i.quantity<=99&&i.selections&&typeof i.selections==='object'&&!Array.isArray(i.selections)&&Object.values(i.selections).every(v=>Array.isArray(v)&&v.every(id=>typeof id==='string')))).map(i=>({...i,productSnapshot:parseSnapshot(i.productSnapshot)??products.find(p=>p.id===i.productId)}));
 }catch{return[]}});
 const [storageError,setStorageError]=useState(false);
 useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(items));setStorageError(false)}catch{setStorageError(true)}},[items]);
 function add(p:Product,selections:CartItem['selections']={},notes=''){
  const current=products.find(product=>product.id===p.id);
  if(!current?.available||!validSelections(current,selections))return false;
  p=current;
  const canonical=Object.fromEntries(Object.entries(selections).sort().map(([k,v])=>[k,[...v].sort()]));const key=JSON.stringify([p.id,canonical,notes.trim()]);
  setItems(old=>{const found=old.find(i=>i.key===key);return found?old.map(i=>i.key===key?{...i,quantity:Math.min(99,i.quantity+1),productSnapshot:p}:i):[...old,{key,productId:p.id,selections:canonical,notes:notes.trim(),quantity:1,productSnapshot:p}]});
  return true;
 }
 const change=(key:string,delta:number)=>setItems(old=>old.map(i=>i.key===key?{...i,quantity:Math.min(99,i.quantity+delta)}:i).filter(i=>i.quantity>0));
 function acceptCurrentPrices(){setItems(old=>old.map(i=>{const p=products.find(p=>p.id===i.productId);return p&&p.available&&validSelections(p,i.selections)?{...i,productSnapshot:p}:i}))}
 return{items,add,change,acceptCurrentPrices,remove:(key:string)=>setItems(old=>old.filter(i=>i.key!==key)),clear:()=>setItems([]),storageError};
}
