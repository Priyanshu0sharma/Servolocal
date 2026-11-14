# Servolocal — Security Checklist & Hardening Specification

> **Document Version**: 2.0.0  
> **Classification**: Security Architecture, OWASP Hardening & Compliance Matrix  
> **Target Environment**: Windows + Antigravity IDE Development Factory  
> **Security Standards**: OWASP Top 10, CWE / SANS Top 25, Indian DPDP Act 2023  

---

## 1. Automated Security Tooling Matrix

| Tool | Engine Version | Rule Sets / Config | Execution Scope |
| :--- | :--- | :--- | :--- |
| **Semgrep SAST** | `1.185.0` | `p/python`, `p/owasp-top-ten`, `p/security-audit` | Python FastAPI backend (`backend/app`) |
| **Gitleaks** | `8.24.0` | Default Gitleaks rules + custom pattern guards | Full workspace before every commit |
| **Alembic ORM** | `SQLAlchemy 2.0` | Parameterized async queries | Neon PostgreSQL database operations |
| **CORS Middleware** | `FastAPI Starlette` | Explicit origin whitelisting | Frontend-to-Backend cross-origin controls |

---

## 2. OWASP Top 10 Hardening Status

### A01: Broken Access Control
- [x] **Enforcement**: Role-based access control (RBAC) via FastAPI dependency injection (`Depends(get_current_active_user)`).
- [x] **Merchant Isolation**: All store updates verify `store.owner_id == current_user.id`. Merchants cannot access rival order streams.
- [x] **Customer Order Privacy**: Customers can only view orders associated with their own `customer_id`.

### A02: Cryptographic Failures
- [x] **In-Transit**: Strict HTTPS / TLS 1.3 encryption across all public edge domains (`servolocal.vercel.app`, `servolocal-api.onrender.com`).
- [x] **Database Transport**: Neon PostgreSQL connection strings enforce `sslmode=require`.
- [x] **Payment Verification**: Razorpay payment signatures verified using server-side HMAC-SHA256 (`crypto.createHmac` / Python `hmac.new`).

### A03: Injection (SQL / NoSQL / Command)
- [x] **Zero Raw SQL**: All database operations execute through SQLAlchemy 2.0 async ORM with parameterized inputs.
- [x] **Input Validation**: Pydantic v2 schemas strictly validate every request body (sanitizing types, string lengths, and email formats).

### A04: Insecure Design
- [x] **Delivery Verification**: 4-digit numeric delivery PIN generated at order placement, requiring customer handoff before payment settlement.
- [x] **Order Expiry**: Unaccepted merchant orders auto-expire within 3 minutes to prevent stale order states.

### A05: Security Misconfiguration
- [x] **Environment Separation**: Distinct `.env.local` for development; production secrets managed via Vercel and Render secret injection.
- [x] **Debug Modes Disabled**: FastAPI `debug=False` in production; OpenAPI docs disabled or secured in high-security production deployments.

### A06: Vulnerable and Outdated Components
- [x] **Automated Scans**: `semgrep scan --config "p/python" backend/app` executed continuously (0 security findings across 27 files).
- [x] **Dependency Locking**: `package-lock.json` and pinned Python versions (`requirements.txt`).

### A07: Identification and Authentication Failures
- [x] **Firebase Auth**: Enterprise-grade SMS OTP delivery, rate-limiting, and brute-force protection managed by Google Cloud Identity Platform.
- [x] **JWT Token Standards**: Short-lived access tokens (15-minute expiry) with cryptographically secure secret signing (`HS256`).

### A08: Software and Data Integrity Failures
- [x] **Razorpay Webhooks**: Incoming payment callbacks verified against raw payload byte signatures before database transaction commits.
- [x] **CI/CD Integrity**: Automated type-checks and test suites run before edge deployment.

### A09: Security Logging and Monitoring Failures
- [x] **Structured Logging**: Every incoming API request logs timestamp, method, path, client IP (masked), status code, and latency.
- [x] **Zero Secret Logging**: Logger filters out passwords, OTPs, auth headers, and payment secrets.

### A10: Server-Side Request Forgery (SSRF)
- [x] **Zero Dynamic Webhooks**: Webhook callbacks are restricted to pre-configured partner gateways (Razorpay, Firebase); no arbitrary user-supplied URLs fetched by server.

---

## 3. Data Privacy & DPDP Act Compliance

1. **Personally Identifiable Information (PII) Masking**:
   - Customer phone numbers masked in logs (`+91 93522*****`).
   - Customer addresses shared with store partners only during active fulfillment; archived after 30 days.
2. **Account Deletion Protocol**:
   - Customer web features self-service "Request to delete account" in Account Privacy.
   - Triggers automated 30-day grace period with scheduled data purging.
