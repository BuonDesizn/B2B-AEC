# 🛡️ Guardrail Check: Handshake Privacy & PII Masking

**Status**: MANDATORY before and after every implementation cycle.

## 📋 Compliance Checklist

- [ ] **Default State**: Are `phone`, `email`, and `linkedin` fields masked in the `public.profiles` view using RLS or server-side logic?
- [ ] **Handshake Status**: Is unmasking strictly contingent on `handshake.status == 'ACCEPTED'`?
- [ ] **Frontend Verification**: Verify that the PII was NEVER sent in the initial API payload (Client-side hiding is banned).
- [ ] **Audit Trail**: Is a new record created in `public.unmasking_audit` every time a profile is "unmasked"?
- [ ] **Log Scrubbing**: Check your own conversation and terminal logs—ensure no PII (actual phone numbers/emails) has been stored or displayed.

---

## 🚫 Rejection Criteria
- Any implementation where `display: none` or CSS/JS masking is the only security layer.
- Any implementation with missing or incomplete audit logging for sensitive actions.
