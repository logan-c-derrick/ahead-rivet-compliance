import Papa from "papaparse";

export interface ParsedBom {
  headers: string[];
  rows: string[][];
  meta: {
    rowCount: number;
    delimiter: string;
  };
}

/**
 * Parse a BOM CSV file and return headers plus sample/data rows.
 * Uses papaparse for robust handling of different CSV formats.
 */
export function parseBomCsv(content: string): ParsedBom {
  const result = Papa.parse<string[]>(content, {
    header: false,
    skipEmptyLines: true,
    preview: 0, // no limit
  });

  const rows = result.data ?? [];
  const headers = rows.length > 0 ? rows[0] : [];
  const dataRows = rows.length > 1 ? rows.slice(1) : [];

  return {
    headers: headers.map((h) => String(h ?? "").trim()),
    rows: dataRows,
    meta: {
      rowCount: dataRows.length,
      delimiter: result.meta.delimiter ?? ",",
    },
  };
}

/**
 * Parse CSV from a File, returning ParsedBom.
 */
export async function parseBomCsvFromFile(file: File): Promise<ParsedBom> {
  const text = await file.text();
  return parseBomCsv(text);
}
