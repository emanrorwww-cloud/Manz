# Security Specification & Test Payloads

## 1. Data Invariants
- Admin documents in `/admins/{adminId}` can only be read or written by authenticated administrators. The bootstrapped admin email is `emanrorwww@gmail.com`.
- Subject documents in `/subjects/{subjectId}` are readable by authenticated users and manageable (create/update/delete) only by verified admins/teachers.
- Question documents in `/questions/{questionId}` are readable by authenticated users and manageable only by verified admins/teachers.
- Result documents in `/results/{resultId}`:
  - Can only be created by an authenticated user matching `incoming().userId == request.auth.uid`.
  - Must have `createdAt == request.time`.
  - Score must be bounded between 0 and 100 (`score >= 0 && score <= 100`).
  - Total questions must be positive.
  - Can be read individually by the student owner (`userId == request.auth.uid`) or by an admin.
  - Results cannot be altered/updated by anyone once written (immutable score record).
  - Can be deleted only by an admin or the owner.

## 2. The Dirty Dozen Payloads (Designed to Fail)
1. **Unauthenticated Write to Admins**: Anonymous or unauthenticated request attempting to create `/admins/attackerUid`.
2. **Admin Role Self-Escalation**: Normal user attempting to set `role: 'admin'` in `/admins/normalUser`.
3. **Ghost Field in Subject Creation**: Payload attempting to add unexpected fields `isSuperAdmin: true` to a subject.
4. **Non-Admin Creating Subject**: Standard student user attempting to create a new subject in `/subjects/new-subj`.
5. **ID Poisoning in Subject**: Attempting to create a subject with an invalid ID like `../../evil/path`.
6. **Negative Exam Score in Result**: Student submitting `score: -10` to `/results/res-1`.
7. **Score Exceeding 100 in Result**: Student submitting `score: 150` to `/results/res-2`.
8. **Identity Spoofing in Result**: User A (`auth.uid: userA`) submitting a result with `userId: userB`.
9. **Tampering with Server Timestamp**: Submitting a result with client timestamp `createdAt: '2020-01-01T00:00:00Z'` instead of `request.time`.
10. **Tampering with Existing Result**: Attempting an `update` to change `score` from 60 to 100 on an existing result.
11. **Foreign Question Write**: Non-admin student user attempting to inject or delete questions in `/questions/q-evil`.
12. **Blanket Query Scraping**: Unauthenticated client querying the entire `/results` collection.
