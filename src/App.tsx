import { useEffect,useState } from 'react';
import { ArrowDown, ArrowUpRight, Coffee, Menu, Plus, Search, ShoppingBag, X } from 'lucide-react';
import { cafe,images } from './data/config';
import { categories,products } from './data/products';
import type { CartItem,Product } from './types';
import { useCart } from './hooks/useCart';
import { useCatalog } from './hooks/useCatalog';
import { refreshCatalog } from './lib/catalog';
import { money,total,whatsappUrl } from './utils/order';
import { ProductCard } from './components/ProductCard';
import { Customize } from './components/Customize';
import { Cart } from './components/Cart';
import { Modal } from './components/Modal';
const links=[['Início','#inicio'],['Cardápio','#cardapio'],['Sobre','#sobre'],['Como chegar','#localizacao']];
const faqs=[['Como faço meu pedido?','Escolha os itens no cardápio, toque em Adicionar e finalize pela sacola\n\nVocê pode copiar o pedido O envio pelo WhatsApp depende da configuração de um contato'],['Meu pedido é confirmado automaticamente?','Não Você precisa enviar a mensagem pelo WhatsApp e aguardar a confirmação da cafeteria sobre disponibilidade e valores'],['Posso retirar na cafeteria?','A retirada no local está sujeita à confirmação Combine os detalhes com a cafeteria pelo contato oficial quando ele estiver disponível'],['A cafeteria realiza entregas?','A modalidade de entrega ainda não foi confirmada Consulte a cafeteria antes de concluir seu pedido'],['Quais são as formas de pagamento?','As formas de pagamento serão informadas pela cafeteria no atendimento Este site não realiza pagamentos'],['Posso personalizar os produtos?','Os produtos com o botão “Escolher” possuem opções demonstrativas de personalização A disponibilidade real deve ser confirmada pela cafeteria'],[`Onde fica a ${cafe.name}?`,[cafe.address,cafe.location,cafe.reference].filter(Boolean).join(' ')]];
function WhatsAppIcon(){return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M20.5 11.7a8.5 8.5 0 0 1-12.7 7.4L3 20.5l1.3-4.6a8.5 8.5 0 1 1 16.2-4.2Z"/><path d="M8 7.7c.5-.4 1.2 1.6 1.2 1.6l-.7 1c.8 1.7 1.8 2.7 3.6 3.4l.9-.9s2.1.7 2 1.4c-.2 2.4-3.6 1.5-5.8-.4S6.1 9 8 7.7Z"/></svg>}
export default function App(){
 const catalogState=useCatalog();
 const [faqOpen,setFaqOpen]=useState<number|null>(0);
 const cart=useCart();const [menu,setMenu]=useState(false),[category,setCategory]=useState('Todos'),[query,setQuery]=useState(''),[custom,setCustom]=useState<Product|null>(null),[cartOpen,setCartOpen]=useState(false),[contact,setContact]=useState(false),[toast,setToast]=useState('');
 useEffect(()=>{
  if(!menu)return;
  function closeMenu(event:KeyboardEvent){
   if(event.key==='Escape'){
    setMenu(false);
    document.querySelector<HTMLButtonElement>('.mobile-menu-toggle')?.focus();
   }
  }
  document.addEventListener('keydown',closeMenu);
  return()=>document.removeEventListener('keydown',closeMenu);
 },[menu]);
 const count=cart.items.reduce((s,i)=>s+i.quantity,0);const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const visible=products.filter(p=>(category==='Todos'||p.category===category)&&normalize(p.name).includes(normalize(query.trim())));
 useEffect(()=>{if(category!=='Todos'&&!categories.includes(category))setCategory('Todos')},[category,categories]);
 useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),3500);return()=>clearTimeout(timer);},[toast]);
 function add(p:Product,selections:CartItem['selections']={},notes=''){if(cart.add(p,selections,notes))setToast(`${p.name} adicionado ao pedido`);else setToast('O produto ou suas opções mudaram, revise o cardápio');}
 function choose(p:Product){if(p.options)setCustom(p);else add(p);}
 function openContact(){if(cafe.whatsapp)window.open(whatsappUrl(cafe.whatsapp,'Olá! Gostaria de uma informação.'),'_blank','noopener,noreferrer');else setContact(true);}
 return <><a href="#cardapio" className="skip-link">Pular para o cardápio</a><header className="header"><div className="container header-inner"><a className="brand" href="#inicio" aria-label={`${cafe.name}, início`}>{cafe.name}<span>Uma pausa com sabor</span></a><nav className="desktop-nav" aria-label="Navegação principal">{links.map(([name,href])=><a href={href} key={href}>{name}</a>)}</nav><div className="header-actions"><button className="icon-button cart-trigger" aria-label={`Abrir carrinho, ${count} itens`} onClick={()=>setCartOpen(true)}><ShoppingBag size={21}/>{count>0&&<span className="count">{count}</span>}</button><button className="icon-button mobile-menu-toggle" aria-label={menu?'Fechar menu':'Abrir menu'} aria-expanded={menu} aria-controls="mobile-nav" onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button></div></div>{menu&&<nav id="mobile-nav" className="mobile-nav" aria-label="Navegação mobile">{links.map(([name,href])=><a href={href} key={href} onClick={()=>setMenu(false)}>{name}</a>)}</nav>}</header>
 <main><section className="hero" id="inicio"><div className="container hero-grid"><div className="hero-copy"><p className="hero-intro">Sua pausa começa aqui</p><h1>Seu momento<br/>merece um<br/>bom café</h1><p className="hero-description">Cafés, lanches e sabores especiais para deixar sua pausa ainda melhor</p><div className="hero-buttons"><a className="button caramel" href="#cardapio">Ver cardápio <ArrowDown size={17}/></a><a className="quiet-link" href="#localizacao">Como chegar <ArrowUpRight size={16}/></a></div></div><figure className="hero-visual"><img src={images.hero} alt="Imagem ilustrativa de uma xícara de café sobre uma mesa" fetchPriority="high" width="1200" height="1400"/><div className="photo-caption"><Coffee size={25} strokeWidth={1}/><span>Um convite para<br/><strong>ficar mais um pouco</strong></span></div></figure></div></section>
 <section id="cardapio" className="section menu-section"><div className="container"><div className="section-heading"><div><p className="section-label">Nosso cardápio</p><h2>O sabor perfeito<br/>para a sua pausa</h2></div></div><div className="menu-toolbar"><label className="search"><Search size={19}/><span className="sr-only">Buscar produto</span><input type="search" placeholder="O que vai acompanhar seu café?" value={query} onChange={e=>setQuery(e.target.value)}/></label></div><div className="categories" aria-label="Filtrar por categoria">{['Todos',...categories].map(c=><button key={c} className={category===c?'active':''} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div>{catalogState==='loading'||catalogState==='error'?<div className="empty" role="status"><p>{catalogState==='loading'?'Carregando cardápio':'Não foi possível atualizar o cardápio'}</p>{catalogState==='error'&&<button className="button outline" onClick={()=>{void refreshCatalog().catch(()=>{});}}>Tentar novamente</button>}</div>:visible.length?<div className="menu-grid">{visible.map(p=><ProductCard compact key={p.id} product={p} onAdd={choose}/>)}</div>:<div className="empty"><Search size={35}/><h3>Nenhum sabor por aqui</h3><p>Tente outro nome ou explore todas as categorias</p><button className="button outline" onClick={()=>{setCategory('Todos');setQuery('');}}>Limpar busca e filtros</button></div>}<div className="menu-footnote"><Coffee size={20}/><p>Monte seu pedido por aqui A disponibilidade e os valores serão confirmados pela cafeteria no atendimento</p></div></div></section>
 <section id="sobre" className="section about-section"><div className="container about-grid"><figure><img src={images.about} alt="Ambiente ilustrativo de uma cafeteria acolhedora, com mesas e luz natural" loading="lazy" width="1000" height="1000"/></figure><div className="about-copy"><p className="section-label">Um pouco sobre nós</p><h2>Mais do que um café,<br/>um momento para você</h2><p>{cafe.about}</p><p>Sua próxima pausa pode ser aqui</p><a className="text-link" href="#localizacao">Venha nos encontrar <ArrowUpRight size={17}/></a><span className="editorial-signature">{cafe.name}</span></div></div></section>
 <section id="localizacao" className="section location-section" aria-labelledby="location-title">
  <div className="container location-grid">
   <div className="location-copy">
    <h2 id="location-title">Seu próximo café está aqui</h2>
    <div className="location-address">
     <strong>{cafe.name}</strong>
     <p>{cafe.address}</p>
     {cafe.location&&<p>{cafe.location}</p>}
     {cafe.reference&&<p className="location-reference">{cafe.reference}</p>}
    </div>
    <div className="location-hours">
     <h3>Horário de funcionamento</h3>
     <p>{cafe.hours}</p>
    </div>
   </div>
   <div className="location-map">
    {cafe.mapsEmbedUrl?<iframe title={`Google Maps: ${cafe.name}`} src={cafe.mapsEmbedUrl} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade"/>:<div className="location-placeholder"><Coffee size={32} strokeWidth={1}/><strong>Localização a configurar</strong><p>O mapa será exibido quando o endereço estiver configurado</p></div>}{cafe.mapsUrl&&<a className="text-link" href={cafe.mapsUrl} target="_blank" rel="noreferrer">Ver rota no Google Maps <ArrowUpRight size={17}/></a>}
   </div>
  </div>
 </section>
 <section className="section faq-section" aria-labelledby="faq-title">
  <div className="container faq-grid">
   <div className="faq-intro">
    <p className="section-label">Antes da sua pausa</p>
    <h2 id="faq-title">Podemos ajudar?</h2>
    <p className="faq-description">Algumas respostas para deixar seu pedido mais simples</p>
    <div className="faq-contact">
     <h3>Não achou sua dúvida?</h3>
     <p>{cafe.whatsapp?'Fale com a cafeteria pelo WhatsApp':'WhatsApp: configuração pendente'}</p>
     <button type="button" className="button whatsapp-button" onClick={openContact}><WhatsAppIcon/>Falar no WhatsApp</button>
    </div>
   </div>
   <div className="faq-list">{faqs.map(([q,a],i)=><details className="faq" key={q} open={faqOpen===i}>
    <summary id={`faq-question-${i}`} aria-expanded={faqOpen===i} aria-controls={`faq-answer-${i}`} onClick={e=>{e.preventDefault();setFaqOpen(current=>current===i?null:i);}}>{q}<span className="faq-toggle" aria-hidden="true"><Plus size={18}/></span></summary>
    <div className="faq-answer" id={`faq-answer-${i}`} role="region" aria-labelledby={`faq-question-${i}`}>{a.split('\n\n').map((paragraph,j)=><p key={j}>{paragraph}</p>)}</div>
   </details>)}</div>
  </div>
 </section></main>
 <footer><div className="container footer-grid"><div><a className="brand" href="#inicio">{cafe.name}<span>Uma pausa com sabor</span></a><p>Café, aconchego e bons momentos<br/>Uma pausa com sabor</p></div><div><h3>Explore</h3>{links.map(([n,h])=><a key={h} href={h}>{n}</a>)}</div><div><h3>Encontre a gente</h3><p>{cafe.address}<br/>{cafe.location}</p><p>{cafe.hours}</p></div><div><h3>Vamos conversar</h3><button className="footer-contact" onClick={openContact}><WhatsAppIcon/> WhatsApp</button>{cafe.instagram?<a href={cafe.instagram} target="_blank" rel="noreferrer">Instagram</a>:<p className="pending">Instagram: configuração pendente</p>}</div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} {cafe.name}</span><span>Protótipo · Imagens e cardápio ilustrativos</span><span>Desenvolvido por <strong>KaioDev</strong></span></div></footer>
 <button className={`floating-whatsapp ${count?'has-cart':''}`} title="Fale conosco" aria-label="Fale conosco pelo WhatsApp" onClick={openContact}><WhatsAppIcon/></button>{count>0&&<button className="mobile-cart" onClick={()=>setCartOpen(true)}><span><ShoppingBag size={19}/>{count} {count===1?'item':'itens'}</span><span>Ver pedido · {money(total(cart.items))}</span></button>}{toast&&<div className="toast" role="status"><ShoppingBag size={18}/>{toast}<button onClick={()=>{setToast('');setCartOpen(true);}}>Ver pedido</button></div>}{custom&&<Customize product={custom} onClose={()=>setCustom(null)} onAdd={add}/ >}{cartOpen&&<Cart cart={cart} onClose={()=>setCartOpen(false)}/ >}{contact&&<Modal title={`Fale com a ${cafe.name}`} onClose={()=>setContact(false)}><div className="modal-body"><p>O contato oficial do WhatsApp ainda não foi informado Assim que estiver configurado, este botão abrirá a conversa com a cafeteria</p><p className="muted">Você pode explorar o cardápio, montar e copiar seu pedido neste protótipo</p><button className="button primary" onClick={()=>{setContact(false);document.getElementById('cardapio')?.scrollIntoView();}}>Explorar cardápio</button></div></Modal>}</>;
}

