export interface RunCtx {
  files: File[];
  options: Record<string, unknown>;
  signal: AbortSignal;
  stage: (index: number, detail?: string) => void;
  progress: (value: number) => void;
  item: (done: number, total: number) => void;
}
