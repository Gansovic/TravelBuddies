export interface Config {
    general: {
        mode: 'strict' | 'lenient';
        exitOnViolation: boolean;
        showViolationDetails: boolean;
        colorOutput: boolean;
    };
    paths: {
        principlesFile: string;
        projectRoot: string;
        ignoredPaths: string[];
        includedExtensions: string[];
    };
    validation: any;
    existingPatterns: string[];
    forbiddenPatterns: Array<{
        pattern: string;
        message: string;
        exceptions: string[];
    }>;
    requiredPatterns: Array<{
        filePattern: string;
        codePattern: string;
        message: string;
    }>;
    commitValidation: any;
}
export interface Violation {
    level: 'error' | 'warning' | 'info';
    message: string;
    file?: string;
    line?: number;
    column?: number;
    rule: string;
    context?: string;
}
export interface ValidationResult {
    passed: boolean;
    violations: Violation[];
    summary: {
        errors: number;
        warnings: number;
        infos: number;
    };
}
/**
 * Load and parse configuration file
 */
export declare function loadConfig(): Config;
/**
 * Parse principles.md file and extract rules
 */
export declare function parsePrinciplesFile(principlesPath: string): any;
/**
 * Parse TypeScript/JavaScript file into AST
 */
export declare function parseFile(filePath: string, content?: string): any;
/**
 * Get all files to validate based on config
 */
export declare function getFilesToValidate(config: Config, specificFiles?: string[]): string[];
/**
 * Check if file should be ignored based on config
 */
export declare function shouldIgnoreFile(filePath: string, config: Config): boolean;
/**
 * Normalize file path to be relative to project root
 */
export declare function normalizeFilePath(filePath: string, config: Config): string;
/**
 * Check if file matches a pattern
 */
export declare function matchesPattern(filePath: string, pattern: string, projectRoot?: string): boolean;
/**
 * Get changed files from git
 */
export declare function getChangedFiles(): string[];
/**
 * Format violation for output
 */
export declare function formatViolation(violation: Violation, config: Config): string;
/**
 * Print validation results
 */
export declare function printResults(result: ValidationResult, config: Config): void;
