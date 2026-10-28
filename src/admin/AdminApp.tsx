import {useCallback,useEffect,useState} from 'react';
import {useAdminAuth,type Role} from './hooks/useAdminAuth';
import {Login,Mfa,Account} from './pages/Auth';
import {Products,Categories} from './pages/Menu';
import {Audit} from './pages/Audit';
import {listMenu} from './services/menu';
import './admin.css';
const links=[['Visão geral','/admin'],['Produtos','/admin/produtos'],['Categorias','/admin/categorias'],['Atividades','/admin/atividades'],['Minha conta','/admin/conta']];
export default function AdminApp(){
 const auth=useAdminAuth();const[path,setPath]=useState(window.location.pathname.replace(/\/$/,'')||'/admin');
 const navigate=useCallback((next:string)=>{window.history.pushState({},'',next);setPath(next)},[]);
 useEffect(()=>{const pop=()=>setPath(window.location.pathname.replace(/\/$/,'')||'/admin');window.addEventListener('popstate',pop);return()=>window.removeEventListener('popstate',pop)},[]);
 useEffect(()=>{if(auth.stage==='login'&&path!=='/admin/login')navigate('/admin/login');if(auth.stage==='ready'&&path==='/admin/login')navigate('/admin')},[auth.stage,path,navigate]);
 if(auth.stage!=='ready')return <main className="admin-root admin-gate">{auth.stage==='loading'?<p role="status">Validando acesso…</p>:auth.stage==='login'?<Login onLogin={auth.refresh}/>:auth.stage==='mfa'?<><Mfa onVerified={auth.refresh}/><button className="admin-text-button" onClick={()=>void auth.logout()}>Sair</button></>:<section className="admin-auth"><h1>Administração indisponível</h1><p>{auth.message??'A integração segura com o Supabase ainda não foi configurada. Nenhuma operação administrativa está liberada'}</p><button onClick={()=>void auth.refresh()}>Tentar novamente</button>{auth.stage==='denied'&&<button className="admin-secondary" onClick={()=>void auth.logout()}>Sair</button>}</section>}</main>;
 return <div className="admin-root admin-shell"><aside><a className="admin-brand" href="/admin" onClick={e=>{e.preventDefault();navigate('/admin')}}>Cafeteria<span>Administração</span></a><nav aria-label="Navegação administrativa">{links.filter(([,url])=>auth.role==='owner'||!['/admin/categorias','/admin/atividades'].includes(url)).map(([label,url])=><a aria-current={path===url?'page':undefined} href={url} key={url} onClick={e=>{e.preventDefault();navigate(url)}}>{label}</a>)}</nav><button className="admin-secondary" onClick={()=>void auth.logout()}>Sair da conta</button></aside><div className="admin-workspace"><header><h1>Gestão do cardápio</h1><span>{auth.role==='owner'?'Proprietário':'Funcionário autorizado'}</span></header><main><AdminContent key={auth.user?.id} path={path} role={auth.role!} email={auth.user?.email} navigate={navigate}/></main></div></div>;
}
function AdminContent({path,role,email,navigate}:{path:string;role:Role;email?:string;navigate:(path:string)=>void}){
 const[data,setData]=useState<Awaited<ReturnType<typeof listMenu>>|null>(null),[error,setError]=useState('');
 const reload=useCallback(async()=>{try{const next=await listMenu();setData(next);setError('')}catch{setData(null);setError('Não foi possível carregar dados administrativos. Verifique sua sessão e conexão');throw new Error('Não foi possível confirmar os dados atuais')}},[]);
 useEffect(()=>{let live=true;void listMenu().then(next=>{if(live)setData(next)}).catch(()=>{if(live)setError('Não foi possível carregar dados administrativos')});return()=>{live=false}},[]);
 if(path==='/admin/conta')return <Account email={email} owner={role==='owner'}/>;
 if(role==='owner'&&path==='/admin/atividades')return <Audit/>;
 if(error)return <section><p role="alert">{error}</p><button onClick={()=>void reload().catch(()=>{})}>Tentar novamente</button></section>;
 if(!data)return <p role="status">Carregando cardápio…</p>;
 if(path==='/admin/produtos')return <Products {...data} owner={role==='owner'} reload={reload}/>;
 if(path==='/admin/categorias'&&role==='owner')return <Categories {...data} reload={reload}/>;
 if(path!=='/admin')return <p role="alert">Área não autorizada ou não encontrada</p>;
 const unavailable=data.products.filter(p=>!p.is_available);
 return <section><h2>Visão geral</h2><div className="admin-metrics"><article><span>Total de produtos</span><strong>{data.products.length}</strong></article><article><span>Disponíveis</span><strong>{data.products.length-unavailable.length}</strong></article><article><span>Indisponíveis</span><strong>{unavailable.length}</strong></article></div><button onClick={()=>navigate('/admin/produtos')}>Gerenciar produtos</button><section className="admin-panel"><h3>Produtos indisponíveis</h3>{unavailable.length?<ul>{unavailable.map(p=><li key={p.id}>{p.name}</li>)}</ul>:<p>Nenhum produto indisponível</p>}</section></section>;
}
