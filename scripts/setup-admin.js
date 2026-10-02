import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { stdout } from 'node:process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  hashAdminPassword,
  issueAdminSession,
  verifyAdminCredentials,
  verifyAdminSession,
} from '@bharatyatra/admin-auth';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
export const ADMIN_EMAIL='khadoliyavikash@gmail.com';
const AUTH_KEYS=['ADMIN_EMAIL','ADMIN_PASSWORD_HASH','ADMIN_SESSION_SECRET'];

export function updateEnvContents(contents,values) {
  const newline=contents.includes('\r\n')?'\r\n':'\n';
  const lines=contents.split(/\r\n|\n|\r/);
  const hadTrailingNewline=/(?:\r\n|\n|\r)$/.test(contents);
  if(hadTrailingNewline)lines.pop();
  const seen=new Set();
  const updated=lines.map((line)=>{
    const match=/^[\t ]*(?:export[\t ]+)?([A-Za-z_][A-Za-z0-9_]*)[\t ]*=/.exec(line);
    if(!match||!AUTH_KEYS.includes(match[1]))return line;
    seen.add(match[1]);
    return `${match[1]}=${values[match[1]]}`;
  });
  for(const key of AUTH_KEYS){
    if(!seen.has(key))updated.push(`${key}=${values[key]}`);
  }
  return `${updated.join(newline)}${hadTrailingNewline?newline:''}`;
}

function isEnvIgnored(rootDir) {
  const ignorePath=path.join(rootDir,'.gitignore');
  if(!existsSync(ignorePath))return false;
  const ignore=readFileSync(ignorePath,'utf8');
  return ignore.split(/\r\n|\n|\r/).some((line)=>/^\s*\.env\s*(?:#.*)?$/.test(line));
}

export async function setupAdminCredentials({rootDir=root,output=stdout}={}) {
  if(!isEnvIgnored(rootDir))throw new Error('Root .env must be gitignored before admin credentials can be written.');

  const envPath=path.join(rootDir,'.env');
  const previousContents=existsSync(envPath)?readFileSync(envPath,'utf8'):'';
  const password=randomBytes(32).toString('base64url');
  const passwordHash=await hashAdminPassword(password);
  const sessionSecret=randomBytes(48).toString('base64url');
  const env={ADMIN_EMAIL:ADMIN_EMAIL,ADMIN_PASSWORD_HASH:passwordHash,ADMIN_SESSION_SECRET:sessionSecret};
  const principal=await verifyAdminCredentials(ADMIN_EMAIL,password,env);
  if(!principal)throw new Error('Generated administrator credential verification failed.');
  const session=issueAdminSession(principal,env);
  if(!verifyAdminSession(session,env))throw new Error('Generated admin session verification failed.');

  const nextContents=updateEnvContents(previousContents,env);
  const tempPath=path.join(rootDir,`.env.${process.pid}.${randomBytes(8).toString('hex')}.tmp`);
  try {
    writeFileSync(tempPath,nextContents,{encoding:'utf8',flag:'wx',mode:0o600});
    renameSync(tempPath,envPath);
  } catch(error) {
    try { unlinkSync(tempPath); } catch {}
    throw error;
  }

  output.write(`Admin email: ${ADMIN_EMAIL}\nAdmin password: ${password}\n`);
}

if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
  setupAdminCredentials().catch((error)=>{
    stdout.write(`Admin credential setup failed: ${error.message}\n`);
    process.exitCode=1;
  });
}