import { readFileSync, existsSync } from 'fs';
import { resolve, relative } from 'path';
import { parse } from '@typescript-eslint/typescript-estree';
import glob from 'fast-glob';
import { minimatch } from 'minimatch';
import chalk from 'chalk';
/**
 * Load and parse configuration file
 */
export function loadConfig() {
    const configPath = resolve(process.cwd(), 'config.json');
    if (!existsSync(configPath)) {
        throw new Error(`Configuration file not found at ${configPath}`);
    }
    const configContent = readFileSync(configPath, 'utf-8');
    return JSON.parse(configContent);
}
/**
 * Parse principles.md file and extract rules
 */
export function parsePrinciplesFile(principlesPath) {
    if (!existsSync(principlesPath)) {
        throw new Error(`Principles file not found at ${principlesPath}`);
    }
    const content = readFileSync(principlesPath, 'utf-8');
    // Extract LEVER framework rules
    const leverSection = extractSection(content, '## The LEVER Framework');
    const technicalRules = extractSection(content, '## Core Technical Rules');
    const patterns = extractExistingPatterns(content);
    const forbiddenExamples = extractForbiddenExamples(content);
    return {
        lever: leverSection,
        technical: technicalRules,
        patterns,
        forbidden: forbiddenExamples
    };
}
/**
 * Extract a specific section from markdown content
 */
function extractSection(content, sectionTitle) {
    const lines = content.split('\n');
    let inSection = false;
    let sectionContent = '';
    let sectionLevel = 0;
    for (const line of lines) {
        if (line.startsWith(sectionTitle)) {
            inSection = true;
            sectionLevel = line.match(/^#+/)?.[0].length || 0;
            continue;
        }
        if (inSection) {
            const currentLevel = line.match(/^#+/)?.[0].length || 0;
            if (currentLevel > 0 && currentLevel <= sectionLevel) {
                break;
            }
            sectionContent += line + '\n';
        }
    }
    return sectionContent;
}
/**
 * Extract existing patterns from principles
 */
function extractExistingPatterns(content) {
    const patterns = [];
    const lines = content.split('\n');
    for (const line of lines) {
        if (line.includes('**EXISTING PATTERNS TO LEVERAGE:**')) {
            continue;
        }
        const match = line.match(/^- `([^`]+)`/);
        if (match) {
            patterns.push(match[1]);
        }
    }
    return patterns;
}
/**
 * Extract forbidden examples from DON'T sections
 */
function extractForbiddenExamples(content) {
    const forbidden = [];
    const lines = content.split('\n');
    let inDontSection = false;
    let inCodeBlock = false;
    for (const line of lines) {
        if (line.includes("**DON'T:**")) {
            inDontSection = true;
            continue;
        }
        if (inDontSection && line.startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            continue;
        }
        if (inDontSection && inCodeBlock && line.includes('// WRONG')) {
            const codeLine = line.split('// WRONG')[0].trim();
            if (codeLine) {
                forbidden.push(codeLine);
            }
        }
        if (inDontSection && line.startsWith('**') && !line.includes("DON'T")) {
            inDontSection = false;
            inCodeBlock = false;
        }
    }
    return forbidden;
}
/**
 * Parse TypeScript/JavaScript file into AST
 */
export function parseFile(filePath, content) {
    try {
        const fileContent = content || readFileSync(filePath, 'utf-8');
        const isTypeScript = filePath.endsWith('.ts') || filePath.endsWith('.tsx');
        return parse(fileContent, {
            loc: true,
            range: true,
            comment: true,
            tokens: true,
            jsx: filePath.endsWith('.tsx') || filePath.endsWith('.jsx'),
            useJSXTextNode: true,
            ecmaVersion: 'latest',
            sourceType: 'module',
            ecmaFeatures: {
                jsx: true,
                globalReturn: false,
                impliedStrict: true
            }
        });
    }
    catch (error) {
        console.warn(chalk.yellow(`Warning: Could not parse ${filePath}: ${error}`));
        return null;
    }
}
/**
 * Get all files to validate based on config
 */
export function getFilesToValidate(config, specificFiles) {
    const projectRoot = resolve(process.cwd(), config.paths.projectRoot);
    if (specificFiles) {
        return specificFiles
            .map(f => resolve(f))
            .filter(f => existsSync(f) && !shouldIgnoreFile(f, config));
    }
    const patterns = config.paths.includedExtensions.map(ext => `**/*${ext}`);
    const files = glob.sync(patterns, {
        cwd: projectRoot,
        absolute: true,
        ignore: config.paths.ignoredPaths
    });
    return files.filter(f => !shouldIgnoreFile(f, config));
}
/**
 * Check if file should be ignored based on config
 */
export function shouldIgnoreFile(filePath, config) {
    const projectRootDir = config.paths.projectRoot ? resolve(process.cwd(), config.paths.projectRoot) : process.cwd();
    const relativePath = relative(projectRootDir, filePath);
    for (const ignoredPath of config.paths.ignoredPaths) {
        if (minimatch(relativePath, ignoredPath)) {
            return true;
        }
    }
    // Check if file is generated
    if (relativePath.includes('.generated.') ||
        relativePath.includes('.d.ts') ||
        relativePath.includes('node_modules')) {
        return true;
    }
    return false;
}
/**
 * Normalize file path to be relative to project root
 */
export function normalizeFilePath(filePath, config) {
    const projectRootDir = config.paths.projectRoot ? resolve(process.cwd(), config.paths.projectRoot) : process.cwd();
    return relative(projectRootDir, filePath);
}
/**
 * Check if file matches a pattern
 */
export function matchesPattern(filePath, pattern, projectRoot) {
    const rootDir = projectRoot ? resolve(process.cwd(), projectRoot) : process.cwd();
    const relativePath = relative(rootDir, filePath);
    return minimatch(relativePath, pattern);
}
/**
 * Get changed files from git
 */
export function getChangedFiles() {
    try {
        const { execSync } = require('child_process');
        const output = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
        return output.trim().split('\n').filter((f) => f.length > 0);
    }
    catch (error) {
        console.warn(chalk.yellow('Warning: Could not get git changes, checking all files'));
        return [];
    }
}
/**
 * Format violation for output
 */
export function formatViolation(violation, config) {
    const { colorOutput } = config.general;
    let output = '';
    // Level indicator
    const levelColor = violation.level === 'error' ? chalk.red :
        violation.level === 'warning' ? chalk.yellow : chalk.blue;
    if (colorOutput) {
        output += levelColor(`[${violation.level.toUpperCase()}]`);
    }
    else {
        output += `[${violation.level.toUpperCase()}]`;
    }
    // File and location
    if (violation.file) {
        const location = violation.line ? `:${violation.line}` : '';
        output += ` ${violation.file}${location}`;
    }
    // Rule
    output += ` (${violation.rule})`;
    // Message
    output += `\n  ${violation.message}`;
    // Context
    if (violation.context && config.general.showViolationDetails) {
        output += `\n  Context: ${violation.context}`;
    }
    return output;
}
/**
 * Print validation results
 */
export function printResults(result, config) {
    const { colorOutput } = config.general;
    console.log('\n' + '='.repeat(60));
    console.log('TravelBuddies Principles Validation Results');
    console.log('='.repeat(60));
    if (result.violations.length === 0) {
        const message = '✅ All principles validated successfully!';
        console.log(colorOutput ? chalk.green(message) : message);
        return;
    }
    // Group violations by level
    const errors = result.violations.filter(v => v.level === 'error');
    const warnings = result.violations.filter(v => v.level === 'warning');
    const infos = result.violations.filter(v => v.level === 'info');
    // Print violations
    if (errors.length > 0) {
        console.log(`\n${colorOutput ? chalk.red('ERRORS:') : 'ERRORS:'}`);
        errors.forEach(v => console.log(formatViolation(v, config)));
    }
    if (warnings.length > 0) {
        console.log(`\n${colorOutput ? chalk.yellow('WARNINGS:') : 'WARNINGS:'}`);
        warnings.forEach(v => console.log(formatViolation(v, config)));
    }
    if (infos.length > 0) {
        console.log(`\n${colorOutput ? chalk.blue('INFO:') : 'INFO:'}`);
        infos.forEach(v => console.log(formatViolation(v, config)));
    }
    // Summary
    console.log('\n' + '-'.repeat(60));
    console.log(`Summary: ${result.summary.errors} errors, ${result.summary.warnings} warnings, ${result.summary.infos} infos`);
    if (result.summary.errors > 0) {
        const message = '\n❌ Validation failed! Please fix the errors above.';
        console.log(colorOutput ? chalk.red(message) : message);
    }
    else if (result.summary.warnings > 0) {
        const message = '\n⚠️  Validation passed with warnings.';
        console.log(colorOutput ? chalk.yellow(message) : message);
    }
}
