import type { ScanResult, AnalysisReport, MigrateResponse, ValidationResult, ApplyRequest, ApplyResponse, Target } from '../types';

const BASE = import.meta.env.DEV ? 'http://localhost:8080' : '';

async function fetchJSON<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
}

export const api = {
  scan(): Promise<ScanResult> {
    return fetchJSON<ScanResult>(`${BASE}/api/scan`, { method: 'POST' });
  },

  analyze(target: Target): Promise<AnalysisReport> {
    return fetchJSON<AnalysisReport>(`${BASE}/api/analyze`, {
      method: 'POST',
      body: JSON.stringify({ target }),
    });
  },

  migrate(target: Target, outputDir: string): Promise<MigrateResponse> {
    return fetchJSON<MigrateResponse>(`${BASE}/api/migrate`, {
      method: 'POST',
      body: JSON.stringify({ target, outputDir }),
    });
  },

  apply(req: ApplyRequest): Promise<ApplyResponse> {
    return fetchJSON<ApplyResponse>(`${BASE}/api/apply`, {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  validate(target: Target): Promise<ValidationResult> {
    return fetchJSON<ValidationResult>(`${BASE}/api/validate`, {
      method: 'POST',
      body: JSON.stringify({ target }),
    });
  },

  downloadUrl(target: Target): string {
    return `${BASE}/api/download?target=${target}`;
  },
};
