import ts from 'typescript';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React,{act} from 'react';
for(const name of ['data/config','data/products','lib/backend','lib/menu-model','lib/catalog','utils/order','hooks/useCart','hooks/useCatalog','components/Modal','components/ProductCard','components/Customize','components/Cart','App']){
 const source=await readFile(`src/${name}.${name.startsWith('components/')||name==='App'?'tsx':'ts'}`,'utf8');
 const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["'](\.\.?\/[^"']+)["']/g,"from '$1.js'").replace(/import\.meta\.glob\([^)]*\)/g,'({})').replace(/import\.meta\.env/g,'({})');
 await mkdir(`.verification/${name.includes('/')?name.split('/')[0]:''}`,{recursive:true});await writeFile(`.verification/${name}.js`,output);
}
const {products}=await import('../.verification/data/products.js');
const {unitPrice,total,orderMessage,whatsappUrl}=await import('../.verification/utils/order.js');
const {useCart,storageKey}=await import('../.verification/hooks/useCart.js');
const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost'});
globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.localStorage=dom.window.localStorage;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
const {createRoot}=await import('react-dom/client');
let cart;function Harness(){cart=useCart();return null;}
let root=createRoot(document.getElementById('root'));await act(async()=>root.render(React.createElement(Harness)));
const coffee=products.find(p=>p.id==='espresso');const first={size:['double'],sugar:['none'],extras:['milk','cinnamon']};
assert.equal(unitPrice(coffee,first),14);
await act(async()=>cart.add(coffee,first,'Leite à parte'));
await act(async()=>cart.add(coffee,{extras:['cinnamon','milk'],sugar:['none'],size:['double']},'Leite à parte'));
assert.equal(cart.items.length,1);assert.equal(cart.items[0].quantity,2);assert.equal(total(cart.items),28);
await act(async()=>cart.add(coffee,{size:['small'],sugar:['sugar']},''));assert.equal(cart.items.length,2);assert.equal(total(cart.items),35);
const key=cart.items[0].key;await act(async()=>cart.change(key,-1));assert.equal(total(cart.items),21);assert.equal(cart.items[0].notes,'Leite à parte');
const message=orderMessage(cart.items,'Mariana & João','Sem talheres, por favor.');assert.match(message,/Mariana & João/);assert.match(message,/Duplo · Sem açúcar · Leite · Canela · Leite à parte/);assert.match(message,/21,00/);assert.match(message,/Sem talheres/);
assert.equal(new URL(whatsappUrl('5521999999999',message)).searchParams.get('text'),message);
await act(async()=>root.unmount());root=createRoot(document.getElementById('root'));await act(async()=>root.render(React.createElement(Harness)));assert.equal(cart.items.length,2);assert.equal(total(cart.items),21);
await act(async()=>cart.remove(key));assert.equal(cart.items.length,1);assert.equal(total(cart.items),7);
await act(async()=>cart.change(cart.items[0].key,-1));assert.equal(cart.items.length,0);assert.equal(total(cart.items),0);
await act(async()=>cart.add(products.find(p=>!p.available)));assert.equal(cart.items.length,0);
await act(async()=>cart.add(products.find(p=>p.id==='bolo')));await act(async()=>cart.clear());assert.equal(localStorage.getItem(storageKey),'[]');
await act(async()=>root.unmount());localStorage.setItem(storageKey,'{"corrupt":true}');root=createRoot(document.getElementById('root'));await act(async()=>root.render(React.createElement(Harness)));assert.equal(cart.items.length,0);await act(async()=>root.unmount());
console.log('PASS: adicionais, configurações distintas, agrupamento, quantidades, remoção, total, persistência, limpeza, produto indisponível, dados inválidos e mensagem/URL do WhatsApp.');
dom.window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
dom.window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
const {default:App}=await import('../.verification/App.js');root=createRoot(document.getElementById('root'));await act(async()=>root.render(React.createElement(App)));
const click=async(el)=>{assert.ok(el);await act(async()=>el.click());};
const button=(label)=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===label);
const cards=()=>document.querySelectorAll('#cardapio .product-card');assert.equal(cards().length,9);
const heroPrimary=document.querySelector('.hero-buttons .button');
assert.equal(heroPrimary.textContent.trim(),'Ver cardápio');assert.ok(heroPrimary.classList.contains('caramel'));assert.equal(heroPrimary.getAttribute('href'),'#cardapio');
const heroSecondary=document.querySelector('.hero-buttons .quiet-link');
assert.equal(heroSecondary.textContent.trim(),'Como chegar');assert.equal(heroSecondary.getAttribute('href'),'#localizacao');assert.ok(heroSecondary.querySelector('svg'));assert.ok(!heroSecondary.classList.contains('button'));
assert.ok(!document.querySelector('header').textContent.includes('Fazer pedido'));
assert.equal(document.querySelector('.hero-visual figcaption'),null);assert.ok(document.querySelector('.hero-visual>img'));
for(const card of cards()){
 const product=products.find(p=>p.name===card.querySelector('h3').textContent);
 assert.equal(card.querySelector('.product-description').textContent,product.description);
 const label=card.querySelector('.price small');
 assert.equal(Boolean(label),['espresso','misto'].includes(product.id));
 if(label){assert.equal(label.textContent,'A partir de');assert.equal(card.querySelector('.price').firstElementChild,label);}
}
const {renderToStaticMarkup}=await import('react-dom/server');
const {ProductCard}=await import('../.verification/components/ProductCard.js');
for(const [required,prices,expected] of [[true,[0,0],false],[false,[0,3],true],[true,[2,2],false],[true,[0,4],true]]){
 const product={...coffee,options:[{id:'check',name:'Opções',required,choices:prices.map((price,i)=>({id:String(i),label:String(i),price}))}]};
 const markup=renderToStaticMarkup(React.createElement(ProductCard,{product,onAdd:()=>{}}));
 assert.equal(markup.includes('A partir de'),expected);
}
assert.equal(document.querySelector('.hero-intro').textContent,'Sua pausa começa aqui');
assert.equal(document.querySelector('.hero-intro span'),null);
assert.equal(document.querySelector('.hero-location'),null);
assert.equal(document.querySelector('.menu-results'),null);
assert.ok(!document.body.textContent.includes('Fotografias ilustrativas'));
for(const add of document.querySelectorAll('#cardapio .add-button'))assert.equal(add.textContent.trim(),'Adicionar');
assert.ok(document.querySelector('#localizacao').textContent.includes('Endereço da cafeteria'));
assert.ok(document.querySelector('footer').textContent.includes('Endereço da cafeteria'));
assert.doesNotMatch(document.body.textContent,/vitorino|piazza|itaipu|niterói|enel/i);
assert.equal(document.querySelector('a[href*="wa.me"]'),null);
await click(button('Doces e sobremesas'));assert.equal(cards().length,1);assert.match(cards()[0].textContent,/Bolo de chocolate/);
await click(button('Todos'));const search=document.querySelector('input[type="search"]');
async function searchFor(value){await act(async()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(search,value);search.dispatchEvent(new dom.window.Event('input',{bubbles:true}));});}
await searchFor('cafe');assert.equal(cards().length,1);await searchFor('zzzz');assert.equal(cards().length,0);assert.match(document.body.textContent,/Nenhum sabor por aqui/);await click(button('Limpar busca e filtros'));assert.equal(cards().length,9);
assert.ok(document.querySelector('button[aria-label="Adicionar Penne ao molho de tomate"]').disabled);
await click(document.querySelector('#cardapio button[aria-label="Adicionar Bolo de chocolate"]'));await click(document.querySelector('.cart-trigger'));assert.match(document.querySelector('dialog').textContent,/R\$\s*15,00/);
await click(button('Revisar e finalizar'));assert.ok(document.querySelector('input[autocomplete="given-name"]').required);await click(document.querySelector('dialog button[aria-label="Fechar painel"]'));
await click(document.querySelector('#cardapio button[aria-label="Personalizar Café espresso"]'));assert.equal(document.querySelectorAll('input[type=radio][required]').length,5);
await click(document.querySelector('input[name="size"]'));await click(document.querySelector('input[name="sugar"]'));await act(async()=>document.querySelector('dialog form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));assert.equal(document.querySelector('dialog'),null);
await click(document.querySelector('button[aria-label="Abrir menu"]'));assert.ok(document.getElementById('mobile-nav'));
await click(document.querySelector('button[aria-label="Fechar menu"]'));assert.equal(document.getElementById('mobile-nav'),null);
await click(document.querySelector('button[aria-label="Abrir menu"]'));await click(document.querySelector('#mobile-nav a[href="#sobre"]'));assert.equal(document.getElementById('mobile-nav'),null);
for(const a of document.querySelectorAll('a[href^="#"]'))assert.ok(document.querySelector(a.getAttribute('href')));
assert.equal(document.querySelectorAll('.faq summary').length,7);
assert.equal(document.getElementById('location-title').textContent,'Seu próximo café está aqui');
assert.equal(document.querySelector('.location-address strong').textContent,'Cafeteria');
assert.deepEqual([...document.querySelectorAll('.location-address p')].map(p=>p.textContent),['Endereço da cafeteria']);
assert.equal(document.querySelector('.location-hours>p').textContent,'Horário de funcionamento a definir');
assert.equal(document.querySelector('.location-map iframe'),null);
assert.match(document.querySelector('.location-placeholder').textContent,/Localização a configurar/);
const faqSummaries=[...document.querySelectorAll('.faq summary')];
assert.deepEqual(faqSummaries.slice(0,5).map(s=>s.firstChild.textContent),['Como faço meu pedido?','Meu pedido é confirmado automaticamente?','Posso retirar na cafeteria?','A cafeteria realiza entregas?','Quais são as formas de pagamento?']);
assert.equal(document.querySelectorAll('.faq[open]').length,1);assert.ok(faqSummaries[0].parentElement.open);
assert.deepEqual([...document.querySelectorAll('.faq-answer')[0].querySelectorAll('p')].map(p=>p.textContent),['Escolha os itens no cardápio, toque em Adicionar e finalize pela sacola','Você pode copiar o pedido O envio pelo WhatsApp depende da configuração de um contato']);
for(const summary of faqSummaries){assert.equal(document.getElementById(summary.getAttribute('aria-controls')).getAttribute('aria-labelledby'),summary.id);assert.ok(summary.querySelector('.faq-toggle svg'));}
await click(faqSummaries[1]);assert.ok(faqSummaries[1].parentElement.open);assert.equal(faqSummaries[1].getAttribute('aria-expanded'),'true');assert.equal(faqSummaries[0].getAttribute('aria-expanded'),'false');assert.equal(document.querySelectorAll('.faq[open]').length,1);
await click(faqSummaries[1]);assert.equal(document.querySelectorAll('.faq[open]').length,0);
await click(faqSummaries[0]);assert.ok(faqSummaries[0].parentElement.open);
const countBeforeContact=document.querySelector('.cart-trigger').textContent;
await click(button('Falar no WhatsApp'));assert.equal(document.querySelector('dialog h2').textContent,'Fale com a Cafeteria');
assert.equal(document.querySelector('.cart-trigger').textContent,countBeforeContact);
await click(document.querySelector('dialog button[aria-label="Fechar painel"]'));
console.log('PASS: identidade neutra, endereço e horários pendentes, mapa sem localização configurada, sete perguntas preservadas, alternância exclusiva, acessibilidade e contato sem alteração do carrinho');
await act(async()=>root.unmount());console.log('PASS: interface renderizada, busca sem acentos, filtros, busca vazia, indisponibilidade, carrinho, revisão, personalização obrigatória, navegação mobile e âncoras. A revisão visual depende de navegador real.');
