import { notFound } from 'next/navigation';
import ContentManager from '../../../../components/content-manager.js';
import { getAdminSession } from '../../../../lib/admin-session.js';

export const metadata={title:'Content · BharatYatra Studio'};
export default async function ContentPage({params}){
 const {type}=await params;if(!['destinations','attractions','articles','states','districts','tehsils'].includes(type))notFound();
 const session=await getAdminSession();if(!session)notFound();
 return <section className="page-content"><div className="page-heading"><div><p className="eyebrow">CONTENT LIBRARY</p><h1>{type[0].toUpperCase()+type.slice(1)}</h1><p className="lead">Search, edit and move content through editorial review.</p></div></div><ContentManager type={type} role={session.role}/></section>;
}
