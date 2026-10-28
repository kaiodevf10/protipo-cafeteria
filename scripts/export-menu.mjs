// Generate a reviewable one-time import, never connect or overwrite remote data.
import ts from 'typescript';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
await mkdir('.verification/menu-import',{recursive:true});
for(const name of ['config','products']){
 const source=await readFile(`src/data/${name}.ts`,'utf8');
 const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace("from './config'","from './config.js'");
 await writeFile(`.verification/menu-import/${name}.js`,output);
}
const {products,categories}=await import('../.verification/menu-import/products.js');
const literal=value=>"'"+String(value).replace(/'/g,"''")+"'";
const slug=name=>name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const cents=value=>{const result=Math.round(value*100);if(!Number.isSafeInteger(result)||result<0)throw new Error('Preço inválido');return result};
let sql='-- IMPORTAÇÃO MANUAL: revise antes de executar em ambiente autorizado\n-- Não substitui registros existentes, não provisiona contas e não deve ser aplicada como migration automática\nbegin;\n';
for(const [i,name] of categories.entries())sql+=`insert into public.categories(id,name,slug,display_order) values(${literal('cat-'+slug(name))},${literal(name)},${literal(slug(name))},${i}) on conflict do nothing;\n`;
for(const [i,p] of products.entries()){
 const options=(p.options??[]).map(g=>({...g,choices:g.choices.map(({price,...c})=>({...c,price_cents:cents(price)}))}));
 sql+=`insert into public.products(id,name,description,category_id,price_cents,image_path,is_available,is_published,display_order,customization_options) values(${[p.id,p.name,p.description,'cat-'+slug(p.category)].map(literal).join(',')},${cents(p.price)},${literal(p.image)},${p.available},true,${i},${literal(JSON.stringify(options))}::jsonb) on conflict(id) do nothing;\n`;
}
await writeFile('supabase/seed-menu.sql',sql+'commit;\n');console.log(`Importação gerada para revisão: ${products.length} produtos, ${categories.length} categorias`);
