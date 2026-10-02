import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminSession } from '../../lib/admin-session.js';

export const dynamic='force-dynamic';
export const revalidate=0;
export default async function StudioLayout({children}){
  const session=await getAdminSession();
  if(!session)redirect('/');
  return <div className="studio"><aside className="sidebar"><Link className="brand" href="/dashboard"><img src="/logo-compact.svg" width="40" height="40" alt="" aria-hidden="true"/><span>BharatYatra<small>CONTENT STUDIO</small></span></Link><nav aria-label="Admin navigation">
    <Link href="/dashboard">Overview</Link><Link href="/content/states">States</Link><Link href="/content/districts">Districts</Link><Link href="/content/tehsils">Tehsils</Link><Link href="/content/destinations">Destinations</Link><Link href="/content/attractions">Attractions</Link><Link href="/content/articles">Articles</Link><Link href="/media">Media library</Link><Link href="/appearance">Appearance</Link><Link href="/audit">Audit history</Link>
  </nav><div className="sidebar-bottom"><span className="role-pill">{session.role}</span><form action="/api/auth/logout" method="post"><button className="signout">Sign out</button></form></div></aside>
  <main className="studio-main"><header className="topbar"><span>Content operations</span><span className="user-chip">{session.email}</span></header>{children}</main></div>;
}
