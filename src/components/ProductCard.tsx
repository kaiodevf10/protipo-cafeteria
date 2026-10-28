import { Plus } from 'lucide-react';
import type { Product } from '../types';
import { money } from '../utils/order';
export function ProductCard({product:p,onAdd,compact=false}:{product:Product;onAdd:(p:Product)=>void;compact?:boolean}) {
 const variablePrice=p.options?.some(group=>{
  const prices=group.choices.map(choice=>choice.price);
  if(!group.required||group.multiple)prices.push(0);
  return new Set(prices).size>1;
 });
 return <article className={`product-card ${compact?'compact':''} ${!p.available?'unavailable':''}`}>
  <div className="product-photo">
   <img src={p.image} alt={`Imagem ilustrativa de ${p.name.toLowerCase()}`} loading="lazy" width="700" height="500"/>
   {!p.available&&<span className="availability">Indisponível</span>}
  </div>
  <div className="product-content">
   <h3>{p.name}</h3>
   <p className="product-description">{p.description}</p>
   <div className="product-bottom">
    <span className="price">{variablePrice&&<small>A partir de</small>}{money(p.price)}</span>
    <button className="add-button" disabled={!p.available} onClick={()=>onAdd(p)} aria-label={`${p.options?'Personalizar':'Adicionar'} ${p.name}`}><Plus size={18}/><span>Adicionar</span></button>
   </div>
  </div>
 </article>;
}
