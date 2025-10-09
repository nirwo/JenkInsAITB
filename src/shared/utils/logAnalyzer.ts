/**
 * Smart Log Analyzer - Pattern recognition for build failures (No AI required)
 * Detects common error patterns, suggests fixes, and provides jump-to-error functionality
 */

export interface LogIssue {
  line: number;
  severity: 'error' | 'warning' | 'info';
  category: string;
  pattern: string;
  message: string;
  suggestion?: string;
  docs?: string;
  relatedLines?: number[];
}

export interface LogAnalysisResult {
  issues: LogIssue[];
  summary: {
    totalErrors: number;
    totalWarnings: number;
    totalInfo: number;
    categories: string[];
    likelyRootCause?: LogIssue;
  };
  buildPhase?: string;
  estimatedFixTime?: string;
}

// Comprehensive error patterns database
const ERROR_PATTERNS = [
  // Compilation Errors
  {
    pattern: /error: (.*?cannot find symbol|package .* does not exist)/i,
    category: 'Compilation',
    severity: 'error' as const,
    suggestion: 'Check imports and dependencies in pom.xml or build.gradle',
    docs: 'https://docs.oracle.com/javase/tutorial/java/package/',
  },
  {
    pattern: /error: (.*?incompatible types|type mismatch)/i,
    category: 'Compilation',
    severity: 'error' as const,
    suggestion: 'Review type conversions and ensure correct data types',
  },
  
  // Maven/Gradle Errors
  {
    pattern: /\[ERROR\].*?Failed to execute goal.*?maven-(compiler|surefire|failsafe)/i,
    category: 'Maven Build',
    severity: 'error' as const,
    suggestion: 'Check Maven plugin configuration and Java version compatibility',
    docs: 'https://maven.apache.org/plugins/',
  },
  {
    pattern: /Could not resolve dependencies?|Could not find artifact/i,
    category: 'Dependency',
    severity: 'error' as const,
    suggestion: 'Verify repository configuration and artifact coordinates',
    docs: 'https://maven.apache.org/guides/introduction/introduction-to-repositories.html',
  },
  {
    pattern: /FAILURE: Build failed with an exception/i,
    category: 'Gradle Build',
    severity: 'error' as const,
    suggestion: 'Review Gradle configuration and task dependencies',
  },
  
  // Test Failures
  {
    pattern: /(Tests? (?:run|failed|error)|junit|testng)/i,
    category: 'Test Failure',
    severity: 'error' as const,
    suggestion: 'Review failing test cases and assertions',
  },
  {
    pattern: /AssertionError|expected.*but (?:was|got)/i,
    category: 'Test Assertion',
    severity: 'error' as const,
    suggestion: 'Check test expectations vs actual results',
  },
  
  // Network/Connection Errors
  {
    pattern: /(Connection (refused|timeout|reset)|UnknownHostException|NoRouteToHostException)/i,
    category: 'Network',
    severity: 'error' as const,
    suggestion: 'Verify network connectivity, firewall rules, and service availability',
  },
  {
    pattern: /certificate|SSL|TLS|PKIX path building failed/i,
    category: 'Security/SSL',
    severity: 'error' as const,
    suggestion: 'Check SSL certificates and trust store configuration',
    docs: 'https://docs.oracle.com/javase/8/docs/technotes/guides/security/jsse/JSSERefGuide.html',
  },
  
  // Docker Errors
  {
    pattern: /(docker.*?(error|failed)|Cannot connect to the Docker daemon)/i,
    category: 'Docker',
    severity: 'error' as const,
    suggestion: 'Ensure Docker daemon is running and accessible',
    docs: 'https://docs.docker.com/config/daemon/',
  },
  {
    pattern: /Error response from daemon|docker.*?permission denied/i,
    category: 'Docker Permissions',
    severity: 'error' as const,
    suggestion: 'Check Docker permissions or add user to docker group',
  },
  
  // Git/SCM Errors
  {
    pattern: /(fatal|error):.*?(git|repository|remote|branch)/i,
    category: 'Git/SCM',
    severity: 'error' as const,
    suggestion: 'Verify repository access, credentials, and branch names',
  },
  
  // Memory/Resource Errors
  {
    pattern: /(OutOfMemoryError|Java heap space|GC overhead limit exceeded)/i,
    category: 'Memory',
    severity: 'error' as const,
    suggestion: 'Increase JVM heap size (-Xmx) or optimize memory usage',
    docs: 'https://docs.oracle.com/en/java/javase/11/troubleshoot/troubleshoot-memory-leaks.html',
  },
  {
    pattern: /No space left on device/i,
    category: 'Disk Space',
    severity: 'error' as const,
    suggestion: 'Clean up workspace or increase disk space',
  },
  
  // Permission Errors
  {
    pattern: /(Permission denied|Access is denied|cannot access)/i,
    category: 'Permissions',
    severity: 'error' as const,
    suggestion: 'Check file/directory permissions and user access rights',
  },
  
  // NPM/Node Errors
  {
    pattern: /(npm ERR!|yarn error|pnpm ERR!)/i,
    category: 'NPM/Node',
    severity: 'error' as const,
    suggestion: 'Clear node_modules and package-lock.json, then reinstall',
  },
  
  // Python Errors
  {
    pattern: /(ModuleNotFoundError|ImportError|No module named)/i,
    category: 'Python Import',
    severity: 'error' as const,
    suggestion: 'Install missing Python packages or check PYTHONPATH',
  },
  
  // Timeout Errors
  {
    pattern: /(timeout|timed out|deadline exceeded)/i,
    category: 'Timeout',
    severity: 'warning' as const,
    suggestion: 'Increase timeout value or investigate slow operations',
  },
  
  // Warnings
  {
    pattern: /\[WARNING\]|WARN:|deprecated/i,
    category: 'Warning',
    severity: 'warning' as const,
    suggestion: 'Review warnings for potential future issues',
  },
];

// Build phase detection patterns
const PHASE_PATTERNS = [
  { pattern: /Checkout|Cloning|SCM checkout/i, phase: 'Source Checkout' },
  { pattern: /Compiling|javac|Compilation/i, phase: 'Compilation' },
  { pattern: /Running tests|T E S T S|Test execution/i, phase: 'Testing' },
  { pattern: /Building|Package|Assembly/i, phase: 'Build' },
  { pattern: /Docker build|Building image/i, phase: 'Docker Build' },
  { pattern: /Deploy|Publishing|Upload/i, phase: 'Deployment' },
];

/**
 * Analyze log content for errors, warnings, and patterns
 */
export function analyzeLogs(logContent: string): LogAnalysisResult {
  const lines = logContent.split('\n');
  const issues: LogIssue[] = [];
  let buildPhase: string | undefined;
  
  // Detect build phase
  for (const line of lines.slice(0, 100)) {
    for (const phasePattern of PHASE_PATTERNS) {
      if (phasePattern.pattern.test(line)) {
        buildPhase = phasePattern.phase;
        break;
      }
    }
    if (buildPhase) break;
  }
  
  // Analyze each line for patterns
  lines.forEach((line, index) => {
    for (const errorPattern of ERROR_PATTERNS) {
      if (errorPattern.pattern.test(line)) {
        issues.push({
          line: index + 1,
          severity: errorPattern.severity,
          category: errorPattern.category,
          pattern: errorPattern.pattern.source,
          message: line.trim(),
          suggestion: errorPattern.suggestion,
          docs: errorPattern.docs,
        });
      }
    }
  });
  
  // Find related lines (context around errors)
  issues.forEach(issue => {
    const relatedLines: number[] = [];
    const startLine = Math.max(0, issue.line - 3);
    const endLine = Math.min(lines.length, issue.line + 3);
    
    for (let i = startLine; i < endLine; i++) {
      if (i !== issue.line - 1) {
        relatedLines.push(i + 1);
      }
    }
    issue.relatedLines = relatedLines;
  });
  
  // Calculate summary
  const totalErrors = issues.filter(i => i.severity === 'error').length;
  const totalWarnings = issues.filter(i => i.severity === 'warning').length;
  const totalInfo = issues.filter(i => i.severity === 'info').length;
  const categories = [...new Set(issues.map(i => i.category))];
  
  // Determine likely root cause (first critical error)
  const likelyRootCause = issues.find(i => 
    i.severity === 'error' && 
    ['Compilation', 'Dependency', 'Maven Build', 'Gradle Build'].includes(i.category)
  ) || issues.find(i => i.severity === 'error');
  
  // Estimate fix time based on issue complexity
  const estimatedFixTime = estimateFixTime(issues, categories);
  
  return {
    issues,
    summary: {
      totalErrors,
      totalWarnings,
      totalInfo,
      categories,
      likelyRootCause,
    },
    buildPhase,
    estimatedFixTime,
  };
}

/**
 * Estimate time to fix based on issue types
 */
function estimateFixTime(issues: LogIssue[], categories: string[]): string {
  const errorCount = issues.filter(i => i.severity === 'error').length;
  
  if (errorCount === 0) return '< 5 minutes';
  
  const complexCategories = ['Maven Build', 'Gradle Build', 'Network', 'Docker', 'Security/SSL'];
  const hasComplexIssues = categories.some(cat => complexCategories.includes(cat));
  
  if (hasComplexIssues) {
    return errorCount > 5 ? '1-2 hours' : '30-60 minutes';
  }
  
  if (errorCount > 10) return '30-60 minutes';
  if (errorCount > 3) return '15-30 minutes';
  return '5-15 minutes';
}

/**
 * Group issues by category for better organization
 */
export function groupIssuesByCategory(issues: LogIssue[]): Record<string, LogIssue[]> {
  return issues.reduce((acc, issue) => {
    if (!acc[issue.category]) {
      acc[issue.category] = [];
    }
    acc[issue.category]!.push(issue);
    return acc;
  }, {} as Record<string, LogIssue[]>);
}

/**
 * Generate actionable recommendations based on analysis
 */
export function generateRecommendations(analysis: LogAnalysisResult): string[] {
  const recommendations: string[] = [];
  const { summary } = analysis;
  
  if (summary.likelyRootCause) {
    recommendations.push(`🎯 Start Here: ${summary.likelyRootCause.message.substring(0, 100)}...`);
    if (summary.likelyRootCause.suggestion) {
      recommendations.push(`💡 ${summary.likelyRootCause.suggestion}`);
    }
  }
  
  // Category-specific recommendations
  if (summary.categories.includes('Dependency')) {
    recommendations.push('Run: mvn dependency:purge-local-repository or gradle --refresh-dependencies');
  }
  
  if (summary.categories.includes('Test Failure')) {
    recommendations.push('Run failed tests locally: mvn test -Dtest=FailingTestClass');
  }
  
  if (summary.categories.includes('Memory')) {
    recommendations.push('Increase heap size: Add MAVEN_OPTS="-Xmx2048m" or increase in Jenkins job config');
  }
  
  if (summary.categories.includes('Docker')) {
    recommendations.push('Check Docker: docker ps && docker info');
  }
  
  if (summary.categories.includes('Network')) {
    recommendations.push('Test connectivity: Check firewall rules and verify service endpoints');
  }
  
  return recommendations;
}

/**
 * Search for specific error pattern in logs
 */
export function searchPattern(logContent: string, pattern: string, caseSensitive = false): number[] {
  const lines = logContent.split('\n');
  const matchedLines: number[] = [];
  const regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
  
  lines.forEach((line, index) => {
    if (regex.test(line)) {
      matchedLines.push(index + 1);
    }
  });
  
  return matchedLines;
}
