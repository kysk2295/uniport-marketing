#!/usr/bin/env node
/**
 * UniPort 카드뉴스 원클릭 파이프라인
 * 콘텐츠 MD → PNG 생성 → 인스타그램 게시까지 한 번에 실행
 *
 * 사용법:
 *   node run-all.js <content-file.md> <caption>
 *   node run-all.js ../content/insta-card-taco-trade.md "타코가 주식 용어라고? 😅\n\n#유니포트"
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const contentFile = process.argv[2];
const caption = process.argv[3] || '';

if (!contentFile) {
  console.error('사용법: node run-all.js <content-file.md> [caption]');
  process.exit(1);
}

const slug = path.basename(contentFile, '.md');
const slidesDir = path.resolve(__dirname, '../slides', slug);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  UniPort 카드뉴스 자동 파이프라인 시작');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📄 콘텐츠: ${contentFile}`);
console.log(`📁 출력: ${slidesDir}`);
console.log('');

// Step 1: 슬라이드 PNG 생성
console.log('[ 1/2 ] 슬라이드 PNG 생성 중...');
execSync(`node ${path.resolve(__dirname, 'generate-slides.js')} ${contentFile}`, {
  stdio: 'inherit',
  cwd: __dirname,
});

// Step 2: 인스타그램 게시
console.log('\n[ 2/2 ] 인스타그램 게시 중...');
execSync(`node ${path.resolve(__dirname, 'publish-instagram.js')} ${slidesDir} "${caption}"`, {
  stdio: 'inherit',
  cwd: __dirname,
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  ✅ 전체 파이프라인 완료!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
