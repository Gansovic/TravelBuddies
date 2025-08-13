#!/usr/bin/env node

/**
 * TravelBuddies Post-Hook Script (Pre-Commit)
 * 
 * This script validates staged files and commit message BEFORE git commit
 * to ensure compliance with engineering principles defined in principles.md
 * 
 * Usage:
 *   npm run post-hook
 *   npm run post-hook --commit-msg "feat: add new feature"
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';
import { program } from 'commander';
import chalk from 'chalk';
import { 
  loadConfig, 
  shouldIgnoreFile,
  printResults,
  ValidationResult,
  Violation
} from './lib/utils.js';
import { validateFile, validateCommitMessage } from './lib/validators.js';

interface PostHookOptions {
  commitMsg?: string;
  skipTests?: boolean;
  verbose?: boolean;
  mode?: 'strict' | 'lenient';
}

async function main() {
  program
    .name('post-hook')
    .description('Validate staged files and commit message before git commit')
    .option('-m, --commit-msg <message>', 'commit message to validate')
    .option('--skip-tests', 'skip test coverage validation')
    .option('-v, --verbose', 'verbose output')
    .option('--mode <mode>', 'validation mode: strict or lenient', 'strict')
    .parse();

  const options: PostHookOptions = program.opts();
  
  try {
    const config = loadConfig();
    
    // Override config mode if specified
    if (options.mode) {
      config.general.mode = options.mode;
    }
    
    const results = await runPostHookValidation(options, config);
    
    if (!results.passed) {
      console.log(chalk.red('\n🚫 Pre-commit validation failed! Commit blocked.'));
      console.log(chalk.yellow('Please fix the violations above before committing.'));
      
      if (config.general.mode === 'strict') {
        process.exit(1);
      } else {
        console.log(chalk.yellow('Running in lenient mode - commit allowed with warnings.'));
      }
    }
    
    if (results.passed) {
      console.log(chalk.green('\n✅ Pre-commit validation passed! Commit allowed.'));
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error(chalk.red(`Post-hook validation error: ${error}`));
    process.exit(1);
  }
}

async function runPostHookValidation(options: PostHookOptions, config: any): Promise<ValidationResult> {
  console.log(chalk.blue('🔍 Running TravelBuddies Pre-Commit Validation...'));
  console.log(chalk.gray('Validating staged files and commit compliance\n'));
  
  const allViolations: Violation[] = [];
  
  // 1. Validate staged files
  const fileValidationResult = await validateStagedFiles(options, config);
  allViolations.push(...fileValidationResult.violations);
  
  // 2. Validate commit message
  const commitValidationResult = await validateCommit(options, config);
  allViolations.push(...commitValidationResult.violations);
  
  // 3. Validate test coverage (if not skipped)
  if (!options.skipTests && config.validation.testing.enabled) {
    const testValidationResult = await validateTestCoverage(options, config);
    allViolations.push(...testValidationResult.violations);
  }
  
  // 4. Validate audit logging for value operations
  const auditValidationResult = await validateAuditLogging(options, config);
  allViolations.push(...auditValidationResult.violations);
  
  const summary = {
    errors: allViolations.filter(v => v.level === 'error').length,
    warnings: allViolations.filter(v => v.level === 'warning').length,
    infos: allViolations.filter(v => v.level === 'info').length
  };
  
  const result: ValidationResult = {
    passed: summary.errors === 0 || config.general.mode === 'lenient',
    violations: allViolations,
    summary
  };
  
  printResults(result, config);
  return result;
}

async function validateStagedFiles(options: PostHookOptions, config: any): Promise<ValidationResult> {
  console.log(chalk.blue('📁 Validating staged files...'));
  
  // Get staged files
  const stagedFiles = getStagedFiles().filter(f => 
    existsSync(f) && !shouldIgnoreFile(f, config)
  );
  
  if (stagedFiles.length === 0) {
    console.log(chalk.yellow('No staged files to validate.'));
    return {
      passed: true,
      violations: [],
      summary: { errors: 0, warnings: 0, infos: 0 }
    };
  }
  
  if (options.verbose) {
    console.log(chalk.gray(`Staged files: ${stagedFiles.length}`));
    stagedFiles.forEach(f => console.log(chalk.gray(`  - ${f}`)));
    console.log('');
  }
  
  const allViolations: Violation[] = [];
  let filesValidated = 0;
  
  for (const filePath of stagedFiles) {
    try {
      if (options.verbose) {
        process.stdout.write(chalk.gray(`Validating ${filePath}... `));
      }
      
      // Get staged content (what will be committed)
      const stagedContent = getStagedFileContent(filePath);
      const result = await validateFile(filePath, config, stagedContent);
      
      filesValidated++;
      allViolations.push(...result.violations);
      
      if (options.verbose) {
        if (result.violations.length === 0) {
          console.log(chalk.green('✓'));
        } else {
          console.log(chalk.red(`✗ (${result.violations.length} violations)`));
        }
      }
      
    } catch (error) {
      console.error(chalk.red(`Error validating ${filePath}: ${error}`));
      allViolations.push({
        level: 'error',
        message: `Validation error: ${error}`,
        file: filePath,
        rule: 'validation-error'
      });
    }
  }
  
  console.log(chalk.gray(`Validated ${filesValidated} staged files\n`));
  
  const summary = {
    errors: allViolations.filter(v => v.level === 'error').length,
    warnings: allViolations.filter(v => v.level === 'warning').length,
    infos: allViolations.filter(v => v.level === 'info').length
  };
  
  return {
    passed: summary.errors === 0,
    violations: allViolations,
    summary
  };
}

async function validateCommit(options: PostHookOptions, config: any): Promise<ValidationResult> {
  console.log(chalk.blue('💬 Validating commit message...'));
  
  let commitMessage = options.commitMsg;
  
  if (!commitMessage) {
    try {
      // Try to get commit message from git
      commitMessage = execSync('git log --format=%B -n 1 HEAD', { encoding: 'utf-8' }).trim();
    } catch (error) {
      // If that fails, try to read from COMMIT_EDITMSG
      try {
        commitMessage = readFileSync('.git/COMMIT_EDITMSG', 'utf-8').trim();
      } catch (readError) {
        console.log(chalk.yellow('Could not retrieve commit message for validation'));
        return {
          passed: true,
          violations: [],
          summary: { errors: 0, warnings: 0, infos: 0 }
        };
      }
    }
  }
  
  if (!commitMessage || commitMessage.trim().length === 0) {
    return {
      passed: false,
      violations: [{
        level: 'error',
        message: 'Commit message is required',
        rule: 'commit-message-required'
      }],
      summary: { errors: 1, warnings: 0, infos: 0 }
    };
  }
  
  const result = validateCommitMessage(commitMessage, config);
  
  if (options.verbose) {
    console.log(chalk.gray(`Commit message: "${commitMessage.split('\\n')[0]}"`));
  }
  
  console.log(chalk.gray('Commit message validation completed\n'));
  return result;
}

async function validateTestCoverage(options: PostHookOptions, config: any): Promise<ValidationResult> {
  console.log(chalk.blue('🧪 Validating test coverage...'));
  
  const violations: Violation[] = [];
  
  try {
    // Check if new files have corresponding tests
    const stagedFiles = getStagedFiles();
    const newCodeFiles = stagedFiles.filter(f => 
      (f.endsWith('.ts') || f.endsWith('.tsx')) && 
      !f.includes('.test.') && 
      !f.includes('.spec.') &&
      !f.includes('/test/') &&
      !f.includes('/__tests__/') &&
      !shouldIgnoreFile(f, config)
    );
    
    for (const codeFile of newCodeFiles) {
      const testFile = findTestFile(codeFile);
      if (!testFile || !existsSync(testFile)) {
        violations.push({
          level: config.validation.testing.requireTestsForNewCode ? 'error' : 'warning',
          message: 'New code files should have corresponding test files',
          file: codeFile,
          rule: 'testing-coverage-new-files'
        });
      }
    }
    
    // Run test coverage if available
    if (existsSync('package.json')) {
      try {
        const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
        
        if (packageJson.scripts && packageJson.scripts.test) {
          if (options.verbose) {
            console.log(chalk.gray('Running test coverage...'));
          }
          
          // Run tests with coverage (suppress output unless verbose)
          const testOutput = execSync('npm run test -- --coverage --passWithNoTests', { 
            encoding: 'utf-8',
            stdio: options.verbose ? 'inherit' : 'pipe'
          });
          
          // Parse coverage results (this would need to be customized based on your test runner)
          const coverageMatch = testOutput.match(/All files[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*(\d+\.?\d*)/);
          if (coverageMatch) {
            const coverage = parseFloat(coverageMatch[1]);
            const minCoverage = config.validation.testing.minimumCoverage;
            
            if (coverage < minCoverage) {
              violations.push({
                level: 'warning',
                message: `Test coverage ${coverage}% is below minimum ${minCoverage}%`,
                rule: 'testing-coverage-threshold'
              });
            }
          }
        }
      } catch (testError) {
        violations.push({
          level: 'warning',
          message: `Could not run test coverage: ${testError}`,
          rule: 'testing-coverage-error'
        });
      }
    }
    
  } catch (error) {
    violations.push({
      level: 'warning',
      message: `Test coverage validation error: ${error}`,
      rule: 'testing-validation-error'
    });
  }
  
  console.log(chalk.gray('Test coverage validation completed\n'));
  
  const summary = {
    errors: violations.filter(v => v.level === 'error').length,
    warnings: violations.filter(v => v.level === 'warning').length,
    infos: violations.filter(v => v.level === 'info').length
  };
  
  return {
    passed: summary.errors === 0,
    violations,
    summary
  };
}

async function validateAuditLogging(options: PostHookOptions, config: any): Promise<ValidationResult> {
  console.log(chalk.blue('📋 Validating audit logging requirements...'));
  
  const violations: Violation[] = [];
  const stagedFiles = getStagedFiles();
  
  // Check for value operations that need audit logging
  const valueOperationPatterns = [
    /points.*[+=]/gi,
    /balance.*[+=]/gi,
    /settlement/gi,
    /expense.*create/gi,
    /trip.*create/gi
  ];
  
  for (const filePath of stagedFiles) {
    if (!filePath.includes('.ts') && !filePath.includes('.tsx')) continue;
    if (shouldIgnoreFile(filePath, config)) continue;
    
    try {
      const content = getStagedFileContent(filePath);
      
      // Check if file contains value operations
      const hasValueOperations = valueOperationPatterns.some(pattern => 
        pattern.test(content)
      );
      
      if (hasValueOperations) {
        // Check if audit logging is present
        const hasAuditLogging = content.includes('audit_logs') || 
                               content.includes('createAuditLog') ||
                               content.includes('AuditLog');
        
        if (!hasAuditLogging) {
          violations.push({
            level: 'error',
            message: 'Value operations must include audit logging',
            file: filePath,
            rule: 'audit-logging-required'
          });
        }
      }
      
    } catch (error) {
      // Ignore files that can't be read
    }
  }
  
  console.log(chalk.gray('Audit logging validation completed\n'));
  
  const summary = {
    errors: violations.filter(v => v.level === 'error').length,
    warnings: violations.filter(v => v.level === 'warning').length,
    infos: violations.filter(v => v.level === 'info').length
  };
  
  return {
    passed: summary.errors === 0,
    violations,
    summary
  };
}

function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
    return output.trim().split('\n').filter(f => f.length > 0).map(f => resolve(f));
  } catch (error) {
    console.warn(chalk.yellow('Warning: Could not get staged files'));
    return [];
  }
}

function getStagedFileContent(filePath: string): string {
  try {
    // Get the staged content of the file
    const relativePath = filePath.replace(process.cwd() + '/', '');
    return execSync(`git show :${relativePath}`, { encoding: 'utf-8' });
  } catch (error) {
    // If git show fails, fall back to current file content
    return readFileSync(filePath, 'utf-8');
  }
}

function findTestFile(codeFile: string): string | null {
  const possibleTestPaths = [
    codeFile.replace(/\.ts$/, '.test.ts'),
    codeFile.replace(/\.tsx$/, '.test.tsx'),
    codeFile.replace(/\.ts$/, '.spec.ts'),
    codeFile.replace(/\.tsx$/, '.spec.tsx'),
    codeFile.replace(/\/([^/]+)\.ts$/, '/__tests__/$1.test.ts'),
    codeFile.replace(/\/([^/]+)\.tsx$/, '/__tests__/$1.test.tsx')
  ];
  
  return possibleTestPaths.find(path => existsSync(path)) || null;
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\nPost-hook validation interrupted'));
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\n\nPost-hook validation terminated'));
  process.exit(1);
});

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(chalk.red(`Fatal error: ${error}`));
    process.exit(1);
  });
}