'use client';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function MobileNav() {
  const [showMore, setShowMore] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Content', action: () => { setShowContent(!showContent); setShowMore(false); }, icon: '📝' },
    { label: 'Media', href: '/media', icon: '🖼️' },
    { label: 'Appearance', href: '/appearance', icon: '🎨' },
    { label: 'More', action: () => { setShowMore(!showMore); setShowContent(false); }, icon: '☰' },
  ];

  const contentMenu = [
    { label: 'Articles', href: '/articles' },
    { label: 'Destinations', href: '/content/destinations' },
    { label: 'Attractions', href: '/content/attractions' },
    { label: 'Itineraries', href: '/content/itineraries' },
    { label: 'States', href: '/content/states' },
    { label: 'Districts', href: '/content/districts' },
    { label: 'Local Areas', href: '/content/tehsils' },
  ];

  const moreMenu = [
    { label: 'Audit History', href: '/audit' }
  ];

  return (
    <>
      <div className="mobile-bottom-nav">
        {navItems.map(item => (
          item.href ? (
            <Link key={item.label} href={item.href} className={`mob-nav-item ${pathname === item.href ? 'active' : ''}`} onClick={() => { setShowContent(false); setShowMore(false); }}>
              <span className="mob-icon">{item.icon}</span>
              <span className="mob-label">{item.label}</span>
            </Link>
          ) : (
            <button key={item.label} className="mob-nav-item" onClick={item.action}>
               <span className="mob-icon">{item.icon}</span>
               <span className="mob-label">{item.label}</span>
            </button>
          )
        ))}
      </div>
      
      {showContent && (
        <div className="mobile-popup-menu">
           <div className="menu-header"><h3>Content</h3><button onClick={() => setShowContent(false)}>✕</button></div>
           <div className="menu-grid">
             {contentMenu.map(c => (
               <Link key={c.label} href={c.href} onClick={() => setShowContent(false)}>{c.label}</Link>
             ))}
           </div>
        </div>
      )}
      
      {showMore && (
        <div className="mobile-popup-menu">
           <div className="menu-header"><h3>More Options</h3><button onClick={() => setShowMore(false)}>✕</button></div>
           <div className="menu-grid">
             {moreMenu.map(c => (
               c.isForm ? (
                 <form key={c.label} action={c.href} method="post"><button type="submit" className="signout-btn">{c.label}</button></form>
               ) : (
                 <Link key={c.label} href={c.href} onClick={() => setShowMore(false)}>{c.label}</Link>
               )
             ))}
           </div>
        </div>
      )}
      
      {(showContent || showMore) && <div className="mobile-backdrop" onClick={() => { setShowContent(false); setShowMore(false); }}></div>}
    </>
  );
}
