# Security Headers Implementation Guide

## 🛡️ Overview

This document outlines the security headers implemented in the TaskMaster application to protect against common web vulnerabilities.

## 🔧 Implementation

### 1. Next.js Configuration (`next.config.mjs`)

The main security headers are configured in the Next.js config file:

- **Content-Security-Policy (CSP)**: Prevents XSS and injection attacks
- **X-Frame-Options**: Prevents clickjacking (set to DENY)
- **X-Content-Type-Options**: Prevents MIME sniffing attacks
- **Referrer-Policy**: Controls referrer information leakage
- **X-XSS-Protection**: Legacy XSS protection for older browsers
- **Permissions-Policy**: Restricts access to browser features

### 2. Middleware Enhancement (`src/middleware.ts`)

Additional security headers added via middleware:

- **Strict-Transport-Security (HSTS)**: Forces HTTPS (production only)
- **X-DNS-Prefetch-Control**: Controls DNS prefetching
- **X-Download-Options**: Prevents file execution in IE
- **X-Permitted-Cross-Domain-Policies**: Restricts Flash/PDF policies
- **Server header removal**: Hides server information

### 3. API Route Protection

Special CORS and caching headers for API routes:

- **Cache-Control**: Prevents API response caching
- **Access-Control-Allow-Origin**: Controlled CORS policy
- **Access-Control-Allow-Methods**: Limited HTTP methods
- **Access-Control-Allow-Headers**: Restricted headers

## 🧪 Testing

### Development Testing

Use the built-in security checker (development only):

```bash
# Check security headers
curl https://localhost:3001/api/security-check

# Check environment variables
curl https://localhost:3001/api/security-check?check=env
```

### Production Testing

Use online security scanners:

- [Security Headers](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [SSL Labs](https://www.ssllabs.com/ssltest/)

## 📋 Security Headers Explained

### Content Security Policy (CSP)

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline' fonts.googleapis.com;
font-src 'self' fonts.gstatic.com;
img-src 'self' data: blob: https:;
connect-src 'self' https:;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests
```

**Purpose**: Prevents XSS attacks by controlling resource loading
**Note**: `unsafe-inline` and `unsafe-eval` are required for Next.js functionality

### X-Frame-Options: DENY

**Purpose**: Prevents the page from being embedded in frames (clickjacking protection)
**Alternative**: CSP's `frame-ancestors 'none'` provides the same protection

### Strict-Transport-Security

**Production**: `max-age=63072000; includeSubDomains; preload`
**Purpose**: Forces HTTPS connections for 2 years, including subdomains

### Permissions-Policy

```
camera=(), microphone=(), geolocation=(), payment=(self), usb=(),
magnetometer=(), accelerometer=(), gyroscope=()
```

**Purpose**: Restricts access to browser APIs and hardware features

## 🚨 Security Considerations

### CSP Limitations

The current CSP allows `unsafe-inline` and `unsafe-eval` for Next.js compatibility. For maximum security:

1. Consider using nonces for inline scripts
2. Evaluate if `unsafe-eval` can be removed
3. Implement CSP reporting for violations

### HSTS Preloading

To include your domain in browser HSTS preload lists:

1. Ensure HSTS header includes `preload`
2. Submit domain to [HSTS Preload List](https://hstspreload.org/)

### Environment Variables

Critical environment variables that must be secured:

- `AUTH_SECRET`: For JWT signing (Auth.js)
- `PRISMA_DATABASE_URL`: Database connection
- `SWEDBANK_WEBHOOK_SECRET`: Payment webhook verification
- All API keys and tokens

## 🔄 Maintenance

### Regular Reviews

1. **Monthly**: Check security header compliance
2. **Quarterly**: Review CSP violations if reporting is enabled
3. **Annually**: Update security policies and test configurations

### Updates

When adding new features that require external resources:

1. Update CSP directives accordingly
2. Test security headers after changes
3. Document any security trade-offs

## 📚 Resources

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#Security)
- [Next.js Security Headers](https://nextjs.org/docs/pages/api-reference/next-config-js/headers)

## ✅ Implementation Checklist

- [x] Content Security Policy configured
- [x] Anti-clickjacking protection (X-Frame-Options)
- [x] MIME sniffing prevention
- [x] XSS protection headers
- [x] HSTS for production
- [x] Permissions policy restrictions
- [x] Server information hiding
- [x] API route security headers
- [x] Development testing endpoint
- [x] Environment variable validation

## 🎯 Next Steps

1. **Webhook Signature Verification**: Implement cryptographic verification for payment callbacks
2. **Rate Limiting**: Consider implementing for sensitive endpoints
3. **CSP Reporting**: Set up CSP violation reporting for monitoring
4. **Security Monitoring**: Implement logging for security events
