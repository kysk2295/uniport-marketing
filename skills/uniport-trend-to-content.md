---
name: uniport-trend-to-content
description: 오늘 시장 트렌드와 인기 시사뉴스를 자동 조사하여 UniPort 카드뉴스 콘텐츠 대본으로 변환. 트렌드 조사, 시사뉴스 대본, 오늘 뉴스 카드뉴스, 최신 트렌드 콘텐츠, 인기 뉴스 카드뉴스, trending news, market news, 시장 이슈 대본, 오늘 시사, 오늘 뉴스로 카드뉴스, 트렌드 대본 등을 언급할 때 활성화.
---

# 오늘 트렌드 → 카드뉴스 대본 자동 생성 스킬

## 목적

오늘 날짜 기준 실시간 시장/경제/시사 트렌드를 조사하고 Z세대 투자 입문자 관점의 카드뉴스 대본(content JSON)을 자동 생성.

## 실행 순서

```
1. 오늘 날짜 확인 (currentDate 컨텍스트)
2. WebSearch로 트렌드 뉴스 수집 (아래 검색 전략 참고)
3. 카드뉴스화 적합도 평가 → 상위 1개 선택
4. WebFetch로 기사 본문 상세 수집
5. content JSON 작성 → marketing/content/insta-card-{slug}.json 저장
```

## 검색 전략

### 1차 검색 (트렌드 파악)
```
"오늘 주식 시장" OR "코스피 오늘"
"오늘 경제 뉴스" site:news.naver.com
"오늘 투자 트렌드" 날짜:today
```

### 2차 검색 (글로벌 + 국내)
```
"나스닥 오늘" OR "S&P500 today"
"오늘 ETF" OR "오늘 금리"
"트럼프 경제" OR "Fed 금리" 최신
```

### 3차 검색 (Z세대 관심사 필터)
```
"비트코인 오늘"
"테슬라 오늘"
"반도체 주가 오늘"
"환율 오늘"
```

## 카드뉴스화 적합도 기준

| 기준 | 설명 | 가중치 |
|------|------|--------|
| 숫자/수치 | 구체적 % 또는 금액 포함 | 높음 |
| 인과관계 | "왜 올랐나/떨어졌나" 설명 가능 | 높음 |
| Z세대 관련성 | ETF, 비트코인, 테슬라, 반도체 등 | 높음 |
| 신선도 | 오늘 발생한 이슈 | 중간 |
| 설명 용이성 | 슬라이드 4~6장으로 설명 가능 | 중간 |
| 행동 유도 | UniPort 모의투자로 연결 가능 | 중간 |

**적합 예시**: 금리 인하 발표, 코스피 급등/급락, 환율 급변, 기업 실적 서프라이즈
**부적합 예시**: 정치 스캔들, 연예 뉴스, 해외 재난, 부동산 규제

## 훅 패턴 (오늘 트렌드 특화)

```
숫자형:  "오늘 코스피 +X% 왜?"
질문형:  "내 ETF 갑자기 초록불인 이유"
비교형:  "어제 -X%, 오늘 +X%... 무슨 일?"
공감형:  "요즘 다들 얘기하는 ○○, 뭔데?"
반전형:  "나쁜 소식인데 주가가 올랐다?"
```

## Content JSON 출력 포맷

```json
{
  "title": "[오늘 날짜] Z세대 관점 제목",
  "category": "투자 입문",
  "caption": "오늘 ○○ 왜 이런지 이제 알겠지?\n\n저장해두면 나중에 또 쓸 수 있는 내용!\n\n#주식입문 #모의투자 #유니포트 #Z세대재테크 #투자시작\n#[주제태그1] #[주제태그2] #[주제태그3]",
  "slides": [
    {
      "type": "thumbnail",
      "category": "투자 입문",
      "hook": "핵심 훅 (숫자/질문/반전 중 택1)",
      "subhook": "오늘 날짜 기준 부연 설명"
    },
    {
      "type": "intro",
      "category": "투자 입문",
      "title": "배경 개념 제목",
      "body": "이 이슈를 이해하기 위한 기본 개념 2~3줄",
      "point": "한 줄 핵심 요약"
    },
    {
      "type": "main",
      "category": "투자 입문",
      "tag": "오늘 사건",
      "title": "오늘 발생한 핵심 이벤트",
      "body": "2~3줄 설명",
      "stat": "오늘 수치",
      "statLabel": "수치 맥락\n날짜 포함"
    },
    {
      "type": "main",
      "category": "투자 입문",
      "tag": "인과관계",
      "title": "왜 이런 결과가 나왔나",
      "body": "원인 → 결과 흐름 설명",
      "stat": "관련 수치",
      "statLabel": "설명"
    },
    {
      "type": "main",
      "category": "투자 입문",
      "tag": "내 ETF는?",
      "title": "투자자 입장에서 보는 영향",
      "body": "실제 ETF/주식에 어떤 영향인지",
      "stat": "ETF 수익률 또는 관련 수치",
      "statLabel": "ETF명 또는 종목"
    },
    {
      "type": "cta",
      "category": "투자 입문",
      "subtitle": "이런 흐름, 직접 느껴보고 싶다면?",
      "title": "UniPort 모의투자로\n오늘 같은 장\n체험해봐",
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

## 파일 저장 규칙

```
경로: marketing/content/insta-card-{slug}.json
slug: 오늘날짜-핵심키워드 (영문 소문자 + 하이픈)
예시:
  insta-card-kospi-rate-cut.json
  insta-card-nasdaq-ai-surge.json
  insta-card-krw-usd-rate.json
  insta-card-samsung-earnings.json
```

## 이후 단계 안내

대본 저장 후 자동으로 사용자에게 다음 선택지 제시:

```
✅ 대본 완성: marketing/content/insta-card-{slug}.json

다음 단계를 선택하세요:
1. 슬라이드 이미지 바로 생성
   → node marketing/tools/generate-slides.js marketing/content/insta-card-{slug}.json marketing/output/{slug}
2. 생성 + 인스타그램 게시까지
   → node marketing/tools/run-all.js marketing/content/insta-card-{slug}.json
3. 대본만 저장 (나중에 게시)
```

## 주의사항

- 항상 오늘 날짜(`currentDate`) 기준으로 검색
- 수치는 반드시 실제 기사에서 확인된 값만 사용 (추측 금지)
- 정치적으로 민감한 주제는 경제적 영향 측면으로만 서술
- UniPort CTA는 항상 모의투자 앱 연결로 고정
