// ─── Oculus Type Definitions ─────────────────────────────────────────────────

export type Severity = 'critical' | 'high' | 'medium' | 'minor';

export type IssueCategory =
  | 'User Navigation'
  | 'Visual Hierarchy'
  | 'Readability'
  | 'Forms & Input'
  | 'Calls-to-Action'
  | 'User Trust'
  | 'System Status'
  | 'Cognitive Load'
  | 'Mobile Usability'
  | 'Accessibility';

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

// ─── A/B Testing Types ────────────────────────────────────────────────────────

export interface ABDomainScore {
  domain: string;
  scoreA: number;
  scoreB: number;
  delta: number; // scoreB - scoreA
  winner: 'A' | 'B' | 'tie';
  comparisonSummary: string;
  whatADid: string;
  whatBChanged: string;
  recommendation: string;
}

export interface ABKeyWin {
  domain: string;
  change: string;
  principle: string;
  impact: string;
}

export interface ABRegression {
  domain: string;
  change: string;
  principle: string;
  impact: string;
  recommendation: string;
}

export interface ABAnnotation {
  id: number;
  x: number; // 0–100 percentage from left
  y: number; // 0–100 percentage from top
  version: 'A' | 'B';
  note: string;
  outcome: 'improvement' | 'regression' | 'neutral';
}

export interface ABReport {
  id: string;
  timestamp: string;
  pageContext?: string;
  winner: 'A' | 'B' | 'tie';
  winnerVerdict: string;
  overallScoreA: number;
  overallScoreB: number;
  shipConfidenceScore: number;
  domainScores: ABDomainScore[];
  keyWins: ABKeyWin[];
  regressions: ABRegression[];
  annotationsA: ABAnnotation[];
  annotationsB: ABAnnotation[];
  screenshotUrlA: string;
  screenshotUrlB: string;
}

// ─── Heatmap Attention Types ──────────────────────────────────────────────────

export interface AttentionHotspot {
  x: number;            // 0–100 % from left
  y: number;            // 0–100 % from top
  intensity: number;    // 0–100 attention weight
  elementDescription: string;
  inFirstFiveSeconds: boolean;
}

export interface GazeFixation {
  order: number;
  x: number;
  y: number;
  dwellTime: number;    // seconds, proportional to circle size
  elementDescription: string;
}

export interface AttentionConflict {
  severity: 'critical' | 'high' | 'medium';
  element: string;
  problem: string;
  principle: string;
  recommendation: string;
}

export interface RegionOfInterestReport {
  label: string;
  attentionPercentage: number;
  gazeRank: number | null;
  dwellEstimate: number;
  verdict: 'pass' | 'fail';
  analysis: string;
}

export interface HeatmapReport {
  id: string;
  timestamp: string;
  pageContext?: string;
  screenshotUrl: string;
  clarityScore: number;
  clarityVerdict: string;
  hotspots: AttentionHotspot[];
  gazeFixations: GazeFixation[];
  aiAnalysis: string;
  attentionConflicts: AttentionConflict[];
  regionReports: RegionOfInterestReport[];
}

// ─── Heuristic Evaluation Types ───────────────────────────────────────────────

export type HeuristicPageType =
  | 'Homepage'
  | 'Product Listing Page'
  | 'Product Detail Page'
  | 'Shopping Cart'
  | 'Checkout'
  | 'Login / Sign-up'
  | 'User Onboarding'
  | 'SaaS Dashboard'
  | 'Feature Page'
  | 'Landing Page'
  | 'Mobile App Screen'
  | 'Form Page'
  | 'Settings Page';

export type HeuristicDeviceContext = 'Desktop' | 'Mobile' | 'Both';

export type HeuristicFrameworkId =
  | 'nielsen'
  | 'baymard'
  | 'wcag'
  | 'gestalt'
  | 'cognitive'
  | 'emotional'
  | 'mobile';

export interface HeuristicCitation {
  framework: HeuristicFrameworkId;
  frameworkLabel: string;
  principle: string;
}

export interface HeuristicFinding {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'minor';
  citations: HeuristicCitation[];
  isConvergent: boolean;
  observation: string;
  userImpact: string;
  recommendation: string;
  realWorldExample: string;
}

export interface HeuristicFrameworkScore {
  id: HeuristicFrameworkId;
  label: string;
  score: number; // 0–100
  topFinding: string;
}

export interface HeuristicReport {
  id: string;
  timestamp: string;
  pageType: HeuristicPageType;
  deviceContext: HeuristicDeviceContext;
  primaryGoal?: string;
  screenshotUrl: string;
  overallScore: number;
  severityCounts: {
    critical: number;
    high: number;
    medium: number;
    minor: number;
  };
  narrativeVerdict: string;
  frameworkScores: HeuristicFrameworkScore[];
  findings: HeuristicFinding[];
}

export const ANALYSIS_STEPS: AnalysisProgress[] = [
  { step: 1, totalSteps: 5, label: 'Capturing page', status: 'pending' },
  { step: 2, totalSteps: 5, label: 'Extracting structure', status: 'pending' },
  { step: 3, totalSteps: 5, label: 'Checking accessibility', status: 'pending' },
  { step: 4, totalSteps: 5, label: 'Running UX heuristics', status: 'pending' },
  { step: 5, totalSteps: 5, label: 'Generating recommendations', status: 'pending' },
];
