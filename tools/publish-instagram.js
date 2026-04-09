#!/usr/bin/env node
/**
 * UniPort 인스타그램 자동 게시기 (Make.com 웹훅 방식)
 *
 * 사전 설정 (marketing/tools/.env):
 *   IMAGE_HOST_API_KEY=your_imgbb_api_key
 *   MAKE_WEBHOOK_URL=https://hook.us2.make.com/xxx
 *
 * 사용법:
 *   node publish-instagram.js <slides-dir> [caption]
 *   node publish-instagram.js ../slides/insta-card-taco-trade "타코가 주식 용어라고? 😅\n\n#유니포트"
 *
 * 파이프라인:
 *   PNG 파일 수집 → JPEG 변환 (sips) → imgbb 업로드 → Make.com 웹훅 → Instagram 캐러셀 게시
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// ── 환경변수 로드 ─────────────────────────────────────────────
function loadEnv() {
  const envPath = path.resolve(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ marketing/tools/.env 파일이 없습니다.');
    console.error('   IMAGE_HOST_API_KEY=...  (imgbb API 키)');
    console.error('   MAKE_WEBHOOK_URL=...    (Make.com 웹훅 URL)');
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  lines.forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
  });
}

// ── PNG → JPEG 변환 (macOS sips 사용) ───────────────────────
function convertToJpeg(pngPath) {
  const jpgPath = pngPath.replace(/\.png$/i, '.jpg');
  execSync(`sips -s format jpeg "${pngPath}" --out "${jpgPath}"`, { stdio: 'pipe' });
  return jpgPath;
}

// ── imgbb 이미지 업로드 (공개 URL 획득) ──────────────────────
async function uploadToImgbb(filePath) {
  const apiKey = process.env.IMAGE_HOST_API_KEY;
  if (!apiKey) throw new Error('IMAGE_HOST_API_KEY 없음');

  const imageData = fs.readFileSync(filePath).toString('base64');

  return new Promise((resolve, reject) => {
    const body = `key=${apiKey}&image=${encodeURIComponent(imageData)}`;
    const options = {
      hostname: 'api.imgbb.com',
      path: '/1/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        const json = JSON.parse(data);
        if (json.success) resolve(json.data.url);
        else reject(new Error(`imgbb 업로드 실패: ${json.error?.message}`));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Make.com 웹훅 호출 ───────────────────────────────────────
async function callMakeWebhook(imageUrls, caption) {
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  if (!webhookUrl) throw new Error('MAKE_WEBHOOK_URL 없음');

  const url = new URL(webhookUrl);
  const payload = JSON.stringify({ caption, image_urls: imageUrls });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── 캐러셀 게시 메인 로직 ────────────────────────────────────
async function publishCarousel(slidesDir, caption) {
  // 1. PNG 파일 수집
  const pngs = fs.readdirSync(slidesDir)
    .filter(f => /\.png$/i.test(f))
    .sort()
    .map(f => path.join(slidesDir, f));

  if (pngs.length === 0) throw new Error('PNG 파일이 없습니다.');
  if (pngs.length > 10) throw new Error('인스타그램 캐러셀은 최대 10장입니다.');

  console.log(`📸 슬라이드 ${pngs.length}장 게시 준비`);

  // 2. PNG → JPEG 변환
  console.log('\n[ 1/3 ] JPEG 변환 중...');
  const jpgs = pngs.map(png => {
    const jpg = convertToJpeg(png);
    console.log(`  ✅ ${path.basename(jpg)}`);
    return jpg;
  });

  // 3. imgbb 업로드
  console.log('\n[ 2/3 ] imgbb 업로드 중...');
  const imageUrls = [];
  for (const [i, jpg] of jpgs.entries()) {
    process.stdout.write(`  ⬆️  (${i + 1}/${jpgs.length}) ${path.basename(jpg)}... `);
    const url = await uploadToImgbb(jpg);
    imageUrls.push(url);
    console.log(`✅`);
  }

  // 4. Make.com 웹훅 호출
  console.log('\n[ 3/3 ] Make.com → Instagram 게시 중...');
  const result = await callMakeWebhook(imageUrls, caption);

  if (result.status === 200) {
    console.log(`  ✅ 웹훅 전송 성공 (${result.body})`);
  } else {
    throw new Error(`웹훅 실패: HTTP ${result.status} - ${result.body}`);
  }
}

// ── 실행 ─────────────────────────────────────────────────────
async function main() {
  loadEnv();

  const slidesDir = process.argv[2];
  const caption = process.argv[3] || '';

  if (!slidesDir) {
    console.error('사용법: node publish-instagram.js <slides-dir> [caption]');
    process.exit(1);
  }

  const absDir = path.resolve(slidesDir);
  if (!fs.existsSync(absDir)) {
    console.error(`❌ 폴더가 없습니다: ${absDir}`);
    process.exit(1);
  }

  try {
    await publishCarousel(absDir, caption);
    console.log('\n🎉 인스타그램 게시 완료!');
  } catch (err) {
    console.error(`\n❌ 게시 실패: ${err.message}`);
    process.exit(1);
  }
}

main();
