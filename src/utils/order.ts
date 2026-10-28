import { products } from '../data/products';
import type { CartItem, Product } from '../types';
export const money=(value:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);
export function itemProduct(item:CartItem,catalog:Product[]=products):Product{return catalog.find(p=>p.id===item.productId)??item.productSnapshot??{id:item.productId,name:'Produto indisponível',description:'',category:'',price:0,image:'',available:false}}
export function unitCents(product:Product,selections:CartItem['selections']) { return Math.round(product.price*100)+(product.options??[]).reduce((sum,g)=>sum+g.choices.filter(c=>selections[g.id]?.includes(c.id)).reduce((s,c)=>s+Math.round(c.price*100),0),0); }
export const unitPrice=(product:Product,selections:CartItem['selections'])=>unitCents(product,selections)/100;
export const linePrice=(product:Product,selections:CartItem['selections'],quantity:number)=>unitCents(product,selections)*quantity/100;
export function details(item:CartItem,catalog:Product[]=products) {const p=itemProduct(item,catalog);return [...(p.options??[]).flatMap(g=>g.choices.filter(c=>item.selections[g.id]?.includes(c.id)).map(c=>c.label)),item.notes].filter(Boolean).join(' · ');}
export const total=(items:CartItem[],catalog:Product[]=products)=>items.reduce((sum,i)=>sum+unitCents(itemProduct(i,catalog),i.selections)*i.quantity,0)/100;
export function orderMessage(items:CartItem[],name:string,notes:string,catalog:Product[]=products) {return `Olá! Gostaria de fazer um pedido.\n\nNome: ${name.trim()}\n\nMeu pedido:\n${items.map(i=>{const p=itemProduct(i,catalog);return `${i.quantity}x ${p.name}${details(i,catalog)?' — '+details(i,catalog):''}\n${money(unitPrice(p,i.selections))} por unidade | Subtotal: ${money(linePrice(p,i.selections,i.quantity))}`;}).join('\n\n')}\n\nTotal: ${money(total(items,catalog))}\nValores demonstrativos, sujeitos à confirmação.${notes.trim()?'\nObservações: '+notes.trim():''}\n\nPodem confirmar a disponibilidade e o pedido? Obrigado!`;}
export const whatsappUrl=(number:string,message:string)=>`https://wa.me/${number.replace(/\D/g,'')}?text=${encodeURIComponent(message)}`;
