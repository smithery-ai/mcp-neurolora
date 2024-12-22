import { AnalyzeCodeOptions as BaseAnalyzeCodeOptions } from '../tools/code-analyzer/types.js';

export interface AnalyzeCodeOptions extends BaseAnalyzeCodeOptions {
  maxTokens?: number;
  temperature?: number;
}
