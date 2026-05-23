import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import seo from '../seo.routes.json';

type RouteMeta = { path: string; title: string; description: string };

const routes = seo.routes as RouteMeta[];
const home = routes.find((r) => r.path === '/')!;

/** 경로별 canonical/og URL (홈 외에는 끝 슬래시 — GitHub Pages 폴더 서빙과 일치) */
function canonicalFor(path: string): string {
  return path === '/' ? `${seo.siteUrl}/` : `${seo.siteUrl}${path}/`;
}

function upsertMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * 라우트 변경 시 document.title·메타·canonical을 갱신한다.
 * 정적 프리렌더(scripts/prerender.mjs)가 초기 HTML에 동일 값을 심고,
 * 이 컴포넌트는 SPA 내비게이션 시 클라이언트에서 동기화한다.
 */
export function Seo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const normalized = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    const meta = routes.find((r) => r.path === normalized) ?? home;
    const url = canonicalFor(meta.path);

    document.title = meta.title;
    upsertMeta('meta[name="description"]', 'name', 'description', meta.description);
    upsertCanonical(url);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', meta.title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', meta.description);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', url);
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', meta.title);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', meta.description);
  }, [pathname]);

  return null;
}
