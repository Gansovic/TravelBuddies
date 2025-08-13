import { Config, ValidationResult } from './utils.js';
/**
 * Main validation orchestrator
 */
export declare function validateFile(filePath: string, config: Config, content?: string): Promise<ValidationResult>;
/**
 * Validate commit message
 */
export declare function validateCommitMessage(message: string, config: Config): ValidationResult;
