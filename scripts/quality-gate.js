#!/usr/bin/env node
// scripts/quality-gate.js
// Quality gate checks for CI/CD pipeline

const fs = require('fs');
const path = require('path');

// Quality thresholds
const QUALITY_THRESHOLDS = {
  coverage: {
    lines: 70,
    functions: 70,
    branches: 70,
    statements: 70,
  },
  performance: {
    maxBundleSize: 5 * 1024 * 1024, // 5MB
    maxComponentRenderTime: 16, // 16ms for 60fps
    maxHookExecutionTime: 5, // 5ms
    maxStorageOperationTime: 50, // 50ms
  },
  security: {
    maxHighVulnerabilities: 0,
    maxMediumVulnerabilities: 5,
  },
  codeQuality: {
    maxLintErrors: 0,
    maxLintWarnings: 10,
    maxTypeScriptErrors: 0,
  },
};

class QualityGate {
  constructor() {
    this.results = {
      coverage: null,
      performance: null,
      security: null,
      codeQuality: null,
      overall: 'UNKNOWN',
    };
    this.errors = [];
    this.warnings = [];
  }

  async run() {
    console.log('🚀 Running Quality Gate Checks...\n');

    try {
      await this.checkCoverage();
      await this.checkPerformance();
      await this.checkSecurity();
      await this.checkCodeQuality();
      
      this.calculateOverallResult();
      this.generateReport();
      
      if (this.results.overall === 'FAIL') {
        console.error('❌ Quality Gate FAILED');
        process.exit(1);
      } else {
        console.log('✅ Quality Gate PASSED');
        process.exit(0);
      }
    } catch (error) {
      console.error('💥 Quality Gate execution failed:', error.message);
      process.exit(1);
    }
  }

  async checkCoverage() {
    console.log('📊 Checking test coverage...');
    
    try {
      const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
      
      if (!fs.existsSync(coveragePath)) {
        this.errors.push('Coverage report not found');
        this.results.coverage = 'FAIL';
        return;
      }

      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      const total = coverage.total;

      const checks = [
        { name: 'Lines', actual: total.lines.pct, threshold: QUALITY_THRESHOLDS.coverage.lines },
        { name: 'Functions', actual: total.functions.pct, threshold: QUALITY_THRESHOLDS.coverage.functions },
        { name: 'Branches', actual: total.branches.pct, threshold: QUALITY_THRESHOLDS.coverage.branches },
        { name: 'Statements', actual: total.statements.pct, threshold: QUALITY_THRESHOLDS.coverage.statements },
      ];

      let coveragePassed = true;
      checks.forEach(check => {
        if (check.actual < check.threshold) {
          this.errors.push(`${check.name} coverage ${check.actual}% is below threshold ${check.threshold}%`);
          coveragePassed = false;
        } else {
          console.log(`  ✅ ${check.name}: ${check.actual}% (>= ${check.threshold}%)`);
        }
      });

      this.results.coverage = coveragePassed ? 'PASS' : 'FAIL';
    } catch (error) {
      this.errors.push(`Coverage check failed: ${error.message}`);
      this.results.coverage = 'FAIL';
    }
  }

  async checkPerformance() {
    console.log('⚡ Checking performance metrics...');
    
    try {
      const performancePath = path.join(process.cwd(), 'performance-report.json');
      
      if (!fs.existsSync(performancePath)) {
        this.warnings.push('Performance report not found');
        this.results.performance = 'WARN';
        return;
      }

      const performance = JSON.parse(fs.readFileSync(performancePath, 'utf8'));
      
      const checks = [
        {
          name: 'Bundle Size',
          actual: performance.bundleSize || 0,
          threshold: QUALITY_THRESHOLDS.performance.maxBundleSize,
          unit: 'bytes',
          format: (value) => `${(value / 1024 / 1024).toFixed(2)}MB`,
        },
        {
          name: 'Component Render Time',
          actual: performance.componentRenderTime || 0,
          threshold: QUALITY_THRESHOLDS.performance.maxComponentRenderTime,
          unit: 'ms',
          format: (value) => `${value.toFixed(2)}ms`,
        },
        {
          name: 'Hook Execution Time',
          actual: performance.hookExecutionTime || 0,
          threshold: QUALITY_THRESHOLDS.performance.maxHookExecutionTime,
          unit: 'ms',
          format: (value) => `${value.toFixed(2)}ms`,
        },
      ];

      let performancePassed = true;
      checks.forEach(check => {
        if (check.actual > check.threshold) {
          this.errors.push(`${check.name} ${check.format(check.actual)} exceeds threshold ${check.format(check.threshold)}`);
          performancePassed = false;
        } else {
          console.log(`  ✅ ${check.name}: ${check.format(check.actual)} (<= ${check.format(check.threshold)})`);
        }
      });

      this.results.performance = performancePassed ? 'PASS' : 'FAIL';
    } catch (error) {
      this.warnings.push(`Performance check failed: ${error.message}`);
      this.results.performance = 'WARN';
    }
  }

  async checkSecurity() {
    console.log('🔒 Checking security vulnerabilities...');
    
    try {
      // Check npm audit results
      const auditPath = path.join(process.cwd(), 'npm-audit.json');
      
      if (fs.existsSync(auditPath)) {
        const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
        
        const highVulns = audit.metadata?.vulnerabilities?.high || 0;
        const mediumVulns = audit.metadata?.vulnerabilities?.moderate || 0;
        
        let securityPassed = true;
        
        if (highVulns > QUALITY_THRESHOLDS.security.maxHighVulnerabilities) {
          this.errors.push(`${highVulns} high severity vulnerabilities found (max: ${QUALITY_THRESHOLDS.security.maxHighVulnerabilities})`);
          securityPassed = false;
        }
        
        if (mediumVulns > QUALITY_THRESHOLDS.security.maxMediumVulnerabilities) {
          this.warnings.push(`${mediumVulns} medium severity vulnerabilities found (max: ${QUALITY_THRESHOLDS.security.maxMediumVulnerabilities})`);
        }
        
        if (securityPassed) {
          console.log(`  ✅ Security: ${highVulns} high, ${mediumVulns} medium vulnerabilities`);
        }
        
        this.results.security = securityPassed ? 'PASS' : 'FAIL';
      } else {
        this.warnings.push('Security audit report not found');
        this.results.security = 'WARN';
      }
    } catch (error) {
      this.warnings.push(`Security check failed: ${error.message}`);
      this.results.security = 'WARN';
    }
  }

  async checkCodeQuality() {
    console.log('🧹 Checking code quality...');
    
    try {
      let codeQualityPassed = true;
      
      // Check ESLint results
      const eslintPath = path.join(process.cwd(), 'eslint-report.json');
      if (fs.existsSync(eslintPath)) {
        const eslint = JSON.parse(fs.readFileSync(eslintPath, 'utf8'));
        
        const errors = eslint.reduce((sum, file) => sum + file.errorCount, 0);
        const warnings = eslint.reduce((sum, file) => sum + file.warningCount, 0);
        
        if (errors > QUALITY_THRESHOLDS.codeQuality.maxLintErrors) {
          this.errors.push(`${errors} ESLint errors found (max: ${QUALITY_THRESHOLDS.codeQuality.maxLintErrors})`);
          codeQualityPassed = false;
        }
        
        if (warnings > QUALITY_THRESHOLDS.codeQuality.maxLintWarnings) {
          this.warnings.push(`${warnings} ESLint warnings found (max: ${QUALITY_THRESHOLDS.codeQuality.maxLintWarnings})`);
        }
        
        if (codeQualityPassed) {
          console.log(`  ✅ ESLint: ${errors} errors, ${warnings} warnings`);
        }
      }
      
      // Check TypeScript compilation
      const tscPath = path.join(process.cwd(), 'tsc-report.json');
      if (fs.existsSync(tscPath)) {
        const tsc = JSON.parse(fs.readFileSync(tscPath, 'utf8'));
        
        if (tsc.errors && tsc.errors.length > QUALITY_THRESHOLDS.codeQuality.maxTypeScriptErrors) {
          this.errors.push(`${tsc.errors.length} TypeScript errors found (max: ${QUALITY_THRESHOLDS.codeQuality.maxTypeScriptErrors})`);
          codeQualityPassed = false;
        } else {
          console.log(`  ✅ TypeScript: ${tsc.errors?.length || 0} errors`);
        }
      }
      
      this.results.codeQuality = codeQualityPassed ? 'PASS' : 'FAIL';
    } catch (error) {
      this.warnings.push(`Code quality check failed: ${error.message}`);
      this.results.codeQuality = 'WARN';
    }
  }

  calculateOverallResult() {
    const criticalChecks = ['coverage', 'codeQuality'];
    const hasCriticalFailures = criticalChecks.some(check => this.results[check] === 'FAIL');
    
    const hasAnyFailures = Object.values(this.results).some(result => result === 'FAIL');
    
    if (hasCriticalFailures) {
      this.results.overall = 'FAIL';
    } else if (hasAnyFailures) {
      this.results.overall = 'FAIL';
    } else if (this.errors.length > 0) {
      this.results.overall = 'FAIL';
    } else {
      this.results.overall = 'PASS';
    }
  }

  generateReport() {
    console.log('\n📋 Quality Gate Report');
    console.log('========================');
    
    Object.entries(this.results).forEach(([check, result]) => {
      if (check !== 'overall') {
        const icon = result === 'PASS' ? '✅' : result === 'FAIL' ? '❌' : '⚠️';
        console.log(`${icon} ${check.charAt(0).toUpperCase() + check.slice(1)}: ${result}`);
      }
    });
    
    console.log(`\n🎯 Overall Result: ${this.results.overall}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      this.warnings.forEach(warning => console.log(`  • ${warning}`));
    }
    
    // Generate HTML report
    this.generateHTMLReport();
    
    // Generate markdown summary for PR comments
    this.generateMarkdownSummary();
  }

  generateHTMLReport() {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Quality Gate Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .result { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .pass { background: #d4edda; color: #155724; }
        .fail { background: #f8d7da; color: #721c24; }
        .warn { background: #fff3cd; color: #856404; }
        .errors, .warnings { margin: 20px 0; }
        .errors ul, .warnings ul { margin: 0; padding-left: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Quality Gate Report</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        <h2 class="${this.results.overall.toLowerCase()}">Overall Result: ${this.results.overall}</h2>
    </div>
    
    <h3>Check Results</h3>
    ${Object.entries(this.results).filter(([key]) => key !== 'overall').map(([check, result]) => 
      `<div class="result ${result.toLowerCase()}">${check.charAt(0).toUpperCase() + check.slice(1)}: ${result}</div>`
    ).join('')}
    
    ${this.errors.length > 0 ? `
    <div class="errors">
        <h3>Errors</h3>
        <ul>${this.errors.map(error => `<li>${error}</li>`).join('')}</ul>
    </div>
    ` : ''}
    
    ${this.warnings.length > 0 ? `
    <div class="warnings">
        <h3>Warnings</h3>
        <ul>${this.warnings.map(warning => `<li>${warning}</li>`).join('')}</ul>
    </div>
    ` : ''}
</body>
</html>
    `;
    
    fs.writeFileSync('quality-report.html', html);
  }

  generateMarkdownSummary() {
    const summary = `
## 🎯 Quality Gate Report

**Overall Result: ${this.results.overall === 'PASS' ? '✅ PASSED' : '❌ FAILED'}**

### Check Results
${Object.entries(this.results).filter(([key]) => key !== 'overall').map(([check, result]) => {
  const icon = result === 'PASS' ? '✅' : result === 'FAIL' ? '❌' : '⚠️';
  return `- ${icon} **${check.charAt(0).toUpperCase() + check.slice(1)}**: ${result}`;
}).join('\n')}

${this.errors.length > 0 ? `
### ❌ Errors
${this.errors.map(error => `- ${error}`).join('\n')}
` : ''}

${this.warnings.length > 0 ? `
### ⚠️ Warnings
${this.warnings.map(warning => `- ${warning}`).join('\n')}
` : ''}

---
*Generated by Quality Gate at ${new Date().toISOString()}*
    `;
    
    fs.writeFileSync('quality-summary.md', summary);
  }
}

// Run quality gate if called directly
if (require.main === module) {
  const gate = new QualityGate();
  gate.run().catch(error => {
    console.error('Quality gate failed:', error);
    process.exit(1);
  });
}

module.exports = QualityGate;
