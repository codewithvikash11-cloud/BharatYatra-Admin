import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { issueAdminSession, verifyAdminCredentials, verifyAdminSession } from '@bharatyatra/admin-auth';
import { ADMIN_EMAIL, setupAdminCredentials, updateEnvContents } from '../scripts/setup-admin.js';

test('updates only admin auth keys and preserves existing env entries and CRLF',()=>{
  const oldContents='DATABASE_URL=do-not-print-this\r\nADMIN_EMAIL=old@example.com\r\nCUSTOM_FLAG=keep-me\r\n';
  const updated=updateEnvContents(oldContents,{
    ADMIN_EMAIL,
    ADMIN_PASSWORD_HASH:'bcrypt-placeholder',
    ADMIN_SESSION_SECRET:'session-placeholder',
  });

  assert.match(updated,/DATABASE_URL=do-not-print-this\r\n/);
  assert.match(updated,/CUSTOM_FLAG=keep-me\r\n/);
  assert.match(updated,/ADMIN_EMAIL=khadoliyavikash@gmail\.com\r\n/);
  assert.match(updated,/ADMIN_PASSWORD_HASH=bcrypt-placeholder\r\n/);
  assert.match(updated,/ADMIN_SESSION_SECRET=session-placeholder\r\n/);
  assert.equal((updated.match(/\n/g)||[]).length,(oldContents.match(/\n/g)||[]).length+2);
});

test('generates credentials, writes a valid bcrypt hash and session, and prints the password once',async()=>{
  const rootDir=mkdtempSync(path.join(os.tmpdir(),'bharatyatra-admin-setup-'));
  try {
    writeFileSync(path.join(rootDir,'.gitignore'),'.env\n');
    writeFileSync(path.join(rootDir,'.env'),'DATABASE_URL=keep-this-setting\nOTHER_SECRET=keep-this-too\n');
    const output={text:'',write(value){this.text+=value;}};

    await setupAdminCredentials({rootDir,output});

    const lines=output.text.trimEnd().split('\n');
    assert.equal(lines.length,2);
    assert.equal(lines[0],`Admin email: ${ADMIN_EMAIL}`);
    assert.match(lines[1],/^Admin password: [A-Za-z0-9_-]{43}$/);
    const password=lines[1].slice('Admin password: '.length);
    assert.equal((output.text.match(/Admin password:/g)||[]).length,1);
    assert.equal(output.text.includes('ADMIN_PASSWORD_HASH'),false);
    assert.equal(output.text.includes('ADMIN_SESSION_SECRET'),false);

    const contents=readFileSync(path.join(rootDir,'.env'),'utf8');
    assert.match(contents,/^DATABASE_URL=keep-this-setting$/m);
    assert.match(contents,/^OTHER_SECRET=keep-this-too$/m);
    const env=dotenv.parse(contents);
    assert.equal(env.ADMIN_EMAIL,ADMIN_EMAIL);
    assert.equal(await bcrypt.compare(password,env.ADMIN_PASSWORD_HASH),true);
    assert.ok(env.ADMIN_SESSION_SECRET.length>=32);
    const principal=await verifyAdminCredentials(ADMIN_EMAIL,password,env);
    assert.ok(principal);
    const session=issueAdminSession(principal,env);
    assert.ok(verifyAdminSession(session,env));
  } finally {
    rmSync(rootDir,{recursive:true,force:true});
  }
});

test('refuses to write credentials or print a password if .env is not ignored',async()=>{
  const rootDir=mkdtempSync(path.join(os.tmpdir(),'bharatyatra-admin-no-ignore-'));
  try {
    writeFileSync(path.join(rootDir,'.gitignore'),'node_modules/\n');
    writeFileSync(path.join(rootDir,'.env'),'KEEP=unchanged\n');
    const output={text:'',write(value){this.text+=value;}};
    await assert.rejects(setupAdminCredentials({rootDir,output}),/must be gitignored/);
    assert.equal(readFileSync(path.join(rootDir,'.env'),'utf8'),'KEEP=unchanged\n');
    assert.equal(output.text,'');
  } finally {
    rmSync(rootDir,{recursive:true,force:true});
  }
});