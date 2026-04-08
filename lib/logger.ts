import { ValidationResult } from './ai';

export interface GenerationLog {
  timestamp: string;
  slug: string;
  company: string;
  generationTimeMs: number;
  validationResult: ValidationResult;
  retryCount: number;
}

export function logGeneration(entry: GenerationLog): void {
  console.log(JSON.stringify({
    type: 'generation',
    ...entry,
  }));
}
