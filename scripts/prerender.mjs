/**
 * 빌드 후 정적 프리렌더 (vite build 다음 실행)
 *
 * dist/index.html 을 템플릿으로, seo.routes.json 의 각 경로에 대해
 *  - 경로별 <title>·description·og·canonical 주입
 *  - SoftwareApplication/WebSite JSON-LD 주입
 *  - #root 안에 비-JS 크롤러용 콘텐츠(h1·설명·내부링크) 주입
 * 하여 dist/<path>/index.html 로 출력한다.
 * 추가로 sitemap.xml 과 404.html(SPA 폴백)을 생성한다.
 *
 * 목적: HashRouter 제거 후 각 계산기를 검색엔진이 개별 페이지로 색인하게 만든다.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');
const seo = JSON.parse(readFileSync(join(root, 'src/seo.routes.json'), 'utf8'));
const template = readFileSync(join(distDir, 'index.html'), 'utf8');

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const canonicalFor = (path) => (path === '/' ? `${seo.siteUrl}/` : `${seo.siteUrl}${path}/`);

function replaceTag(html, regex, replacement) {
  if (!regex.test(html)) return html;
  return html.replace(regex, replacement);
}

function jsonLd(route) {
  const url = canonicalFor(route.path);
  const blocks = [];
  if (route.path === '/') {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: seo.siteName,
      url: `${seo.siteUrl}/`,
      description: route.description,
      inLanguage: 'ko-KR',
    });
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: seo.siteName,
      url: `${seo.siteUrl}/`,
      logo: seo.defaultImage,
    });
  } else {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: route.title.replace(/\s*\|\s*지분노트\s*$/, ''),
      url,
      description: route.description,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      inLanguage: 'ko-KR',
      isPartOf: { '@type': 'WebSite', name: seo.siteName, url: `${seo.siteUrl}/` },
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
    });
  }
  return blocks
    .map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`)
    .join('\n    ');
}

/** 비-JS 크롤러가 읽을 콘텐츠 (#root 안 — JS 로드 시 React가 대체) */
function fallbackContent(route) {
  const links = seo.routes
    .filter((r) => r.path !== route.path)
    .map((r) => `<li><a href="${canonicalFor(r.path)}">${esc(r.title.replace(/\s*\|\s*지분노트\s*$/, ''))}</a></li>`)
    .join('');
  return (
    `<div id="seo-fallback">` +
    `<h1>${esc(route.title.replace(/\s*\|\s*지분노트\s*$/, ''))}</h1>` +
    `<p>${esc(route.description)}</p>` +
    `<nav aria-label="계산기 목록"><ul>${links}</ul></nav>` +
    `</div>`
  );
}

function buildPage(route) {
  const url = canonicalFor(route.path);
  const title = esc(route.title);
  const desc = esc(route.description);
  let html = template;
  html = replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  html = replaceTag(
    html,
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${desc}" />`,
  );
  html = replaceTag(html, /<link rel="canonical"[\s\S]*?\/>/, `<link rel="canonical" href="${url}" />`);
  html = replaceTag(html, /<meta property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${title}" />`);
  html = replaceTag(
    html,
    /<meta\s+property="og:description"[\s\S]*?\/>/,
    `<meta property="og:description" content="${desc}" />`,
  );
  html = replaceTag(html, /<meta property="og:url"[\s\S]*?\/>/, `<meta property="og:url" content="${url}" />`);
  html = replaceTag(html, /<meta name="twitter:title"[\s\S]*?\/>/, `<meta name="twitter:title" content="${title}" />`);
  html = replaceTag(
    html,
    /<meta\s+name="twitter:description"[\s\S]*?\/>/,
    `<meta name="twitter:description" content="${desc}" />`,
  );
  // JSON-LD 주입 (</head> 직전)
  html = html.replace('</head>', `  ${jsonLd(route)}\n  </head>`);
  // 비-JS 폴백 콘텐츠 주입 (#root 안)
  html = html.replace('<div id="root"></div>', `<div id="root">${fallbackContent(route)}</div>`);
  return html;
}

let count = 0;
for (const route of seo.routes) {
  const html = buildPage(route);
  const outPath =
    route.path === '/' ? join(distDir, 'index.html') : join(distDir, route.path.slice(1), 'index.html');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, 'utf8');
  count++;
}

// sitemap.xml
const today = new Date().toISOString().slice(0, 10);
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  seo.routes
    .map(
      (r) =>
        `  <url><loc>${canonicalFor(r.path)}</loc><lastmod>${today}</lastmod>` +
        `<priority>${r.path === '/' ? '1.0' : '0.8'}</priority></url>`,
    )
    .join('\n') +
  `\n</urlset>\n`;
writeFileSync(join(distDir, 'sitemap.xml'), sitemap, 'utf8');

// 404.html — 미지정 경로용 SPA 폴백 (홈 셸 재사용)
writeFileSync(join(distDir, '404.html'), readFileSync(join(distDir, 'index.html'), 'utf8'), 'utf8');

console.log(`prerender: ${count} pages + sitemap.xml + 404.html`);
