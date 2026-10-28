// Run on an authorized development machine with registry access and Node >=22.
import {spawnSync} from 'node:child_process';
if(Number(process.versions.node.split('.')[0])<22)throw new Error('Use Node.js 22 ou superior para o SDK atual');
const result=spawnSync(process.platform==='win32'?'npm.cmd':'npm',['install','--save-exact','@supabase/supabase-js@2.118.0','--ignore-scripts'],{stdio:'inherit',shell:process.platform==='win32'});
process.exitCode=result.status??1;
