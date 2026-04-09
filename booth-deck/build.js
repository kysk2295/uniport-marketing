const pptxgen = require('pptxgenjs');
const html2pptx = require('/Users/koyunseo/.claude/skills/pptx/scripts/html2pptx');
const path = require('path');

const SLIDES_DIR = path.join(__dirname, 'slides');
const OUTPUT = path.join(__dirname, 'UniPort_부스이벤트_기획안.pptx');

async function build() {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = 'UniPort 캠퍼스 투자 체험 부스 기획안';
    pptx.author = 'UniPort';

    const slides = [
        'slide1.html', 'slide2.html', 'slide3.html', 'slide4.html',
        'slide5.html', 'slide6.html', 'slide7.html'
    ];

    for (const s of slides) {
        await html2pptx(path.join(SLIDES_DIR, s), pptx);
        console.log(`✓ ${s}`);
    }

    await pptx.writeFile({ fileName: OUTPUT });
    console.log(`\n완료: ${OUTPUT}`);
}

build().catch(err => { console.error(err); process.exit(1); });
