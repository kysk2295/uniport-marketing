---
name: uniport-daily-marketing-pipeline
description: 매일 오전 9시 UniPort 마케팅 자동화 파이프라인 (트렌드 수집 → 카드뉴스 제작 → 게시)
---

# UniPort 일일 마케팅 파이프라인

오늘 날짜를 확인하고 아래 3단계를 순서대로 실행한다.
작업 디렉토리: /Users/koyunseo/Desktop/workspace/uniport

---

## 1단계: 트렌드 수집 (uniport-market-researcher 역할)

### 1-A. 뉴스 최상위 트렌드 수집
특정 키워드를 미리 정하지 않고, 지금 실제로 가장 많이 읽히는 금융/경제 기사를 가져온다.

아래 순서로 실행:
1. WebSearch → "경제 뉴스 오늘 {오늘날짜} 실시간" 으로 상위 뉴스 목록 확인
2. WebSearch → "코스피 나스닥 오늘 {오늘날짜}" 으로 시장 동향 파악
3. WebFetch → 상위 노출된 기사 2~3개 본문 수집

**카드뉴스 적합도 평가** (아래 기준으로 상위 3개 선정):
- 숫자/수치 포함 (+X%, -X원 등)
- 왜 올랐나/떨어졌나 인과관계 설명 가능
- Z세대 직접 관련 (ETF, 코인, 환율, 반도체 등)
- 오늘 처음 발생한 이슈

### 1-B. 인스타그램 인기 캐러셀 분석
1. WebSearch → "#주식입문 인스타그램 최신 인기 카드뉴스"
2. WebSearch → "#재테크 인스타그램 인기 최신"

분석 항목: 인기 훅 패턴, 해시태그 조합, 인기 주제

### 1-C. 이전 피드백 반영
marketing/feedback/ 폴더에서 가장 최신 feedback-{날짜}.md 파일을 읽는다.
없으면 건너뛴다.

### 1-D. 결과 저장
marketing/research/daily-{오늘날짜}.json 형식으로 저장:
```json
{
  "date": "YYYY-MM-DD",
  "generatedAt": "ISO timestamp",
  "topTrends": [
    { "rank": 1, "topic": "...", "why": "...", "hook": "...", "stat": "...", "source": "URL", "slug": "영문-하이픈" },
    { "rank": 2, ... },
    { "rank": 3, ... }
  ],
  "instagramTrends": {
    "popularHooks": ["..."],
    "trendingHashtags": ["#..."],
    "hotTopics": ["..."]
  },
  "feedbackApplied": "반영한 피드백 요약 (없으면 없음)",
  "recommendation": "오늘 1순위 추천 주제와 이유"
}
```

---

## 2단계: 카드뉴스 제작 + 게시 (uniport-content-creator 역할)

### 2-A. 주제 선정
daily-{오늘날짜}.json의 topTrends[0] (1순위) 선택

### 2-B. 콘텐츠 대본 작성 (uniport-trend-to-content 스킬 적용)
피드백 반영:
- 저장율 낮았으면 → stat 슬라이드 추가
- 인게이지먼트 낮았으면 → 훅을 질문형으로, 댓글 유도 캡션
- 인스타 인기 훅 패턴 → 오늘 훅에 적용

content JSON 포맷:
```json
{
  "title": "Z세대 관점 제목",
  "category": "투자 입문",
  "caption": "캡션\n\n#주식입문 #모의투자 #유니포트 #Z세대재테크 #투자시작 + 주제별 3개",
  "slides": [
    { "type": "thumbnail", "category": "투자 입문", "hook": "훅(10자 내외)", "subhook": "서브훅" },
    { "type": "intro", "category": "투자 입문", "title": "...", "body": "...", "point": "..." },
    { "type": "main", "category": "투자 입문", "tag": "태그", "title": "...", "body": "...", "stat": "수치", "statLabel": "설명" },
    { "type": "main", ... },
    { "type": "main", ... },
    { "type": "cta", "category": "투자 입문", "subtitle": "...", "title": "UniPort 모의투자로\n직접 체험해봐", "points": ["...", "...", "..."], "cta": "UniPort 무료 시작하기" }
  ]
}
```

marketing/content/insta-card-{slug}.json 으로 저장

### 2-C. 슬라이드 생성 + 인스타그램 게시
```bash
cd /Users/koyunseo/Desktop/workspace/uniport/marketing
node tools/run-all.js content/insta-card-{slug}.json
```

게시 완료 후 daily-{날짜}.json에 추가:
```json
"postedSlug": "{slug}",
"postedAt": "ISO timestamp"
```

---

## 3단계: 전날 게시물 성과 분석 (uniport-marketing-analyst 역할)

### 3-A. 인사이트 수집
```bash
cd /Users/koyunseo/Desktop/workspace/uniport/marketing
node tools/fetch-insights.js --days 2
```

IG_USER_ID, IG_ACCESS_TOKEN이 .env에 없으면 이 단계는 건너뛴다.

### 3-B. 어제 게시물 분석
marketing/research/daily-{어제날짜}.json 에서 postedSlug 확인 후
해당 게시물의 성과 지표 분석:
- 도달수 1,000 미만 → 해시태그/시간대 개선 권고
- 저장수 50 미만 → 정보 밀도 강화 권고
- ER 5% 미만 → 훅/CTA 개선 권고

### 3-C. 피드백 파일 저장
marketing/feedback/feedback-{오늘날짜}.md 생성:
```
# 인스타그램 성과 피드백 ({날짜})

## 어제 게시물 성과
- 슬라이드: {slug}
- 도달수: {reach} / 저장수: {saved} / ER: {er}%

## 잘 된 점
- ...

## 개선 필요
- ...

## 내일 콘텐츠 반영사항
1. (훅) ...
2. (구성) ...
3. (해시태그) ...
```

---

모든 단계 완료 후 요약 출력:
- 오늘 게시한 카드뉴스 주제
- 전날 성과 핵심 지표 (있으면)
- 내일 반영할 피드백 한 줄 요약