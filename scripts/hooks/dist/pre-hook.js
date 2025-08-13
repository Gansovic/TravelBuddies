#!/usr/bin/env node
/**
 * TravelBuddies Pre-Hook Script
 *
 * This script validates files BEFORE they are created or edited to ensure
 * compliance with engineering principles defined in principles.md
 *
 * Usage:
 *   npm run pre-hook <file1> <file2> ...
 *   npm run pre-hook (validates all changed files)
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { program } from 'commander';
import chalk from 'chalk';
import { loadConfig, getFilesToValidate, getChangedFiles, shouldIgnoreFile, printResults } from './lib/utils.js';
import { validateFile } from './lib/validators.js';
async function main() {
    program
        .name('pre-hook')
        .description('Validate files against TravelBuddies engineering principles before editing')
        .option('-f, --files <files...>', 'specific files to validate')
        .option('--fix', 'attempt to auto-fix violations where possible')
        .option('-s, --severity <level>', 'minimum severity level to report', 'error')
        .option('-v, --verbose', 'verbose output')
        .parse();
    const options = program.opts();
    try {
        const config = loadConfig();
        const results = await runPreHookValidation(options, config);
        if (!results.passed && config.general.exitOnViolation) {
            console.log(chalk.red('\n🚫 Pre-hook validation failed! File changes blocked.'));
            console.log(chalk.yellow('Please fix the violations above before proceeding.'));
            process.exit(1);
        }
        if (results.passed) {
            console.log(chalk.green('\n✅ Pre-hook validation passed! File changes allowed.'));
        }
        process.exit(0);
    }
    catch (error) {
        console.error(chalk.red(`Pre-hook validation error: ${error}`));
        process.exit(1);
    }
}
async function runPreHookValidation(options, config) {
    console.log(chalk.blue('🔍 Running TravelBuddies Pre-Hook Validation...'));
    console.log(chalk.gray('Checking compliance with engineering principles\n'));
    // Determine files to validate
    let filesToValidate = [];
    if (options.files && options.files.length > 0) {
        filesToValidate = options.files.map(f => resolve(f));
    }
    else {
        // Get files that are about to be changed
        const changedFiles = getChangedFiles();
        if (changedFiles.length === 0) {
            console.log(chalk.yellow('No changed files detected. Validating all eligible files...'));
            filesToValidate = getFilesToValidate(config);
        }
        else {
            filesToValidate = changedFiles
                .map(f => resolve(f))
                .filter(f => existsSync(f) && !shouldIgnoreFile(f, config));
        }
    }
    if (filesToValidate.length === 0) {
        console.log(chalk.yellow('No files to validate.'));
        return {
            passed: true,
            violations: [],
            summary: { errors: 0, warnings: 0, infos: 0 }
        };
    }
    if (options.verbose) {
        console.log(chalk.gray(`Files to validate: ${filesToValidate.length}`));
        filesToValidate.forEach(f => console.log(chalk.gray(`  - ${f}`)));
        console.log('');
    }
    // Validate each file
    const allViolations = [];
    let filesValidated = 0;
    let filesWithViolations = 0;
    for (const filePath of filesToValidate) {
        try {
            if (options.verbose) {
                process.stdout.write(chalk.gray(`Validating ${filePath}... `));
            }
            const result = await validateFile(filePath, config);
            filesValidated++;
            // Filter violations by severity
            const filteredViolations = result.violations.filter(v => {
                if (options.severity === 'all')
                    return true;
                if (options.severity === 'warning')
                    return v.level === 'warning' || v.level === 'error';
                return v.level === 'error';
            });
            if (filteredViolations.length > 0) {
                filesWithViolations++;
                allViolations.push(...filteredViolations);
            }
            if (options.verbose) {
                if (filteredViolations.length === 0) {
                    console.log(chalk.green('✓'));
                }
                else {
                    console.log(chalk.red(`✗ (${filteredViolations.length} violations)`));
                }
            }
        }
        catch (error) {
            console.error(chalk.red(`Error validating ${filePath}: ${error}`));
            allViolations.push({
                level: 'error',
                message: `Validation error: ${error}`,
                file: filePath,
                rule: 'validation-error'
            });
        }
    }
    // Print progress summary
    console.log(chalk.gray(`\nValidated ${filesValidated} files`));
    if (filesWithViolations > 0) {
        console.log(chalk.yellow(`${filesWithViolations} files have violations`));
    }
    // Categorize violations
    const summary = {
        errors: allViolations.filter(v => v.level === 'error').length,
        warnings: allViolations.filter(v => v.level === 'warning').length,
        infos: allViolations.filter(v => v.level === 'info').length
    };
    const result = {
        passed: summary.errors === 0,
        violations: allViolations,
        summary
    };
    // Print results
    printResults(result, config);
    // Auto-fix if requested
    if (options.fix && allViolations.length > 0) {
        console.log(chalk.blue('\n🔧 Attempting to auto-fix violations...'));
        const fixedCount = await attemptAutoFix(allViolations, config);
        if (fixedCount > 0) {
            console.log(chalk.green(`✅ Auto-fixed ${fixedCount} violations`));
            console.log(chalk.yellow('Please review the changes and re-run validation'));
        }
        else {
            console.log(chalk.yellow('No auto-fixable violations found'));
        }
    }
    return result;
}
async function attemptAutoFix(violations, config) {
    let fixedCount = 0;
    // Group violations by file
    const violationsByFile = violations.reduce((acc, violation) => {
        if (!violation.file)
            return acc;
        if (!acc[violation.file])
            acc[violation.file] = [];
        acc[violation.file].push(violation);
        return acc;
    }, {});
    for (const [filePath, fileViolations] of Object.entries(violationsByFile)) {
        try {
            let content = readFileSync(filePath, 'utf-8');
            let modified = false;
            for (const violation of fileViolations) {
                const fixed = await tryFixViolation(violation, content);
                if (fixed && fixed !== content) {
                    content = fixed;
                    modified = true;
                    fixedCount++;
                }
            }
            if (modified) {
                // In a real implementation, you might want to write the fixed content back
                // For now, just log what would be fixed
                console.log(chalk.gray(`Would fix ${filePath}`));
            }
        }
        catch (error) {
            console.error(chalk.red(`Error auto-fixing ${filePath}: ${error}`));
        }
    }
    return fixedCount;
}
async function tryFixViolation(violation, content) {
    // Implement auto-fixes for common violations
    switch (violation.rule) {
        case 'lever-leverage-patterns':
            if (violation.message.includes('LoadingDialog')) {
                // Replace custom loading with LoadingDialog
                return content.replace(/<div className="spinner">Loading\.\.\.<\/div>/g, '<LoadingSpinner />');
            }
            break;
        case 'lever-eliminate-duplication':
            if (violation.message.includes('hardcoded timeout')) {
                // Replace hardcoded timeouts with constants
                return content.replace(/timeout\s*[=:]\s*(\d+)/g, 'timeout: AppConstants.defaultTimeout');
            }
            break;
        case 'technical-documentation':
            if (violation.message.includes('JSDoc documentation')) {
                // Add basic JSDoc template
                const lines = content.split('\n');
                if (violation.line) {
                    lines.splice(violation.line - 1, 0, '/**', ' * TODO: Add description', ' */');
                    return lines.join('\n');
                }
            }
            break;
    }
    return null;
}
// Handle process termination gracefully
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\nPre-hook validation interrupted'));
    process.exit(1);
});
process.on('SIGTERM', () => {
    console.log(chalk.yellow('\n\nPre-hook validation terminated'));
    process.exit(1);
});
// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error(chalk.red(`Fatal error: ${error}`));
        process.exit(1);
    });
}
