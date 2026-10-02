import Link from 'next/link';
import { adminApiFetch } from '../../../lib/api.js';

export const metadata={title:'Overview · BharatYatra Studio'};
const types=['destinations','attractions','articles'];
async function loadOverview(){
  try{const response=await adminApiFetch('overview');if(response.ok)return (await response.json()).data;}catch{}
  return null;
}
export default async function Dashboard(){
  const overview=await loadOverview();
  return <section className="page-content"><div className="page-heading"><div><p className="eyebrow">YOUR EDITORIAL DESK</p><h1>Overview</h1><p className="lead">A clear view of what is being prepared for travellers.</p></div></div>
    {!overview&&<div className="notice" role="status">Dashboard counts are unavailable. Sign in through the studio and confirm the API connection.</div>}
    <div className="stat-grid">{types.map((type)=><article className="stat-card" key={type}><span className="stat-label">{type}</span><strong>{overview?Object.values(overview[type]||{}).reduce((a,b)=>a+b,0):'—'}</strong><div className="stat-breakdown">{['DRAFT','REVIEW','PUBLISHED','ARCHIVED'].map(status=><span key={status}>{status.toLowerCase()} <b>{overview?.[type]?.[status]??'—'}</b></span>)}</div><Link href={`/content/${type}`}>Manage {type} →</Link></article>)}</div>
    <div className="workflow-note"><span className="workflow-icon">✦</span><div><h2>One source, two experiences</h2><p>Publish reviewed content once and it becomes available to the public website and shared API.</p></div></div>
  </section>;
}
