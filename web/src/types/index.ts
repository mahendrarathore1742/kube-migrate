// ----- Scan types -----
export interface ControllerInfo {
  type: string;
  version: string;
  namespace: string;
  podName: string;
}

export interface TLSInfo {
  hosts: string[];
  secretName: string;
}

export interface PathInfo {
  path: string;
  pathType: string;
  serviceName: string;
  servicePort: number;
}

export interface RuleInfo {
  host: string;
  paths: PathInfo[];
}

export interface IngressInfo {
  namespace: string;
  name: string;
  ingressClassName: string;
  hosts: string[];
  tls: TLSInfo[];
  rules: RuleInfo[];
  annotations: Record<string, string>;
  nginxAnnotations: Record<string, string>;
  complexity: string;
}

export interface ScanResult {
  controller: ControllerInfo;
  ingresses: IngressInfo[];
}

// ----- Analyze types -----
export interface AnnotationMapping {
  originalKey: string;
  originalValue: string;
  status: 'supported' | 'partial' | 'unsupported';
  targetResource: string;
  generatedYaml?: string;
  note: string;
}

export interface IngressReport {
  namespace: string;
  name: string;
  mappings: AnnotationMapping[];
  overallStatus: 'ready' | 'workaround' | 'breaking';
}

export interface Summary {
  total: number;
  fullyCompatible: number;
  needsWorkaround: number;
  hasUnsupported: number;
}

export interface AnalysisReport {
  target: string;
  ingressReports: IngressReport[];
  summary: Summary;
}

// ----- Migrate types -----
export interface GeneratedFile {
  relPath: string;
  content: string;
  description: string;
  category: string;
}

export interface MigrateResponse {
  files: GeneratedFile[];
  summary: Summary;
}

// ----- Apply types -----
export interface ApplyRequest {
  target: Target;
  category: string;
  dryRun: boolean;
}

export interface ApplyResponse {
  success: boolean;
  output: string;
  dryRun: boolean;
  applied: string[];
  error?: string;
}

// ----- Validate types -----
export interface Check {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  detail: string;
}

export interface ValidationResult {
  phase: 'pre-migration' | 'migrating' | 'post-migration';
  target: string;
  targetRunning: boolean;
  nginxRunning: boolean;
  nextSteps: string[];
  checks: Check[];
}

// ----- Common -----
export type Target = 'traefik' | 'gateway-api';
