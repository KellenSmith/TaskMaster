/**
 * Security utilities for validating and testing security configurations
 */

export interface SecurityHeaderCheck {
    header: string;
    present: boolean;
    value?: string;
    recommendation?: string;
}

/**
 * Validate security headers from a response
 */
export function validateSecurityHeaders(headers: Headers): SecurityHeaderCheck[] {
    const checks: SecurityHeaderCheck[] = [
        {
            header: "Content-Security-Policy",
            present: headers.has("Content-Security-Policy"),
            value: headers.get("Content-Security-Policy") || undefined,
            recommendation: "Should include default-src, script-src, style-src directives",
        },
        {
            header: "X-Frame-Options",
            present: headers.has("X-Frame-Options"),
            value: headers.get("X-Frame-Options") || undefined,
            recommendation: "Should be DENY or SAMEORIGIN",
        },
        {
            header: "X-Content-Type-Options",
            present: headers.has("X-Content-Type-Options"),
            value: headers.get("X-Content-Type-Options") || undefined,
            recommendation: "Should be nosniff",
        },
        {
            header: "Referrer-Policy",
            present: headers.has("Referrer-Policy"),
            value: headers.get("Referrer-Policy") || undefined,
            recommendation: "Should be strict-origin-when-cross-origin",
        },
        {
            header: "Strict-Transport-Security",
            present: headers.has("Strict-Transport-Security"),
            value: headers.get("Strict-Transport-Security") || undefined,
            recommendation: "Should include max-age and includeSubDomains (HTTPS only)",
        },
        {
            header: "X-XSS-Protection",
            present: headers.has("X-XSS-Protection"),
            value: headers.get("X-XSS-Protection") || undefined,
            recommendation: "Should be 1; mode=block",
        },
        {
            header: "Permissions-Policy",
            present: headers.has("Permissions-Policy"),
            value: headers.get("Permissions-Policy") || undefined,
            recommendation: "Should restrict unused browser features",
        },
    ];

    return checks;
}

/**
 * Generate a security report
 */
export function generateSecurityReport(checks: SecurityHeaderCheck[]): string {
    const passed = checks.filter((check) => check.present).length;
    const total = checks.length;

    let report = `Security Headers Report: ${passed}/${total} headers present\n\n`;

    checks.forEach((check) => {
        const status = check.present ? "✅" : "❌";
        report += `${status} ${check.header}\n`;
        if (check.value) {
            report += `   Value: ${check.value}\n`;
        }
        if (!check.present && check.recommendation) {
            report += `   Recommendation: ${check.recommendation}\n`;
        }
        report += "\n";
    });

    return report;
}

/**
 * Environment variable validation
 */
export interface EnvCheck {
    variable: string;
    present: boolean;
    isPublic: boolean;
    recommendation?: string;
}

export function validateEnvironmentVariables(): EnvCheck[] {
    const requiredVars: Array<{ name: string; isPublic: boolean; recommendation?: string }> = [
        {
            name: "PRISMA_DATABASE_URL",
            isPublic: false,
            recommendation: "Database connection string is required",
        },
        {
            name: "AUTH_SECRET",
            isPublic: false,
            recommendation: "Auth.js secret is required for JWT signing",
        },
        {
            name: "EMAIL",
            isPublic: false,
            recommendation: "Email address for sending authentication emails",
        },
        {
            name: "SMTP_HOST",
            isPublic: false,
            recommendation: "SMTP server hostname",
        },
        {
            name: "SMTP_PORT",
            isPublic: false,
            recommendation: "SMTP server port (usually 587 or 465)",
        },
        {
            name: "EMAIL_PASSWORD",
            isPublic: false,
            recommendation: "SMTP authentication password",
        },
        {
            name: "SWEDBANK_PAY_ACCESS_TOKEN",
            isPublic: false,
            recommendation: "Swedbank Pay API access token",
        },
        {
            name: "SWEDBANK_PAY_PAYEE_ID",
            isPublic: false,
            recommendation: "Swedbank Pay payee identifier",
        },
        {
            name: "SWEDBANK_WEBHOOK_SECRET",
            isPublic: false,
            recommendation: "Secret for verifying Swedbank Pay webhooks (CRITICAL)",
        },
        {
            name: "CRON_SECRET",
            isPublic: false,
            recommendation: "Secret for authenticating cron job requests",
        },
        {
            name: "BLOB_HOSTNAME",
            isPublic: false,
            recommendation:
                "Vercel Blob storage hostname for file uploads (e.g., abc123.public.blob.vercel-storage.com)",
        },
    ];

    return requiredVars.map((varInfo) => ({
        variable: varInfo.name,
        present: !!process.env[varInfo.name],
        isPublic: varInfo.isPublic,
        recommendation: varInfo.recommendation,
    }));
}

/**
 * Generate environment variables report
 */
export function generateEnvReport(checks: EnvCheck[]): string {
    const present = checks.filter((check) => check.present).length;
    const total = checks.length;
    const missing = checks.filter((check) => !check.present);

    let report = `Environment Variables Report: ${present}/${total} variables present\n\n`;

    if (missing.length > 0) {
        report += "❌ Missing Variables:\n";
        missing.forEach((check) => {
            report += `   ${check.variable}\n`;
            if (check.recommendation) {
                report += `   Purpose: ${check.recommendation}\n`;
            }
            report += "\n";
        });
    }

    const critical = missing.filter(
        (check) =>
            check.variable.includes("SECRET") ||
            check.variable.includes("DATABASE") ||
            check.variable.includes("AUTH_"),
    );

    if (critical.length > 0) {
        report += "\n🚨 CRITICAL: These missing variables will break the application:\n";
        critical.forEach((check) => {
            report += `   - ${check.variable}\n`;
        });
    }

    return report;
}
