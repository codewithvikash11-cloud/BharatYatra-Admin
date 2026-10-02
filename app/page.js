'use client';
import { useActionState } from 'react';
import { signInAction } from './actions.js';

export default function SignInPage(){
  const [state,action,pending]=useActionState(signInAction,null);
  return <main className="login-wrap"><section className="login-card">
    <p className="eyebrow">BHARATYATRA · CONTENT STUDIO</p><h1>Good work<br/><em>travels far.</em></h1>
    <p className="lead">Sign in with your invited staff account to manage destination guides and stories.</p>
    <form action={action} className="form-stack">
      <label>Work email<input name="email" type="email" autoComplete="username" required maxLength={254}/></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={256}/></label>
      {state?.error&&<p className="error" role="alert">{state.error}</p>}
      <button className="button primary" disabled={pending}>{pending?'Signing in…':'Sign in securely'}</button>
    </form>
    <p className="hint">Staff access is invitation-only. Contact your BharatYatra administrator if you need an account.</p>
  </section></main>;
}
