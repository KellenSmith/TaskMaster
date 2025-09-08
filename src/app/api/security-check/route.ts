import { NextRequest, NextResponse } from "next/server";
import {
    validateSecurityHeaders,
    generateSecurityReport,
    validateEnvironmentVariables,
    generateEnvReport,
} from "../../lib/security-utils";

export async function GET(request: NextRequest) {
    // Only allow this endpoint in development
    if (process.env.NODE_ENV === "production") {
        return new NextResponse("Not available in production", { status: 404 });
    }

    const url = new URL(request.url);
    const check = url.searchParams.get("check");

    if (check === "env") {
        // Check environment variables
        const envChecks = validateEnvironmentVariables();
        const report = generateEnvReport(envChecks);

        return new NextResponse(report, {
            headers: {
                "Content-Type": "text/plain",
            },
        });
    }

    // Default: Check security headers by making a request to the home page
    try {
        const baseUrl = url.origin;
        const homeResponse = await fetch(`${baseUrl}/`, {
            method: "HEAD", // Just get headers, not the full response
        });

        const securityChecks = validateSecurityHeaders(homeResponse.headers);
        const report = generateSecurityReport(securityChecks);

        return new NextResponse(report, {
            headers: {
                "Content-Type": "text/plain",
            },
        });
    } catch (error) {
        return new NextResponse(`Error checking headers: ${error.message}`, {
            status: 500,
            headers: {
                "Content-Type": "text/plain",
            },
        });
    }
}
