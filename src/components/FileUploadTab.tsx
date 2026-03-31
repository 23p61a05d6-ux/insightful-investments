import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, AlertCircle, Download, CheckCircle, X } from 'lucide-react';
import { read, utils } from 'xlsx';
import { Button } from '@/components/ui/button';
import { BalanceSheetData } from '@/types/analysis';
import { useToast } from '@/hooks/use-toast';

const REQUIRED_COLUMNS = ['totalAssets', 'totalLiabilities', 'currentAssets', 'currentLiabilities', 'totalEquity', 'totalDebt'];
const COLUMN_ALIASES: Record<string, string> = {
  'total assets': 'totalAssets', 'total_assets': 'totalAssets', 'totalassets': 'totalAssets',
  'total liabilities': 'totalLiabilities', 'total_liabilities': 'totalLiabilities', 'totalliabilities': 'totalLiabilities',
  'current assets': 'currentAssets', 'current_assets': 'currentAssets', 'currentassets': 'currentAssets',
  'current liabilities': 'currentLiabilities', 'current_liabilities': 'currentLiabilities', 'currentliabilities': 'currentLiabilities',
  'total equity': 'totalEquity', 'total_equity': 'totalEquity', 'totalequity': 'totalEquity',
  'total debt': 'totalDebt', 'total_debt': 'totalDebt', 'totaldebt': 'totalDebt',
  'company name': 'companyName', 'company_name': 'companyName', 'companyname': 'companyName', 'company': 'companyName',
  'ticker symbol': 'tickerSymbol', 'ticker_symbol': 'tickerSymbol', 'tickersymbol': 'tickerSymbol', 'ticker': 'tickerSymbol',
  'analysis period': 'analysisPeriod', 'analysis_period': 'analysisPeriod', 'analysisperiod': 'analysisPeriod', 'period': 'analysisPeriod',
};

function normalizeColumn(col: string): string {
  const lower = col.trim().toLowerCase();
  return COLUMN_ALIASES[lower] || lower;
}

interface FileUploadTabProps {
  onDataParsed: (rows: BalanceSheetData[]) => void;
}

export default function FileUploadTab({ onDataParsed }: FileUploadTabProps) {
  const { toast } = useToast();
  const [preview, setPreview] = useState<Record<string, any>[] | null>(null);
  const [mappedColumns, setMappedColumns] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    setFileError(null);
    setPreview(null);
    setFileName(file.name);

    if (file.size > 5 * 1024 * 1024) {
      setFileError('File exceeds 5MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = utils.sheet_to_json<Record<string, any>>(sheet);

        if (!jsonData.length) {
          setFileError('File contains no data rows');
          return;
        }

        // Map columns
        const rawCols = Object.keys(jsonData[0]);
        const mapping: Record<string, string> = {};
        for (const col of rawCols) {
          const normalized = normalizeColumn(col);
          if (REQUIRED_COLUMNS.includes(normalized) || ['companyName', 'tickerSymbol', 'analysisPeriod'].includes(normalized)) {
            mapping[col] = normalized;
          }
        }

        const missingRequired = REQUIRED_COLUMNS.filter(rc => !Object.values(mapping).includes(rc));
        if (missingRequired.length > 0) {
          setFileError(`Missing required columns: ${missingRequired.join(', ')}. Found: ${rawCols.join(', ')}`);
          return;
        }

        setMappedColumns(mapping);
        setPreview(jsonData.slice(0, 20)); // Preview max 20 rows
        toast({ title: 'File parsed successfully', description: `${jsonData.length} row(s) found` });
      } catch {
        setFileError('Failed to parse file. Make sure it\'s a valid Excel or CSV file.');
      }
    };
    reader.readAsArrayBuffer(file);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && processFile(files[0]),
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  const handleProcess = () => {
    if (!preview || !mappedColumns) return;

    const rows: BalanceSheetData[] = preview.map(row => {
      const mapped: any = {};
      for (const [rawCol, normalizedCol] of Object.entries(mappedColumns)) {
        mapped[normalizedCol] = row[rawCol];
      }
      return {
        companyName: String(mapped.companyName || 'Unknown Company'),
        tickerSymbol: mapped.tickerSymbol ? String(mapped.tickerSymbol) : '',
        analysisPeriod: mapped.analysisPeriod ? String(mapped.analysisPeriod) : '',
        totalAssets: Number(mapped.totalAssets) || 0,
        totalLiabilities: Number(mapped.totalLiabilities) || 0,
        currentAssets: Number(mapped.currentAssets) || 0,
        currentLiabilities: Number(mapped.currentLiabilities) || 0,
        totalEquity: Number(mapped.totalEquity) || 0,
        totalDebt: Number(mapped.totalDebt) || 0,
      };
    });

    const invalid = rows.filter(r => !r.totalAssets || !r.totalEquity || !r.currentLiabilities);
    if (invalid.length) {
      toast({ title: 'Warning', description: `${invalid.length} row(s) have zero/missing required values`, variant: 'destructive' });
    }

    onDataParsed(rows.filter(r => r.totalAssets > 0 && r.totalEquity > 0 && r.currentLiabilities > 0));
  };

  const downloadTemplate = () => {
    const headers = ['companyName', 'tickerSymbol', 'analysisPeriod', ...REQUIRED_COLUMNS];
    const sampleRow = ['Apple Inc.', 'AAPL', 'Q4 2025', '352583', '287912', '143566', '105392', '64671', '112043'];
    const csv = [headers.join(','), sampleRow.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finance_analyzer_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`rounded-xl border-2 border-dashed bg-card p-12 text-center shadow-card cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
        <p className="text-lg font-medium text-card-foreground mb-2">
          {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
        </p>
        <p className="text-sm text-muted-foreground mb-4">Supports .xlsx, .xls, .csv (max 5MB)</p>
        <Button variant="outline" type="button">Browse Files</Button>
      </div>

      {/* Download template */}
      <div className="text-center">
        <button onClick={downloadTemplate} className="text-sm text-primary underline hover:text-primary/80 inline-flex items-center gap-1">
          <Download className="h-3 w-3" /> Download sample template
        </button>
      </div>

      {/* Error */}
      {fileError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">Invalid File</p>
            <p className="text-xs text-destructive/80 mt-1">{fileError}</p>
          </div>
        </div>
      )}

      {/* File info */}
      {fileName && !fileError && (
        <div className="rounded-xl border border-success/30 bg-success/5 p-4 flex items-center gap-3">
          <FileSpreadsheet className="h-5 w-5 text-success" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{fileName}</p>
            <p className="text-xs text-muted-foreground">
              {preview ? `${preview.length} row(s) · Columns mapped: ${Object.keys(mappedColumns).length}` : 'Processing...'}
            </p>
          </div>
          <button onClick={() => { setPreview(null); setFileName(null); setFileError(null); }}>
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      )}

      {/* Preview table */}
      {preview && (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-x-auto">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-card-foreground">Data Preview</h3>
            <Button size="sm" onClick={handleProcess} className="gradient-electric text-primary-foreground border-0">
              <CheckCircle className="mr-1 h-4 w-4" /> Process {preview.length} Row(s)
            </Button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {Object.keys(mappedColumns).map(col => (
                  <th key={col} className="p-2 text-left text-muted-foreground font-medium">
                    {col}
                    <span className="block text-[10px] text-primary">→ {mappedColumns[col]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.slice(0, 10).map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {Object.keys(mappedColumns).map(col => (
                    <td key={col} className="p-2 text-card-foreground">{String(row[col] ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {preview.length > 10 && (
            <p className="p-2 text-xs text-muted-foreground text-center">
              Showing 10 of {preview.length} rows
            </p>
          )}
        </div>
      )}
    </div>
  );
}
