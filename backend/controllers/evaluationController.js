const EvaluationResult = require('../models/evaluationResult');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const UserCode = require('../models/userCode');
const Game = require('../models/game');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Footer, PageNumber, BorderStyle, Table, TableRow, TableCell, WidthType } = require('docx');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');
const sharp = require('sharp');
const libreofficeConvert = require('libreoffice-convert');
const { PDFDocument } = require('pdf-lib');
const crypto = require('crypto');
const { safeLog, getSafeErrorMessage } = require('../utils/helpers');
const { getCompanyFilter } = require('../middleware/auth');
const expressionParser = require("docxtemplater/expressions.js");
const parser = expressionParser.configure({});

const DEFAULT_WORD_TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'Degerlendirme_Merkez_Raporu_v19.docx');
const SHARED_PDF_DIR = path.join(__dirname, '..', 'tmp', 'shared-pdfs');
const SHARED_PDF_TTL_MS = Number(process.env.SHARE_PDF_TTL_MS || 60 * 60 * 1000);

const sharedPdfStore = new Map();

try {
    fs.mkdirSync(SHARED_PDF_DIR, { recursive: true });
} catch (error) {
    // klasör oluşturulamazsa paylaşım endpoint'i hata verir
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function normalizeScore(score) {
    const parsed = typeof score === 'number' ? score : parseFloat(score);
    return Number.isFinite(parsed) ? parsed : 0;
}

async function getPdfPageCount(buffer) {
    try {
        const doc = await PDFDocument.load(buffer);
        return doc.getPageCount();
        } catch (error) {
        return null;
    }
}

function cleanupSharedPdfs() {
    const now = Date.now();
    for (const [token, entry] of sharedPdfStore.entries()) {
        if (!entry || entry.expiresAt <= now) {
            if (entry?.filePath) {
                try {
                    fs.unlinkSync(entry.filePath);
                } catch (error) {
                    // yoksa geç
                }
            }
            sharedPdfStore.delete(token);
        }
    }
}

setInterval(cleanupSharedPdfs, 10 * 60 * 1000);

async function buildPdfBufferFromTemplate(req, userCode, templateData = {}, templatePath) {
    const originalBody = req.body;
    const mockRes = {
        statusCode: 200,
        buffer: null,
        errorPayload: null,
        setHeader: () => {},
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.errorPayload = payload;
            return payload;
        },
        send(data) {
            this.buffer = data;
            return data;
        }
    };

    try {
        req.body = { userCode, templateData, templatePath };
        await evaluationController.generateWordFromTemplate(req, mockRes);
    } finally {
        req.body = originalBody;
    }

    if (!mockRes.buffer) {
        const message = mockRes.errorPayload?.message || 'Word oluşturulurken bir hata oluştu';
        const error = new Error(message);
        error.statusCode = mockRes.statusCode || 500;
        throw error;
    }

    const docxBuffer = Buffer.isBuffer(mockRes.buffer)
        ? mockRes.buffer
        : Buffer.from(mockRes.buffer);
    const sofficeCandidates = [
        process.env.LIBRE_OFFICE_EXE || '',
        'C:/Program Files/LibreOffice/program/soffice.com',
        'C:/Program Files/LibreOffice/program/soffice.exe',
        'C:/Program Files (x86)/LibreOffice/program/soffice.com',
        'C:/Program Files (x86)/LibreOffice/program/soffice.exe'
    ].filter(Boolean);
    const resolvedSoffice = sofficeCandidates.find((filePath) => fs.existsSync(filePath));
    const sofficePaths = resolvedSoffice ? [resolvedSoffice] : sofficeCandidates;
    const sofficeDir = resolvedSoffice ? path.dirname(resolvedSoffice) : '';
    const sofficeEnv = sofficeDir
        ? {
            ...process.env,
            PATH: `${sofficeDir};${process.env.PATH || ''}`,
            UNO_PATH: sofficeDir,
            URE_BOOTSTRAP: `vnd.sun.star.pathname:${path
                .join(sofficeDir, 'fundamental.ini')
                .replace(/\\/g, '/')}`
        }
        : process.env;
    const pdfBuffer = await new Promise((resolve, reject) => {
        libreofficeConvert.convertWithOptions(
            docxBuffer,
            '.pdf',
            undefined,
            {
                sofficeBinaryPaths: sofficePaths,
                fileName: 'source.docx',
                execOptions: { env: sofficeEnv, cwd: sofficeDir || undefined }
            },
            (err, result) => (err ? reject(err) : resolve(result))
        );
    });

    return Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
}

function getBaseUrl(req) {
    const forwarded = req.headers['x-forwarded-proto'];
    const proto = Array.isArray(forwarded)
        ? forwarded[0]
        : (forwarded ? forwarded.split(',')[0] : req.protocol);
    return `${proto}://${req.get('host')}`;
}

function segmentColor(score) {
    const colors = ['#ff9aa2', '#ffb78a', '#ffe08a', '#bfe9a8', '#79d7a1'];
    const s = clamp(score, 0, 100);
    const idx = Math.min(4, Math.floor(s / 20));
    return colors[idx];
}

function makeGraphSvg(score, W = 71, H = 21) {
    const colors = ['#ff9aa2', '#ffb78a', '#ffe08a', '#bfe9a8', '#79d7a1'];

    const s = clamp(score, 0, 100);
    const segW = W / 5;
    const r = Math.max(5, Math.floor(H * 0.45));
    const cx = clamp((s / 100) * W, r, W - r);
    const cy = Math.floor(H / 2);
    const cFill = segmentColor(s);
    const fontSize = Math.max(7, Math.floor(H * 0.45));

    const gap = 2;
    const rects = colors
        .map((c, i) => {
            const x = i * segW;
            return `<rect x="${x}" y="${Math.floor(H * 0.25)}" width="${segW - gap}" height="${Math.floor(H * 0.5)}" rx="0" fill="${c}"/>`;
        })
        .join('\n');

    const circle = `
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="${cFill}" stroke-width="2"/>
        <text x="${cx}" y="${cy + Math.floor(fontSize * 0.35)}"
              text-anchor="middle"
              font-family="Arial"
              font-size="${fontSize}"
              font-weight="700"
              fill="${cFill}">${Math.round(s)}</text>
    `;

    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
        ${rects}
        ${circle}
    </svg>`;
}

async function graphPngBuffer(score, W = 71, H = 21) {
    const svg = makeGraphSvg(score, W, H);
    const density = 300;
    const pngBuffer = await sharp(Buffer.from(svg), { density })
        .png()
        .toBuffer();
    return pngBuffer;
}

function makeGaugeSvg(score, W = 260, H = 140) {
    const colors = ['#ff9aa2', '#ffb78a', '#ffe08a', '#bfe9a8', '#79d7a1'];
    const s = clamp(score, 0, 100);

    const padding = Math.max(4, Math.floor(Math.min(W, H) * 0.06));
    const topPadding = Math.max(padding, Math.floor(padding * 1.5));
    const cx = Math.floor(W / 2);
    const outerR = Math.max(
        1,
        Math.min(Math.floor((W - padding * 2) / 2), H - topPadding - padding)
    );
    const thickness = Math.max(8, Math.floor(outerR * 0.28));
    const cy = H - padding - Math.max(4, Math.floor(thickness * 0.35));
    const innerR = Math.max(outerR - thickness, 1);

    const angleStart = Math.PI;
    const angleEnd = 0;
    const segmentAngle = (angleStart - angleEnd) / 5;
    const gapAngle = Math.PI * 0.01;

    const polar = (r, a) => ({
        x: cx + r * Math.cos(a),
        y: cy - r * Math.sin(a)
    });

    const midR = outerR - thickness / 2;
    const segments = colors
        .map((c, i) => {
            const a0 = angleStart - segmentAngle * i;
            const a1 = angleStart - segmentAngle * (i + 1);
            const start = a0 - gapAngle;
            const end = a1 + gapAngle;
            const p1 = polar(midR, start);
            const p2 = polar(midR, end);
            const sweep = start > end ? 1 : 0;
            return `<path d="M ${p1.x} ${p1.y} A ${midR} ${midR} 0 0 ${sweep} ${p2.x} ${p2.y}" stroke="${c}" stroke-width="${thickness}" fill="none" stroke-linecap="butt"/>`;
        })
        .join('\n');

    const needleAngle = angleStart - (s / 100) * (angleStart - angleEnd);
    const needleLen = Math.max(1, innerR - Math.floor(thickness * 0.35));
    const nx = cx + needleLen * Math.cos(needleAngle);
    const ny = cy - needleLen * Math.sin(needleAngle);
    const baseRadius = Math.max(4, Math.floor(thickness * 0.35));
    const baseOffset = Math.max(2, Math.floor(baseRadius * 0.6));
    const bx = cx + baseOffset * Math.cos(needleAngle);
    const by = cy - baseOffset * Math.sin(needleAngle);
    const perpX = Math.cos(needleAngle + Math.PI / 2);
    const perpY = -Math.sin(needleAngle + Math.PI / 2);
    const halfWidth = Math.max(3, Math.floor(thickness * 0.2));
    const p1x = bx + perpX * halfWidth;
    const p1y = by + perpY * halfWidth;
    const p2x = bx - perpX * halfWidth;
    const p2y = by - perpY * halfWidth;
    const needle = `
        <polygon points="${p1x},${p1y} ${p2x},${p2y} ${nx},${ny}" fill="#9e9e9e" />
        <circle cx="${cx}" cy="${cy}" r="${baseRadius}" fill="white" stroke="#9e9e9e" stroke-width="${Math.max(2, Math.floor(baseRadius * 0.35))}"/>
    `;

    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
        ${segments}
        ${needle}
    </svg>`;
}

async function gaugePngBuffer(score, W = 260, H = 140) {
    const svg = makeGaugeSvg(score, W, H);
    const density = 300;
    const pngBuffer = await sharp(Buffer.from(svg), { density })
        .png()
        .toBuffer();
    return pngBuffer;
}

function cmToPx(cm, dpi = 180) {
    return Math.round((cm / 2.54) * dpi);
}

function normalizeTagKey(key = '') {
    const normalized = String(key)
        .replace(/[çÇ]/g, 'c')
        .replace(/[ğĞ]/g, 'g')
        .replace(/[ıİ]/g, 'i')
        .replace(/[öÖ]/g, 'o')
        .replace(/[şŞ]/g, 's')
        .replace(/[üÜ]/g, 'u');
    return normalized
        .replace(/[^A-Za-z0-9_]+/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_+|_+$/g, '');
}

function addSafeKeys(source = {}, target = {}) {
    Object.keys(source).forEach((key) => {
        const safeKey = normalizeTagKey(key);
        if (safeKey && safeKey !== key && !(safeKey in target)) {
            target[safeKey] = source[key];
        }
    });
    return target;
}

function parseInterviewQuestionsText(text = '') {
    if (!text || text === '-') return [];
    const lines = text
        .split(/\r?\n+/)
        .map((line) => line.trim())
        .filter(Boolean);

    const rows = [];
    let current = { developmentArea: '', interviewQuestion: '', followUpQuestions: [] };
    let mode = null;

    const flush = () => {
        if (current.developmentArea || current.interviewQuestion || current.followUpQuestions.length > 0) {
            rows.push({
                developmentArea: current.developmentArea || '',
                interviewQuestion: current.interviewQuestion || '',
                followUpQuestions: current.followUpQuestions
            });
        }
        current = { developmentArea: '', interviewQuestion: '', followUpQuestions: [] };
        mode = null;
    };

    lines.forEach((line) => {
        if (/^(başlık|baslik)\b/i.test(line)) {
            const cleaned = line.replace(/^(başlık|baslik)\b\s*[:\-–—]?\s*/i, '').trim();
            if (!cleaned) return;
            line = cleaned;
        }

        const areaMatch = line.match(/^(gelişim alanı|gelisim alani)\b\s*[:\-–—]?\s*(.*)$/i);
        if (areaMatch) {
            if (current.developmentArea || current.interviewQuestion || current.followUpQuestions.length) {
                flush();
            }
            current.developmentArea = areaMatch[2]?.trim() || '';
            mode = 'area';
            return;
        }

        const questionMatch = line.match(/^(mülakat sorusu|mulakat sorusu)\b\s*[:\-–—]?\s*(.*)$/i);
        if (questionMatch) {
            current.interviewQuestion = questionMatch[2]?.trim() || '';
            mode = 'question';
            return;
        }

        const followMatch = line.match(/^(devam sorusu|takip sorusu)\b\s*[:\-–—]?\s*(.*)$/i);
        if (followMatch) {
            const followText = followMatch[2]?.trim();
            if (followText) {
                current.followUpQuestions.push(followText);
            }
            mode = 'followup';
            return;
        }

        if (mode === 'area') {
            current.developmentArea = current.developmentArea ? `${current.developmentArea} ${line}` : line;
            return;
        }

        if (mode === 'question') {
            current.interviewQuestion = current.interviewQuestion
                ? `${current.interviewQuestion} ${line}`
                : line;
            return;
        }

        if (mode === 'followup') {
            current.followUpQuestions.push(line);
            return;
        }

        if (!current.developmentArea) {
            current.developmentArea = line;
        } else if (!current.interviewQuestion) {
            current.interviewQuestion = line;
        } else {
            current.followUpQuestions.push(line);
        }
    });

    flush();
    return rows;
}

function buildInterviewColumnText(rows = [], accessor) {
    return rows
        .map((row) => {
            const value = accessor(row);
            return value ? String(value).trim() : '';
        })
        .filter(Boolean)
        .join('\n');
}

function stripTitleDetailLabels(text = '') {
    if (!text || text === '-') return text;
    const lines = text
        .split(/\r?\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
    const cleaned = [];
    lines.forEach((line) => {
        const match = line.match(/^(başlık|baslik|detay)\b\s*[:\-–—]?\s*(.*)$/i);
        if (match) {
            const rest = (match[2] || '').trim();
            if (rest) cleaned.push(rest);
            return;
        }
        cleaned.push(line);
    });
    return cleaned.join('\n');
}

function parseDevelopmentPlanText(text = '') {
    if (!text || text === '-') return [];
    const lines = text
        .split(/\r?\n+/)
        .map((line) => line.trim())
        .filter(Boolean);

    const sections = [];
    let currentSection = null;
    let currentItem = null;
    let expectSectionTitle = false;
    let expectItemTitle = false;

    const isAltHeadingMarker = (value) => /^(alt başlık|alt baslik)\b/i.test(value);
    const isSubHeading = (value) =>
        /^(hedef|günlük kullanım|gunluk kullanim|günlük işlerde kullanım|gunluk islerde kullanim|eğitim önerileri|egitim onerileri|eğitimler|egitimler|podcast\s*&\s*tedx|podcast|uygulama)\b/i.test(value);
    const isInlineContentMarker = (value) =>
        /^(günlük soru|gunluk soru|aylık|aylik|çeyrek bazlı|ceyrek bazli)\b/i.test(value);

    const normalizeSectionTitle = (value) => {
        const withoutPrefix = value.replace(/^(gelişim planı|gelisim plani)\b\s*[:\-–—]?\s*/i, '');
        return withoutPrefix.replace(/^\d+[\).\s\-–—:]*/g, '').trim();
    };

    const normalizeLine = (value) => value.replace(/^\uFEFF/, '').trim();

    const flushItem = () => {
        if (!currentSection || !currentItem) return;
        if (currentItem.title || currentItem.content.length > 0) {
            currentSection.items.push(currentItem);
        }
        currentItem = null;
    };

    const flushSection = () => {
        flushItem();
        if (currentSection && (currentSection.title || currentSection.items.length > 0)) {
            sections.push(currentSection);
        }
        currentSection = null;
    };

    lines.forEach((rawLine) => {
        const line = normalizeLine(rawLine);
        const planMatch = line.match(/^(?:\d+[\).\s-]*)?(gelişim planı|gelisim plani)\b\s*[:\-–—]?\s*(.*)$/i);
        if (planMatch) {
            flushSection();
            const rawTitle = planMatch[2]?.trim() || '';
            const titleText = normalizeSectionTitle(rawTitle);
            currentSection = { title: titleText, items: [] };
            expectSectionTitle = !titleText;
            return;
        }

        if (expectSectionTitle) {
            const cleanedTitle = normalizeSectionTitle(line);
            if (!currentSection) {
                currentSection = { title: cleanedTitle, items: [] };
                    } else {
                currentSection.title = cleanedTitle;
            }
            expectSectionTitle = false;
            return;
        }

        if (expectItemTitle) {
            if (!currentItem) {
                currentItem = { title: rawLine, content: [] };
            } else {
                currentItem.title = rawLine;
            }
            expectItemTitle = false;
            return;
        }

        const lineMatch = line.match(/^(.+?)\s*[:\-–—]\s*(.*)$/);
        const headingCandidate = (lineMatch ? lineMatch[1] : line).trim();
        const contentTail = lineMatch ? lineMatch[2]?.trim() : '';

        if (isInlineContentMarker(headingCandidate)) {
            if (!currentItem) {
                currentItem = { title: '', content: [] };
            }
            const inlineText = contentTail ? `${headingCandidate}: ${contentTail}` : headingCandidate;
            currentItem.content.push(inlineText);
            return;
        }

        if (isAltHeadingMarker(headingCandidate)) {
            flushItem();
            if (!currentItem) {
                currentItem = { title: contentTail, content: [] };
            } else {
                currentItem.title = contentTail;
            }
            if (!contentTail) {
                expectItemTitle = true;
            }
            return;
        }

        if (isSubHeading(headingCandidate)) {
            flushItem();
            currentItem = { title: headingCandidate, content: [] };
            if (contentTail) {
                currentItem.content.push(contentTail);
            }
            return;
        }

        if (!currentSection) {
            currentSection = { title: '', items: [] };
        }

        if (!currentItem) {
            currentItem = { title: headingCandidate, content: [] };
            if (contentTail && contentTail !== headingCandidate) {
                currentItem.content.push(contentTail);
            }
            return;
        }

        currentItem.content.push(line);
    });

    flushSection();
    return sections;
}

function buildDevelopmentPlanText(items = []) {
    const lines = [];
    items.forEach((item) => {
        if (Array.isArray(item.content) && item.content.length > 0) {
            item.content.forEach((line) => {
                if (line) lines.push(line);
            });
            return;
        }
        if (item.title) {
            lines.push(item.title);
        }
    });
    return lines.join('\n');
}

function extractPlanTitleFromText(text = '') {
    if (!text || typeof text !== 'string') return '';
    const lines = text
        .split(/\r?\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/(?:\d+[\).\s-]*)?(gelişim planı|gelisim plani)\b\s*[:\-–—]?\s*(.*)$/i);
        if (!match) continue;
        const inlineTitle = (match[2] || '').trim();
        if (inlineTitle) {
            const firstPart = inlineTitle.split('|')[0].trim();
            return firstPart;
        }
        const nextLine = lines[i + 1];
        if (nextLine) return nextLine.trim();
        return '';
    }
    return '';
}

function buildDevelopmentPlanTitle(sections = [], rawText = '') {
    const normalizePlanTitle = (value = '') =>
        value.replace(/^(gelişim planı|gelisim plani)\b\s*[:\-–—]?\s*/i, '').trim();
    if (Array.isArray(sections) && sections.length > 0) {
        const firstSection = sections[0];
        if (firstSection?.title) return firstSection.title;
        const items = Array.isArray(firstSection?.items) ? firstSection.items : [];
        const planTitleItem = items.find((item) => /^(gelişim planı|gelisim plani)\b/i.test(item.title || ''));
        const fromContent = planTitleItem?.content?.[0]?.trim();
        if (fromContent) return fromContent;
        const fromTitle = normalizePlanTitle(planTitleItem?.title || '');
        if (fromTitle) return fromTitle;
    }
    const fallback = extractPlanTitleFromText(rawText);
    if (fallback) return fallback;
    if (rawText && typeof rawText === 'string') {
        const match = rawText.match(/gelişim planı\s*[:\-–—]\s*([^|\r\n]+)/i);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    return '';
}

const FALLBACK_PNG_BASE64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5n0WAAAAAASUVORK5CYII=';
const FALLBACK_PNG_BUFFER = Buffer.from(FALLBACK_PNG_BASE64, 'base64');

const evaluationController = {
    async getEvaluationById(req, res) {
        try {
            const { id } = req.params;
            
            // Multi-tenant: companyId kontrolü yap
            const companyFilter = getCompanyFilter(req);
            const evaluation = await EvaluationResult.findOne({ ID: id, ...companyFilter });
          
                if (!evaluation) {
                return res.status(404).json({ error: 'Değerlendirme bulunamadı' });
            }

            res.json(evaluation);
        } catch (error) {
            res.status(500).json({ error: 'Değerlendirme yüklenirken bir hata oluştu' });
        }
    },

    async generatePDF(req, res) {
        try {
            const { userCode, templateData = {}, templatePath } = req.body;

            if (!userCode) {
                return res.status(400).json({ message: 'userCode alanı zorunludur' });
            }

            let pdfBufferData;
            try {
                pdfBufferData = await buildPdfBufferFromTemplate(req, userCode, templateData, templatePath);
            } catch (error) {
                const statusCode = error?.statusCode || 500;
                return res.status(statusCode).json({ message: error.message || 'Word oluşturulurken bir hata oluştu' });
            }

            const pageCount = await getPdfPageCount(pdfBufferData);
            if (pageCount) {
                res.setHeader('x-pdf-pages', String(pageCount));
            }
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=evaluation_${userCode}_template.pdf`);
            res.send(pdfBufferData);
        } catch (error) {
            safeLog('error', 'PDF oluşturma hatası', error);
            res.status(500).json({ message: 'PDF oluşturulurken bir hata oluştu' });
        }
    },

    async generateWordFromTemplate(req, res) {
        try {
            const { userCode, templateData = {}, templatePath } = req.body;

            if (!userCode) {
                return res.status(400).json({ message: 'userCode alanı zorunludur' });
            }

            const companyFilter = getCompanyFilter(req);
            const filter = companyFilter.companyId ? { code: userCode, companyId: companyFilter.companyId } : { code: userCode };
            const userCodeData = await UserCode.findOne(filter);

            if (!userCodeData) {
                return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
            }

            const evaluationResults = await getEvaluationResultsByUserCode(userCode, companyFilter);
            const developmentText = extractDevelopmentSuggestionsText(evaluationResults);
            const developmentSections = splitDevelopmentSections(developmentText);

            const completionDate = userCodeData.completionDate ? new Date(userCodeData.completionDate) : null;
            const completionDayMonth = completionDate && !Number.isNaN(completionDate.getTime())
                ? completionDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
                : '-';
            const completionYear = completionDate && !Number.isNaN(completionDate.getTime())
                ? completionDate.toLocaleDateString('tr-TR', { year: 'numeric' })
                : '-';
            const completionFullDate = completionDate && !Number.isNaN(completionDate.getTime())
                ? completionDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                : '-';
            const currentYear = new Date().getFullYear().toString();
            const gameDuration = formatDuration(userCodeData.sentDate, completionDate);

            const gamesForAverage = await Game.find({ playerCode: userCode, ...companyFilter }).lean();
            const venusGame = (gamesForAverage || []).find((game) => game.section === '0' || game.section === 0);
            const titanGame = (gamesForAverage || []).find((game) => game.section === '1' || game.section === 1);

            const customerFocusScore = (venusGame ? venusGame.customerFocusScore : null) || userCodeData.customerFocusScore || '-';
            const uncertaintyScore = (venusGame ? venusGame.uncertaintyScore : null) || userCodeData.uncertaintyScore || '-';
            const ieScore = (titanGame ? titanGame.ieScore : null) || userCodeData.ieScore || '-';
            const idikScore = (titanGame ? titanGame.idikScore : null) || userCodeData.idikScore || '-';

            const scoreValues = [customerFocusScore, uncertaintyScore, ieScore, idikScore]
                .map((score) => {
                    const parsed = typeof score === 'number' ? score : parseFloat(score);
                    return Number.isFinite(parsed) ? parsed : null;
                })
                .filter((value) => value !== null);
            const averageScoreValue = scoreValues.length
                ? Math.round(scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length)
                : null;
            const averageScoreText = averageScoreValue !== null ? averageScoreValue.toString() : '-';

            const graphWidthPx = cmToPx(6.0);
            const graphHeightPx = cmToPx(0.45);
            const gaugeWidthPx = cmToPx(6.0);
            const gaugeHeightPx = cmToPx(3.0);

            const [g1Buffer, g2Buffer, g3Buffer, g4Buffer, avrGaugeBuffer] = await Promise.all([
                graphPngBuffer(normalizeScore(uncertaintyScore), graphWidthPx, graphHeightPx),
                graphPngBuffer(normalizeScore(customerFocusScore), graphWidthPx, graphHeightPx),
                graphPngBuffer(normalizeScore(ieScore), graphWidthPx, graphHeightPx),
                graphPngBuffer(normalizeScore(idikScore), graphWidthPx, graphHeightPx),
                gaugePngBuffer(averageScoreValue !== null ? averageScoreValue : 0, gaugeWidthPx, gaugeHeightPx)
            ]);

            const competencyConfigs = [
                { key: 'Yetkinlik_1', name: 'Uyumluluk ve Dayanıklılık', type: 'BY' },
                { key: 'Yetkinlik_2', name: 'Müşteri Odaklılık', type: 'MO' },
                { key: 'Yetkinlik_3', name: 'İnsanları Etkileme', type: 'IE' },
                { key: 'Yetkinlik_4', name: 'Güven Veren İşbirliği ve Sinerji', type: 'IDIK' }
            ];

            const getResultByType = (type) =>
                evaluationResults.find((result) => result?.type === type || result?.data?.type === type);
            const getExecutiveSummaryStrengths = (result) =>
                result?.data && typeof result.data === 'object'
                    ? result.data['Yönetici özeti güçlü yönleri'] || ''
                    : '';
            const getExecutiveSummaryDevelopment = (result) =>
                result?.data && typeof result.data === 'object'
                    ? result.data['Yönetici özeti geliştirme'] || ''
                    : '';
            const getGeneralEvaluation = (result) =>
                result?.data && typeof result.data === 'object'
                    ? result.data['Genel Değerlendirme'] || ''
                    : '';
            const getStrengths = (result) =>
                result?.data && typeof result.data === 'object'
                    ? result.data['Güçlü Yönler'] || ''
                    : '';
            const getDevelopmentAreas = (result) =>
                result?.data && typeof result.data === 'object'
                    ? result.data['Gelişim Alanları'] || ''
                    : '';
            const getInterviewQuestions = (result) =>
                result?.data && typeof result.data === 'object'
                    ? result.data['Mülakat Soruları'] || ''
                    : '';
            const getWhyTheseQuestions = (result) =>
                result?.data && typeof result.data === 'object'
                    ? result.data['Neden Bu Sorular?'] || ''
                    : '';
            const getDevelopmentPlan = (result) =>
                result?.data && typeof result.data === 'object'
                    ? result.data['Gelişim Önerileri -1'] ||
                      result.data['Gelişim Önerileri'] ||
                      result.data['Gelisim Onerileri'] ||
                      result.data['Gelişim Planı'] ||
                      result.data['Gelisim Plani'] ||
                      ''
                    : '';

            const competencyPayload = {};
            competencyConfigs.forEach((config) => {
                const result = getResultByType(config.type);
                competencyPayload[config.key] = config.name;
                competencyPayload[config.key.toLowerCase()] = config.name;
                competencyPayload[`${config.key}_executive_summary_strenghts`] = getExecutiveSummaryStrengths(result);
                competencyPayload[`${config.key}_executive_summary_development`] = getExecutiveSummaryDevelopment(result);
                competencyPayload[`${config.key.toLowerCase()}_executive_summary_strenghts`] =
                    getExecutiveSummaryStrengths(result);
                competencyPayload[`${config.key.toLowerCase()}_executive_summary_development`] =
                    getExecutiveSummaryDevelopment(result);
            });

            const getScoreByType = (type) => {
                if (type === 'BY') return uncertaintyScore;
                if (type === 'MO') return customerFocusScore;
                if (type === 'IE') return ieScore;
                if (type === 'IDIK') return idikScore;
                return null;
            };
            const competencyItems = competencyConfigs
                .map((config) => {
                    const result = getResultByType(config.type);
                    if (!result) return null;
                    return {
                        name: config.name,
                        generalEvaluation: getGeneralEvaluation(result),
                        score: getScoreByType(config.type)
                    };
                })
                .filter(Boolean);

            const developmentItems = competencyConfigs
                .map((config) => {
                    const result = getResultByType(config.type);
                    if (!result) return null;
                    return {
                        name: config.name,
                        strengths: stripTitleDetailLabels(getStrengths(result)),
                        development: stripTitleDetailLabels(getDevelopmentAreas(result)),
                        score: getScoreByType(config.type)
                    };
                })
                .filter(Boolean);

            const interviewItems = competencyConfigs
                .map((config) => {
                    const result = getResultByType(config.type);
                    if (!result) return null;
                    return {
                        name: config.name,
                        interviewQuestions: getInterviewQuestions(result),
                        whyTheseQuestions: getWhyTheseQuestions(result),
                        score: getScoreByType(config.type)
                    };
                })
                .filter(Boolean);

            const developmentPlanItems = competencyConfigs
                .map((config) => {
                    const result = getResultByType(config.type);
                    if (!result) return null;
                    return {
                        name: config.name,
                        planText: getDevelopmentPlan(result),
                        score: getScoreByType(config.type)
                    };
                })
                .filter(Boolean);
            safeLog('info', 'development_plan_source debug', developmentPlanItems.map((item) => ({
                competency_name: item.name,
                planText: (item.planText || '').slice(0, 60)
            })));

            const competencyPages = [];
            for (let i = 0; i < competencyItems.length; i += 2) {
                const pageIndex = Math.floor(i / 2);
                const totalPages = Math.ceil(competencyItems.length / 2);
                const leftItem = competencyItems[i] || { name: '', generalEvaluation: '' };
                const rightItem = competencyItems[i + 1] || { name: '', generalEvaluation: '' };
                competencyPages.push({
                    left: { ...leftItem },
                    right: { ...rightItem },
                    left_name: leftItem.name,
                    left_generalEvaluation: leftItem.generalEvaluation,
                    right_name: rightItem.name,
                    right_generalEvaluation: rightItem.generalEvaluation,
                    pageBreak: pageIndex < totalPages - 1
                  });
            }
            const pageGraphPromises = [];
            competencyPages.forEach((page, pageIndex) => {
                if (page.left && page.left.score !== null && page.left.score !== undefined) {
                    const key = `left_t1_${pageIndex}`;
                    page.left.t1 = key;
                    pageGraphPromises.push(
                        graphPngBuffer(normalizeScore(page.left.score), graphWidthPx, graphHeightPx).then((buf) => ({
                            key,
                            buf
                        }))
                    );
                } else if (page.left) {
                    page.left.t1 = '';
                }

                if (page.right && page.right.score !== null && page.right.score !== undefined) {
                    const key = `right_t1_${pageIndex}`;
                    page.right.t1 = key;
                    pageGraphPromises.push(
                        graphPngBuffer(normalizeScore(page.right.score), graphWidthPx, graphHeightPx).then((buf) => ({
                            key,
                            buf
                        }))
                    );
                } else if (page.right) {
                    page.right.t1 = '';
                }
            });

            const developmentPages = developmentItems.map((item, index) => {
                const totalPages = developmentItems.length;
                const page = {
                    competency_name: item.name,
                    left: {
                        strengths: item.strengths,
                        development: item.development
                    },
                    right: {
                        development: item.development
                    },
                    right_development: item.development,
                    pageBreak: index < totalPages - 1
                };
                if (item.score !== null && item.score !== undefined) {
                    const key = `development_t1_${index}`;
                    page.t1 = key;
                    page.left.t1 = key;
                    pageGraphPromises.push(
                        graphPngBuffer(normalizeScore(item.score), graphWidthPx, graphHeightPx).then((buf) => ({
                            key,
                            buf
                        }))
                    );
                } else {
                    page.t1 = '';
                    page.left.t1 = '';
                }
                return page;
            });
            safeLog('info', 'development_pages debug', developmentPages.map((page) => ({
                competency_name: page.competency_name,
                left_strengths: (page.left?.strengths || '').slice(0, 40),
                left_development: (page.left?.development || '').slice(0, 40),
                right_development: (page.right?.development || '').slice(0, 40),
                pageBreak: page.pageBreak
            })));

            const questionPages = interviewItems.map((item, index) => {
                const totalPages = interviewItems.length;
                const rows = parseInterviewQuestionsText(item.interviewQuestions);
                const baslik = buildInterviewColumnText(rows, (row) => row.developmentArea);
                const mulakat = buildInterviewColumnText(rows, (row) => row.interviewQuestion);
                const devam = buildInterviewColumnText(rows, (row) => row.followUpQuestions.join(' / '));
                return {
                    competency_name: item.name,
                    interviewQuestions_baslik: baslik,
                    interviewQuestions_mulakat_sorusu: mulakat,
                    interviewQuestions_devam_sorusu: devam,
                    followupQuestions: item.whyTheseQuestions || '',
                    pageBreak: index < totalPages - 1
                };
            });
            questionPages.forEach((page, index) => {
                const item = interviewItems[index];
                if (item && item.score !== null && item.score !== undefined) {
                    const key = `question_t1_${index}`;
                    page.t1 = key;
                    page.left = { ...(page.left || {}), t1: key };
                    pageGraphPromises.push(
                        graphPngBuffer(normalizeScore(item.score), graphWidthPx, graphHeightPx).then((buf) => ({
                            key,
                            buf
                        }))
                    );
                } else {
                    page.t1 = '';
                    page.left = { ...(page.left || {}), t1: '' };
                }
            });
            const questionFlat = {};
            questionPages.forEach((page, index) => {
                const idx = index + 1;
                questionFlat[`yetkinlik${idx}_interviewQuestions_baslik`] =
                    page.interviewQuestions_baslik || '';
                questionFlat[`yetkinlik${idx}_interviewQuestions_mulakat_sorusu`] =
                    page.interviewQuestions_mulakat_sorusu || '';
                questionFlat[`yetkinlik${idx}_interviewQuestions_devam_sorusu`] =
                    page.interviewQuestions_devam_sorusu || '';
                questionFlat[`yetkinlik${idx}_followupQuestions`] = page.followupQuestions || '';
                questionFlat[`yetkinlik${idx}_competency_name`] = page.competency_name || '';
            });
            safeLog('info', 'question_pages debug', questionPages.map((page) => ({
                competency_name: page.competency_name,
                baslik: (page.interviewQuestions_baslik || '').slice(0, 40),
                mulakat: (page.interviewQuestions_mulakat_sorusu || '').slice(0, 40),
                devam: (page.interviewQuestions_devam_sorusu || '').slice(0, 40),
                followup: (page.followupQuestions || '').slice(0, 40),
                pageBreak: page.pageBreak
            })));

            const developmentPlanPages = developmentPlanItems.map((item, index) => {
                const totalPages = developmentPlanItems.length;
                const sections = parseDevelopmentPlanText(item.planText || '');
                const allItems = sections.flatMap((section) => section.items || []);
                const planTitle = buildDevelopmentPlanTitle(sections, item.planText || '');
                const planTitleSource = planTitle
                    ? 'computed'
                    : (item.planText || '').split(/\r?\n+/).slice(0, 3).join(' | ');

                const isTraining = (value) => /eğitim|egitim/i.test(value);
                const isDaily = (value) =>
                    /günlük kullanım|gunluk kullanim|günlük işlerde kullanım|gunluk islerde kullanim/i.test(value);
                const isPodcast = (value) => /podcast|tedx/i.test(value);
                const isGoal = (value) => /hedef/i.test(value);
                const isPractice = (value) => /uygulama/i.test(value);

                const trainingItems = allItems.filter((row) => isTraining(row.title || ''));
                const dailyItems = allItems.filter((row) => isDaily(row.title || ''));
                const podcastItems = allItems.filter((row) => isPodcast(row.title || ''));
                const goalItems = allItems.filter((row) => isGoal(row.title || ''));
                const practiceItems = allItems.filter((row) => isPractice(row.title || ''));

                const page = {
                    competency_name: item.name,
                    gelisim_plani: planTitle || '',
                    Egitimler: buildDevelopmentPlanText(trainingItems),
                    GünlükKullanim: buildDevelopmentPlanText(dailyItems),
                    Podcast_TEDx: buildDevelopmentPlanText(podcastItems),
                    Hedef_SMARTKP: buildDevelopmentPlanText(goalItems),
                    Uygulama: buildDevelopmentPlanText(practiceItems),
                    _planTitleSource: planTitleSource,
                    pageBreak: index < totalPages - 1
                };
                addSafeKeys(page, page);
                if (!page.GunlukKullanim && page['GünlükKullanim']) {
                    page.GunlukKullanim = page['GünlükKullanim'];
                }
                if (item.score !== null && item.score !== undefined) {
                    const key = `devplan_t1_${index}`;
                    page.t1 = key;
                    page.left = { ...(page.left || {}), t1: key };
                    pageGraphPromises.push(
                        graphPngBuffer(normalizeScore(item.score), graphWidthPx, graphHeightPx).then((buf) => ({
                            key,
                            buf
                        }))
                    );
                } else {
                    page.t1 = '';
                    page.left = { ...(page.left || {}), t1: '' };
                }
                return page;
            });
            const pageGraphResults = await Promise.all(pageGraphPromises);
            const pageGraphBuffers = pageGraphResults.reduce((acc, item) => {
                acc[item.key] = item.buf;
                return acc;
            }, {});
            safeLog('info', 'development_plan_pages debug', developmentPlanPages.map((page) => ({
                competency_name: page.competency_name,
                gelisim_plani: (page.gelisim_plani || '').slice(0, 40),
                planTitleSource: (page._planTitleSource || '').slice(0, 80),
                Egitimler: (page.Egitimler || '').slice(0, 40),
                GünlükKullanim: (page.GünlükKullanim || '').slice(0, 40),
                Podcast_TEDx: (page.Podcast_TEDx || '').slice(0, 40),
                Hedef_SMARTKP: (page.Hedef_SMARTKP || '').slice(0, 40),
                Uygulama: (page.Uygulama || '').slice(0, 40),
                pageBreak: page.pageBreak
            })));
            const firstPage = competencyPages[0] || {
                left: { name: '', generalEvaluation: '' },
                right: { name: '', generalEvaluation: '' },
                left_name: '',
                right_name: '',
                left_generalEvaluation: '',
                right_generalEvaluation: ''
            };
            safeLog('info', 'yetkinlik_pages debug', competencyPages.map((page) => ({
                left: page.left?.name || '',
                right: page.right?.name || '',
                pageBreak: page.pageBreak
            })));

            const baseTemplatePayload = {
                ...competencyPayload,
                'ortalama_puan': averageScoreText,
                'kullanıcı_adı': userCodeData.name || '-',
                'pozisyon': '',
                'oyun_tamamlanma_tarih': completionFullDate,
                'yıl': currentYear,
                'g1': g1Buffer,
                'g2': g2Buffer,
                'g3': g3Buffer,
                'g4': g4Buffer,
                'avrScoreTable': avrGaugeBuffer,
                'Kullanıcı Adı Soyadı': userCodeData.name || '-',
                'Kullanıcı Pozisyon': '',
                'Kullanıcı Pozisyon ': '',
                'Oyun Süresi': gameDuration,
                'Oyun Tamamlama Gün ve ay': completionDayMonth,
                'Oyun Tamamlana Gün ve ay': completionDayMonth,
                'Oyun tamamlanma yıl': completionYear,
                'Günlük_Kullanım': developmentSections.Günlük_Kullanım || '',
                'Podcast': developmentSections.Podcast || '',
                'Eğitim_Önerileri': developmentSections.Eğitim_Önerileri || '',
                'Uygulama': developmentSections.Uygulama || '',
                'Hedef': developmentSections.Hedef || ''
            };

            const templatePayload = {
                ...baseTemplatePayload,
                'kullanici_adi': baseTemplatePayload['kullanıcı_adı'],
                'yil': baseTemplatePayload['yıl'],
                ...templateData,
                ...questionFlat,
                'g1': 'g1',
                'g2': 'g2',
                'g3': 'g3',
                'g4': 'g4',
                'avrScoreTable': 'avrScoreTable',
                'yetkinlik_pages': competencyPages,
                'development_pages': developmentPages,
                'question_pages': questionPages,
                'questions_pages': questionPages,
                'development_plan_pages': developmentPlanPages
            };

            addSafeKeys(baseTemplatePayload, templatePayload);
            addSafeKeys(templateData, templatePayload);

            const resolvedTemplatePath = templatePath || process.env.WORD_TEMPLATE_PATH || DEFAULT_WORD_TEMPLATE_PATH;
            if (!fs.existsSync(resolvedTemplatePath)) {
                return res.status(400).json({
                    message: 'Word template bulunamadı',
                    templatePath: resolvedTemplatePath
                });
            }
            safeLog('info', `Word template path: ${resolvedTemplatePath}`);

            const graphBuffers = {
                g1: g1Buffer,
                g2: g2Buffer,
                g3: g3Buffer,
                g4: g4Buffer,
                avrScoreTable: avrGaugeBuffer,
                ...pageGraphBuffers
            };
            console.error('Word image debug init', {
                graphWidthPx,
                graphHeightPx,
                gaugeWidthPx,
                gaugeHeightPx,
                g1: Buffer.isBuffer(g1Buffer) ? g1Buffer.length : 0,
                g2: Buffer.isBuffer(g2Buffer) ? g2Buffer.length : 0,
                g3: Buffer.isBuffer(g3Buffer) ? g3Buffer.length : 0,
                g4: Buffer.isBuffer(g4Buffer) ? g4Buffer.length : 0,
                avrScoreTable: Buffer.isBuffer(avrGaugeBuffer) ? avrGaugeBuffer.length : 0
            });
            const imageModule = new ImageModule({
                centered: false,
                fileType: 'docx',
                getImage: (tagValue, tagName) => {
                    console.error('Word image debug (getImage)', {
                        tagName,
                        tagValue: String(tagValue),
                        isBuffer: Buffer.isBuffer(tagValue)
                    });
                    
                    let resolved = tagValue;
                    if (!Buffer.isBuffer(resolved)) {
                        const valueKey = typeof tagValue === 'string' ? tagValue.trim() : '';
                        const nameKey = typeof tagName === 'string' ? tagName.trim() : '';
                        const lastToken = nameKey ? nameKey.split(/\s+/).pop() : '';
                        resolved =
                            graphBuffers[valueKey] ||
                            graphBuffers[nameKey] ||
                            graphBuffers[lastToken] ||
                            null;
                    }
                    if (!Buffer.isBuffer(resolved)) {
                        resolved = FALLBACK_PNG_BUFFER;
                    }
                    const size = Buffer.isBuffer(resolved) ? resolved.length : 0;
                    console.error('Word image debug (resolved)', {
                        tagName,
                        tagValue: String(tagValue),
                        bufferSize: size
                    });
                    return resolved;
                },
                getSize: (img, tagValue, tagName) => {
                    const key =
                        (typeof tagValue === 'string' ? tagValue.trim() : '') ||
                        (typeof tagName === 'string' ? tagName.trim() : '');
                    const size =
                        key === 'avrScoreTable' ? [gaugeWidthPx, gaugeHeightPx] : [graphWidthPx, graphHeightPx];
                    console.error('Word image debug (getSize)', {
                        tagName,
                        tagValue: String(tagValue),
                        size
                    });
                    return size;
                }
            });

            const content = fs.readFileSync(resolvedTemplatePath, 'binary');
            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
                modules: [imageModule],
                delimiters: { start: '{{', end: '}}' },
                nullGetter: () => "",
                parser,
            });
            const templateText = doc.getFullText ? doc.getFullText() : '';
            if (templateText) {
                safeLog('info', `Word template g1 tag found: ${templateText.includes('g1')}`);
            }

            doc.setData(templatePayload);
            doc.render();
            safeLog('info', 'Word render success');

            const buffer = doc.getZip().generate({ type: 'nodebuffer' });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', `attachment; filename=evaluation_${userCode}_template.docx`);
            res.send(buffer);
        } catch (error) {
            safeLog('error', 'Word template oluşturma hatası', error);
            const defaultMessage = 'Word oluşturulurken bir hata oluştu';
            let detailedMessage = getSafeErrorMessage ? getSafeErrorMessage(error, defaultMessage) : defaultMessage;

            if (error && error.properties && Array.isArray(error.properties.errors)) {
                safeLog('error', 'Word template errors', error.properties.errors);
                const docxErrors = error.properties.errors
                    .map((err) => err.properties && err.properties.explanation ? err.properties.explanation : err.message)
                    .filter(Boolean);
                if (docxErrors.length > 0) {
                    detailedMessage = docxErrors.join(' | ');
                }
            }

            res.status(500).json({ message: detailedMessage });
        }
    },

    previewPDF: async (req, res) => {
        try {
            const { code } = req.query;
            if (!code) {
                return res.status(400).json({ message: 'code alanı zorunludur' });
            }

            let pdfBufferData;
            try {
                pdfBufferData = await buildPdfBufferFromTemplate(req, code, {}, req.query.templatePath);
            } catch (error) {
                const statusCode = error?.statusCode || 500;
                return res.status(statusCode).json({ message: error.message || 'Word oluşturulurken bir hata oluştu' });
            }
            const pageCount = await getPdfPageCount(pdfBufferData);
            if (pageCount) {
                res.setHeader('x-pdf-pages', String(pageCount));
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=evaluation_${code}_template.pdf`);
            res.send(pdfBufferData);
        } catch (error) {
            safeLog('error', 'PDF önizleme hatası', error);
            res.status(500).json({ message: 'PDF oluşturulurken bir hata oluştu' });
        }
    },

    sharePDF: async (req, res) => {
        try {
            const { userCode, templateData = {}, templatePath } = req.body;
            if (!userCode) {
                return res.status(400).json({ message: 'userCode alanı zorunludur' });
            }

            const pdfBuffer = await buildPdfBufferFromTemplate(req, userCode, templateData, templatePath);
            const token = crypto.randomBytes(16).toString('hex');
            const filePath = path.join(SHARED_PDF_DIR, `${token}.pdf`);
            await fs.promises.writeFile(filePath, pdfBuffer);

            const expiresAt = Date.now() + SHARED_PDF_TTL_MS;
            sharedPdfStore.set(token, { filePath, expiresAt });

            res.json({
                url: `${getBaseUrl(req)}/api/shared-pdf/${token}`,
                expiresAt
            });
        } catch (error) {
            safeLog('error', 'PDF paylaşım hatası', error);
            res.status(500).json({ message: 'Paylaşım linki oluşturulurken bir hata oluştu' });
        }
    },

    getSharedPDF: async (req, res) => {
        try {
            const { token } = req.params;
            if (!token) {
                return res.status(400).json({ message: 'token alanı zorunludur' });
            }
            const entry = sharedPdfStore.get(token);
            if (!entry || entry.expiresAt <= Date.now()) {
                return res.status(404).json({ message: 'Paylaşım linki süresi dolmuş' });
            }
            if (!fs.existsSync(entry.filePath)) {
                sharedPdfStore.delete(token);
                return res.status(404).json({ message: 'Paylaşılan dosya bulunamadı' });
            }
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=shared_${token}.pdf`);
            res.sendFile(entry.filePath);
        } catch (error) {
            safeLog('error', 'Paylaşılan PDF getirme hatası', error);
            res.status(500).json({ message: 'Paylaşılan PDF alınamadı' });
        }
    },

    // Tüm değerlendirmeleri getir
    getAllEvaluations: async (req, res) => {
        try {
            // Multi-tenant: companyId kontrolü yap
            const companyFilter = getCompanyFilter(req);
            const evaluations = await EvaluationResult.find(companyFilter).sort({ createdAt: -1 });
            res.json(evaluations);
        } catch (error) {
            safeLog('error', 'Değerlendirmeleri getirme hatası', error);
            res.status(500).json({ error: 'Değerlendirmeler yüklenirken bir hata oluştu' });
        }
    }
};

// Yetenek türüne göre başlık belirleme fonksiyonu
function getReportTitle(type) {
    switch (type) {
        case 'BY': return 'Uyumluluk ve Dayanıklılık Raporu';
        case 'MO': return 'Müşteri Odaklılık Raporu';
        case 'IE': return 'İnsanları Etkileme Raporu';
        case 'IDIK': return 'Güven Veren İşbirliği ve Sinerji Raporu';
        default: return 'Bilinmeyen Yetenek Raporu';
    }
}

// Kullanıcı bilgilerini al
async function getUserInfo(userCode, companyId = null) {
    try {
        const filter = companyId ? { code: userCode, companyId } : { code: userCode };
        const userCodeData = await UserCode.findOne(filter);
        if (userCodeData) {
            return {
                name: userCodeData.name || 'Bilinmeyen',
                completionDate: userCodeData.completionDate || new Date(),
                sentDate: userCodeData.sentDate || null
            };
        }
        return {
            name: 'Bilinmeyen',
            completionDate: new Date(),
            sentDate: null
        };
    } catch (error) {
        safeLog('error', 'Kullanıcı bilgisi alınırken hata', error);
        return {
            name: 'Bilinmeyen',
            completionDate: new Date(),
            sentDate: null
        };
    }
}

function formatDuration(startDate, endDate) {
    if (!startDate || !endDate) return '-';
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '-';
    const diffMs = Math.max(0, end.getTime() - start.getTime());
    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    const parts = [];
    if (days > 0) parts.push(`${days} gün`);
    if (hours > 0) parts.push(`${hours} saat`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes} dakika`);
    return parts.join(' ');
}

async function getEvaluationResultsByUserCode(userCode, companyFilter) {
    const games = await Game.find({ playerCode: userCode, ...companyFilter });
    let allEvaluationResults = [];

    if (!games || games.length === 0) {
        const evaluation = await EvaluationResult.findOne({ ID: userCode, ...companyFilter });
        if (evaluation) {
            allEvaluationResults = Array.isArray(evaluation) ? evaluation : [evaluation];
        }
    } else {
        for (const game of games) {
            if (game.evaluationResult) {
                if (Array.isArray(game.evaluationResult)) {
                    allEvaluationResults = allEvaluationResults.concat(game.evaluationResult);
                } else {
                    allEvaluationResults.push(game.evaluationResult);
                }
            }
        }

        if (allEvaluationResults.length === 0) {
            const evaluation = await EvaluationResult.findOne({ ID: userCode, ...companyFilter });
            if (evaluation) {
                allEvaluationResults = Array.isArray(evaluation) ? evaluation : [evaluation];
            }
        }
    }

    const uniqueResults = [];
    const seenIds = new Set();

    for (const result of allEvaluationResults) {
        if (result && result.data && result.data.ID && !seenIds.has(result.data.ID)) {
            seenIds.add(result.data.ID);
            uniqueResults.push(result);
        }
    }

    return uniqueResults.length > 0 ? uniqueResults : allEvaluationResults;
}

function extractDevelopmentSuggestionsText(evaluationResults = []) {
    if (!Array.isArray(evaluationResults) || evaluationResults.length === 0) return '';

    const texts = [];
    for (const result of evaluationResults) {
        const data = result?.data;
        if (!data || typeof data !== 'object') continue;

        for (const key of Object.keys(data)) {
            if (/Gelişim\s*Önerileri/i.test(key)) {
                const value = data[key];
                if (typeof value === 'string' && value.trim()) {
                    texts.push(value.trim());
                }
            }
        }
    }

    return texts.join('\n\n');
}

function splitDevelopmentSections(text = '') {
    const empty = {
        'Günlük_Kullanım': '',
        'Podcast': '',
        'Eğitim_Önerileri': '',
        'Uygulama': '',
        'Hedef': ''
    };

    if (!text || typeof text !== 'string') return empty;

    const headingRegex = /(G[uü]nl[uü]k\s*Kullan[ıi]m|Podcast|E[ğg]itim\s*O[öo]nerileri|Uygulama|Hedef)\s*[:\-–]?\s*/gi;
    const matches = [];
    let match;

    while ((match = headingRegex.exec(text)) !== null) {
        matches.push({
            raw: match[1],
            index: match.index,
            length: match[0].length
        });
    }

    if (matches.length === 0) {
        return {
            ...empty,
            'Eğitim_Önerileri': text.trim()
        };
    }

    const normalize = (value) => value
        .toLowerCase()
        .replace(/[ıİ]/g, 'i')
        .replace(/[ğĞ]/g, 'g')
        .replace(/[üÜ]/g, 'u')
        .replace(/[şŞ]/g, 's')
        .replace(/[öÖ]/g, 'o')
        .replace(/[çÇ]/g, 'c')
        .replace(/\s+/g, '');

    const mapKey = (raw) => {
        const normalized = normalize(raw);
        if (normalized === 'gunlukkullanim') return 'Günlük_Kullanım';
        if (normalized === 'podcast') return 'Podcast';
        if (normalized === 'egitimönerileri' || normalized === 'egitimonerileri') return 'Eğitim_Önerileri';
        if (normalized === 'uygulama') return 'Uygulama';
        if (normalized === 'hedef') return 'Hedef';
        return null;
    };

    const result = { ...empty };
    for (let i = 0; i < matches.length; i++) {
        const current = matches[i];
        const next = matches[i + 1];
        const start = current.index + current.length;
        const end = next ? next.index : text.length;
        const content = text.slice(start, end).trim();
        const key = mapKey(current.raw);
        if (key && content) {
            result[key] = content;
        }
    }

    return result;
}

// Gezegen seçim sırasına göre raporları sıralama fonksiyonu
async function sortReportsByPlanetOrder(evaluation, userCode, companyId = null) {
    try {
        if (!userCode) return evaluation;
        
        const filter = companyId ? { code: userCode, companyId } : { code: userCode };
        const userCodeData = await UserCode.findOne(filter);
        if (!userCodeData || !userCodeData.allPlanets || userCodeData.allPlanets.length === 0) {
            return evaluation;
        }
        
        // Gezegen-yetenek eşleştirmesi
        const planetToSkills = {
            'venus': ['BY', 'MO'],
            'titan': ['IE', 'IDIK']
        };
        
        // Gezegen sırasına göre yetenekleri sırala
        const skillOrder = [];
        userCodeData.allPlanets.forEach(planet => {
            if (planetToSkills[planet]) {
                skillOrder.push(...planetToSkills[planet]);
            }
        });
        
        // Raporları gezegen sırasına göre sırala
        const sortedEvaluation = [...evaluation].sort((a, b) => {
            const aIndex = skillOrder.indexOf(a.type);
            const bIndex = skillOrder.indexOf(b.type);
            return aIndex - bIndex;
        });

        return sortedEvaluation;
        
    } catch (error) {
        safeLog('error', 'Gezegen sırası alınırken hata', error);
        return evaluation;
    }
}

async function generateAndSendWord(evaluation, options, res, userCode, companyId = null) {
    try {
        const sortedEvaluation = await sortReportsByPlanetOrder(evaluation, userCode, companyId);
        const userInfo = await getUserInfo(userCode, companyId);
        const formattedDate = userInfo.completionDate.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Metni satırlara bölüp her satır için ayrı Paragraph oluştur (PDF'deki buildContentRows mantığı)
        const buildWordParagraphs = (text = '', fontSize = 20, fontFamily = "Arial") => {
            if (!text) return [];
            const lines = text.split(/\r?\n/);
            return lines.map(line => {
                const trimmed = line.trim();
                if (!trimmed) {
                    // Boş satırlar için boş paragraph
                    return new Paragraph({
                        children: [new TextRun({ text: " ", size: fontSize, font: fontFamily })],
                        spacing: { after: 120 }
                    });
                }
                return new Paragraph({
                    children: [
                        new TextRun({
                            text: trimmed,
                            size: fontSize,
                            font: fontFamily
                        })
                    ],
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 120 }
                });
            });
        };

        // Footer oluştur
        const footer = new Footer({
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "ANDRON Game",
                            bold: true,
                            size: 10, 
                            color: "2c3e50"
                        })
                    ],
                    alignment: AlignmentType.RIGHT,
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "GİZLİ © ANDRON Game 2025, İzinsiz paylaşılamaz.    ",
                            size: 10, 
                            color: "666666"
                        }),
                        new TextRun({
                            children: [PageNumber.CURRENT],
                            size: 10, 
                            color: "666666"
                        }),
                        new TextRun({
                            text: " / ",
                            size: 10, 
                            color: "666666"
                        }),
                        new TextRun({
                            children: [PageNumber.TOTAL_PAGES],
                            size: 10, 
                            color: "666666"
                        })
                    ],
                    alignment: AlignmentType.RIGHT
                })
            ]
        });

        // Word belgesi oluştur - İlk section kapak sayfası olacak
        // Dinamik font boyutu hesaplama - sayfanın solundan sağına kadar uzanacak şekilde
        const pageWidth = 595; // A4 sayfa genişliği (pt)
        const margin = 100; // Sol ve sağ margin
        const availableWidth = pageWidth - margin;
        const titleFontSize = 64; 
        
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    // Boşluk için üst kısım - sayfa ortasına getirmek için
                    new Paragraph({
                        children: [new TextRun({ text: "" })],
                        spacing: { before: 3500, after: 0 }
                    }),
                    // Ana başlık - sağa yaslı, iki satır, gölgeli ve koyulaşan harfler
                    // DEĞERLENDİRME başlığı
                    new Paragraph({
                        children: "DEĞERLENDİRME".split('').map((char, index) => {
                            const totalChars = "DEĞERLENDİRME".length;
                            const intensity = index / (totalChars - 1);
                            const r = Math.round(204 + (204 - 204) * intensity); // CC0000 (sabit kırmızı)
                            const g = Math.round(0 + (0 - 0) * intensity);
                            const b = Math.round(0 + (0 - 0) * intensity);
                            const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                            return new TextRun({
                                text: char,
                                bold: true,
                                size: titleFontSize,
                                color: color,
                                font: "Cambria",
                                shading: {
                                    fill: "auto",
                                    type: "clear"
                                }
                            });
                        }),
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 0, after: 0 }
                    }),
                    // RAPORU başlığı
                    new Paragraph({
                        children: "RAPORU".split('').map((char, index) => {
                            const totalChars = "RAPORU".length;
                            const intensity = index / (totalChars - 1);
                            const r = Math.round(204 + (204 - 204) * intensity); // CC0000 (sabit kırmızı)
                            const g = Math.round(0 + (0 - 0) * intensity);
                            const b = Math.round(0 + (0 - 0) * intensity);
                            const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                            return new TextRun({
                                text: char,
                                bold: true,
                                size: titleFontSize,
                                color: color,
                                font: "Cambria",
                                shading: {
                                    fill: "auto",
                                    type: "clear"
                                }
                            });
                        }),
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 0, after: 300 }
                    }),
                    // Çizgi - yatay çizgi
                    new Paragraph({
                        children: [new TextRun({ text: "" })],
                        spacing: { before: 0, after: 200 },
                        border: {
                            bottom: {
                                color: "000000",
                                space: 1,
                                style: BorderStyle.SINGLE,
                                size: 6
                            }
                        }
                    }),
                    // İsim ve tarih - sağa yaslı
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: userInfo.name,
                                bold: true,
                                size: 24, 
                                color: "2c3e50",
                                font: "Cambria",
                                italics: true 
                            })
                        ],
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 200, after: 100 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: formattedDate,
                                size: 22,
                                color: "2c3e50",
                                font: "Cambria"
                            })
                        ],
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 0, after: 0 }
                    })
                ],
                footers: {
                    default: footer
                }
            }]
        });

        // Her yetkinlik için bölüm
        for (let i = 0; i < sortedEvaluation.length; i++) {
            const report = sortedEvaluation[i];
            const data = report.data;
            const reportTitle = getReportTitle(report.type);
            const competencyName = reportTitle.replace(' Raporu', '');

            // Skor hesaplama 
            let competencyScore = 0;
            const filter = companyId ? { playerCode: userCode, companyId } : { playerCode: userCode };
            const competencyGames = await Game.find(filter);
            
            switch (report.type) {
                case 'MO':
                    const venusGame = competencyGames.find(g => g.section === '0' || g.section === 0);
                    competencyScore = venusGame ? venusGame.customerFocusScore : 0;
                    break;
                case 'BY':
                    const venusGame2 = competencyGames.find(g => g.section === '0' || g.section === 0);
                    competencyScore = venusGame2 ? venusGame2.uncertaintyScore : 0;
                    break;
                case 'IE':
                    const titanGame = competencyGames.find(g => g.section === '1' || g.section === 1);
                    competencyScore = titanGame ? titanGame.ieScore : 0;
                    break;
                case 'IDIK':
                    const titanGame2 = competencyGames.find(g => g.section === '1' || g.section === 1);
                    competencyScore = titanGame2 ? titanGame2.idikScore : 0;
                    break;
                default:
                    competencyScore = 0;
            }
            
            competencyScore = (!competencyScore || competencyScore === '-') ? 0 : Math.round(parseFloat(competencyScore));
            
            let barColor = '#0286F7';
            if (competencyScore <= 37) barColor = '#FF0000';
            else if (competencyScore <= 65) barColor = '#FFD700';
            else if (competencyScore <= 89.99) barColor = '#00FF00';
            else barColor = '#FF0000';

            // Yetkinlik başlığı
            doc.addSection({
                properties: {},
                children: [
                    new Paragraph({
                        children: competencyName.split('').map((char, index) => {
                            const totalChars = competencyName.length;
                            const intensity = index / (totalChars - 1);
                            const r = Math.round(40 + (155 - 40) * intensity); // 283C9B'den başlayarak
                            const g = Math.round(60 + (60 - 60) * intensity);
                            const b = Math.round(155 + (155 - 155) * intensity);
                            const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                            return new TextRun({
                                text: char,
                                bold: true,
                                size: 100, 
                                color: color,
                                font: "Impact",
                                shading: {
                                    fill: "auto",
                                    type: "clear"
                                }
                            });
                        }),
                        alignment: AlignmentType.RIGHT, // Sağa yaslı
                        spacing: { before: 5040, after: 800 }, 
                        tabStops: [
                            {
                                type: "center",
                                position: 297 // A4 sayfa genişliğinin yarısı (pt cinsinden)
                            }
                        ]
                    })
                ],
                footers: {
                    default: footer
                }
            });

            // Skor gösterimi

            // İçerikler
            if (options.generalEvaluation && data['Genel Değerlendirme']) {
                doc.addSection({
                    properties: {},
                    children: [
                        // Yetkinlik adı ve progress bar - yan yana (görünmez tablo)
                        new Table({
                            width: {
                                size: 100,
                                type: WidthType.PERCENTAGE,
                            },
                            borders: {
                                top: { style: BorderStyle.NONE },
                                bottom: { style: BorderStyle.NONE },
                                left: { style: BorderStyle.NONE },
                                right: { style: BorderStyle.NONE },
                                insideHorizontal: { style: BorderStyle.NONE },
                                insideVertical: { style: BorderStyle.NONE }
                            },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [
                                                new Paragraph({
                                                    children: [
                                                        new TextRun({
                                                            text: competencyName,
                                                            bold: true,
                                                            size: 26,
                                                            color: "283c9b"
                                                        })
                                                    ],
                                                    alignment: AlignmentType.LEFT
                                                })
                                            ],
                                            width: {
                                                size: 80,
                                                type: WidthType.PERCENTAGE,
                                            },
                                            borders: {
                                                top: { style: BorderStyle.NONE },
                                                bottom: { style: BorderStyle.NONE },
                                                left: { style: BorderStyle.NONE },
                                                right: { style: BorderStyle.NONE }
                                            }
                                        }),
                                        new TableCell({
                                            children: [
                                                new Table({
                                                    width: {
                                                        size: 100,
                                                        type: WidthType.PERCENTAGE,
                                                    },
                                                    rows: [
                                                        new TableRow({
                                                            children: [
                                                                new TableCell({
                                                                    children: [
                                                                        new Paragraph({
                                                                            children: [
                                                                                new TextRun({
                                                                                    text: `${competencyScore}`,
                                                                                    bold: true,
                                                                                    size: 14,
                                                                                    color: "FFFFFF"
                                                                                })
                                                                            ],
                                                                            alignment: AlignmentType.CENTER,
                                                                            spacing: { before: 50, after: 50 }
                                                                        })
                                                                    ],
                                                                    width: {
                                                                        size: competencyScore,
                                                                        type: WidthType.PERCENTAGE,
                                                                    },
                                                                    shading: {
                                                                        fill: barColor.replace('#', ''),
                                                                        type: "clear"
                                                                    }
                                                                }),
                                                                new TableCell({
                                                                    children: [
                                                                        new Paragraph({
                                                                            children: [
                                                                                new TextRun({
                                                                                    text: " ",
                                                                                    size: 11
                                                                                })
                                                                            ],
                                                                            alignment: AlignmentType.CENTER,
                                                                            spacing: { before: 50, after: 50 }
                                                                        })
                                                                    ],
                                                                    width: {
                                                                        size: 100 - competencyScore,
                                                                        type: WidthType.PERCENTAGE,
                                                                    },
                                                                    shading: {
                                                                        fill: "E0E0E0",
                                                                        type: "clear"
                                                                    }
                                                                })
                                                            ],
                                                        }),
                                                    ],
                                                })
                                            ],
                                            width: {
                                                size: 20,
                                                type: WidthType.PERCENTAGE,
                                            },
                                            borders: {
                                                top: { style: BorderStyle.NONE },
                                                bottom: { style: BorderStyle.NONE },
                                                left: { style: BorderStyle.NONE },
                                                right: { style: BorderStyle.NONE }
                                            }
                                        })
                                    ],
                                }),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Genel Değerlendirme",
                                    bold: true,
                                    size: 24,
                                    color: "001c55"
                                })
                            ],
                            spacing: { before: 560, after: 200 }
                        }),
                        ...buildWordParagraphs(data['Genel Değerlendirme'], 20, "Arial")
                    ],
                    footers: {
                        default: footer
                    }
                });
            }

            if (options.strengths && data['Güçlü Yönler']) {
                doc.addSection({
                    properties: {},
                    children: [
                        // Yetkinlik adı ve progress bar - yan yana (görünmez tablo)
                        new Table({
                            width: {
                                size: 100,
                                type: WidthType.PERCENTAGE,
                            },
                            borders: {
                                top: { style: BorderStyle.NONE },
                                bottom: { style: BorderStyle.NONE },
                                left: { style: BorderStyle.NONE },
                                right: { style: BorderStyle.NONE },
                                insideHorizontal: { style: BorderStyle.NONE },
                                insideVertical: { style: BorderStyle.NONE }
                            },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [
                                                new Paragraph({
                                                    children: [
                                                        new TextRun({
                                                            text: competencyName,
                                                            bold: true,
                                                            size: 26,
                                                            color: "283c9b"
                                                        })
                                                    ],
                                                    alignment: AlignmentType.LEFT
                                                })
                                            ],
                                            width: {
                                                size: 70,
                                                type: WidthType.PERCENTAGE,
                                            },
                                            borders: {
                                                top: { style: BorderStyle.NONE },
                                                bottom: { style: BorderStyle.NONE },
                                                left: { style: BorderStyle.NONE },
                                                right: { style: BorderStyle.NONE }
                                            }
                                        }),
                                        new TableCell({
                                            children: [
                                                new Table({
                                                    width: {
                                                        size: 100,
                                                        type: WidthType.PERCENTAGE,
                                                    },
                                                    rows: [
                                                        new TableRow({
                                                            children: [
                                                                new TableCell({
                                                                    children: [
                                                                        new Paragraph({
                                                                            children: [
                                                                                new TextRun({
                                                                                    text: `${competencyScore}`,
                                                                                    bold: true,
                                                                                    size: 14,
                                                                                    color: "FFFFFF"
                                                                                })
                                                                            ],
                                                                            alignment: AlignmentType.CENTER,
                                                                            spacing: { before: 50, after: 50 }
                                                                        })
                                                                    ],
                                                                    width: {
                                                                        size: competencyScore,
                                                                        type: WidthType.PERCENTAGE,
                                                                    },
                                                                    shading: {
                                                                        fill: barColor.replace('#', ''),
                                                                        type: "clear"
                                                                    }
                                                                }),
                                                                new TableCell({
                                                                    children: [
                                                                        new Paragraph({
                                                                            children: [
                                                                                new TextRun({
                                                                                    text: " ",
                                                                                    size: 11
                                                                                })
                                                                            ],
                                                                            alignment: AlignmentType.CENTER,
                                                                            spacing: { before: 50, after: 50 }
                                                                        })
                                                                    ],
                                                                    width: {
                                                                        size: 100 - competencyScore,
                                                                        type: WidthType.PERCENTAGE,
                                                                    },
                                                                    shading: {
                                                                        fill: "E0E0E0",
                                                                        type: "clear"
                                                                    }
                                                                })
                                                            ],
                                                        }),
                                                    ],
                                                })
                                            ],
                                            width: {
                                                size: 30,
                                                type: WidthType.PERCENTAGE,
                                            },
                                            borders: {
                                                top: { style: BorderStyle.NONE },
                                                bottom: { style: BorderStyle.NONE },
                                                left: { style: BorderStyle.NONE },
                                                right: { style: BorderStyle.NONE }
                                            }
                                        })
                                    ],
                                }),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Güçlü Yönler",
                                    bold: true,
                                    size: 24,
                                    color: "001c55" 
                                })
                            ],
                            spacing: { before: 560, after: 200 } // Skor bar ile mesafe
                        }),
                        ...buildWordParagraphs(data['Güçlü Yönler'], 20, "Arial")
                    ],
                    footers: {
                        default: footer
                    }
                });
            }

            if (options.strengths && data['Gelişim Alanları']) {
                doc.addSection({
                    properties: {},
                    children: [
                        // Yetkinlik adı ve progress bar - yan yana (görünmez tablo)
                        new Table({
                            width: {
                                size: 100,
                                type: WidthType.PERCENTAGE,
                            },
                            borders: {
                                top: { style: BorderStyle.NONE },
                                bottom: { style: BorderStyle.NONE },
                                left: { style: BorderStyle.NONE },
                                right: { style: BorderStyle.NONE },
                                insideHorizontal: { style: BorderStyle.NONE },
                                insideVertical: { style: BorderStyle.NONE }
                            },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [
                                                new Paragraph({
                                                    children: [
                                                        new TextRun({
                                                            text: competencyName,
                                                            bold: true,
                                                            size: 26,
                                                            color: "283c9b"
                                                        })
                                                    ],
                                                    alignment: AlignmentType.LEFT
                                                })
                                            ],
                                            width: {
                                                size: 70,
                                                type: WidthType.PERCENTAGE,
                                            },
                                            borders: {
                                                top: { style: BorderStyle.NONE },
                                                bottom: { style: BorderStyle.NONE },
                                                left: { style: BorderStyle.NONE },
                                                right: { style: BorderStyle.NONE }
                                            }
                                        }),
                                        new TableCell({
                                            children: [
                                                new Table({
                                                    width: {
                                                        size: 100,
                                                        type: WidthType.PERCENTAGE,
                                                    },
                                                    rows: [
                                                        new TableRow({
                                                            children: [
                                                                new TableCell({
                                                                    children: [
                                                                        new Paragraph({
                                                                            children: [
                                                                                new TextRun({
                                                                                    text: `${competencyScore}`,
                                                                                    bold: true,
                                                                                    size: 14,
                                                                                    color: "FFFFFF"
                                                                                })
                                                                            ],
                                                                            alignment: AlignmentType.CENTER,
                                                                            spacing: { before: 50, after: 50 }
                                                                        })
                                                                    ],
                                                                    width: {
                                                                        size: competencyScore,
                                                                        type: WidthType.PERCENTAGE,
                                                                    },

                                                                    shading: {
                                                                        fill: barColor.replace('#', ''),
                                                                        type: "clear"
                                                                    }
                                                                }),
                                                                new TableCell({
                                                                    children: [
                                                                        new Paragraph({
                                                                            children: [
                                                                                new TextRun({
                                                                                    text: " ",
                                                                                    size: 11
                                                                                })
                                                                            ],
                                                                            alignment: AlignmentType.CENTER,
                                                                            spacing: { before: 50, after: 50 }
                                                                        })
                                                                    ],
                                                                    width: {
                                                                        size: 100 - competencyScore,
                                                                        type: WidthType.PERCENTAGE,
                                                                    },
                                                                    shading: {
                                                                        fill: "E0E0E0",
                                                                        type: "clear"
                                                                    }
                                                                })
                                                            ],
                                                        }),
                                                    ],
                                                })
                                            ],
                                            width: {
                                                size: 30,
                                                type: WidthType.PERCENTAGE,
                                            },
                                            borders: {
                                                top: { style: BorderStyle.NONE },
                                                bottom: { style: BorderStyle.NONE },
                                                left: { style: BorderStyle.NONE },
                                                right: { style: BorderStyle.NONE }
                                            }
                                        })
                                    ],
                                }),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Gelişim Alanları",
                                    bold: true,
                                    size: 24,
                                    color: "001c55" 
                                })
                            ],
                            spacing: { before: 560, after: 200 } // Skor bar ile mesafe
                        }),
                        ...buildWordParagraphs(data['Gelişim Alanları'], 20, "Arial")
                    ],
                    footers: {
                        default: footer
                    }
                });
            }

            if (options.interviewQuestions && data['Mülakat Soruları']) {
                doc.addSection({
                    properties: {},
                    children: [
                        // Yetkinlik adı ve progress bar - yan yana (görünmez tablo)
                        new Table({
                            width: {
                                size: 100,
                                type: WidthType.PERCENTAGE,
                            },
                            borders: {
                                top: { style: BorderStyle.NONE },
                                bottom: { style: BorderStyle.NONE },
                                left: { style: BorderStyle.NONE },
                                right: { style: BorderStyle.NONE },
                                insideHorizontal: { style: BorderStyle.NONE },
                                insideVertical: { style: BorderStyle.NONE }
                            },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [
                                                new Paragraph({
                                                    children: [
                                                        new TextRun({
                                                            text: competencyName,
                                                            bold: true,
                                                            size: 26,
                                                            color: "283c9b"
                                                        })
                                                    ],
                                                    alignment: AlignmentType.LEFT
                                                })
                                            ],
                                            width: {
                                                size: 70,
                                                type: WidthType.PERCENTAGE,
                                            },
                                            borders: {
                                                top: { style: BorderStyle.NONE },
                                                bottom: { style: BorderStyle.NONE },
                                                left: { style: BorderStyle.NONE },
                                                right: { style: BorderStyle.NONE }
                                            }
                                        }),
                                        new TableCell({
                                            children: [
                                                new Table({
                                                    width: {
                                                        size: 100,
                                                        type: WidthType.PERCENTAGE,
                                                    },
                                                    rows: [
                                                        new TableRow({
                                                            children: [
                                                                new TableCell({
                                                                    children: [
                                                                        new Paragraph({
                                                                            children: [
                                                                                new TextRun({
                                                                                    text: `${competencyScore}`,
                                                                                    bold: true,
                                                                                    size: 14,
                                                                                    color: "FFFFFF"
                                                                                })
                                                                            ],
                                                                            alignment: AlignmentType.CENTER,
                                                                            spacing: { before: 50, after: 50 }
                                                                        })
                                                                    ],
                                                                    width: {
                                                                        size: competencyScore,
                                                                        type: WidthType.PERCENTAGE,
                                                                    },
                                                                    shading: {
                                                                        fill: barColor.replace('#', ''),
                                                                        type: "clear"
                                                                    }
                                                                }),
                                                                new TableCell({
                                                                    children: [
                                                                        new Paragraph({
                                                                            children: [
                                                                                new TextRun({
                                                                                    text: " ",
                                                                                    size: 11
                                                                                })
                                                                            ],
                                                                            alignment: AlignmentType.CENTER,
                                                                            spacing: { before: 50, after: 50 }
                                                                        })
                                                                    ],
                                                                    width: {
                                                                        size: 100 - competencyScore,
                                                                        type: WidthType.PERCENTAGE,
                                                                    },
                                                                    shading: {
                                                                        fill: "E0E0E0",
                                                                        type: "clear"
                                                                    }
                                                                })
                                                            ],
                                                        }),
                                                    ],
                                                })
                                            ],
                                            width: {
                                                size: 30,
                                                type: WidthType.PERCENTAGE,
                                            },
                                            borders: {
                                                top: { style: BorderStyle.NONE },
                                                bottom: { style: BorderStyle.NONE },
                                                left: { style: BorderStyle.NONE },
                                                right: { style: BorderStyle.NONE }
                                            }
                                        })
                                    ],
                                }),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Mülakat Soruları",
                                    bold: true,
                                    size: 24,
                                    color: "001c55" 
                                })
                            ],
                            spacing: { before: 560, after: 200 } // Skor bar ile mesafe
                        }),
                        ...buildWordParagraphs(data['Mülakat Soruları'], 20, "Arial"),
                        // "Neden Bu Sorular?" bölümünü aynı sayfaya ekle
                        ...(options.whyTheseQuestions && data['Neden Bu Sorular?'] ? [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "Neden Bu Sorular?",
                                        bold: true,
                                        size: 24,
                                        color: "001c55" 
                                    })
                                ],
                                spacing: { before: 560, after: 200 } // Skor bar ile mesafe
                            }),
                            ...buildWordParagraphs(data['Neden Bu Sorular?'], 20, "Arial")
                        ] : [])
                    ],
                    footers: {
                        default: footer
                    }
                });
            }

            // "Neden Bu Sorular?" bölümü sadece "Mülakat Soruları" yoksa ayrı section olarak ekle
            if (options.whyTheseQuestions && data['Neden Bu Sorular?'] && (!options.interviewQuestions || !data['Mülakat Soruları'])) {
                doc.addSection({
                    properties: {},
                    children: [
                        // Yetkinlik adı ve progress bar - yan yana (görünmez tablo)
                        new Table({
                            width: {
                                size: 100,
                                type: WidthType.PERCENTAGE,
                            },
                            borders: {
                                top: { style: BorderStyle.NONE },
                                bottom: { style: BorderStyle.NONE },
                                left: { style: BorderStyle.NONE },
                                right: { style: BorderStyle.NONE },
                                insideHorizontal: { style: BorderStyle.NONE },
                                insideVertical: { style: BorderStyle.NONE }
                            },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [
                                                new Paragraph({
                                                    children: [
                                                        new TextRun({
                                                            text: competencyName,
                                                            bold: true,
                                                            size: 26,
                                                            color: "283c9b"
                                                        })
                                                    ],
                                                    alignment: AlignmentType.LEFT
                                                })
                                            ],
                                            width: {
                                                size: 70,
                                                type: WidthType.PERCENTAGE,
                                            },
                                            borders: {
                                                top: { style: BorderStyle.NONE },
                                                bottom: { style: BorderStyle.NONE },
                                                left: { style: BorderStyle.NONE },
                                                right: { style: BorderStyle.NONE }
                                            }
                                        }),
                                        new TableCell({
                                            children: [
                                                new Table({
                                                    width: {
                                                        size: 100,
                                                        type: WidthType.PERCENTAGE,
                                                    },
                                                    rows: [
                                                        new TableRow({
                                                            children: [
                                                                new TableCell({
                                                                    children: [
                                                                        new Paragraph({
                                                                            children: [
                                                                                new TextRun({
                                                                                    text: `${competencyScore}`,
                                                                                    bold: true,
                                                                                    size: 14,
                                                                                    color: "FFFFFF"
                                                                                })
                                                                            ],
                                                                            alignment: AlignmentType.CENTER,
                                                                            spacing: { before: 50, after: 50 }
                                                                        })
                                                                    ],
                                                                    width: {
                                                                        size: competencyScore,
                                                                        type: WidthType.PERCENTAGE,
                                                                    },
                                                                    shading: {
                                                                        fill: barColor.replace('#', ''),
                                                                        type: "clear"
                                                                    }
                                                                }),
                                                                new TableCell({
                                                                    children: [
                                                                        new Paragraph({
                                                                            children: [
                                                                                new TextRun({
                                                                                    text: " ",
                                                                                    size: 11
                                                                                })
                                                                            ],
                                                                            alignment: AlignmentType.CENTER,
                                                                            spacing: { before: 50, after: 50 }
                                                                        })
                                                                    ],
                                                                    width: {
                                                                        size: 100 - competencyScore,
                                                                        type: WidthType.PERCENTAGE,
                                                                    },
                                                                    shading: {
                                                                        fill: "E0E0E0",
                                                                        type: "clear"
                                                                    }
                                                                })
                                                            ],
                                                        }),
                                                    ],
                                                })
                                            ],
                                            width: {
                                                size: 30,
                                                type: WidthType.PERCENTAGE,
                                            },
                                            borders: {
                                                top: { style: BorderStyle.NONE },
                                                bottom: { style: BorderStyle.NONE },
                                                left: { style: BorderStyle.NONE },
                                                right: { style: BorderStyle.NONE }
                                            }
                                        })
                                    ],
                                }),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Neden Bu Sorular?",
                                    bold: true,
                                    size: 24,
                                    color: "001c55" 
                                })
                            ],
                            spacing: { before: 560, after: 200 } // Skor bar ile mesafe
                        }),
                        ...buildWordParagraphs(data['Neden Bu Sorular?'], 20, "Arial")
                    ],
                    footers: {
                        default: footer
                    }
                });
            }

            if (options.developmentSuggestions && data['Gelişim Önerileri -1']) {
                doc.addSection({
                    properties: {},
                    children: [
                        // Yetkinlik adı ve progress bar - yan yana (görünmez tablo)
                        new Table({
                            width: {
                                size: 100,
                                type: WidthType.PERCENTAGE,
                            },
                            borders: {
                                top: { style: BorderStyle.NONE },
                                bottom: { style: BorderStyle.NONE },
                                left: { style: BorderStyle.NONE },
                                right: { style: BorderStyle.NONE },
                                insideHorizontal: { style: BorderStyle.NONE },
                                insideVertical: { style: BorderStyle.NONE }
                            },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [
                                                new Paragraph({
                                                    children: [
                                                        new TextRun({
                                                            text: competencyName,
                                                            bold: true,
                                                            size: 20,
                                                            color: "283c9b"
                                                        })
                                                    ],
                                                    alignment: AlignmentType.LEFT
                                                })
                                            ],
                                            width: {
                                                size: 60,
                                                type: WidthType.PERCENTAGE,
                                            },
                                            borders: {
                                                top: { style: BorderStyle.NONE },
                                                bottom: { style: BorderStyle.NONE },
                                                left: { style: BorderStyle.NONE },
                                                right: { style: BorderStyle.NONE }
                                            }
                                        }),
                                        new TableCell({
                                            children: [
                                                new Table({
                                                    width: {
                                                        size: 100,
                                                        type: WidthType.PERCENTAGE,
                                                    },
                                                    rows: [
                                                        new TableRow({
                                                            children: [
                                                                new TableCell({
                                                                    children: [
                                                                        new Paragraph({
                                                                            children: [
                                                                                new TextRun({
                                                                                    text: `${competencyScore}`,
                                                                                    bold: true,
                                                                                    size: 14,
                                                                                    color: "FFFFFF"
                                                                                })
                                                                            ],
                                                                            alignment: AlignmentType.CENTER,
                                                                            spacing: { before: 50, after: 50 }
                                                                        })
                                                                    ],
                                                                    width: {
                                                                        size: competencyScore,
                                                                        type: WidthType.PERCENTAGE,
                                                                    },
                                                                    verticalAlign: "bottom",
                                                                    shading: {
                                                                        fill: barColor.replace('#', ''),
                                                                        type: "clear"
                                                                    }
                                                                }),
                                                                new TableCell({
                                                                    children: [
                                                                        new Paragraph({
                                                                            children: [
                                                                                new TextRun({
                                                                                    text: " ",
                                                                                    size: 11
                                                                                })
                                                                            ],
                                                                            alignment: AlignmentType.CENTER,
                                                                            spacing: { before: 50, after: 50 }
                                                                        })
                                                                    ],
                                                                    width: {
                                                                        size: 100 - competencyScore,
                                                                        type: WidthType.PERCENTAGE,
                                                                    },
                                                                    shading: {
                                                                        fill: "E0E0E0",
                                                                        type: "clear"
                                                                    }
                                                                })
                                                            ],
                                                        }),
                                                    ],
                                                })
                                            ],
                                            width: {
                                                size: 40,
                                                type: WidthType.PERCENTAGE,
                                            },
                                            borders: {
                                                top: { style: BorderStyle.NONE },
                                                bottom: { style: BorderStyle.NONE },
                                                left: { style: BorderStyle.NONE },
                                                right: { style: BorderStyle.NONE }
                                            }
                                        })
                                    ],
                                }),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: 'Gelişim Önerileri',
                                    bold: true,
                                    size: 24,
                                    color: "001c55" 
                                })
                            ],
                            spacing: { before: 560, after: 200 } // Skor bar ile mesafe
                        }),
                        ...buildWordParagraphs(data['Gelişim Önerileri -1'], 20, "Arial")
                    ],
                    footers: {
                        default: footer
                    }
                });
            }
        }

        // Word dosyasını oluştur ve gönder
        const buffer = await Packer.toBuffer(doc);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=evaluation_${evaluation[0].data.ID}.docx`);
        res.send(buffer);
        
    } catch (error) {
        console.error('Word oluşturma hatası:', error);
        res.status(500).json({ message: 'Word oluşturulurken bir hata oluştu' });
    }
}

module.exports = evaluationController; 