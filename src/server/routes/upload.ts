import { Hono } from "hono";
import ExcelJS from "exceljs";
import { Buffer } from "node:buffer";
import { Readable } from "node:stream";
import type { FinancialData } from '../utils/types';
import { zip, fromEntries, merge } from 'remeda'
import { writeTeamParquet } from "../db/index";

const REQUIRED_SHEETS = [
  "RESULTADO",
  "CONTABIL",
  "FICTICIO",
  "SALDO_MEDIO",
  "SALDO_PONTA",
] as const;

// await writeTeamParquet({ teamId, sheet: sheetObj.sheet, headers, rows: sheetData });

const upload = new Hono();

const progressStore = new Map<string, { progress: number; status: string }>()

upload.get('/progress/:jobId', (ctx) => {
  const jobId = ctx.req.param('jobId')
  const { progress = 5, status = 'uploading' } = progressStore.get(jobId) ?? {}
  return ctx.json({ progress, status })
})

upload.post("/", async (ctx) => {
  const formData = await ctx.req.formData();
  const jobId = formData.get("jobId") as string;
  const file = formData.get("file") as File;
  if (!file || !file.name.endsWith(".xlsx")) {
    return ctx.json({ error: "Invalid file type" }, 400);
  }
  const result = await processFile(file, jobId);
  return ctx.json({ sheets: result });
});

async function processFile(
  file: File, jobId: string
): Promise<Record<string, FinancialData[]>> {
  try {
    progressStore.set(jobId, { progress: 10, status: 'reading' })
    const stream = Readable.from(Buffer.from(await file.arrayBuffer()));
    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(stream, {});
    const allSheetsData = new Map<string, FinancialData[]>();
    const foundSheets = new Set<string>();
    for await (const worksheet of workbookReader) {
      const sheetObj = {'sheet': worksheet.name}
      if (!REQUIRED_SHEETS.includes(sheetObj.sheet)) continue;
      foundSheets.add(sheetObj.sheet);
      progressStore.set(jobId, {
        progress: Math.round((REQUIRED_SHEETS.indexOf(sheetObj.sheet) / REQUIRED_SHEETS.length) * 80) + 15,
        status: 'processing'
      })
      const sheetData: FinancialData[] = [];
      let headers: string[] = [];
      for await (const row of worksheet) {
        const values = row.values.slice(1);
        if (row.number === 1) {
          headers = values.map(String)
          continue;
        } 
        sheetData.push(merge(fromEntries(zip(headers, values)), sheetObj));
      }
      allSheetsData.set(sheetObj.sheet, sheetData);
    }
    progressStore.set(jobId, { progress: 90, status: 'validating' })
    // validate all required sheets are present
    const missingSheets = REQUIRED_SHEETS.filter(sheet => !foundSheets.has(sheet))
    if (missingSheets.length > 0) {
      throw new Error(`Missing required sheets: ${missingSheets.join(', ')}`)
    }
    progressStore.set(jobId, { progress: 100, status: 'done' })
    return Object.fromEntries(allSheetsData)
  } catch (err) {
    throw new Error((err as Error).message);
  }
}

export default upload;
