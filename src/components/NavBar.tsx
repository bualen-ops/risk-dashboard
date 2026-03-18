'use client';

import Link from 'next/link';
import { useState, useCallback, useEffect } from 'react';
import {
  LayoutList,
  TrendingUp,
  Map,
  LineChart,
  Sparkles,
  MessageSquare,
  LogOut,
  Shield,
} from 'lucide-react';

const navLinks = [
  { href: '/risks', label: 'Реестр', Icon: LayoutList },
  { href: '/key-risks', label: 'Ключевые риски', Icon: TrendingUp },
  { href: '/map', label: 'Карта', Icon: Map },
  { href: '/dynamics', label: 'Динамика', Icon: LineChart },
  { href: '/ai', label: 'AI-анализ', Icon: Sparkles },
  { href: '/requests', label: 'Запросы', Icon: MessageSquare },
  { href: '/logout', label: 'Выйти', border: true, Icon: LogOut },
];

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [menuOpen]);

  return (
    <>
      <header className="periscope-nav sticky top-0 z-50 shadow-md safe-area-padding">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold text-white hover:text-white/95"
            onClick={closeMenu}
          >
            <Shield className="h-6 w-6 flex-shrink-0" aria-hidden />
            <span className="hidden sm:inline">РИСКИ в КАРМАНЕ</span>
            <span className="sm:hidden">Риски в кармане</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden flex-wrap items-center gap-1 md:flex">
            {navLinks.map(({ href, label, border, Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white ${
                  border ? 'ml-2 border border-white/30' : ''
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" aria-hidden />
                {label}
              </Link>
            ))}
          </nav>

          {/* Mobile: hamburger */}
          <button
            type="button"
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/10 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile overlay menu */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 md:hidden ${
          menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!menuOpen}
        onClick={closeMenu}
      >
        <nav
          className={`absolute right-0 top-0 flex h-full w-full max-w-[280px] flex-col gap-1 bg-[var(--periscope-primary)] p-4 shadow-xl transition-transform duration-200 ease-out ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{
            paddingTop: 'calc(56px + max(0.75rem, env(safe-area-inset-top)))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {navLinks.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-[48px] items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-white/95 transition hover:bg-white/10 active:bg-white/15"
              onClick={closeMenu}
            >
              <Icon className="h-5 w-5 flex-shrink-0 opacity-90" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
