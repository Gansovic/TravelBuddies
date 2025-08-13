import { readFileSync } from 'fs';
import { relative } from 'path';
import { parseFile, matchesPattern, normalizeFilePath } from './utils.js';
/**
 * Main validation orchestrator
 */
export async function validateFile(filePath, config, content) {
    const violations = [];
    const fileContent = content || readFileSync(filePath, 'utf-8');
    const ast = parseFile(filePath, fileContent);
    const normalizedPath = normalizeFilePath(filePath, config);
    try {
        // LEVER Framework validations
        if (config.validation.lever.enabled) {
            violations.push(...await validateLeverFramework(filePath, fileContent, ast, config));
        }
        // Technical rules validations
        if (config.validation.technical.enabled) {
            violations.push(...await validateTechnicalRules(filePath, fileContent, ast, config));
        }
        // File organization validations
        if (config.validation.fileOrganization.enabled) {
            violations.push(...await validateFileOrganization(filePath, fileContent, config));
        }
        // Pattern validations
        violations.push(...await validatePatterns(filePath, fileContent, config));
    }
    catch (error) {
        violations.push({
            level: 'error',
            message: `Failed to validate file: ${error}`,
            file: normalizedPath,
            rule: 'validation-error'
        });
    }
    // Normalize all violation file paths
    const normalizedViolations = violations.map(violation => ({
        ...violation,
        file: violation.file ? normalizeFilePath(violation.file, config) : violation.file
    }));
    const summary = {
        errors: normalizedViolations.filter(v => v.level === 'error').length,
        warnings: normalizedViolations.filter(v => v.level === 'warning').length,
        infos: normalizedViolations.filter(v => v.level === 'info').length
    };
    return {
        passed: summary.errors === 0,
        violations: normalizedViolations,
        summary
    };
}
/**
 * Validate LEVER Framework principles
 */
async function validateLeverFramework(filePath, content, ast, config) {
    const violations = [];
    // L - Leverage Existing Patterns
    violations.push(...validateLeveragePatterns(filePath, content, ast, config));
    // E - Extend Before Creating
    violations.push(...validateExtendBeforeCreating(filePath, content, ast, config));
    // V - Verify Through Reactivity
    violations.push(...validateReactivePatterns(filePath, content, ast, config));
    // E - Eliminate Duplication
    violations.push(...validateDuplicationElimination(filePath, content, ast, config));
    // R - Reduce Complexity
    violations.push(...validateComplexityReduction(filePath, content, ast, config));
    return violations;
}
/**
 * L - Leverage Existing Patterns
 */
function validateLeveragePatterns(filePath, content, ast, config) {
    const violations = [];
    // Check for direct Supabase access without service
    const directSupabasePattern = /supabase\.(?:from|functions|auth|storage)\(/g;
    let match;
    while ((match = directSupabasePattern.exec(content)) !== null) {
        const line = content.substring(0, match.index).split('\n').length;
        // Check if it's in an allowed context (service files)
        const isInService = filePath.includes('.service.') ||
            filePath.includes('supabase/functions/') ||
            filePath.includes('/lib/supabaseClient');
        if (!isInService) {
            violations.push({
                level: 'error',
                message: 'Direct Supabase access forbidden. Use appropriate service instead.',
                file: filePath,
                line,
                rule: 'lever-leverage-patterns',
                context: content.split('\n')[line - 1]?.trim()
            });
        }
    }
    // Check for custom loading patterns instead of LoadingDialog
    const customLoadingPatterns = [
        /className="spinner"/g,
        /className="loading"/g,
        /<div.*loading.*>/gi
    ];
    for (const pattern of customLoadingPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            const line = content.substring(0, match.index).split('\n').length;
            violations.push({
                level: 'error',
                message: 'Custom loading patterns forbidden. Use LoadingDialog or LoadingOverlay.',
                file: filePath,
                line,
                rule: 'lever-leverage-patterns',
                context: content.split('\n')[line - 1]?.trim()
            });
        }
    }
    // Check if using existing patterns
    const requiredServices = ['ConfigService', 'EdgeFunctionsService', 'DataConverters'];
    for (const service of requiredServices) {
        if (content.includes(service) && !content.includes(`${service}.getInstance()`)) {
            violations.push({
                level: 'warning',
                message: `Consider using ${service}.getInstance() for singleton access`,
                file: filePath,
                rule: 'lever-leverage-patterns'
            });
        }
    }
    return violations;
}
/**
 * E - Extend Before Creating
 */
function validateExtendBeforeCreating(filePath, content, ast, config) {
    const violations = [];
    // Skip validation for the canonical implementations themselves
    const isCanonicalFile = filePath.includes('number-formatters') ||
        filePath.includes('data-converters') ||
        filePath.includes('paginated-data-provider');
    if (!isCanonicalFile) {
        // Check for parallel implementations
        const parallelPatterns = [
            { pattern: /class.*Pagination.*Provider/g, message: 'Extend PaginatedDataProvider instead of creating parallel implementation' },
            { pattern: /class.*NumberFormatter/g, message: 'Use existing NumberFormatters instead of creating custom one' },
            { pattern: /class.*DataConverter/g, message: 'Use existing DataConverters instead of creating custom one' }
        ];
        for (const { pattern, message } of parallelPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const line = content.substring(0, match.index).split('\n').length;
                violations.push({
                    level: 'error',
                    message,
                    file: filePath,
                    line,
                    rule: 'lever-extend-before-creating',
                    context: content.split('\n')[line - 1]?.trim()
                });
            }
        }
    }
    return violations;
}
/**
 * V - Verify Through Reactivity
 */
function validateReactivePatterns(filePath, content, ast, config) {
    const violations = [];
    // Check for manual polling instead of TanStack Query
    const pollingPatterns = [
        /setInterval\s*\(/g,
        /Timer\.periodic/g
    ];
    for (const pattern of pollingPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            const line = content.substring(0, match.index).split('\n').length;
            violations.push({
                level: 'error',
                message: 'Manual polling forbidden. Use TanStack Query with refetchInterval.',
                file: filePath,
                line,
                rule: 'lever-verify-reactivity',
                context: content.split('\n')[line - 1]?.trim()
            });
        }
    }
    // Check for manual server state management
    if (content.includes('useState') && content.includes('fetch') && !content.includes('useQuery')) {
        violations.push({
            level: 'warning',
            message: 'Consider using TanStack Query for server state management instead of manual useState + fetch',
            file: filePath,
            rule: 'lever-verify-reactivity'
        });
    }
    return violations;
}
/**
 * E - Eliminate Duplication
 */
function validateDuplicationElimination(filePath, content, ast, config) {
    const violations = [];
    // Skip hardcoded value checks for constants files and test files - they should contain hardcoded values!
    const isConstantsFile = filePath.includes('constants') || filePath.includes('app-constants');
    const isConfigPathsFile = filePath.includes('config-paths') || filePath.includes('ConfigPaths');
    const isTestFile = filePath.includes('.test.') || filePath.includes('.spec.');
    if (!isConstantsFile && !isConfigPathsFile && !isTestFile) {
        // Check for hardcoded values
        const hardcodedPatterns = [
            { pattern: /timeout\s*[=:]\s*\d+/g, message: 'Hardcoded timeout values forbidden. Use AppConstants.' },
            { pattern: /maxRetries\s*[=:]\s*\d+/g, message: 'Hardcoded retry values forbidden. Use AppConstants.' },
            { pattern: /'[^']*points_rules[^']*'/g, message: 'Hardcoded configuration paths forbidden. Use ConfigPaths.' }
        ];
        for (const { pattern, message } of hardcodedPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const line = content.substring(0, match.index).split('\n').length;
                violations.push({
                    level: 'error',
                    message,
                    file: filePath,
                    line,
                    rule: 'lever-eliminate-duplication',
                    context: content.split('\n')[line - 1]?.trim()
                });
            }
        }
    }
    // Check for duplicate string literals
    const stringLiteralsMatch = content.match(/'[^']{10,}'/g);
    const stringLiterals = stringLiteralsMatch || [];
    const duplicates = stringLiterals.filter((str, index) => stringLiterals.indexOf(str) !== index);
    if (duplicates.length > 0) {
        violations.push({
            level: 'warning',
            message: `Duplicate string literals found. Consider centralizing: ${duplicates.slice(0, 3).join(', ')}`,
            file: filePath,
            rule: 'lever-eliminate-duplication'
        });
    }
    return violations;
}
/**
 * R - Reduce Complexity
 */
function validateComplexityReduction(filePath, content, ast, config) {
    const violations = [];
    // Check for deep nesting
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const indentLevel = (line.match(/^[\s]*/)?.[0]?.length || 0) / 2;
        if (indentLevel > 6) {
            violations.push({
                level: 'warning',
                message: 'Deep nesting detected. Consider refactoring with early returns.',
                file: filePath,
                line: i + 1,
                rule: 'lever-reduce-complexity',
                context: line.trim()
            });
        }
    }
    // Check for functions with too many responsibilities
    const functionPattern = /(?:function|async function)\s+\w+.*\{([\s\S]*?)\}/g;
    let match;
    while ((match = functionPattern.exec(content)) !== null) {
        const functionBody = match[1];
        const responsibilities = [
            /await.*\.from\(/g.test(functionBody), // Database access
            /\.log\(/g.test(functionBody), // Logging
            /setState|setStatus/g.test(functionBody), // State updates
            /fetch|axios/g.test(functionBody), // HTTP requests
            /throw|catch/g.test(functionBody) // Error handling
        ].filter(Boolean).length;
        if (responsibilities > 3) {
            const line = content.substring(0, match.index).split('\n').length;
            violations.push({
                level: 'warning',
                message: 'Function has too many responsibilities. Consider breaking it down.',
                file: filePath,
                line,
                rule: 'lever-reduce-complexity'
            });
        }
    }
    return violations;
}
/**
 * Validate technical rules
 */
async function validateTechnicalRules(filePath, content, ast, config) {
    const violations = [];
    // Singleton pattern validation for services
    if (filePath.includes('.service.')) {
        violations.push(...validateSingletonPattern(filePath, content, config));
    }
    // Security validations
    violations.push(...validateSecurity(filePath, content, config));
    // Error handling validations
    violations.push(...validateErrorHandling(filePath, content, config));
    // Documentation validations
    violations.push(...validateDocumentation(filePath, content, config));
    return violations;
}
/**
 * Validate singleton pattern in services
 */
function validateSingletonPattern(filePath, content, config) {
    const violations = [];
    // Skip singleton validation for test files
    const isTestFile = filePath.includes('.test.') || filePath.includes('.spec.');
    if (isTestFile) {
        return violations;
    }
    const hasPrivateInstance = /private static instance:/g.test(content);
    const hasGetInstance = /static getInstance\(\)/g.test(content);
    const hasPrivateConstructor = /private constructor\(\)/g.test(content);
    if (!hasPrivateInstance) {
        violations.push({
            level: 'error',
            message: 'Service classes must implement singleton pattern with private static instance',
            file: filePath,
            rule: 'technical-singleton-pattern'
        });
    }
    if (!hasGetInstance) {
        violations.push({
            level: 'error',
            message: 'Service classes must have static getInstance() method',
            file: filePath,
            rule: 'technical-singleton-pattern'
        });
    }
    if (!hasPrivateConstructor) {
        violations.push({
            level: 'error',
            message: 'Service classes must have private constructor',
            file: filePath,
            rule: 'technical-singleton-pattern'
        });
    }
    return violations;
}
/**
 * Validate security requirements
 */
function validateSecurity(filePath, content, config) {
    const violations = [];
    // Check for PII logging
    const piiPatterns = [
        /console\.log.*email/gi,
        /console\.log.*password/gi,
        /console\.log.*token/gi,
        /logger.*email/gi
    ];
    for (const pattern of piiPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            const line = content.substring(0, match.index).split('\n').length;
            violations.push({
                level: 'error',
                message: 'Logging PII (email, password, token) is forbidden for security reasons',
                file: filePath,
                line,
                rule: 'technical-security',
                context: content.split('\n')[line - 1]?.trim()
            });
        }
    }
    // Check for input validation
    if (content.includes('req.body') || content.includes('userInput')) {
        if (!content.includes('parse') && !content.includes('validate')) {
            violations.push({
                level: 'warning',
                message: 'Input validation recommended when handling user data',
                file: filePath,
                rule: 'technical-security'
            });
        }
    }
    return violations;
}
/**
 * Validate error handling
 */
function validateErrorHandling(filePath, content, config) {
    const violations = [];
    // Check for try-catch in async functions
    const asyncFunctions = content.match(/async\s+function[^{]*\{[^}]*\}/gs) || [];
    for (const func of asyncFunctions) {
        if (!func.includes('try') || !func.includes('catch')) {
            violations.push({
                level: 'warning',
                message: 'Async functions should include proper error handling with try-catch',
                file: filePath,
                rule: 'technical-error-handling'
            });
        }
    }
    return violations;
}
/**
 * Validate documentation requirements
 */
function validateDocumentation(filePath, content, config) {
    const violations = [];
    // Check for class documentation
    const classPattern = /export\s+class\s+\w+/g;
    let match;
    while ((match = classPattern.exec(content)) !== null) {
        const beforeClass = content.substring(0, match.index);
        const lastDocComment = beforeClass.lastIndexOf('/**');
        const lastRegularComment = beforeClass.lastIndexOf('//');
        if (lastDocComment === -1 || (lastRegularComment > lastDocComment)) {
            const line = content.substring(0, match.index).split('\n').length;
            violations.push({
                level: 'warning',
                message: 'Public classes should have JSDoc documentation',
                file: filePath,
                line,
                rule: 'technical-documentation'
            });
        }
    }
    return violations;
}
/**
 * Validate file organization
 */
async function validateFileOrganization(filePath, content, config) {
    const violations = [];
    const relativePath = relative(process.cwd(), filePath);
    // Check naming conventions
    if (config.validation.fileOrganization.enforceNamingConventions) {
        violations.push(...validateNamingConventions(relativePath, content, config));
    }
    // Check directory structure
    if (config.validation.fileOrganization.enforceDirectoryStructure) {
        violations.push(...validateDirectoryStructure(relativePath, config));
    }
    return violations;
}
/**
 * Validate naming conventions
 */
function validateNamingConventions(filePath, content, config) {
    const violations = [];
    // Service files should end with .service.ts (only check for class definitions, not imports)
    const serviceClassRegex = /class\s+\w*Service\s*{/;
    if (serviceClassRegex.test(content) && !filePath.includes('.service.')) {
        violations.push({
            level: 'error',
            message: 'Service files should follow naming convention: *.service.ts',
            file: filePath,
            rule: 'file-organization-naming'
        });
    }
    // Hook files should start with use-
    if (content.includes('useCallback') || content.includes('useEffect')) {
        const fileName = filePath.split('/').pop() || '';
        if (!fileName.startsWith('use-') && !fileName.startsWith('use')) {
            violations.push({
                level: 'warning',
                message: 'Hook files should follow naming convention: use-*.ts',
                file: filePath,
                rule: 'file-organization-naming'
            });
        }
    }
    return violations;
}
/**
 * Validate directory structure
 */
function validateDirectoryStructure(filePath, config) {
    const violations = [];
    // Services should be in services directory
    if (filePath.includes('.service.') && !filePath.includes('/services/') && !filePath.includes('/lib/')) {
        violations.push({
            level: 'warning',
            message: 'Service files should be organized in services/ or lib/ directory',
            file: filePath,
            rule: 'file-organization-structure'
        });
    }
    // Components should be in components directory
    if ((filePath.includes('.tsx') || filePath.includes('.jsx')) &&
        !filePath.includes('/components/') &&
        !filePath.includes('/app/') &&
        !filePath.includes('page.') &&
        !filePath.includes('layout.')) {
        violations.push({
            level: 'warning',
            message: 'React components should be organized in components/ directory',
            file: filePath,
            rule: 'file-organization-structure'
        });
    }
    return violations;
}
/**
 * Validate patterns from config
 */
async function validatePatterns(filePath, content, config) {
    const violations = [];
    // Check forbidden patterns
    for (const forbidden of config.forbiddenPatterns) {
        const regex = new RegExp(forbidden.pattern, 'g');
        let match;
        // Check if file is in exceptions
        const isException = forbidden.exceptions.some(pattern => matchesPattern(filePath, pattern, config.paths.projectRoot));
        if (isException)
            continue;
        while ((match = regex.exec(content)) !== null) {
            const line = content.substring(0, match.index).split('\n').length;
            violations.push({
                level: 'error',
                message: forbidden.message,
                file: filePath,
                line,
                rule: 'pattern-forbidden',
                context: content.split('\n')[line - 1]?.trim()
            });
        }
    }
    // Check required patterns
    for (const required of config.requiredPatterns) {
        if (matchesPattern(filePath, required.filePattern, config.paths.projectRoot)) {
            const regex = new RegExp(required.codePattern, 'g');
            if (!regex.test(content)) {
                violations.push({
                    level: 'error',
                    message: required.message,
                    file: filePath,
                    rule: 'pattern-required'
                });
            }
        }
    }
    return violations;
}
/**
 * Validate commit message
 */
export function validateCommitMessage(message, config) {
    const violations = [];
    if (!config.commitValidation.conventionalCommits) {
        return { passed: true, violations: [], summary: { errors: 0, warnings: 0, infos: 0 } };
    }
    const lines = message.trim().split('\n');
    const subject = lines[0];
    // Check conventional commit format
    const conventionalPattern = new RegExp(`^(${config.commitValidation.allowedTypes.join('|')})(?:\\(.+\\))?: .{1,${config.commitValidation.maxSubjectLength}}$`);
    if (!conventionalPattern.test(subject)) {
        violations.push({
            level: 'error',
            message: `Commit message must follow conventional commits format: type(scope): description`,
            rule: 'commit-conventional-format',
            context: subject
        });
    }
    if (subject.length > config.commitValidation.maxSubjectLength) {
        violations.push({
            level: 'error',
            message: `Commit subject too long (${subject.length}/${config.commitValidation.maxSubjectLength} chars)`,
            rule: 'commit-subject-length',
            context: subject
        });
    }
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
