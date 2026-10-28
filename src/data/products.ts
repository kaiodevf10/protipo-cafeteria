import type { Product } from '../types';
import { photo } from './config';
export let categories=['Cafés e bebidas','Lanches','Salgados','Padaria','Doces e sobremesas','Massas e refeições'];
export let products:Product[]=[
{id:'espresso',name:'Café espresso',category:categories[0],description:'Intenso, aromático e com aquela crema que convida a uma pausa',price:7,image:photo('photo-1510707577719-ae7c14805e3a'),available:true,featured:true,options:[{id:'size',name:'Tamanho',required:true,choices:[{id:'small',label:'Pequeno',price:0},{id:'double',label:'Duplo',price:4}]},{id:'sugar',name:'Açúcar',required:true,choices:[{id:'none',label:'Sem açúcar',price:0},{id:'sugar',label:'Açúcar à parte',price:0},{id:'sweetener',label:'Adoçante à parte',price:0}]},{id:'extras',name:'Complementos',multiple:true,choices:[{id:'milk',label:'Leite',price:2},{id:'cinnamon',label:'Canela',price:1}]}]},
{id:'misto',name:'Misto quente',category:categories[1],description:'Pão dourado, queijo derretido e presunto Simples e delicioso',price:16,image:photo('photo-1528735602780-2552fd46c7af'),available:true,featured:true,options:[{id:'extras',name:'Adicionais',multiple:true,choices:[{id:'cheese',label:'Queijo extra',price:4},{id:'tomato',label:'Tomate',price:2}]},{id:'remove',name:'Retirar ingredientes',multiple:true,choices:[{id:'ham',label:'Sem presunto',price:0}]}]},
{id:'croissant',name:'Croissant amanteigado',category:categories[3],description:'Massa leve, camadas delicadas e uma casquinha dourada',price:12,image:photo('photo-1555507036-ab1f4038808a'),available:true,featured:true},
{id:'bolo',name:'Bolo de chocolate',category:categories[4],description:'Uma fatia macia com cobertura de chocolate para completar a pausa',price:15,image:photo('photo-1578985545062-69928b1d9587'),available:true,featured:true},
{id:'cappuccino',name:'Cappuccino',category:categories[0],description:'Café e leite cremoso em uma combinação acolhedora',price:14,image:photo('photo-1572442388796-11668a67e53d'),available:true},
{id:'suco',name:'Suco de laranja',category:categories[0],description:'Fresco e leve para acompanhar seu lanche',price:12,image:photo('photo-1613478223719-2ab802602423'),available:true},
{id:'coxinha',name:'Coxinha de frango',category:categories[2],description:'Massa douradinha com recheio de frango',price:9,image:photo('photo-1562967914-608f82629710'),available:true},
{id:'pao',name:'Pão de queijo',category:categories[3],description:'Dourado por fora, macio por dentro Um bom par para o café',price:6,image:photo('photo-1549931319-a545dcf3bc73'),available:true},
{id:'massa',name:'Penne ao molho de tomate',category:categories[5],description:'Massa com molho de tomate e manjericão',price:32,image:photo('photo-1473093295043-cdd812d0e601'),available:false}];
// Static records are import/preview data only. Configured deployments replace them atomically.
export function replaceCatalog(next:Product[],nextCategories:string[]){products=next;categories=nextCategories;}
