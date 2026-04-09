const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
    ShadingType, VerticalAlign, PageNumber, LevelFormat
} = require('docx');
const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, 'UniPort_부스이벤트_기획서.docx');

const PRIMARY = "4F46E5";
const DARK = "0F172A";
const GRAY = "64748B";
const LIGHT_BG = "EEF2FF";

const border = { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function heading1(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 360, after: 160 },
        children: [new TextRun({ text, bold: true, size: 32, color: DARK, font: "Arial" })]
    });
}

function heading2(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 280, after: 120 },
        children: [new TextRun({ text, bold: true, size: 26, color: PRIMARY, font: "Arial" })]
    });
}

function body(text, options = {}) {
    return new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [new TextRun({ text, size: 22, color: options.color || GRAY, font: "Arial", bold: options.bold || false })]
    });
}

function bullet(text) {
    return new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { before: 60, after: 60 },
        children: [new TextRun({ text, size: 22, color: GRAY, font: "Arial" })]
    });
}

function spacer() {
    return new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun("")] });
}

function divider() {
    return new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" } },
        spacing: { before: 200, after: 200 },
        children: [new TextRun("")]
    });
}

function infoTable(rows) {
    return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2800, 6560],
        rows: rows.map(([label, value]) => new TableRow({
            children: [
                new TableCell({
                    borders,
                    width: { size: 2800, type: WidthType.DXA },
                    shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
                    margins: { top: 100, bottom: 100, left: 160, right: 160 },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [new Paragraph({
                        children: [new TextRun({ text: label, bold: true, size: 20, color: PRIMARY, font: "Arial" })]
                    })]
                }),
                new TableCell({
                    borders,
                    width: { size: 6560, type: WidthType.DXA },
                    margins: { top: 100, bottom: 100, left: 160, right: 160 },
                    children: [new Paragraph({
                        children: [new TextRun({ text: value, size: 20, color: DARK, font: "Arial" })]
                    })]
                })
            ]
        }))
    });
}

function programTable() {
    const headerCell = (text) => new TableCell({
        borders,
        shading: { fill: PRIMARY, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 160, right: 160 },
        children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text, bold: true, size: 20, color: "FFFFFF", font: "Arial" })]
        })]
    });
    const dataCell = (text, bg = "FFFFFF", color = DARK) => new TableCell({
        borders,
        shading: { fill: bg, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 160, right: 160 },
        children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text, size: 20, color, font: "Arial" })]
        })]
    });

    return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1560, 2600, 2600, 2600],
        rows: [
            new TableRow({
                children: [
                    headerCell("구분"),
                    headerCell("무료 미션"),
                    headerCell("홍보 미션"),
                    headerCell("유료 상품"),
                ]
            }),
            new TableRow({
                children: [
                    dataCell("프로그램", LIGHT_BG, PRIMARY),
                    dataCell("투자성향 테스트"),
                    dataCell("그룹 모의투자 대회"),
                    dataCell("30일 부트캠프 할인권"),
                ]
            }),
            new TableRow({
                children: [
                    dataCell("목적", LIGHT_BG, PRIMARY),
                    dataCell("발걸음 유도 · 바이럴"),
                    dataCell("앱 설치 · 핵심 체험"),
                    dataCell("고관여 유저 조기 확보"),
                ]
            }),
            new TableRow({
                children: [
                    dataCell("소요 시간", LIGHT_BG, PRIMARY),
                    dataCell("1분"),
                    dataCell("2분"),
                    dataCell("즉시 결제"),
                ]
            }),
            new TableRow({
                children: [
                    dataCell("보상", LIGHT_BG, PRIMARY),
                    dataCell("슬러시 또는 사탕"),
                    dataCell("상품권 · 기프티콘"),
                    dataCell("할인가 구매 혜택"),
                ]
            }),
        ]
    });
}

function kpiTable() {
    const headerCell = (text) => new TableCell({
        borders,
        shading: { fill: DARK, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 160, right: 160 },
        children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text, bold: true, size: 20, color: "FFFFFF", font: "Arial" })]
        })]
    });
    const dataCell = (text, highlight = false) => new TableCell({
        borders,
        shading: { fill: highlight ? LIGHT_BG : "FFFFFF", type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 160, right: 160 },
        children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text, size: 20, color: highlight ? PRIMARY : DARK, bold: highlight, font: "Arial" })]
        })]
    });

    return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3120, 3120, 3120],
        rows: [
            new TableRow({ children: [headerCell("지표"), headerCell("목표"), headerCell("성공 기준")] }),
            new TableRow({ children: [dataCell("부스 방문자"), dataCell("100명+", true), dataCell("참여율 80% 이상")] }),
            new TableRow({ children: [dataCell("앱 설치"), dataCell("30명+", true), dataCell("방문자 대비 30%")] }),
            new TableRow({ children: [dataCell("사전등록"), dataCell("40명+", true), dataCell("방문자 대비 40%")] }),
            new TableRow({ children: [dataCell("부트캠프 판매"), dataCell("10장+", true), dataCell("현장 즉시 결제")] }),
        ]
    });
}

const doc = new Document({
    numbering: {
        config: [{
            reference: "bullets",
            levels: [{
                level: 0, format: LevelFormat.BULLET, text: "•",
                alignment: AlignmentType.LEFT,
                style: { paragraph: { indent: { left: 600, hanging: 300 } } }
            }]
        }]
    },
    styles: {
        default: {
            document: { run: { font: "Arial", size: 22, color: GRAY } }
        },
        paragraphStyles: [
            {
                id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
                run: { size: 32, bold: true, font: "Arial", color: DARK },
                paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 }
            },
            {
                id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
                run: { size: 26, bold: true, font: "Arial", color: PRIMARY },
                paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 }
            }
        ]
    },
    sections: [{
        properties: {
            page: {
                size: { width: 11906, height: 16838 },
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
            }
        },
        headers: {
            default: new Header({
                children: [new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" } },
                    children: [new TextRun({ text: "UniPort — 캠퍼스 부스 이벤트 기획서", size: 18, color: "94A3B8", font: "Arial" })]
                })]
            })
        },
        footers: {
            default: new Footer({
                children: [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ text: "- ", size: 18, color: "94A3B8", font: "Arial" }),
                        new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "94A3B8", font: "Arial" }),
                        new TextRun({ text: " -", size: 18, color: "94A3B8", font: "Arial" }),
                    ]
                })]
            })
        },
        children: [
            // ───── 표지 ─────
            spacer(), spacer(),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 400, after: 80 },
                children: [new TextRun({ text: "UniPort", size: 52, bold: true, color: PRIMARY, font: "Arial" })]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 80 },
                children: [new TextRun({ text: "캠퍼스 투자 체험 부스 기획서", size: 36, bold: true, color: DARK, font: "Arial" })]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80, after: 400 },
                children: [new TextRun({ text: "Campus Booth Event Plan", size: 22, color: GRAY, font: "Arial", italics: true })]
            }),
            spacer(),
            infoTable([
                ["목적", "잠재 유저 확보 및 앱 사전등록 전환"],
                ["타겟", "Z세대 대학생 (투자 입문자)"],
                ["체험 시간", "1~2분 / 인당"],
                ["핵심 프로그램", "투자성향 테스트 · 그룹 모의투자 대회 · 부트캠프 할인권"],
                ["작성일", "2026년 4월"],
            ]),
            spacer(), spacer(),

            // ───── 1. 이벤트 개요 ─────
            divider(),
            heading1("1. 이벤트 개요"),
            body("UniPort는 Z세대 투자 입문자를 위한 그룹 모의투자 앱입니다. 대학교 캠퍼스 내 부스를 운영하여 출시 전 잠재 유저를 직접 확보하고, 앱의 핵심 가치를 1~2분 안에 체험시키는 것을 목표로 합니다.", { color: GRAY }),
            spacer(),

            heading2("배경"),
            bullet("대학생 70%가 투자를 시작하지 않은 상태 — 최대 잠재 시장"),
            bullet("정보는 많지만 검증 없이 위험한 투자 결정을 내리는 문제 존재"),
            bullet("캠퍼스 부스는 목표 타겟과 직접 접촉하는 가장 효율적인 채널"),
            spacer(),

            heading2("목표"),
            bullet("앱 사전등록 40명 이상 확보"),
            bullet("UniPort 핵심 기능(그룹 투자) 직접 체험 유도"),
            bullet("30일 투자 부트캠프 할인권 현장 판매"),
            spacer(),

            // ───── 2. 운영 흐름 ─────
            divider(),
            heading1("2. 부스 운영 흐름"),
            body("발걸음을 멈추게 하는 것부터 사전등록 완료까지 4단계로 설계합니다."),
            spacer(),
            infoTable([
                ["Step 1 — 접근 유도 (30초)", "현수막, 슬러시 증정 안내로 지나가는 학생의 발걸음을 멈춤"],
                ["Step 2 — 투자성향 테스트 (1분)", "태블릿으로 5문항 테스트 진행 → 결과지 출력 증정 → SNS 공유 유도"],
                ["Step 3 — 그룹 모의투자 대회 (2분)", "앱 설치 → 부스 전용 대회방 입장 → 종목 선택 투표 체험"],
                ["Step 4 — 유료 상품 안내 (선택)", "결과지 연계하여 30일 부트캠프 할인권 현장 구매 유도"],
            ]),
            spacer(),

            // ───── 3. 프로그램 상세 ─────
            divider(),
            heading1("3. 프로그램 상세"),
            spacer(),
            programTable(),
            spacer(),

            heading2("미션 ① 투자성향 테스트 (무료 · 슬러시 증정)"),
            body("5문항의 MBTI식 투자성향 진단. 결과는 4가지 유형으로 분류되며, 결과지를 현장 출력해 증정합니다."),
            spacer(),
            infoTable([
                ["결과 유형", "공격형 / 분석형 / 안정형 / 탐색형"],
                ["보상", "참여 시 슬러시 또는 사탕 증정"],
                ["추가 보상", "SNS 공유 시 기념품 증정, 사전등록 완료 시 쿠폰 지급"],
                ["바이럴 포인트", "결과지를 들고 있는 모습이 자연스럽게 주변 학생의 호기심 유도"],
            ]),
            spacer(),

            heading2("미션 ② 그룹 모의투자 대회 (홍보 · 핵심 미션)"),
            body("UniPort 앱을 설치하고 부스 전용 그룹 투자 대회에 참가합니다. 실시간 종목 선택 투표를 통해 앱의 핵심 가치를 직접 체험할 수 있습니다."),
            spacer(),
            infoTable([
                ["참가 방법", "QR코드로 앱 설치 → 초대 코드로 대회방 입장 → 투표 참가"],
                ["대회 기간", "부스 당일 ~ 1주일"],
                ["시상", "1등: 스타벅스 3만원 / 2~3등: 편의점 상품권 1만원"],
                ["참가자 전원", "30일 부트캠프 할인 쿠폰 지급"],
                ["친구 초대 보너스", "같은 방 입장 시 두 사람 모두 추가 보상"],
            ]),
            spacer(),

            heading2("유료 상품 — 30일 투자 부트캠프 할인권"),
            body("투자성향 테스트 후 더 깊이 배우고 싶다는 수요를 현장에서 즉시 전환합니다. 부스 한정 할인가 적용."),
            spacer(),
            infoTable([
                ["가격", "현장 특별가 (정가 대비 30% 할인)"],
                ["포함 내용", "30일 단계별 투자 커리큘럼 + 앱 내 그룹 투자 실습 + 주간 리포트"],
                ["판매 전략", "결과지 유형을 보여주며 연결 — 수량 한정으로 희소성 부여"],
                ["목표 판매 수", "현장 10장 이상"],
            ]),
            spacer(),

            // ───── 4. 준비 사항 ─────
            divider(),
            heading1("4. 준비 사항"),
            spacer(),
            infoTable([
                ["태블릿", "테스트 진행용 2대 이상 사전 점검"],
                ["결과지", "4종 투자자 유형 카드 사전 인쇄 (200장 이상)"],
                ["슬러시 머신", "또는 음료 교환권 쿠폰 준비"],
                ["QR코드 배너", "앱 설치 유도용 — 눈에 잘 띄는 위치에 배치"],
                ["할인권 재고", "현장 판매용 50장 인쇄"],
                ["운영 인원", "최소 2인 (테스트 안내 + 앱 설치 지원)"],
            ]),
            spacer(),

            heading2("사전 준비 일정"),
            infoTable([
                ["D-14", "부스 신청 및 장소 확보"],
                ["D-7", "결과지 인쇄 및 물품 구매 완료"],
                ["D-3", "테스트 앱 시나리오 점검 및 리허설"],
                ["D-Day", "부스 셋업 행사 시작 2시간 전 완료"],
            ]),
            spacer(),

            // ───── 5. 기대 성과 ─────
            divider(),
            heading1("5. 기대 성과 및 성공 기준"),
            spacer(),
            kpiTable(),
            spacer(),

            heading2("핵심 성공 지표"),
            body("단순 방문자 수보다 사전등록 전환율이 핵심입니다. 부스 접촉 → 앱 체험 → 연락처 수집의 3단계 전환율을 측정합니다."),
            spacer(),
            bullet("사전등록 전환율 40% 이상 달성 시 성공으로 판단"),
            bullet("친구 초대 발생 비율이 60% 이상이면 바이럴 구조 작동 확인"),
            bullet("부트캠프 할인권 10장 이상 판매 시 고관여 유저 풀 형성 확인"),
            spacer(), spacer(),

            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "— UniPort 마케팅팀 —", size: 20, color: "94A3B8", font: "Arial", italics: true })]
            }),
        ]
    }]
});

Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync(OUTPUT, buffer);
    console.log("완료:", OUTPUT);
}).catch(err => { console.error(err); process.exit(1); });
