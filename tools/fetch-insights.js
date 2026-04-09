#!/usr/bin/env node
/**
 * UniPort Instagram 성과 분석기
 *
 * 사전 설정 (marketing/tools/.env):
 *   IG_USER_ID=인스타그램_비즈니스_계정_ID
 *   IG_ACCESS_TOKEN=장기_액세스_토큰
 *
 * 사용법:
 *   node fetch-insights.js              ← 최근 10개 게시물 분석
 *   node fetch-insights.js --days 7     ← 최근 7일치 분석
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
      const [key, ...vals] = line.split('=');
      if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
    });
  }
}

function graphGet(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://graph.instagram.com/v25.0${endpoint}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON 파싱 실패: ${data.slice(0, 100)}`)); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function getRecentMedia(igUserId, token, limit = 10) {
  const fields = 'id,caption,media_type,timestamp,like_count,comments_count,permalink';
  const endpoint = `/${igUserId}/media?fields=${fields}&limit=${limit}&access_token=${token}`;
  const res = await graphGet(endpoint);
  if (res.error) throw new Error(`미디어 조회 실패: ${res.error.message}`);
  return res.data || [];
}

async function getMediaInsights(mediaId, mediaType, token) {
  // 미디어 타입별 사용 가능한 지표
  // 새 Instagram API v25.0 지원 지표
  const metricMap = {
    IMAGE:          'reach,saved,shares,likes,comments,total_interactions',
    CAROUSEL_ALBUM: 'reach,saved,shares,likes,comments,total_interactions',
    VIDEO:          'reach,saved,shares,likes,comments,plays,total_interactions',
    REEL:           'reach,saved,shares,likes,comments,plays,total_interactions',
  };
  const metrics = metricMap[mediaType] || 'impressions,reach,saved';
  const endpoint = `/${mediaId}/insights?metric=${metrics}&access_token=${token}`;

  const res = await graphGet(endpoint);
  if (res.error) {
    // 일부 오래된 게시물은 insights 지원 안 함
    return null;
  }

  const result = {};
  (res.data || []).forEach(item => {
    result[item.name] = item.values?.[0]?.value ?? item.value ?? 0;
  });
  return result;
}

function calcEngagementRate(likes, comments, saves, reach) {
  if (!reach) return 0;
  return (((likes || 0) + (comments || 0) + (saves || 0)) / reach * 100).toFixed(2);
}

function summarize(posts) {
  const validPosts = posts.filter(p => p.insights);

  if (!validPosts.length) return null;

  const avgReach = Math.round(validPosts.reduce((s, p) => s + (p.insights.reach || 0), 0) / validPosts.length);
  const avgSaved = Math.round(validPosts.reduce((s, p) => s + (p.insights.saved || 0), 0) / validPosts.length);
  const avgEngagement = (validPosts.reduce((s, p) => s + parseFloat(p.engagementRate || 0), 0) / validPosts.length).toFixed(2);

  const sorted = [...validPosts].sort((a, b) => (b.insights.reach || 0) - (a.insights.reach || 0));

  return {
    totalPosts: validPosts.length,
    avgReach,
    avgSaved,
    avgEngagementRate: `${avgEngagement}%`,
    bestPost: {
      id: sorted[0].id,
      caption: sorted[0].caption?.slice(0, 60) + '...',
      reach: sorted[0].insights.reach,
      saved: sorted[0].insights.saved,
      engagementRate: `${sorted[0].engagementRate}%`,
      permalink: sorted[0].permalink,
    },
    worstPost: {
      id: sorted[sorted.length - 1].id,
      caption: sorted[sorted.length - 1].caption?.slice(0, 60) + '...',
      reach: sorted[sorted.length - 1].insights.reach,
      permalink: sorted[sorted.length - 1].permalink,
    },
  };
}

function generateFeedback(summary, posts) {
  if (!summary) return '데이터 부족으로 피드백을 생성할 수 없습니다.';

  const feedback = [];

  // 저장수 분석
  if (summary.avgSaved > 50) {
    feedback.push('✅ 저장율이 높습니다 — 정보성 콘텐츠가 잘 작동하고 있습니다. 계속 유지하세요.');
  } else if (summary.avgSaved < 20) {
    feedback.push('⚠️ 저장율이 낮습니다 — 훅을 더 강렬하게, 정보 밀도를 높이세요 (통계/숫자 포함).');
  }

  // 인게이지먼트율 분석
  const er = parseFloat(summary.avgEngagementRate);
  if (er >= 5) {
    feedback.push('✅ 인게이지먼트율 우수 (5%+) — 현재 톤&매너를 유지하세요.');
  } else if (er < 3) {
    feedback.push('⚠️ 인게이지먼트율 낮음 — 댓글 유도 문구 강화, 질문형 캡션 사용을 권장합니다.');
  }

  // 베스트 포스트 패턴 분석
  if (summary.bestPost) {
    const caption = summary.bestPost.caption || '';
    if (/[0-9]+%/.test(caption)) feedback.push('💡 숫자/퍼센트 포함 콘텐츠가 도달수가 높습니다 — 계속 활용하세요.');
    if (/왜|이유|방법/.test(caption)) feedback.push('💡 "왜/이유/방법" 형식 훅이 잘 반응합니다.');
  }

  // 도달수 기반
  if (summary.avgReach < 500) {
    feedback.push('📈 도달수 확장을 위해 해시태그 다양화 및 공유 유도 CTA를 강화하세요.');
  }

  return feedback.join('\n');
}

async function main() {
  loadEnv();

  const igUserId = process.env.IG_USER_ID;
  const token = process.env.IG_ACCESS_TOKEN;

  if (!igUserId || !token) {
    console.error('❌ .env에 IG_USER_ID, IG_ACCESS_TOKEN이 필요합니다.');
    console.error('   Instagram Graph API 토큰 발급: https://developers.facebook.com/');
    process.exit(1);
  }

  const daysArg = process.argv.indexOf('--days');
  const days = daysArg !== -1 ? parseInt(process.argv[daysArg + 1]) : null;
  const limit = days ? Math.min(days * 2, 50) : 10;

  console.log(`📊 Instagram 성과 분석 시작 (최근 ${limit}개 게시물)...\n`);

  // 1. 최근 게시물 목록 조회
  const mediaList = await getRecentMedia(igUserId, token, limit);

  if (!mediaList.length) {
    console.log('게시물이 없습니다.');
    return;
  }

  // 날짜 필터
  const cutoff = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : null;
  const filtered = cutoff
    ? mediaList.filter(m => new Date(m.timestamp) >= cutoff)
    : mediaList;

  // 2. 각 게시물 인사이트 조회
  const posts = [];
  for (const media of filtered) {
    process.stdout.write(`  📈 ${media.id} (${media.media_type})... `);
    const insights = await getMediaInsights(media.id, media.media_type, token);
    const engagementRate = insights
      ? calcEngagementRate(media.like_count, media.comments_count, insights.saved, insights.reach)
      : '0';

    posts.push({ ...media, insights, engagementRate });

    if (insights) {
      console.log(`reach:${insights.reach || 0} saved:${insights.saved || 0} er:${engagementRate}%`);
    } else {
      console.log('insights 없음');
    }
  }

  // 3. 요약 및 피드백 생성
  const summary = summarize(posts);
  const feedback = generateFeedback(summary, posts);

  const report = {
    generatedAt: new Date().toISOString(),
    period: days ? `최근 ${days}일` : `최근 ${filtered.length}개 게시물`,
    summary,
    feedback,
    posts: posts.map(p => ({
      id: p.id,
      type: p.media_type,
      timestamp: p.timestamp,
      caption: p.caption?.slice(0, 100),
      likes: p.like_count,
      comments: p.comments_count,
      insights: p.insights,
      engagementRate: `${p.engagementRate}%`,
      permalink: p.permalink,
    })),
  };

  // 4. 저장
  const today = new Date().toISOString().slice(0, 10);
  const reportsDir = path.resolve(__dirname, '../reports');
  fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, `insights-${today}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // 5. 피드백을 다음 콘텐츠 제작을 위해 별도 저장
  const feedbackDir = path.resolve(__dirname, '../feedback');
  fs.mkdirSync(feedbackDir, { recursive: true });
  const feedbackPath = path.join(feedbackDir, `feedback-${today}.md`);
  const feedbackMd = `# 인스타그램 성과 피드백 (${today})

## 요약 지표
- 평균 도달수: ${summary?.avgReach?.toLocaleString() || 'N/A'}
- 평균 저장수: ${summary?.avgSaved?.toLocaleString() || 'N/A'}
- 평균 인게이지먼트율: ${summary?.avgEngagementRate || 'N/A'}

## 베스트 콘텐츠
${summary?.bestPost ? `- 도달수 ${summary.bestPost.reach?.toLocaleString()}: "${summary.bestPost.caption}"` : 'N/A'}

## 다음 콘텐츠 제작 피드백
${feedback}

## 원본 리포트
${reportPath}
`;
  fs.writeFileSync(feedbackPath, feedbackMd);

  // 6. 콘솔 출력
  console.log('\n─────────────────────────────');
  console.log('📋 요약');
  if (summary) {
    console.log(`  평균 도달수: ${summary.avgReach.toLocaleString()}`);
    console.log(`  평균 저장수: ${summary.avgSaved.toLocaleString()}`);
    console.log(`  평균 인게이지먼트율: ${summary.avgEngagementRate}`);
    console.log(`  베스트: "${summary.bestPost.caption}" (도달 ${summary.bestPost.reach?.toLocaleString()})`);
  }
  console.log('\n💬 다음 콘텐츠 피드백');
  console.log(feedback);
  console.log(`\n✅ 리포트 저장: ${reportPath}`);
  console.log(`✅ 피드백 저장: ${feedbackPath}`);
}

main().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
