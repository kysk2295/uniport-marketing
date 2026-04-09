#!/usr/bin/env node
/**
 * UniPort 카드뉴스 슬라이드 생성기 v2.0
 *
 * content.json 또는 content.md → Pexels 배경 이미지 + 텍스트 오버레이 → 1080×1350 PNG
 *
 * 색상 시스템:
 *   Primary   #0F172A  다크 네이비 (배경)
 *   Secondary #06B6D4  네온 청록 (강조, CTA)
 *   Accent    #EC4899  핑크 (카테고리 소제목)
 *
 * 사용법:
 *   node generate-slides.js <content.json>
 *   node generate-slides.js <content.md>   ← 기존 MD 포맷도 지원
 */

const puppeteer = require('puppeteer-core');
const https = require('https');
const fs = require('fs');
const path = require('path');

const C = {
  bg:      '#0F172A',
  neon:    '#06B6D4',
  pink:    '#EC4899',
  white:   '#FFFFFF',
  dimText: 'rgba(255,255,255,0.65)',
};

const W = 1080;
const H = 1080;

// ── 환경변수 로드 ─────────────────────────────────────────────
function loadEnv() {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
      const [key, ...vals] = line.split('=');
      if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
    });
  }
}

// ── Pexels 이미지 검색 ────────────────────────────────────────
async function searchPexels(query, resultIndex = 0) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  // per_page=15로 충분히 가져온 뒤 resultIndex로 다른 사진 선택
  const perPage = 15;
  const page = Math.floor(resultIndex / perPage) + 1;
  const photoIndex = resultIndex % perPage;

  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(query);
    const options = {
      hostname: 'api.pexels.com',
      path: `/v1/search?query=${encoded}&per_page=${perPage}&page=${page}&orientation=portrait`,
      method: 'GET',
      headers: { Authorization: apiKey },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const photos = json.photos || [];
          resolve(photos[photoIndex]?.src?.large2x || photos[0]?.src?.large2x || null);
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

// 한국어 키워드 → Pexels 영문 검색어 후보 배열 매핑
const KEYWORD_MAP = [
  [/삼성|반도체|hbm|메모리|칩/i,        ['semiconductor chip closeup macro', 'microchip circuit board technology', 'silicon wafer factory cleanroom', 'computer chip manufacturing dark', 'memory chip processor technology']],
  [/코스피|코스닥|주가|주식시장/i,        ['stock market trading screen numbers', 'korea financial district night', 'stock exchange ticker board', 'trading charts monitor dark', 'bull market upward trend chart']],
  [/나스닥|s&p|미국.*증시|월스트리트/i,   ['wall street new york financial', 'nasdaq trading floor screen', 'stock exchange building facade', 'american finance market dark', 'us market bull run']],
  [/etf|인덱스|펀드/i,                   ['index fund portfolio diversified', 'etf stock chart growth', 'investment fund graph', 'portfolio stocks pie chart', 'diversified investment dark']],
  [/환율|달러|원화/i,                     ['currency dollar bills dark', 'foreign exchange forex screen', 'dollar euro exchange rate', 'currency trading chart', 'money exchange international']],
  [/유가|원유|석유|opec/i,                ['oil refinery industrial night', 'crude oil barrel petroleum', 'oil pipeline infrastructure', 'energy sector dark', 'petroleum industry sunset']],
  [/ai|인공지능|chatgpt|llm/i,           ['artificial intelligence neural network', 'data center server rack blue', 'machine learning code screen', 'ai robot technology futuristic', 'deep learning concept dark']],
  [/금리|기준금리|연준|fed/i,             ['federal reserve building washington', 'interest rate bank concept', 'monetary policy finance dark', 'central bank economics', 'bond yield chart']],
  [/인플레|물가|cpi/i,                    ['inflation rising prices economy', 'grocery store price increase', 'cost of living concept', 'economic inflation graph', 'consumer price index']],
  [/전쟁|휴전|지정학|중동|이란/i,         ['world map geopolitics dark', 'peace diplomacy handshake', 'international relations flag', 'conflict resolution concept', 'global politics dark']],
  [/부동산|아파트|집값/i,                 ['real estate apartment skyline', 'housing market building construction', 'city apartment complex aerial', 'property investment urban', 'real estate price chart']],
  [/암호화폐|코인|비트코인|이더리움/i,     ['bitcoin cryptocurrency dark', 'blockchain digital currency', 'crypto trading screen', 'digital coin ethereum', 'cryptocurrency market dark']],
  [/영업이익|실적|매출|어닝/i,            ['corporate earnings report chart', 'business profit growth bar chart', 'quarterly results financial', 'revenue growth upward', 'financial report success']],
  [/금|은|원자재|commodity/i,             ['gold bars precious metal shiny', 'silver commodity investment', 'gold market trading', 'precious metal vault', 'commodity market chart']],
  [/로봇|휴머노이드|자동화/i,             ['humanoid robot future technology', 'industrial robot arm factory', 'automation robotic dark', 'robot artificial intelligence', 'factory automation machine']],
  [/배당|월배당|배당주/i,                 ['passive income dividend concept', 'monthly income cash flow', 'dividend stock growth', 'investment return calendar', 'financial income stream']],
];

// 슬라이드 콘텐츠 기반 동적 Pexels 검색어 + 결과 인덱스
function getPexelsQueryAndPage(slide, slideIndex) {
  // 1. slide에 직접 pexelsQuery 지정된 경우 우선 사용
  if (slide.pexelsQuery) return { query: slide.pexelsQuery, resultIndex: 0 };

  // 2. 슬라이드 텍스트에서 키워드 추출
  const text = [slide.hook, slide.title, slide.tag, slide.body, slide.stat]
    .filter(Boolean).join(' ').toLowerCase();

  for (const [pattern, queries] of KEYWORD_MAP) {
    if (pattern.test(text)) {
      // 같은 토픽 내 슬라이드마다 다른 쿼리 사용
      return { query: queries[slideIndex % queries.length], resultIndex: Math.floor(slideIndex / queries.length) };
    }
  }

  // 3. 타입별 기본값 (fallback)
  const fallback = {
    thumbnail: ['financial market dramatic dark blue', 'stock exchange trading floor night', 'investment growth bull market dark', 'finance concept abstract blue', 'market crash recovery dramatic'],
    intro:     ['economics abstract concept dark', 'global finance network dark blue', 'money flow concept modern', 'financial planning concept', 'investment decision thinking'],
    main:      ['finance data chart dark', 'investment statistics visualization', 'business growth analytics dark', 'financial graph upward', 'market analysis screen'],
    cta:       ['success achievement upward growth', 'young investor smartphone app', 'financial freedom concept', 'investment success celebration', 'mobile trading app young'],
  };
  const arr = fallback[slide.type] || fallback.main;
  return { query: arr[slideIndex % arr.length], resultIndex: 0 };
}

// 이미지 URL을 base64로 변환 (HTML에 인라인 삽입)
async function urlToBase64(url) {
  return new Promise((resolve, reject) => {
    const get = url.startsWith('https') ? https : require('http');
    get.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        urlToBase64(res.headers.location).then(resolve).catch(reject);
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const b64 = Buffer.concat(chunks).toString('base64');
        const mime = res.headers['content-type'] || 'image/jpeg';
        resolve(`data:${mime};base64,${b64}`);
      });
    }).on('error', () => resolve(null));
  });
}

// ── HTML 슬라이드 빌더 ────────────────────────────────────────
function buildHTML(slide, bgDataUrl, slideNum, total) {
  const bg = bgDataUrl
    ? `background-image: url('${bgDataUrl}'); background-size: cover; background-position: center;`
    : `background: ${C.bg};`;

  // 썸네일은 하단 집중 그라디언트, 나머지는 전체 오버레이
  const overlay = bgDataUrl
    ? slide.type === 'thumbnail'
      ? `<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,0.05) 30%,rgba(15,23,42,0.75) 52%,rgba(15,23,42,0.97) 72%,rgba(15,23,42,1) 100%);z-index:1;"></div>`
      : `<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,23,42,0.72) 0%,rgba(15,23,42,0.55) 40%,rgba(15,23,42,0.88) 100%);z-index:1;"></div>`
    : '';

  // 카테고리 소제목 바 (비썸네일용)
  const categoryBar = `
    <div style="display:flex;justify-content:space-between;align-items:center;width:100%;position:relative;z-index:2;">
      <div style="color:${C.pink};font-size:28px;font-weight:600;letter-spacing:0.5px;display:flex;align-items:center;gap:10px;">
        <span style="opacity:0.5">|</span><span>${slide.category || '투자 입문'}</span>
      </div>
      <div style="color:rgba(255,255,255,0.35);font-size:22px;font-weight:500;">${slideNum} / ${total}</div>
    </div>`;

  // 브랜드 ID
  const brandId = `<div style="color:rgba(255,255,255,0.3);font-size:20px;font-weight:400;text-align:right;letter-spacing:0.5px;position:relative;z-index:2;">@UniPort</div>`;

  // 네온 코너 장식 (비썸네일용)
  const neonCorners = `
    <div style="position:absolute;top:20px;right:20px;width:8px;height:8px;border-radius:50%;background:${C.neon};box-shadow:0 0 12px ${C.neon};z-index:3;"></div>
    <div style="position:absolute;top:20px;left:20px;width:8px;height:8px;border-radius:50%;background:${C.pink};box-shadow:0 0 12px ${C.pink};z-index:3;"></div>`;

  let content = '';

  if (slide.type === 'thumbnail') {
    // ── 썸네일: 풀블리드 사진 + 하단 텍스트 ──────────────────
    content = `
      <!-- 상단 우측 브랜드 배지 -->
      <div style="position:absolute;top:44px;right:44px;z-index:10;background:rgba(15,23,42,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.18);border-radius:50px;padding:14px 28px;display:flex;align-items:center;gap:12px;">
        <div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,${C.neon},#0891b2);display:flex;align-items:center;justify-content:center;font-size:17px;">📈</div>
        <span style="color:${C.white};font-size:28px;font-weight:800;letter-spacing:0.5px;">UniPort</span>
      </div>

      <!-- 하단 콘텐츠 영역 -->
      <div style="position:absolute;bottom:0;left:0;right:0;padding:0 60px 60px;z-index:5;display:flex;flex-direction:column;gap:22px;">
        <!-- 카테고리 pill -->
        <div style="display:inline-flex;align-self:flex-start;background:rgba(255,255,255,0.16);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.28);border-radius:10px;padding:11px 24px;">
          <span style="color:${C.white};font-size:28px;font-weight:700;letter-spacing:0.3px;">${slide.category || '투자 입문'}</span>
        </div>

        <!-- 메인 훅 제목 -->
        <div style="color:${C.white};font-size:86px;font-weight:900;line-height:1.12;letter-spacing:-3px;word-break:keep-all;">${(slide.hook || '').replace(/\n/g, '<br>')}</div>

        <!-- 서브훅 (시안 강조) -->
        ${slide.subhook ? `<div style="color:${C.neon};font-size:44px;font-weight:700;line-height:1.3;letter-spacing:-0.5px;">${slide.subhook}</div>` : ''}
      </div>`;

  } else if (slide.type === 'intro') {
    content = `
      ${categoryBar}
      <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:28px;position:relative;z-index:2;">
        <div style="color:${C.white};font-size:76px;font-weight:900;line-height:1.15;letter-spacing:-2.5px;word-break:keep-all;">${slide.title || ''}</div>
        ${slide.body ? `<div style="color:${C.dimText};font-size:38px;font-weight:500;line-height:1.6;word-break:keep-all;">${slide.body}</div>` : ''}
        ${slide.point ? `
          <div style="display:flex;align-items:flex-start;gap:16px;background:rgba(6,182,212,0.1);border:1px solid rgba(6,182,212,0.3);border-radius:18px;padding:24px 30px;">
            <span style="color:${C.neon};font-size:30px;flex-shrink:0;margin-top:2px;">💡</span>
            <span style="color:${C.neon};font-size:34px;font-weight:600;line-height:1.5;">${slide.point}</span>
          </div>` : ''}
        ${brandId}
      </div>`;

  } else if (slide.type === 'main') {
    content = `
      ${categoryBar}
      <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:26px;position:relative;z-index:2;">
        ${slide.tag ? `<div style="display:inline-flex;align-self:flex-start;background:rgba(6,182,212,0.15);border:1px solid rgba(6,182,212,0.5);color:${C.neon};font-size:26px;font-weight:700;padding:8px 22px;border-radius:40px;letter-spacing:0.5px;">${slide.tag}</div>` : ''}
        <div style="color:${C.white};font-size:72px;font-weight:900;line-height:1.15;letter-spacing:-2.5px;word-break:keep-all;">${slide.title || ''}</div>
        ${slide.body ? `<div style="color:${C.dimText};font-size:36px;font-weight:500;line-height:1.65;word-break:keep-all;">${slide.body}</div>` : ''}
        ${slide.stat ? `
          <div style="display:flex;align-items:center;gap:20px;background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.2);border-radius:18px;padding:24px 30px;">
            <span style="color:${C.neon};font-size:68px;font-weight:900;letter-spacing:-2px;">${slide.stat}</span>
            <span style="color:${C.dimText};font-size:32px;font-weight:500;line-height:1.4;">${slide.statLabel || ''}</span>
          </div>` : ''}
        ${brandId}
      </div>`;

  } else if (slide.type === 'cta') {
    const points = (slide.points || []).map((p, i) => `
      <div style="display:flex;align-items:center;gap:20px;">
        <div style="width:44px;height:44px;border-radius:50%;background:rgba(6,182,212,0.2);border:1.5px solid rgba(6,182,212,0.6);display:flex;align-items:center;justify-content:center;color:${C.neon};font-size:22px;font-weight:800;flex-shrink:0;">${i + 1}</div>
        <div style="color:${C.dimText};font-size:36px;font-weight:500;line-height:1.5;">${p}</div>
      </div>`).join('');

    content = `
      ${categoryBar}
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:36px;position:relative;z-index:2;">
        ${slide.subtitle ? `<div style="color:${C.pink};font-size:38px;font-weight:600;">${slide.subtitle}</div>` : ''}
        <div style="color:${C.white};font-size:78px;font-weight:900;line-height:1.15;letter-spacing:-2.5px;word-break:keep-all;">${(slide.title || '').replace(/\n/g, '<br>')}</div>
        ${points ? `<div style="display:flex;flex-direction:column;gap:20px;">${points}</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:16px;position:relative;z-index:2;">
        <div style="background:linear-gradient(135deg,${C.neon},#0891b2);color:${C.white};font-size:40px;font-weight:900;padding:32px 40px;border-radius:20px;text-align:center;box-shadow:0 8px 32px rgba(6,182,212,0.4);">${slide.cta || ''} →</div>
        ${brandId}
      </div>`;
  }

  const isThumbnail = slide.type === 'thumbnail';

  // 썸네일은 패딩 없는 전체 캔버스, 나머지는 flex column
  const bodyLayout = isThumbnail
    ? `position: relative; overflow: hidden;`
    : `display: flex; flex-direction: column; padding: 60px; gap: 0; position: relative; overflow: hidden;`;

  const pseudoElements = isThumbnail ? '' : `
  body::before {
    content: '';
    position: absolute; top: -200px; right: -100px;
    width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%);
    pointer-events: none;
  }
  body::after {
    content: '';
    position: absolute; bottom: -100px; left: -100px;
    width: 400px; height: 400px; border-radius: 50%;
    background: radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%);
    pointer-events: none;
  }`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width: ${W}px; height: ${H}px;
    background: ${C.bg};
    ${bg}
    font-family: 'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
    ${bodyLayout}
  }
  ${pseudoElements}
</style>
</head>
<body>
  ${overlay}
  ${isThumbnail ? '' : neonCorners}
  ${content}
</body>
</html>`;
}

// ── 콘텐츠 파싱 (JSON 또는 MD) ───────────────────────────────
function parseContent(filePath) {
  const ext = path.extname(filePath);

  if (ext === '.json') {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  // 기존 MD 포맷 파싱
  const raw = fs.readFileSync(filePath, 'utf-8');
  const slides = [];
  const slideBlocks = raw.split(/^### 슬라이드/m).slice(1);
  const types = ['thumbnail', 'intro', 'main', 'main', 'main', 'main', 'cta'];

  slideBlocks.forEach((block, i) => {
    const lines = block.trim().split('\n');
    const texts = lines.filter(l => l.startsWith('> ')).map(l =>
      l.replace(/^> \*\*/, '').replace(/\*\*$/, '').replace(/^> /, '').trim()
    );
    const exampleLine = lines.find(l => l.startsWith('예시:'));
    slides.push({
      type: types[i] || 'main',
      category: '투자 입문',
      hook: texts[0] || '',
      title: texts[0] || '',
      body: texts.slice(1).join(' '),
      point: exampleLine ? exampleLine.replace('예시:', '').trim() : null,
    });
  });

  return { slides };
}

// ── 메인 ─────────────────────────────────────────────────────
async function main() {
  loadEnv();

  const inputFile = process.argv[2];
  if (!inputFile) {
    console.error('사용법: node generate-slides.js <content.json|content.md>');
    process.exit(1);
  }

  const absInput = path.resolve(inputFile);
  const slug = path.basename(absInput).replace(/\.(json|md)$/, '');
  const outputDir = path.resolve(__dirname, '../slides', slug);
  fs.mkdirSync(outputDir, { recursive: true });

  const content = parseContent(absInput);
  const slides = content.slides;
  const total = slides.length;

  console.log(`📂 슬라이드 생성 시작: ${slug} (${total}장)`);

  const CHROME_PATHS = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ];
  const executablePath = CHROME_PATHS.find(p => fs.existsSync(p));
  if (!executablePath) throw new Error('Chrome이 설치되어 있지 않습니다.');

  const browser = await puppeteer.launch({ executablePath, args: ['--no-sandbox'] });

  for (const [i, slide] of slides.entries()) {
    const num = String(i + 1).padStart(2, '0');

    // Pexels 배경 이미지
    process.stdout.write(`  🔍 배경 이미지 검색 (${num})... `);
    const { query: pexelsQuery, resultIndex } = getPexelsQueryAndPage(slide, i);
    const pexelsUrl = await searchPexels(pexelsQuery, resultIndex);
    let bgDataUrl = null;
    if (pexelsUrl) {
      bgDataUrl = await urlToBase64(pexelsUrl);
      process.stdout.write('✅ ');
    } else {
      process.stdout.write('⚠️ (없음) ');
    }

    // HTML 렌더링
    const html = buildHTML(slide, bgDataUrl, i + 1, total);
    const htmlPath = path.join(outputDir, `slide-${num}.html`);
    const pngPath  = path.join(outputDir, `slide-${num}.png`);

    fs.writeFileSync(htmlPath, html);

    const jpgPath = path.join(outputDir, `slide-${num}.jpg`);

    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: jpgPath, type: 'jpeg', quality: 92 });
    await page.close();

    console.log(`slide-${num}.jpg ✅`);
  }

  await browser.close();
  console.log(`\n🎉 완료! 저장 위치: ${outputDir}`);
}

main().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
