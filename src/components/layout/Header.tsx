import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { categoryOrder, toolsByCategory, type ToolCategory } from '../../tools';
import { BrandMark } from '../ui/BrandMark';

const VCNOTE_URL = 'https://vcnote.com';

function ExternalArrow() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3 11L11 3M11 3H5M11 3V9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function itemClass({ isActive }: { isActive: boolean }): string {
  return [
    'block rounded-lg px-3 py-2 text-sm transition',
    isActive
      ? 'bg-brand-50 text-brand-700 font-semibold'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ');
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openCat, setOpenCat] = useState<ToolCategory | null>(null);
  const { pathname } = useLocation();

  const close = () => {
    setMobileOpen(false);
    setOpenCat(null);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2" onClick={close}>
          <BrandMark size={28} className="text-brand-600" />
          <span className="text-lg font-bold tracking-tight text-slate-900">지분노트</span>
        </Link>

        {/* 데스크톱: 카테고리 드롭다운 */}
        <nav className="hidden items-center gap-1 md:flex">
          {categoryOrder.map((cat) => {
            const items = toolsByCategory(cat);
            if (items.length === 0) return null;
            const active = items.some((t) => t.path === pathname);
            const isOpen = openCat === cat;
            return (
              <div key={cat} className="relative">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenCat(isOpen ? null : cat)}
                  className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active || isOpen
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {cat}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="absolute right-0 z-40 mt-1 w-72 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                    {items.map((t) => (
                      <NavLink key={t.path} to={t.path} className={itemClass} onClick={close}>
                        <span className="font-medium text-slate-800">{t.title}</span>
                        <span className="mt-0.5 block text-xs font-normal text-slate-400">
                          {t.desc}
                        </span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <NavLink
            to="/laws"
            onClick={close}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            법령
          </NavLink>
          <NavLink
            to="/faq"
            onClick={close}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            FAQ
          </NavLink>
          <NavLink
            to="/about"
            onClick={close}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            소개
          </NavLink>
          <a
            href={VCNOTE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            심사노트
            <ExternalArrow />
          </a>
        </nav>

        <button
          type="button"
          aria-label="메뉴 열기"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            {mobileOpen ? (
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            ) : (
              <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* 데스크톱 드롭다운 바깥 클릭 닫기 */}
      {openCat && <div className="fixed inset-0 z-30 hidden md:block" onClick={close} aria-hidden="true" />}

      {/* 모바일: 카테고리별 그룹 */}
      {mobileOpen && (
        <nav className="border-t border-slate-100 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3">
            {categoryOrder.map((cat) => {
              const items = toolsByCategory(cat);
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <div className="px-1 pb-1 text-xs font-semibold tracking-wide text-slate-400">
                    {cat}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {items.map((t) => (
                      <NavLink key={t.path} to={t.path} className={itemClass} onClick={close}>
                        {t.title}
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            })}
            <div>
              <NavLink to="/laws" className={itemClass} onClick={close}>
                법령
              </NavLink>
              <NavLink to="/faq" className={itemClass} onClick={close}>
                FAQ
              </NavLink>
              <NavLink to="/about" className={itemClass} onClick={close}>
                소개
              </NavLink>
              <a
                href={VCNOTE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                심사노트
                <ExternalArrow />
              </a>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
