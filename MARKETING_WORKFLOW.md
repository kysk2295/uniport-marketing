# UniPort 마케팅 멀티 에이전트 워크플로우

UniPort 마케팅 자동화 시스템의 운영 기준 문서.

---

## 시스템 구조

```
marketing/
  brand-guide.md          ← 브랜드 보이스, 경쟁 포지셔닝
  target-persona.md       ← 페르소나 A/B/C
  product-faq.md          ← 핵심 기능 Q&A
  content/                ← 생성된 콘텐츠 저장
  research/               ← 리서치 리포트 저장
  reports/                ← 분석 리포트 저장
  campaigns/              ← 캠페인 기획서 저장

.agents/
  product-marketing-context.md  ← 모든 스킬이 참조하는 파운데이션

.claude/agents/
  uniport-campaign-strategist.md  ← 캠페인 기획 에이전트
  uniport-content-creator.md      ← 콘텐츠 제작 에이전트
  uniport-market-researcher.md    ← 시장 조사 에이전트
  uniport-marketing-analyst.md    ← 데이터 분석 에이전트

.claude/commands/
  # UniPort 전용 스킬 (5개)
  uniport-insta-card.md       ← 인스타그램 카드뉴스 생성
  uniport-youtube.md          ← 유튜브 스크립트 생성
  uniport-keyword-analysis.md ← 키워드 트렌드 분석
  uniport-blog.md             ← 블로그 포스트 자동 생성
  uniport-blog-to-content.md  ← 블로그/기사 URL → 카드뉴스 대본 변환 (글로벌 스킬)

  # coreyhaines31/marketingskills 다운로드 스킬 (5개)
  social-content.md           ← 소셜 미디어 콘텐츠
  seo-audit.md                ← SEO 감사
  content-strategy.md         ← 콘텐츠 전략
  analytics-tracking.md       ← 분석 트래킹 설정
  marketing-ideas.md          ← 마케팅 아이디어 발굴
```

---

## 에이전트 역할 분담

| 에이전트 | 담당 | 주로 쓰는 스킬 |
|---------|------|------------|
| `uniport-campaign-strategist` | 캠페인 기획, GTM, 채널 전략 | content-strategy, marketing-ideas |
| `uniport-content-creator` | 콘텐츠 제작 (SNS, 블로그, 유튜브) | uniport-insta-card, uniport-youtube, uniport-blog, uniport-blog-to-content, social-content |
| `uniport-market-researcher` | 트렌드/경쟁사 조사 | uniport-keyword-analysis, seo-audit |
| `uniport-marketing-analyst` | 성과 분석, 리포트 | analytics-tracking |

---

## 표준 플로우

### A. 캠페인 요청 (복합)

```
사용자 요청
→ uniport-campaign-strategist (전략 수립)
→ uniport-market-researcher (리서치 지원)
→ uniport-content-creator (콘텐츠 제작)
→ uniport-marketing-analyst (성과 기준 설정)
→ Notion 저장
```

### B. 콘텐츠 단건 요청

```
사용자 요청
→ /uniport-keyword-analysis (키워드 먼저 확인)
→ /uniport-insta-card 또는 /uniport-youtube 또는 /uniport-blog
→ marketing/content/ 폴더 저장
```

### C. 월간 마케팅 리포트

```
마케팅 데이터 입력
→ uniport-marketing-analyst
→ /analytics-tracking
→ 인사이트 → uniport-campaign-strategist (다음 달 전략)
→ Notion 저장
```

### D. 경쟁사 분석

```
사용자 요청
→ uniport-market-researcher
→ /uniport-keyword-analysis
→ /seo-audit
→ marketing/research/ 저장
```

### E. 기사/블로그 URL → 카드뉴스 즉시 제작

```
URL 전달 ("이 기사로 카드뉴스 만들어줘")
→ /uniport-blog-to-content (URL 파싱 → JSON 대본)
→ node tools/generate-slides.js (슬라이드 생성)
→ node tools/publish-instagram.js (게시)
```

---

## 스킬 호출 예시

```bash
# 인스타 카드뉴스
/uniport-insta-card
주제: 주식 용어 5가지 쉽게 설명
타겟: 페르소나 A (대학생)
카드 수: 7장

# 유튜브 쇼츠 스크립트
/uniport-youtube
형식: 쇼츠 (60초)
주제: "모의투자로 3개월 연습하면 생기는 일"
타겟: 페르소나 C

# 키워드 분석 후 블로그
/uniport-keyword-analysis
목적: 네이버 블로그 SEO
주제: 주식 입문 관련

# → 분석 결과 받은 후
/uniport-blog
메인 키워드: [분석 결과 키워드]
플랫폼: 네이버 블로그
```

---

## Notion 연동

모든 에이전트가 공유하는 Notion 접근 정보:

- **API 키**: `NOTION_API_TOKEN`
- **마케팅 메인 페이지**: `2d5d58e6-c6ff-812c-9f5f-fd3616f14ebc`
- **설문/리서치**: `322d58e6-c6ff-808b-945a-c4e526660f6c`
- **프로젝트 일정**: `322d58e6-c6ff-805c-8518-f64c34ce8a77`

---

## 콘텐츠 발행 기준

| 채널 | 빈도 | 담당 에이전트 | 주요 스킬 |
|-----|------|------------|---------|
| 인스타그램 피드/릴스 | 주 3회 (월/수/금) | content-creator | uniport-insta-card, social-content |
| 유튜브 쇼츠 | 주 1회 | content-creator | uniport-youtube |
| 유튜브 롱폼 | 격주 1회 | content-creator | uniport-youtube |
| 네이버 블로그 | 주 2회 | content-creator | uniport-blog |
| 틱톡 | 주 2회 | content-creator | uniport-youtube (스크립트 활용) |
| 에브리타임 | 이벤트성 | campaign-strategist | — |

---

## 월간 마케팅 사이클

```
1주차: /uniport-keyword-analysis → 당월 콘텐츠 키워드 확정
2주차: 콘텐츠 배치 제작 (카드뉴스 4개, 블로그 4편, 유튜브 2편)
3주차: 콘텐츠 발행 + 트래킹
4주차: uniport-marketing-analyst → 월간 성과 리포트 → 다음 달 전략 수정
```

---

## 5월 출시 마케팅 카운트다운

- **2026-04-06 현재**: 출시까지 약 4주
- 우선순위 캠페인: 베타 테스터 모집 (에브리타임 + 인스타)
- 핵심 콘텐츠: "유니포트 어떤 앱이야?" 설명 카드뉴스 + 블로그 포스트
- 목표: 출시 전 사전 등록 500명

---

## 시작 프롬프트 예시

### 캠페인 전체 기획

```
MARKETING_WORKFLOW.md 기준으로 마케팅 작업을 시작해줘.
우리 앱이 5월에 출시되는데, 대학생 타겟 베타 테스터 모집 캠페인이 필요해.
채널 전략, 핵심 메시지, 콘텐츠 리스트까지 기획해줘.
```

### 콘텐츠 단건

```
인스타그램 카드뉴스 만들어줘.
주제는 "주식 초보가 꼭 알아야 할 용어 5가지"
타겟은 대학교 신입생.
```

### 경쟁사 분석

```
토스증권 모의투자 최근 마케팅 분석해줘.
우리가 어떻게 포지셔닝해야 할지 인사이트도 줘.
```
