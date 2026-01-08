Dispatch App Platform



A mobile-only dispatch application that uses the Manager App as the single backend surface (no separate dispatch-backend service required in production).



\*\*Dispatch App\*\* (`/dispatch-app/`) - React Native + Expo mobile client for field operations and dispatch management, communicating with the Manager App’s `/api/mobile/\*` endpoints.



\*\*Key Features:\*\*



\- \*\*Single Backend (Manager App)\*\* - Manager App exposes `/api/\*` for web and `/api/mobile/\*` for mobile. All business logic, validation, and database writes are centralized in Manager App (Prisma + MySQL).

\- \*\*Private/Internal Distribution\*\* - Keep Dispatch as a private app without public store presence:

&nbsp; - iOS: Apple Business Manager (Custom App) + MDM (Jamf/Intune/Workspace ONE) recommended; alternatively Apple Developer Enterprise Program; Ad Hoc for small pilots.

&nbsp; - Android: Managed Google Play private app via MDM; alternatively sideload signed APK for small pilots.

\- \*\*OTA Updates\*\* - Use Expo EAS Update for JS-only fixes; rebuild with EAS for native changes (plugins/permissions).

\- \*\*Security Posture\*\* - Short-lived Bearer JWT access token with rotating refresh stored only in Expo SecureStore; optional mTLS/per-app VPN via MDM; WAF on CloudFront; pre-signed S3 uploads; device/session hygiene and rate limits on auth endpoints.

\- \*\*Offline-Aware \& i18n\*\* - Network detection and graceful error handling; English/Japanese localization.



\*\*Architecture:\*\*



```

React Native App (dispatch-app)

&nbsp;       ↓ HTTPS

Route 53 / CloudFront (WAF)

&nbsp;       ↓

Elastic Beanstalk (Manager App API: /api/mobile/\* → Express + Prisma)

&nbsp;       ↓

RDS MySQL  (optional: RDS Proxy)

Uploads: pre-signed PUT → S3 (private, OAC) → CloudFront GET

```



\*\*Data Flow:\*\*



\- Mobile app communicates exclusively with Manager App API (no direct DB access)

\- Manager App handles all business logic, validation, and database operations

\- File uploads use pre-signed S3 PUT; keys stored in DB; reads via CloudFront

\- Prisma ORM provides type-safe database operations and automated migrations



\*\*Security Model:\*\*



\- JWT tokens stored securely with Expo SecureStore (no cookies on mobile)

\- All `/api/mobile/\*` endpoints require authentication except login

\- Optional device controls via MDM (remote wipe, OS minimums, per-app VPN)

\- Input validation and sanitization at API layer; WAF rules and rate limiting at edge



\*\*Distribution (summary):\*\*



\- iOS: ABM + MDM “Custom App” (recommended) or ADEP enterprise-signed; Ad Hoc for small pilots

\- Android: Managed Google Play private app via MDM (recommended) or APK sideload



\*\*Target Users:\*\* Field personnel using a mobile dispatch client backed by a single, centralized Manager backend



\## Universal Requirements



\### Multi-language Support (Required for All Projects)



\- \*\*English/Japanese Localization\*\* - All current and future projects must implement comprehensive i18n support for English and Japanese languages

\- \*\*Consistent Translation Patterns\*\* - Use standardized localization libraries and file structures across projects

\- \*\*Cultural Adaptation\*\* - Consider cultural differences in UI/UX design for Japanese users



