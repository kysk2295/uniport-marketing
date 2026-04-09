---
name: uniport-blog-to-content
description: 블로그 URL을 UniPort 카드뉴스 콘텐츠 대본으로 변환. 블로그 변환, blog to content, URL to content, 대본 작성, 블로그 카드뉴스, 기사 요약, 뉴스 카드뉴스, 콘텐츠 대본, content script, blog url, article to slides, 블로그 글 카드뉴스화 등을 언급할 때 활성화.
---

# 블로그 URL → 카드뉴스 콘텐츠 변환 스킬

## 목적

외부 블로그/기사 URL을 입력받아 UniPort 카드뉴스용 content JSON을 자동 생성.

## 실행 순서

```
1. WebFetch로 URL 내용 추출
2. 핵심 개념/데이터 파악
3. Z세대 투자 입문자 관점으로 재구성
4. insta-card JSON 포맷으로 변환
5. marketing/content/insta-card-{slug}.json 저장
```

## 변환 규칙

### 타겟 독자
- Z세대 (20대 초반), 투자 입문자
- 어려운 금융 용어 → 쉬운 말로 풀어서
- 숫자/통계는 구체적으로 유지
- 공감대 형성: "내 주식은 왜?", "오늘 왜 올랐지?" 스타일

### 훅 작성 원칙
- 질문형: "오늘 코스피 왜 갑자기 올랐지?"
- 숫자 포함: "+6% 급등의 진짜 이유"
- 반전/놀라움: "이거 알면 ETF 다르게 보임"

### main 슬라이드 tag 종류
`인과관계` / `오늘 사건` / `시장 반응` / `내 ETF는?` / `핵심 요약` / `왜 중요해?` / `지금 어떻게?`

### stat 필드 작성
- 기사 내 실제 수치 사용
- 형식: `+7%`, `-8%`, `90일`, `$2.3조`
- statLabel: 수치 맥락 2줄 이내

## 출력 포맷

```json
{
  "title": "기사 핵심을 Z세대 관점으로 재해석한 제목",
  "category": "투자 입문",
  "caption": "카드뉴스 요약 1~2줄\n저장해두면 유용한 이유\n\n#주식입문 #모의투자 #유니포트 #Z세대재테크 #투자시작\n#[주제별해시태그1] #[주제별해시태그2] #[주제별해시태그3]",
  "slides": [
    {
      "type": "thumbnail",
      "category": "투자 입문",
      "hook": "핵심 훅 (10자 내외, 질문/숫자/반전)",
      "subhook": "부연 설명 (20자 내외)"
    },
    {
      "type": "intro",
      "category": "투자 입문",
      "title": "기본 개념 or 배경 설명",
      "body": "2~3문장 핵심 설명",
      "point": "한 줄 요약 포인트"
    },
    {
      "type": "main",
      "category": "투자 입문",
      "tag": "인과관계",
      "title": "슬라이드 소제목",
      "body": "설명 2~3줄",
      "stat": "수치",
      "statLabel": "수치 설명\n맥락"
    },
    {
      "type": "cta",
      "category": "투자 입문",
      "subtitle": "마무리 연결 멘트",
      "title": "UniPort 모의투자로\n직접 경험해봐",
      "points": [
        "실제 돈 없이 진짜 시세로",
        "오늘 이슈 반영된 실시간 데이터",
        "투자 감각을 키우는 가장 빠른 방법"
      ],
      "cta": "UniPort 무료 시작하기"
    }
  ]
}
```

## 슬라이드 수 가이드

| 기사 분량 | 슬라이드 수 |
|-----------|------------|
| 짧은 뉴스 (500자 이하) | 5장 (thumb+intro+main×2+cta) |
| 일반 기사 (500~2000자) | 6~7장 |
| 심층 분석 (2000자 이상) | 7~8장 (main 최대 5장) |

## 파일 저장

```
파일명: marketing/content/insta-card-{slug}.json
slug 규칙: 영문 소문자 + 하이픈 (기사 주제 3~4단어)
예시: insta-card-kospi-rate-cut.json
     insta-card-bitcoin-etf-approval.json
     insta-card-samsung-earnings.json
```

## 이후 단계

콘텐츠 JSON 생성 후 카드뉴스 실제 제작이 필요하면:
→ `uniport-insta-card` 스킬 참조

```bash
node marketing/tools/generate-slides.js \
  marketing/content/insta-card-{slug}.json \
  marketing/output/{slug}
```

## 변환 불가 케이스

- 페이월로 막힌 기사 (로그인 필요)
- 영상 전용 콘텐츠 (글이 없는 유튜브 등)
- 광고성 콘텐츠 (투자 권유, 상품 홍보)
→ 이 경우 WebSearch로 관련 기사를 직접 찾아서 변환
