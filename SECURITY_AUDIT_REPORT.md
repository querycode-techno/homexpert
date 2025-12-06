# Security Audit Report
**Date:** December 2025  
**Next.js Version:** 15.2.6 (✅ Patched for CVE-2025-66478)

## Executive Summary

This security audit identified **7 critical and high-severity vulnerabilities** that require immediate attention. The most critical issues involve hardcoded credentials and weak fallback secrets that could lead to unauthorized access.

---

## 🔴 CRITICAL VULNERABILITIES

### 1. Hardcoded Firebase API Key in Public File
**Severity:** CRITICAL  
**Location:** `public/firebase-messaging-sw.js:7`  
**Issue:** Firebase API key is hardcoded in a public service worker file that is accessible to anyone.

```7:7:public/firebase-messaging-sw.js
  apiKey: "AIzaSyBui0DiZMxTDw5CBHYrUZw7jamP3aQrmCA",
```

**Risk:** 
- API key exposed to all users
- Potential for quota abuse
- Could be used to make unauthorized Firebase requests

**Recommendation:**
- Move Firebase config to environment variables
- Use `NEXT_PUBLIC_FIREBASE_API_KEY` environment variable
- Rotate the exposed API key immediately

---

### 2. Hardcoded Cloudinary Credentials with Fallback Values
**Severity:** CRITICAL  
**Location:** `lib/cloudinary.js:5-7` and `lib/uploadUtils.js:10`

**Issues:**
```5:7:lib/cloudinary.js
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dh4njmebp',
  api_key: process.env.CLOUDINARY_API_KEY || '458448514385394',
  api_secret: process.env.CLOUDINARY_CLOUDINARY_API_SECRET || 'vfcZDShtw_c1hqgW1CQXdi7lmus',
```

**Risk:**
- Hardcoded fallback credentials in source code
- If environment variables are missing, production uses hardcoded credentials
- Credentials could be exposed if code is leaked or repository is public

**Recommendation:**
- Remove all hardcoded fallback credentials
- Require environment variables to be set (throw error if missing)
- Rotate all exposed credentials
- Never commit credentials to version control

---

### 3. Hardcoded Default Password
**Severity:** CRITICAL  
**Location:** `lib/services/vendorService.js:475`

```475:475:lib/services/vendorService.js
            password: 'defaultPassword123' // This should be changed by the vendor
```

**Risk:**
- All vendors created via import get the same default password
- If not changed, accounts are easily compromised
- Password is predictable and weak

**Recommendation:**
- Generate random secure passwords for each vendor
- Force password change on first login
- Send password reset link via email/SMS instead of using default password
- Use strong password generation (minimum 12 characters, mixed case, numbers, symbols)

---

## 🟠 HIGH SEVERITY VULNERABILITIES

### 4. Weak Fallback Secrets for JWT/Auth
**Severity:** HIGH  
**Locations:** Multiple files

**Issues:**
```10:10:auth.js
  secret: process.env.NEXTAUTH_SECRET || "homexpert-dev-secret-2024",
```

```77:77:middleware.js
    secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development"
```

```6:6:app/api/vendors/auth/login/route.js
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'homexpert-dev-secret-2024';
```

**Risk:**
- Weak, predictable fallback secrets
- If environment variable is missing, production uses weak secret
- Tokens could be forged or decoded
- Different fallback secrets across files (inconsistent)

**Recommendation:**
- Remove all fallback secrets
- Require `NEXTAUTH_SECRET` to be set (throw error if missing)
- Use strong, randomly generated secrets (minimum 32 characters)
- Use same secret consistently across all files
- Rotate secrets if they were ever exposed

---

### 5. API Routes Bypass Middleware Authentication
**Severity:** HIGH  
**Location:** `middleware.js:61-72`

```61:72:middleware.js
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/public/') ||
    pathname.startsWith('/api/setup/') ||
    pathname.startsWith('/api/health') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    //console.log(`⏭️ SKIPPING - Static/API: ${pathname}`)
    return NextResponse.next()
  }
```

**Risk:**
- All API routes bypass middleware authentication
- Individual API routes must implement their own auth checks
- Risk of missing authentication on new API routes
- Inconsistent security implementation

**Recommendation:**
- Review all API routes to ensure they implement proper authentication
- Consider creating API route middleware wrapper
- Document which routes are intentionally public
- Add automated tests to verify authentication on protected routes

---

## 🟡 MEDIUM SEVERITY ISSUES

### 6. No Explicit CORS Configuration
**Severity:** MEDIUM  
**Issue:** No CORS headers configured in API routes

**Risk:**
- Potential for unauthorized cross-origin requests
- No control over which origins can access APIs
- Could allow CSRF attacks if not properly handled

**Recommendation:**
- Implement CORS middleware for API routes
- Whitelist specific origins in production
- Use Next.js headers API to set CORS headers
- Consider using `next-cors` package if needed

---

### 7. React Strict Mode Disabled
**Severity:** MEDIUM  
**Location:** `next.config.mjs:19`

```19:19:next.config.mjs
  reactStrictMode: false, // Disable strict mode to fix dialog issues
```

**Risk:**
- React Strict Mode helps identify potential problems
- Disabled to work around issues (indicates underlying problems)
- May hide security-related warnings

**Recommendation:**
- Fix the underlying dialog issues properly
- Re-enable React Strict Mode
- Use proper React patterns instead of disabling safety features

---

## ✅ POSITIVE SECURITY FINDINGS

1. **MongoDB Injection Protection:** Using Mongoose and MongoDB driver with parameterized queries (good)
2. **Password Hashing:** Using bcryptjs for password hashing (good)
3. **File Upload Validation:** File type and size validation implemented (good)
4. **JWT Authentication:** Proper JWT implementation with refresh tokens (good)
5. **Environment Variables:** `.env*` files are in `.gitignore` (good)
6. **Input Validation:** Most API routes validate input before processing (good)
7. **No Dangerous Functions:** No use of `eval()`, `Function()`, or `innerHTML` found (good)

---

## 📋 IMMEDIATE ACTION ITEMS

### Priority 1 (Do Immediately):
1. ✅ **DONE:** Upgrade Next.js to 15.2.6 (patched for CVE-2025-66478)
2. Remove hardcoded Firebase API key from `public/firebase-messaging-sw.js`
3. Remove hardcoded Cloudinary credentials from `lib/cloudinary.js`
4. Remove hardcoded default password from `lib/services/vendorService.js`
5. Remove weak fallback secrets from all auth files

### Priority 2 (Do This Week):
6. Rotate all exposed credentials (Firebase, Cloudinary)
7. Implement proper password generation for vendor imports
8. Add CORS configuration for API routes
9. Audit all API routes for missing authentication

### Priority 3 (Do This Month):
10. Re-enable React Strict Mode and fix underlying issues
11. Implement API route authentication middleware
12. Add security headers (HSTS, CSP, X-Frame-Options)
13. Set up automated security scanning in CI/CD

---

## 🔒 SECURITY BEST PRACTICES RECOMMENDATIONS

1. **Secrets Management:**
   - Use environment variables for all secrets
   - Never commit secrets to version control
   - Use secret management services (AWS Secrets Manager, Vercel Environment Variables)
   - Rotate secrets regularly

2. **Authentication:**
   - Implement rate limiting on auth endpoints
   - Add account lockout after failed login attempts
   - Use strong password requirements
   - Implement 2FA for admin accounts

3. **API Security:**
   - Add request rate limiting
   - Implement request validation middleware
   - Add API versioning
   - Log all API access attempts

4. **File Upload Security:**
   - Scan uploaded files for malware
   - Validate file content, not just extension
   - Store files outside web root when possible
   - Implement file size limits (already done ✅)

5. **Monitoring:**
   - Set up security monitoring and alerting
   - Log all authentication attempts
   - Monitor for suspicious activity
   - Regular security audits

---

## 📊 VULNERABILITY SUMMARY

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 3 | ⚠️ Requires Immediate Action |
| High | 2 | ⚠️ Requires Immediate Action |
| Medium | 2 | 📋 Plan Remediation |
| Low | 0 | ✅ None Found |
| **Total** | **7** | |

---

## 📝 NOTES

- This audit focused on code-level security issues
- Consider performing penetration testing for comprehensive security assessment
- Review OWASP Top 10 for additional security considerations
- Keep dependencies updated (run `pnpm audit` regularly)
- Consider using tools like Snyk or Dependabot for dependency scanning

---

**Report Generated:** December 2025  
**Next Review:** Recommended in 3 months or after major changes

