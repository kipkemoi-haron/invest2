# Firestore Security Specification

## 1. Data Invariants
- Every user profile document at `/users/{userId}` MUST have `uid == request.auth.uid == userId`, `role == 'CLIENT'` on self-creation, and server-verified `createdAt`/`updatedAt` timestamps (`request.time`).
- Users CANNOT escalate their own `role`, `status`, or `kycStatus` to `VERIFIED` on creation or self-update; only `isAdmin()` (verified via `/admins/{uid}` or `email_verified == true` for `markobare25@gmail.com`) can change `role`, `status`, or approve KYC.
- Every client-owned financial record (`/deposits`, `/investments`, `/withdrawals`, `/ledger`, `/notifications`) MUST carry `userId == request.auth.uid`, and `list` queries MUST enforce `resource.data.userId == request.auth.uid` (unless `isAdmin()`).
- Terminal states (`CONFIRMED`, `REJECTED` on deposits; `COMPLETED`, `REJECTED` on withdrawals; `MATURED`, `CANCELLED` on investments) are locked from client updates; only `isAdmin()` can override.
- Every string field has strict `.size()` bounds and IDs match `^[a-zA-Z0-9_-]+$`.

## 2. "Dirty Dozen" Adversarial Payloads
1. **Self-Assigned Admin Role on Signup**: `POST /users/{uid}` with `role: "ADMIN"` -> DENIED (`role == 'CLIENT'` enforced).
2. **Privilege Escalation on Profile Update**: `PATCH /users/{uid}` updating `role` or `status` -> DENIED (`affectedKeys().hasOnly(...)` blocks `role` and `status`).
3. **Spoofed Admin Email without Verification**: Auth token with `email: "markobare25@gmail.com"` and `email_verified: false` -> DENIED (`isAdmin()` requires `email_verified == true`).
4. **Cross-User PII Read**: Authenticated User A reading `/users/{userB}` -> DENIED (`isOwner(userId)` fails).
5. **Blanket Collection Scrape**: `list /deposits` without `where('userId', '==', uid)` -> DENIED (`allow list` requires `resource.data.userId == request.auth.uid || isAdmin()`).
6. **Ghost Field Injection (Shadow Update)**: `create /deposits/{id}` with extra `approvedByAdmin: true` -> DENIED (`hasOnly` check rejects unknown keys).
7. **Forged Deposit Owner**: `create /deposits/{id}` with `userId: otherUid` -> DENIED (`incoming().userId == request.auth.uid`).
8. **Pre-Confirmed Deposit Fraud**: `create /deposits/{id}` with `status: "CONFIRMED"` -> DENIED (create only allows `AWAITING_PAYMENT` or `PENDING_CONFIRMATION`).
9. **Terminal Deposit Tampering**: `update /deposits/{id}` when `existing().status == "CONFIRMED"` -> DENIED for non-admins.
10. **Client-Forged Timestamps**: `create /investments/{id}` with backdated `createdAt` != `request.time` -> DENIED (`incoming().createdAt == request.time`).
11. **Oversized ID Poisoning**: `create /deposits/{2000-char-id}` -> DENIED (`isValidId` limits ID <= 128 chars).
12. **Unauthorized Wallet Hijack**: Non-admin attempting `update /wallets/{id}` to replace deposit address -> DENIED (`isAdmin()` required).
