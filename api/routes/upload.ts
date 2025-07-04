import { Hono } from 'hono';
import ExcelJS from 'exceljs';
import { randomUUID } from 'crypto';
import { progressStore } from '../utils/progressStore';

const REQUIRED_SHEETS = [
  'RESULTADO',
  'CONTABIL',
  'FICTICIO',
  'SALDO_MEDIO',
  'SALDO_PONTA',
] as const;

interface FinancialData {
  cod: number;
  seg: string;
  file: string;
  sheet: string;
  [key: string]: unknown;
}

const upload = new Hono();

upload.post('/', async (ctx) => {
  const formData = await ctx.req.formData();
  const file = formData.get('file') as File;
  if (!file || !file.name.endsWith('.xlsx')) {
    return ctx.json({ error: 'Invalid file type' }, 400);
  }
  const jobId = randomUUID();
  progressStore.set(jobId, { status: 'processing', progress: 0 });
  processFile(file, jobId);
  return ctx.json({ jobId });
});

async function processFile(file: File, jobId: string) {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(buffer);
    const allSheetsData = new Map<string, FinancialData[]>();
    for await (const worksheet of workbookReader) {
      const sheetName = worksheet.name;
      if (!REQUIRED_SHEETS.includes(sheetName as any)) continue;
      const sheetData: FinancialData[] = [];
      let headers: string[] = [];
      for await (const row of worksheet) {
        const values = row.values.slice(1);
        if (row.number === 1) {
          headers = values.map((v) => String(v));
          continue;
        }
        const rowObj: Record<string, unknown> = {};
        headers.forEach((key, i) => {
          rowObj[key] = values[i];
        });
        const financialRow: FinancialData = {
          ...(rowObj as Record<string, unknown>),
          sheet: sheetName,
        };
        sheetData.push(financialRow);
      }
      allSheetsData.set(sheetName, sheetData);
      progressStore.set(jobId, {
        status: 'processing',
        // progress: Math.round((REQUIRED_SHEETS.indexOf(sheetName) / REQUIRED_SHEETS.length) * 90),
        progress: 40,
      });
    }
    const result: Record<string, FinancialData[]> = Object.fromEntries(allSheetsData);
    progressStore.set(jobId, {
      status: 'done',
      progress: 100,
      sheets: result,
    });
  } catch (err) {
    progressStore.set(jobId, {
      status: 'error',
      progress: 0,
      error: (err as Error).message,
    });
  }
}

export default upload;
