# Seamlis — Authentication Architecture

**Version:** 1.0  
**Phase:** 0 — Architecture Foundation  
**Date:** 2026-08-18  
**Status:** Approved

---

## 1. Authentication Strategy

Seamlis uses a **stateless JWT + Redis-backed refresh token** model:

- **Access Token**: Short-lived JWT (15 minutes), stateless verification
- **Refresh Token**: Long-lived opaque token (30 days), stored in Redis for revocability
- **Session**: Combination of access + refresh token pair; tracked in Redis

This model allows:
- Horizontal API scaling (no sticky sessions)
- Instant token revocation (via Redis deletion)
- Secure logout across all devices

---

## 2. Token Specifications

### 2.1 Access Token (JWT)

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user-uuid",
    "role": "CREATOR",
    "channelId": "channel-uuid-or-null",
    "sessionId": "sess_abc123",
    "iat": 1724000000,
    "exp": 1724000900
  }
}
```

**Signing:** HMAC-SHA256 with 256-bit secret (from environment variable `JWT_SECRET`)  
**TTL:** 900 seconds (15 minutes)  
**Stored:** Client memory only (NOT localStorage, NOT sessionStorage for security)

### 2.2 Refresh Token

```
Format: Opaque random string (256 bits, URL-safe base64)
Example: VGhpcyBpcyBhIHRlc3QgcmVmcmVzaCB0b2tlbg
TTL: 30 days
Storage:
  - Server: Redis hash → session:{token_hash} → { userId, sessionId, userAgent, ip, createdAt }
  - Client: HttpOnly, Secure, SameSite=Strict cookie
```

---

## 3. Authentication Flows

### 3.1 Registration Flow

```
Client                          API                           Services
  │                              │                              │
  │── POST /auth/register ──────►│                              │
  │   { email, password,         │                              │
  │     displayName }            │── Validate input            │
  │                              │── Check email uniqueness    │
  │                              │── Hash password (Argon2id)  │
  │                              │── Create user record        │
  │                              │── Create profile record     │
  │                              │── Send verification email ─►│ (email service)
  │◄── 201 { message } ─────────│                              │
  │                              │                              │
  │── GET /auth/verify-email ───►│ (link from email)            │
  │   ?token=...                 │── Validate token            │
  │                              │── Mark email_verified=true   │
  │◄── 200 { verified } ────────│                              │
```

**Email verification token:**
- Random 32-byte hex string
- Stored in Redis: `email_verify:{token}` → `userId`
- TTL: 24 hours
- Single use (deleted after verification)

### 3.2 Login Flow

```
Client                          API                           Redis
  │                              │                              │
  │── POST /auth/login ─────────►│                              │
  │   { email, password }        │── Find user by email         │
  │                              │── Verify Argon2id hash       │
  │                              │── Check account status       │
  │                              │── Generate sessionId         │
  │                              │── Generate access JWT        │
  │                              │── Generate refresh token     │
  │                              │── Store session in Redis ───►│
  │                              │   session:{hash(refresh)}    │
  │◄── 200 { accessToken } ─────│                              │
  │    Set-Cookie: refresh=...   │                              │
```

### 3.3 Token Refresh Flow

```
Client                          API                           Redis
  │                              │                              │
  │── POST /auth/refresh ───────►│                              │
  │   Cookie: refresh=...        │── Extract refresh token      │
  │                              │── Hash token                 │
  │                              │── Lookup in Redis ──────────►│
  │                              │◄── Session data ────────────│
  │                              │── Validate session alive     │
  │                              │── Generate new access JWT    │
  │                              │── Rotate refresh token       │
  │                              │   (old deleted, new stored)  │
  │◄── 200 { accessToken } ─────│                              │
  │    Set-Cookie: refresh=...   │                              │
```

**Token rotation:** Every refresh generates a new refresh token, invalidating the old one. This detects refresh token theft (if the old token is used after rotation, both sessions are revoked).

### 3.4 Logout Flow

```
Client                          API                           Redis
  │                              │                              │
  │── POST /auth/logout ────────►│                              │
  │   Authorization: Bearer ...  │── Extract sessionId from JWT │
  │   Cookie: refresh=...        │── Delete session in Redis ──►│
  │                              │── Clear cookie               │
  │◄── 200 ────────────────────│                              │
```

### 3.5 Logout All Devices

```
Pattern: session:{userId}:* → all sessions for user
DELETE all matching keys → all devices logged out
```

---

## 4. Password Security

**Algorithm:** Argon2id (recommended by OWASP for password hashing)

**Parameters:**
```
Memory: 64 MB (65536 KB)
Iterations: 3
Parallelism: 4
Hash length: 32 bytes
Salt: 16 bytes random (auto-generated per hash)
```

**Kotlin implementation:**
```kotlin
// Using de.mkammerer:argon2-jvm
val argon2 = Argon2Factory.create(Argon2Factory.Argon2Types.ARGON2id)
val hash = argon2.hash(3, 65536, 4, password.toCharArray())
val matches = argon2.verify(hash, password.toCharArray())
```

**Password rules (enforced at registration and change):**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit
- At least 1 special character
- Not in common passwords list (top 10,000 check)
- Not same as current password (on change)

---

## 5. Role-Based Access Control (RBAC)

### 5.1 Role Hierarchy

```
ADMIN
  └── MODERATOR
        └── CREATOR
              └── VIEWER
```

Higher roles inherit all permissions of lower roles.

### 5.2 Permission Checks in Ktor

```kotlin
// Route-level authorization
authenticate("auth-jwt") {
    requireRole(UserRole.CREATOR) {
        post("/api/v1/upload/initiate") {
            // Only CREATOR and above can reach this
        }
    }
    requireRole(UserRole.MODERATOR) {
        get("/api/v1/moderation/queue") {
            // Only MODERATOR and ADMIN
        }
    }
}

// Resource ownership check (inside handler)
fun verifyOwnership(currentUserId: UUID, resourceOwnerId: UUID) {
    if (currentUserId != resourceOwnerId && currentUser.role != UserRole.ADMIN) {
        throw ForbiddenException("You don't own this resource")
    }
}
```

### 5.3 Channel Ownership

A CREATOR user owns exactly one channel. Channel-specific operations verify:
1. User is authenticated
2. User has CREATOR role
3. `channels.user_id = authenticated user's id`

---

## 6. Email Verification

**Flow:**
1. User registers → verification email sent immediately
2. Email contains link: `https://seamlis.com/auth/verify-email?token={token}`
3. Token verified → `users.email_verified = true`
4. Unverified accounts can log in but have restricted access (no upload, no live)

**Unverified account restrictions:**
- Cannot upload videos
- Cannot start livestreams
- Cannot create community posts
- Can watch, like, comment, subscribe

---

## 7. Password Reset Flow

```
1. POST /auth/forgot-password { email }
   → If email exists: send reset email (always return 200 to prevent enumeration)
   → Token stored: password_reset:{token} → userId, TTL: 1 hour

2. GET /auth/reset-password?token={token}
   → Frontend shows reset form

3. POST /auth/reset-password { token, newPassword }
   → Validate token exists in Redis
   → Validate new password rules
   → Hash new password
   → Update users.password_hash
   → Delete token from Redis
   → Invalidate ALL existing sessions for user (force re-login everywhere)
   → Send confirmation email
```

---

## 8. Account Status Management

| Status | Login Allowed | Content Visible | Reason |
|--------|--------------|----------------|--------|
| `ACTIVE` | ✅ | ✅ | Normal |
| `SUSPENDED` | ❌ | ✅ (public content) | Temporary action |
| `BANNED` | ❌ | ❌ | Permanent action |
| `DELETED` | ❌ | ❌ | User deleted account |

On suspension/ban: all active sessions immediately revoked via Redis pattern delete.

---

## 9. Security Hardening

| Measure | Implementation |
|---------|---------------|
| Brute force protection | Rate limit login: 5 attempts/minute/IP, then 5-minute lockout |
| Account enumeration prevention | Same response for invalid email and wrong password |
| Token storage | Access token in memory only; refresh in HttpOnly cookie |
| HTTPS enforcement | All endpoints require TLS; HSTS header set |
| Session fixation | New session created on every login |
| Concurrent session limit | Max 10 active sessions per user |
| Audit logging | All auth events logged (login, logout, password change, role change) |

---

## 10. Future: Social Login

When social login is added (Phase 3+), the flow will be:

```
OAuth2 callback → Get provider user info → Find or create local user
→ If new: create user record without password (password_hash = NULL)
→ Issue same JWT + refresh token pair
→ Store: oauth_accounts table { userId, provider, providerId, accessToken }
```

Supported providers (planned): Google, Apple (required for iOS), GitHub

---

*Document prepared as part of Phase 0 — Architecture Foundation*  
*Previous: [Video Processing Architecture ←](./06-video-processing-architecture.md) | Next: [UX Information Architecture →](./08-ux-information-architecture.md)*
