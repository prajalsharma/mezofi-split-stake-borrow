// backend/src/ocrService.js
import Tesseract from 'tesseract.js';
import fetch from 'node-fetch';

const OCR_PROVIDER = process.env.OCR_PROVIDER || 'tesseract';
const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;

async function googleVisionOCR(imageBuffer) {
  // TODO: Implement Google Vision API OCR call using API key
  const base64Image = imageBuffer.toString('base64');
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;
  const body = {
    requests: [
      {
        image: { content: base64Image },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }]
      }
    ]
  };
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  const text = data?.responses?.[0]?.fullTextAnnotation?.text || '';
  return text;
}

async function tesseractOCR(imageBuffer) {
  const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng');
  return text;
}

// Simple regex fallback extractor
function simpleParse(text) {
  const merchantMatch = text.match(/^\s*(.*?)\s*$/m);
  const dateMatch = text.match(/\b(\d{4}[-\/]\d{2}[-\/]\d{2})\b/);
  const totalMatch = text.match(/\b\d+[.,]?\d*\b/);

  return {
    merchant: merchantMatch ? merchantMatch[1] : 'Unknown',
    date: dateMatch ? dateMatch[1] : null,
    total: totalMatch ? parseFloat(totalMatch[0]) : 0,
    rawText: text
  };
}

export async function parseReceipt(imageBuffer) {
  let text = '';
  if (OCR_PROVIDER === 'google' && GOOGLE_VISION_API_KEY) {
    text = await googleVisionOCR(imageBuffer);
  } else {
    text = await tesseractOCR(imageBuffer);
  }

  const parsed = simpleParse(text);
  return {
    merchant: parsed.merchant,
    date: parsed.date,
    total: parsed.total,
    items: [], // placeholder - real parsing can extract line items
    rawText: parsed.rawText
  };
}

