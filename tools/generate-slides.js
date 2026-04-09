#!/usr/bin/env node
/**
 * UniPort 인스타그램 카드뉴스 슬라이드 생성기
 * - 슬라이드 HTML 렌더링 → 1080×1080 PNG 자동 캡처
 *
 * 사용법:
 *   node generate-slides.js <content-file.md>
 *   node generate-slides.js ../content/insta-card-taco-trade.md
 *
 * 출력: marketing/slides/{slug}/ 폴더에 slide-01.png ~ slide-07.png
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// ── 브랜드 컬러 ──────────────────────────────────────────────
const BRAND = {
  primary: '#4F46E5',      // 유니포트 메인 퍼플
  secondary: '#7C3AED',    // 딥 퍼플
  accent: '#10B981',       // 민트 그린
  dark: '#0F172A',         // 슬라이드 1~5 배경
  light: '#F8FAFC',        // 텍스트 (다크 배경 위)
  card: '#1E293B',         // 카드 배경
};

// ── 슬라이드 데이터 파서 ──────────────────────────────────────
function parseMarkdown(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const slides = [];
  const slideBlocks = raw.split(/^### 슬라이드/m).slice(1);

  slideBlocks.forEach((block, i) => {
    const lines = block.trim().split('\n');
    const titleLine = lines[0]; // e.g. " 1 (훅)"
    const number = i + 1;

    // blockquote 텍스트 추출
    const texts = lines
      .filter(l => l.startsWith('> '))
      .map(l => l.replace(/^> \*\*/, '').replace(/\*\*$/, '').replace(/^> /, '').trim());

    // 예시 추출
    const exampleLine = lines.find(l => l.startsWith('예시:'));
    const example = exampleLine ? exampleLine.replace('예시:', '').trim() : null;

    // 배경 메모 추출
    const bgLine = lines.find(l => l.startsWith('- 배경:'));
    const bg = bgLine ? bgLine.replace('- 배경:', '').trim() : null;

    slides.push({ number, title: titleLine.trim(), texts, example, bg });
  });

  return slides;
}

// ── 슬라이드 HTML 생성 ───────────────────────────────────────
function buildSlideHTML(slide, totalSlides) {
  const isLast = slide.number === totalSlides;
  const isBrand = slide.number >= totalSlides - 1; // 마지막 2장은 브랜드 컬러
  const bg = isBrand ? BRAND.primary : BRAND.dark;
  const cardBg = isBrand ? BRAND.secondary : BRAND.card;

  const mainText = slide.texts.join('<br><br>');
  const exampleHTML = slide.example
    ? `<div class="example">💡 ${slide.example}</div>`
    : '';

  const slideNum = `${slide.number} / ${totalSlides}`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px;
    height: 1080px;
    background: ${bg};
    font-family: 'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .slide {
    width: 920px;
    display: flex;
    flex-direction: column;
    gap: 40px;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .logo {
    background: ${BRAND.accent};
    color: white;
    font-size: 22px;
    font-weight: 800;
    padding: 8px 18px;
    border-radius: 30px;
    letter-spacing: -0.5px;
  }
  .slide-num {
    color: rgba(255,255,255,0.4);
    font-size: 20px;
    font-weight: 500;
    margin-left: auto;
  }
  .main-text {
    color: #FFFFFF;
    font-size: 64px;
    font-weight: 800;
    line-height: 1.25;
    letter-spacing: -2px;
    word-break: keep-all;
  }
  .main-text em {
    color: ${BRAND.accent};
    font-style: normal;
  }
  .example {
    background: ${cardBg};
    color: rgba(255,255,255,0.75);
    font-size: 30px;
    font-weight: 500;
    padding: 28px 36px;
    border-radius: 20px;
    line-height: 1.6;
    border-left: 4px solid ${BRAND.accent};
    word-break: keep-all;
  }
  .cta-box {
    background: ${BRAND.accent};
    color: white;
    font-size: 36px;
    font-weight: 800;
    padding: 32px 40px;
    border-radius: 20px;
    text-align: center;
    letter-spacing: -0.5px;
  }
  .footer {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 8px;
  }
  .hashtag {
    color: rgba(255,255,255,0.35);
    font-size: 22px;
    font-weight: 500;
  }
</style>
</head>
<body>
<div class="slide">
  <div class="header">
    <div class="logo">UniPort</div>
    <div class="slide-num">${slideNum}</div>
  </div>
  <div class="main-text">${mainText}</div>
  ${exampleHTML}
  ${isLast ? `<div class="cta-box">투자 시작은 유니포트로 👉</div>` : ''}
  <div class="footer">
    <span class="hashtag">#유니포트 #주식입문 #Z세대재테크</span>
  </div>
</div>
</body>
</html>`;
}

// ── 메인 실행 ────────────────────────────────────────────────
async function main() {
  const inputFile = process.argv[2];
  if (!inputFile) {
    console.error('사용법: node generate-slides.js <content-file.md>');
    process.exit(1);
  }

  const absInput = path.resolve(inputFile);
  const slug = path.basename(absInput, '.md');
  const outputDir = path.resolve(__dirname, '../slides', slug);
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`📂 슬라이드 생성 시작: ${slug}`);

  const slides = parseMarkdown(absInput);
  // Mac에 설치된 Chrome을 직접 사용 (Chromium 별도 다운로드 불필요)
const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];
const executablePath = CHROME_PATHS.find(p => require('fs').existsSync(p));
if (!executablePath) throw new Error('Chrome 또는 Chromium이 설치되어 있지 않습니다.');

const browser = await puppeteer.launch({ executablePath, args: ['--no-sandbox'] });

  for (const slide of slides) {
    const html = buildSlideHTML(slide, slides.length);
    const htmlPath = path.join(outputDir, `slide-${String(slide.number).padStart(2, '0')}.html`);
    const pngPath = path.join(outputDir, `slide-${String(slide.number).padStart(2, '0')}.png`);

    fs.writeFileSync(htmlPath, html);

    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });
    await page.goto(`file://${htmlPath}`);
    await page.screenshot({ path: pngPath, type: 'png' });
    await page.close();

    console.log(`  ✅ slide-${String(slide.number).padStart(2, '0')}.png`);
  }

  await browser.close();
  console.log(`\n🎉 완료! 저장 위치: ${outputDir}`);
  console.log(`\n다음 단계: node publish-instagram.js ${outputDir}`);
}

main().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
