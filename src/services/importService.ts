import * as XLSX from 'xlsx';
import { inferAccountFromMethod } from '../data/initialData';
import {
  Account,
  ExpenseNature,
  ImportPreviewRow,
  ImportSummary,
  Transaction,
  TransactionType,
} from '../types/finance';
import { computeAccountBalances, computeKpis } from '../utils/calculations';
import {
  getMonthKey,
  getMonthLabel,
  MONTH_LOOKUP,
  parseBulanToPeriodKey,
  parseCurrencyString,
} from '../utils/formatMoney';

import { validateFinanceDataset } from '../utils/validation';

const HEADER_ALIASES: Record<string, string> = {
  id: 'id',
  no_transaksi: 'id',
  transaction_id: 'id',
  kode_transaksi: 'id',

  transfer_id: 'transferId',
  transferid: 'transferId',
  id_transfer: 'transferId',
  kode_transfer: 'transferId',

  tanggal: 'tanggal',
  date: 'tanggal',
  tgl: 'tanggal',
  waktu: 'tanggal',

  tipe: 'tipe',
  type: 'tipe',
  jenis_transaksi: 'tipe',

  kategori: 'kategori',
  category: 'kategori',
  pos: 'kategori',

  metode: 'metode',
  method: 'metode',
  metode_pembayaran: 'metode',
  metodepembayaran: 'metode',
  payment_method: 'metode',
  pembayaran: 'metode',

  akun: 'akun',
  account: 'akun',
  dompet: 'akun',
  rekening: 'akun',
  sumber_dana: 'akun',

  pemasukan: 'masuk',
  masuk: 'masuk',
  income: 'masuk',
  kredit: 'masuk',
  uang_masuk: 'masuk',
  debit_masuk: 'masuk',

  pengeluaran: 'keluar',
  keluar: 'keluar',
  expense: 'keluar',
  debit: 'keluar',
  uang_keluar: 'keluar',

  keterangan: 'keterangan',
  description: 'keterangan',
  catatan: 'keterangan',
  note: 'keterangan',
  uraian: 'keterangan',
  deskripsi: 'keterangan',

  jenispengeluaran: 'jenisPengeluaran',
  jenis_pengeluaran: 'jenisPengeluaran',
  jenis: 'jenisPengeluaran',
  nature: 'jenisPengeluaran',
  tipe_pengeluaran: 'jenisPengeluaran',

  saldo: 'saldo',
  balance: 'saldo',
  sisa_saldo: 'saldo',

  bulan: 'bulan',
  month: 'bulan',
  periode: 'bulan',
};

function normalizeHeader(header: string): string {
  const cleaned = header
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return HEADER_ALIASES[cleaned] || cleaned;
}

function normalizeDate(raw: unknown): string {
  if (raw === null || raw === undefined || raw === '') return '';

  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, '0');
    const d = String(raw.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Excel serial number date (including fractional time part)
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 1000 && raw < 200000) {
    const parsed = XLSX.SSF.parse_date_code(Math.floor(raw));
    if (parsed && parsed.y && parsed.m && parsed.d) {
      return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
  }

  let str = String(raw).trim();
  if (!str) return '';

  // Numeric string representing Excel serial date
  if (/^\d{5}(\.\d+)?$/.test(str)) {
    const serial = Math.floor(Number(str));
    if (serial > 1000 && serial < 200000) {
      const parsed = XLSX.SSF.parse_date_code(serial);
      if (parsed && parsed.y && parsed.m && parsed.d) {
        return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
      }
    }
  }

  // Strip optional Indonesian/English weekday prefix e.g. "Senin, 16 November 2026"
  str = str.replace(/^[a-zA-Z]+,\s*/, '');

  // YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})(?:\s.*)?$/);
  if (dmyMatch) {
    const part1 = parseInt(dmyMatch[1], 10);
    const part2 = parseInt(dmyMatch[2], 10);
    let year = dmyMatch[3];
    if (year.length === 2) year = `20${year}`;

    // Standard Indonesian DD/MM/YYYY; if part2 > 12 and part1 <= 12, swap as MM/DD/YYYY
    let day = part1;
    let month = part2;
    if (month > 12 && day <= 12) {
      day = part2;
      month = part1;
    }
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Indonesian or English month name: "16 November 2026", "16 Nov 2026", "16-Nov-2026"
  const dMonthY = str.match(/^(\d{1,2})[\s-]+([a-zA-Z]+)[\s,-]+(\d{2,4})/);
  if (dMonthY) {
    const day = parseInt(dMonthY[1], 10);
    const monthNum = MONTH_LOOKUP[dMonthY[2].toLowerCase()];
    let year = dMonthY[3];
    if (year.length === 2) year = `20${year}`;
    if (monthNum && day >= 1 && day <= 31) {
      return `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Month Day, Year: "November 16, 2026"
  const monthDY = str.match(/^([a-zA-Z]+)\s+(\d{1,2})[,\s]+(\d{4})/);
  if (monthDY) {
    const monthNum = MONTH_LOOKUP[monthDY[1].toLowerCase()];
    const day = parseInt(monthDY[2], 10);
    const year = monthDY[3];
    if (monthNum && day >= 1 && day <= 31) {
      return `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const parsedDate = new Date(str);
  if (!Number.isNaN(parsedDate.getTime())) {
    const y = parsedDate.getFullYear();
    const m = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const d = String(parsedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return '';
}

function isTotalRow(values: unknown[]): boolean {
  return values.some((val) => {
    if (typeof val !== 'string') return false;
    const trimmed = val.trim().toLowerCase();
    return (
      trimmed === 'total' ||
      trimmed === 'grand total' ||
      trimmed === 'jumlah total' ||
      trimmed.startsWith('total ') ||
      trimmed.startsWith('total:')
    );
  });
}

function findHeaderRowIndex(matrix: unknown[][]): number {
  const limit = Math.min(20, matrix.length);
  for (let i = 0; i < limit; i += 1) {
    const row = matrix[i] || [];
    const normalized = row.map((cell) => normalizeHeader(String(cell ?? '')));
    const hasTanggal = normalized.includes('tanggal');
    const hasFinancialCol =
      normalized.includes('masuk') ||
      normalized.includes('keluar') ||
      normalized.includes('keterangan');
    if (hasTanggal && hasFinancialCol) {
      return i;
    }
  }
  return 0;
}

function parseSemicolonCsvFallback(text: string): unknown[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  return lines.map((line) => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ';' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  });
}

function buildRowSignature(row: {
  tanggal: string;
  tipe: TransactionType;
  kategori: string;
  jenisPengeluaran: string;
  metode: string;
  akun: string;
  masuk: number;
  keluar: number;
  keterangan: string;
}): string {
  return [
    row.tanggal,
    row.tipe,
    row.kategori.toLowerCase().trim(),
    String(row.jenisPengeluaran || '').toLowerCase().trim(),
    row.metode.toLowerCase().trim(),
    row.akun.toLowerCase().trim(),
    Number(row.masuk) || 0,
    Number(row.keluar) || 0,
    row.keterangan.toLowerCase().trim(),
  ].join('|');
}

function normalizeExpenseNatureFromImport(params: {
  rawJenis: string;
  kategori: string;
  tipe: TransactionType;
}): ExpenseNature {
  const { rawJenis, kategori, tipe } = params;
  const katLower = kategori.toLowerCase().trim();
  const jenisLower = rawJenis.toLowerCase().trim();

  if (katLower === 'transfer' || jenisLower === 'transfer') {
    return 'Transfer';
  }
  if (katLower === 'tabungan' || jenisLower === 'tabungan') {
    return 'Tabungan';
  }
  if (tipe === 'Pemasukan') {
    return 'Pemasukan';
  }
  if (jenisLower === 'kebutuhan') return 'Kebutuhan';
  if (jenisLower === 'keinginan') return 'Keinginan';
  if (jenisLower === 'pemasukan') return 'Pemasukan';
  if (jenisLower === 'perlu ditinjau' || jenisLower === 'tidak jelas') return 'Perlu Ditinjau';

  // Jangan menebak atau memaksa menjadi Kebutuhan/Keinginan tanpa dasar dari kolom Jenis
  return 'Perlu Ditinjau';
}

/**
 * Normalisasi nama akun tepat ke: Cash, ShopeePay, SeaBank (atau nama akun valid dari kolom Akun).
 * Tidak pernah membuat akun bernama QRIS atau Tunai.
 */
function normalizeImportedAccount(params: {
  akunRaw: string;
  metode: string;
  keterangan: string;
  kategori: string;
  masuk: number;
  keluar: number;
}): string {
  const { akunRaw, metode, keterangan, kategori, masuk, keluar } = params;
  const ket = keterangan.toLowerCase();
  const kat = kategori.toLowerCase().trim();
  const met = metode.toLowerCase().trim();
  const akunLower = akunRaw.toLowerCase().trim();

  // 1. Jika kolom Akun di XLSX sudah valid (selain QRIS/Tunai yang merupakan metode), hormati & normalkan kapitalisasinya
  if (akunLower === 'cash') return 'Cash';
  if (akunLower === 'shopeepay' || akunLower === 'shopee pay') return 'ShopeePay';
  if (akunLower === 'seabank' || akunLower === 'sea bank' || akunLower === 'seabank bank') {
    return 'SeaBank';
  }

  // 2. Jika Akun kosong atau salah isi dengan nama metode ("Tunai" / "QRIS"), petakan sesuai aturan:
  if (met === 'qris' || akunLower === 'qris' || met === 'shopeepay' || met === 'shopee pay') {
    return 'ShopeePay';
  }

  if (
    kat === 'tabungan' ||
    ket.includes('seabank') ||
    ket.includes('sea bank')
  ) {
    if (keluar > 0 && masuk === 0) return 'Cash';
    return 'SeaBank';
  }

  if (kat === 'transfer' || ket.includes('top up shopeepay')) {
    if (masuk > 0 && keluar === 0) return 'ShopeePay';
    if (keluar > 0 && masuk === 0) return 'Cash';
  }

  if (met === 'tunai' || met === 'cash' || akunLower === 'tunai') return 'Cash';

  if (akunRaw.trim() && akunLower !== 'qris' && akunLower !== 'tunai') {
    return akunRaw.trim();
  }
  return inferAccountFromMethod(metode);
}

export interface ParsedImportResult {
  fileName: string;
  fileType: 'XLSX' | 'XLS' | 'CSV';
  sheetName?: string;
  totalRowsRead: number;
  rows: ImportPreviewRow[];
  failedRows: { rowNumber: number; reason: string }[];
  error?: string;
}

export async function parseImportFile(
  file: File,
  existingTransactions: Transaction[] = []
): Promise<ParsedImportResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!['xlsx', 'xls', 'csv'].includes(ext)) {
    return {
      fileName: file.name,
      fileType: 'CSV',
      totalRowsRead: 0,
      rows: [],
      failedRows: [],
      error: 'Format file tidak didukung. Gunakan file .xlsx, .xls, atau .csv.',
    };
  }

  const fileType = ext === 'xlsx' ? 'XLSX' : ext === 'xls' ? 'XLS' : 'CSV';

  try {
    let rawMatrix: unknown[][] = [];
    let selectedSheetName: string | undefined;

    if (fileType === 'CSV') {
      const text = await file.text();
      const workbook = XLSX.read(text, { type: 'string', raw: true });
      const firstSheet = workbook.SheetNames[0];
      if (firstSheet) {
        rawMatrix = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[firstSheet], {
          header: 1,
          defval: '',
          raw: true,
        });
      }

      // Handle semicolon-delimited CSV exports
      if (
        rawMatrix.length > 0 &&
        rawMatrix[0].length === 1 &&
        String(rawMatrix[0][0] || '').includes(';')
      ) {
        rawMatrix = parseSemicolonCsvFallback(text);
      }
    } else {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return {
          fileName: file.name,
          fileType,
          totalRowsRead: 0,
          rows: [],
          failedRows: [],
          error: 'Workbook Excel kosong atau tidak memiliki sheet.',
        };
      }

      // Prioritaskan sheet "Data Keuangan" (case-insensitive)
      const dataKeuanganSheet =
        workbook.SheetNames.find((name) => name.trim().toLowerCase() === 'data keuangan') ||
        workbook.SheetNames.find((name) => name.trim().toLowerCase().includes('data keuangan'));

      selectedSheetName = dataKeuanganSheet || workbook.SheetNames[0];
      const sheet = workbook.Sheets[selectedSheetName];
      rawMatrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: '',
        raw: true,
      });
    }

    if (!rawMatrix || rawMatrix.length < 2) {
      return {
        fileName: file.name,
        fileType,
        sheetName: selectedSheetName,
        totalRowsRead: 0,
        rows: [],
        failedRows: [],
        error: 'File harus berisi baris header dan minimal 1 baris data transaksi.',
      };
    }

    const headerIdx = findHeaderRowIndex(rawMatrix);
    const rawHeaders = (rawMatrix[headerIdx] || []).map((h) => String(h ?? ''));
    const normalizedHeaders = rawHeaders.map(normalizeHeader);

    const hasTanggal = normalizedHeaders.includes('tanggal');
    const hasKeterangan = normalizedHeaders.includes('keterangan');
    const hasMasuk = normalizedHeaders.includes('masuk');
    const hasKeluar = normalizedHeaders.includes('keluar');

    if (!hasTanggal || (!hasMasuk && !hasKeluar)) {
      return {
        fileName: file.name,
        fileType,
        sheetName: selectedSheetName,
        totalRowsRead: 0,
        rows: [],
        failedRows: [],
        error:
          'Import gagal: kolom "Tanggal", "Keterangan", "Pemasukan", atau "Pengeluaran" tidak ditemukan.',
      };
    }

    const seenExplicitIds = new Set<string>();
    const existingOccurrenceCounts = new Map<string, number>();
    const existingSaldoSignatures = new Set<string>();
    existingTransactions.forEach((tx) => {
      const sig = buildRowSignature({
        tanggal: tx.tanggal,
        tipe: tx.tipe,
        kategori: tx.kategori,
        jenisPengeluaran: String(tx.jenisPengeluaran || ''),
        metode: tx.metode,
        akun: tx.akun,
        masuk: tx.masuk,
        keluar: tx.keluar,
        keterangan: tx.keterangan,
      });
      existingOccurrenceCounts.set(sig, (existingOccurrenceCounts.get(sig) || 0) + 1);
      if (typeof tx.importedSaldo === 'number' && !Number.isNaN(tx.importedSaldo)) {
        existingSaldoSignatures.add(`${sig}|${tx.importedSaldo}`);
      }
    });

    const fileOccurrenceCounts = new Map<string, number>();
    const previewRows: ImportPreviewRow[] = [];
    const failedRows: { rowNumber: number; reason: string }[] = [];
    let totalRowsRead = 0;

    for (let i = headerIdx + 1; i < rawMatrix.length; i += 1) {
      const rowValues = rawMatrix[i];
      if (!rowValues || rowValues.every((v) => String(v ?? '').trim() === '')) {
        continue;
      }

      if (isTotalRow(rowValues)) {
        continue;
      }

      totalRowsRead += 1;

      const record: Record<string, unknown> = {};
      normalizedHeaders.forEach((key, idx) => {
        if (key) record[key] = rowValues[idx];
      });

      const issues: string[] = [];
      const tanggal = normalizeDate(record.tanggal);
      if (!tanggal) {
        issues.push(`Tanggal tidak valid (${String(record.tanggal || 'kosong')})`);
      }

      const masuk = hasMasuk ? parseCurrencyString(record.masuk) : 0;
      const keluar = hasKeluar ? parseCurrencyString(record.keluar) : 0;

      if (masuk === 0 && keluar === 0) {
        issues.push('Pemasukan dan Pengeluaran bernilai 0');
      }

      let tipe: TransactionType = 'Pengeluaran';
      const rawTipe = String(record.tipe || '').toLowerCase().trim();
      if (rawTipe.includes('masuk') || rawTipe.includes('income') || (masuk > 0 && keluar === 0)) {
        tipe = 'Pemasukan';
      } else {
        tipe = 'Pengeluaran';
      }

      const keteranganRaw = hasKeterangan ? String(record.keterangan ?? '').trim() : '';

      // Ambil Kategori persis dari kolom Kategori di XLSX/CSV (JANGAN membuat kategori dari Keterangan)
      const kategoriRaw = String(record.kategori ?? '').trim();
      const kategori = kategoriRaw || (tipe === 'Pemasukan' ? 'Pemasukan' : 'Lainnya');

      // Ambil Metode Pembayaran persis dari kolom Metode (QRIS tetap QRIS, Tunai tetap Tunai)
      const metodeRaw = String(record.metode ?? '').trim();
      const metode = metodeRaw || 'Tunai';

      const akunRaw = String(record.akun ?? '').trim();
      const akun = normalizeImportedAccount({
        akunRaw,
        metode,
        keterangan: keteranganRaw,
        kategori,
        masuk,
        keluar,
      });

      const keterangan = keteranganRaw || kategori;
      if (!hasKeterangan || !keteranganRaw) {
        issues.push('Keterangan kosong');
      }

      const rawJenis = String(record.jenisPengeluaran ?? '').trim();
      const jenisPengeluaran = normalizeExpenseNatureFromImport({
        rawJenis,
        kategori,
        tipe,
      });

      const rawBulan = String(record.bulan ?? '').trim();
      const bulanKeyFromRaw = rawBulan ? parseBulanToPeriodKey(rawBulan) : '';
      const monthKey = getMonthKey(tanggal) || bulanKeyFromRaw;
      const bulan = rawBulan || (monthKey ? getMonthLabel(monthKey) : '');

      const importedSaldo =
        record.saldo !== undefined && String(record.saldo).trim() !== ''
          ? parseCurrencyString(record.saldo, true)
          : undefined;

      const transferIdRaw = String(record.transferId ?? '').trim();
      const explicitId = String(record.id ?? '').trim();

      const rowSig = buildRowSignature({
        tanggal: tanggal || '-',
        tipe,
        kategori,
        jenisPengeluaran: String(jenisPengeluaran),
        metode,
        akun,
        masuk,
        keluar,
        keterangan,
      });
      const occCount = (fileOccurrenceCounts.get(rowSig) || 0) + 1;
      fileOccurrenceCounts.set(rowSig, occCount);

      const existingCount = existingOccurrenceCounts.get(rowSig) || 0;
      const saldoDup =
        typeof importedSaldo === 'number' &&
        !Number.isNaN(importedSaldo) &&
        existingSaldoSignatures.has(`${rowSig}|${importedSaldo}`);

      let isDuplicate = false;
      if (explicitId) {
        if (seenExplicitIds.has(explicitId)) {
          isDuplicate = true;
          issues.push(`ID duplikat (${explicitId})`);
        } else {
          seenExplicitIds.add(explicitId);
        }
      }
      if (!isDuplicate && (existingCount >= occCount || saldoDup)) {
        isDuplicate = true;
        issues.push('Transaksi duplikat (sudah tersimpan sebelumnya)');
      }

      let status: ImportPreviewRow['status'] = 'Valid';
      if (!tanggal) {
        status = 'Invalid';
        failedRows.push({
          rowNumber: i + 1,
          reason: `Tanggal tidak terbaca: "${String(record.tanggal ?? '')}"`,
        });
      } else if (masuk === 0 && keluar === 0) {
        status = 'Invalid';
        failedRows.push({
          rowNumber: i + 1,
          reason: 'Nominal pemasukan dan pengeluaran keduanya 0',
        });
      } else if (issues.length > 0) {
        status = 'Warning';
      }

      previewRows.push({
        rowNumber: i + 1,
        tanggal: tanggal || '-',
        tipe,
        kategori,
        metode,
        akun,
        masuk,
        keluar,
        keterangan,
        jenisPengeluaran,
        bulan,
        importedSaldo,
        transferId: transferIdRaw || undefined,
        status,
        issues,
        isDuplicate,
      });
    }

    // Pasangkan baris Transfer / Setor Tabungan dengan transferId yang sama tanpa menambah baris baru
    const validRows = previewRows.filter((r) => r.status !== 'Invalid');
    const unmatchedTransferOut: ImportPreviewRow[] = [];
    const unmatchedSavingsOut: ImportPreviewRow[] = [];
    let trfSeq = 1;
    let savSeq = 1;

    validRows.forEach((row) => {
      if (row.transferId) return;
      const jenisLower = String(row.jenisPengeluaran).toLowerCase();
      const katLower = row.kategori.toLowerCase();
      const ketLower = row.keterangan.toLowerCase();
      const akunCompact = row.akun.toLowerCase().replace(/\s+/g, '');

      const isTransfer =
        jenisLower === 'transfer' || katLower === 'transfer' || ketLower.includes('top up shopeepay');
      const isSavings =
        jenisLower === 'tabungan' ||
        katLower === 'tabungan' ||
        ketLower.includes('tabungan seabank') ||
        ketLower.includes('setor tabungan');

      if (isTransfer) {
        if (akunCompact === 'cash' && row.keluar > 0 && row.masuk === 0) {
          unmatchedTransferOut.push(row);
        } else if (akunCompact === 'shopeepay' && row.masuk > 0 && row.keluar === 0) {
          const matchIdx = unmatchedTransferOut.findIndex(
            (src) => src.tanggal === row.tanggal && src.keluar === row.masuk && !src.transferId
          );
          if (matchIdx >= 0) {
            const pairId = `TRF-${row.tanggal.replace(/-/g, '')}-${row.masuk}-${trfSeq++}`;
            unmatchedTransferOut[matchIdx].transferId = pairId;
            row.transferId = pairId;
          }
        }
      } else if (isSavings) {
        if (akunCompact === 'cash' && row.keluar > 0 && row.masuk === 0) {
          unmatchedSavingsOut.push(row);
        } else if (akunCompact === 'seabank' && row.masuk > 0 && row.keluar === 0) {
          const matchIdx = unmatchedSavingsOut.findIndex(
            (src) => src.tanggal === row.tanggal && src.keluar === row.masuk && !src.transferId
          );
          if (matchIdx >= 0) {
            const pairId = `SAV-${row.tanggal.replace(/-/g, '')}-${row.masuk}-${savSeq++}`;
            unmatchedSavingsOut[matchIdx].transferId = pairId;
            row.transferId = pairId;
          }
        }
      }
    });

    if (previewRows.length === 0) {
      return {
        fileName: file.name,
        fileType,
        sheetName: selectedSheetName,
        totalRowsRead,
        rows: [],
        failedRows,
        error: 'Tidak ada baris transaksi yang ditemukan di dalam file.',
      };
    }

    return {
      fileName: file.name,
      fileType,
      sheetName: selectedSheetName,
      totalRowsRead,
      rows: previewRows,
      failedRows,
    };
  } catch (err) {
    return {
      fileName: file.name,
      fileType,
      totalRowsRead: 0,
      rows: [],
      failedRows: [],
      error: `Gagal membaca file: ${err instanceof Error ? err.message : 'Kesalahan tidak diketahui'}`,
    };
  }
}

export function buildAccountsFromTransactions(rows: Pick<Transaction, 'akun' | 'kategori' | 'jenisPengeluaran' | 'keterangan'>[]): Account[] {
  const result: Account[] = [];
  const seen = new Set<string>();

  const addAcc = (name: string, type: Account['type'], note: string) => {
    const key = name.toLowerCase().trim();
    // Jangan pernah membuat akun bernama QRIS atau Tunai
    if (!key || key === 'qris' || key === 'tunai' || seen.has(key)) return;
    seen.add(key);
    result.push({
      id: `acc-${key.replace(/[^a-z0-9]+/g, '-')}`,
      name,
      type,
      initialBalance: 0,
      note,
    });
  };

  // Selalu sediakan 3 akun wajib (Cash, ShopeePay, SeaBank) agar SeaBank tidak pernah hilang
  addAcc('Cash', 'Cash', 'Dompet tunai harian');
  addAcc('ShopeePay', 'E-Wallet', 'Akun digital ShopeePay / QRIS');
  addAcc('SeaBank', 'Bank', 'Rekening tabungan SeaBank');

  rows.forEach((r) => {
    const accName = (r.akun || '').trim();
    const lower = accName.toLowerCase();
    const compact = lower.replace(/\s+/g, '');

    if (compact === 'cash' || compact === 'tunai') {
      addAcc('Cash', 'Cash', 'Dompet tunai harian');
    } else if (compact === 'shopeepay') {
      addAcc('ShopeePay', 'E-Wallet', 'Akun digital ShopeePay / QRIS');
    } else if (compact === 'seabank') {
      addAcc('SeaBank', 'Bank', 'Rekening tabungan SeaBank');
    } else if (accName && compact !== 'qris') {
      addAcc(
        accName,
        lower.includes('dana') || lower.includes('ovo') || lower.includes('gopay') ? 'E-Wallet' : 'Bank',
        'Akun dari data import'
      );
    }
  });

  return result;
}

export function buildImportSummary(params: {
  parsed: ParsedImportResult;
  importedRows: ImportPreviewRow[];
  skippedDuplicateCount?: number;
}): ImportSummary {
  const { parsed, importedRows, skippedDuplicateCount = 0 } = params;
  const dates = importedRows
    .map((r) => r.tanggal)
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort();
  const earliestDate = dates[0] || '-';
  const latestDate = dates[dates.length - 1] || '-';

  const monthCountsMap = new Map<string, number>();
  importedRows.forEach((r) => {
    const mk = getMonthKey(r.tanggal) || parseBulanToPeriodKey(r.bulan);
    if (mk) {
      monthCountsMap.set(mk, (monthCountsMap.get(mk) || 0) + 1);
    }
  });

  const tempTx: Transaction[] = importedRows.map((r, idx) => ({
    id: idx + 1,
    tanggal: r.tanggal,
    tipe: r.tipe,
    kategori: r.kategori,
    metode: r.metode,
    akun: r.akun,
    masuk: r.masuk,
    keluar: r.keluar,
    keterangan: r.keterangan,
    jenisPengeluaran: r.jenisPengeluaran,
    bulan: r.bulan,
    importedSaldo: r.importedSaldo,
    transferId: r.transferId,
  }));

  const derivedAccounts = buildAccountsFromTransactions(tempTx);
  const accSummary = computeAccountBalances(derivedAccounts, tempTx);
  const kpi = computeKpis(tempTx);
  const validation = validateFinanceDataset(tempTx, derivedAccounts, { skippedDuplicateCount });

  const perMonthCounts = Array.from(monthCountsMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodKey, count]) => ({
      periodKey,
      periodLabel: getMonthLabel(periodKey),
      count,
    }));

  return {
    fileName: parsed.fileName,
    fileType: parsed.fileType,
    sheetName: parsed.sheetName,
    totalRowsRead: parsed.totalRowsRead,
    importedCount: importedRows.length,
    skippedDuplicateCount,
    failedCount: parsed.failedRows.length,
    failedReasons: parsed.failedRows,
    earliestDate,
    latestDate,
    perMonthCounts,
    cashBalance: accSummary.cashBalance,
    shopeePayBalance: accSummary.shopeePayBalance,
    seaBankBalance: accSummary.seaBankBalance,
    digitalBalance: accSummary.digitalBalance,
    totalSavings: accSummary.seaBankBalance || kpi.savingsFromTransactions,
    validation,
    importedAt: new Date().toISOString(),
  };
}

export function exportTransactionsToCsv(
  transactions: Transaction[],
  filename = 'finance-insight-transaksi.csv'
): void {
  const headers = [
    'Tanggal',
    'Keterangan',
    'Kategori',
    'Jenis',
    'Metode',
    'Akun',
    'Pemasukan',
    'Pengeluaran',
    'Bulan',
    'ID Transfer',
  ];
  const escapeCsv = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.join(','),
    ...transactions.map((t) =>
      [
        t.tanggal,
        t.keterangan,
        t.kategori,
        t.jenisPengeluaran,
        t.metode,
        t.akun,
        t.masuk,
        t.keluar,
        t.bulan || getMonthLabel(getMonthKey(t.tanggal)),
        t.transferId || '',
      ]
        .map(escapeCsv)
        .join(',')
    ),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportTransactionsToExcel(
  transactions: Transaction[],
  filename = 'finance-insight-transaksi.xlsx'
): void {
  const rows = transactions.map((t) => ({
    Tanggal: t.tanggal,
    Keterangan: t.keterangan,
    Kategori: t.kategori,
    Jenis: t.jenisPengeluaran,
    Metode: t.metode,
    Akun: t.akun,
    Pemasukan: t.masuk,
    Pengeluaran: t.keluar,
    Bulan: t.bulan || getMonthLabel(getMonthKey(t.tanggal)),
    'ID Transfer': t.transferId || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Keuangan');
  XLSX.writeFile(workbook, filename);
}
