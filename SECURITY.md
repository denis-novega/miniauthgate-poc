# Security policy

This repository is a proof-of-concept snapshot.

Do not use it in production without reviewing and completing the missing host-application pieces:

- signed session verification;
- nonce storage and single-use consumption;
- `/api/me` session verification;
- database schema and access policies;
- deployment-specific cookie settings;
- rate limiting and abuse protection.

If you find a vulnerability in the PoC, open a private advisory or contact the maintainer directly.
