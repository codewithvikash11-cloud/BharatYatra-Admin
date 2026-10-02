import AuditLog from '../../../components/audit-log.js';
import { notFound } from 'next/navigation';
import { getAdminSession } from '../../../lib/admin-session.js';

export const metadata={title:'Audit history · BharatYatra Studio'};
export default async function AuditPage(){const session=await getAdminSession();if(session?.role!=='admin')notFound();return <section className="page-content"><div className="page-heading"><div><p className="eyebrow">ACCOUNTABILITY</p><h1>Audit history</h1><p className="lead">A record of content changes and publication decisions.</p></div></div><AuditLog/></section>;}
