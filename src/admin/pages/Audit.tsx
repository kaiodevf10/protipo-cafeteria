import {useEffect,useState} from 'react';
import {listAudit} from '../services/menu';
export function Audit(){
 const[rows,setRows]=useState<Awaited<ReturnType<typeof listAudit>>>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{let live=true;void listAudit().then(data=>{if(live)setRows(data)}).catch(()=>{if(live)setError('Não foi possível consultar o histórico')}).finally(()=>{if(live)setLoading(false)});return()=>{live=false}},[]);
 return <section><h2>Atividades</h2><p>Até 200 registros recentes. Horários no fuso deste dispositivo</p><p role="status">{loading?'Carregando histórico…':error}</p>{rows.map(row=><article className="admin-panel" key={row.id}><h3>{row.action} · {row.entity_type}</h3><p>Registro: {row.entity_id}</p><p>Responsável: {row.actor_user_id??'Operação privilegiada de manutenção'}</p><time dateTime={row.created_at}>{new Date(row.created_at).toLocaleString('pt-BR')}</time><details><summary>Ver alterações</summary><pre>{JSON.stringify({antes:row.previous_values,depois:row.new_values},null,2)}</pre></details></article>)}</section>;
}
