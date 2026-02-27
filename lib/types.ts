// ─── Oculus Type Definitions ─────────────────────────────────────────────────

export type Severity = 'critical' | 'major' | 'minor';

export type IssueCategory =
  | 'accessibility'
  | 'readability'
  | 'layout'
  | 'mobile'
  | 'navigation'
  | 'contrast'
  | 'ux-heuristic';

export interface AuditIssue {
  id: string;
  title: string;
  category: IssueCategory;
  severity: Severity;
  description: string;
  evidence: string;
  impact: string;
  recommendation: string;
  /** Bounding box on the screenshot where the issue is located (optional) */
  region?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Which UX law or principle is violated */
  principle?: string;
}

export interface CategoryScore {
  category: IssueCategory;
  label: string;
  score: number; // 0–100
  issueCount: number;
}

export interface AuditResult {
  id: string;
  timestamp: string;
  inputType: 'screenshot' | 'url';
  url?: string;
  overallScore: number; // 0–100
  grade: string; // A–F
  categoryScores: CategoryScore[];
  issues: AuditIssue[];
  screenshotUrl: string; // base64 data URL or path
  mobileScreenshotUrl?: string;
  summary: string;
}

export interface AnalysisProgress {
  step: number;
  totalSteps: number;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
}

export const ANALYSIS_STEPS: AnalysisProgress[] = [
  { step: 1, totalSteps: 5, label: 'Capturing page', status: 'pending' },
  { step: 2, totalSteps: 5, label: 'Extracting structure', status: 'pending' },
  { step: 3, totalSteps: 5, label: 'Checking accessibility', status: 'pending' },
  { step: 4, totalSteps: 5, label: 'Running UX heuristics', status: 'pending' },
  { step: 5, totalSteps: 5, label: 'Generating recommendations', status: 'pending' },
];
