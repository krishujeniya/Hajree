# Hajree — Product and Content Inventory

Audited against the repository on 2026-11-06. This is one application, not a multi-product ecosystem; no fictional product registry, pricing, customer logos, footage or testimonials have been created.

## Confirmed product

| Property | Repository evidence |
| --- | --- |
| Product | Hajree |
| Type | Open-source attendance SaaS-style application / self-hosted web app |
| Audience | Administrators, faculty, students |
| Licensing | MIT license in \`LICENSE\` |
| Runtime | FastAPI backend; React 18 + TypeScript + Vite frontend |
| Recognition | DeepFace SFace configured via \`backend/app/ml/face_engine.py\` and application settings |
| Anti-spoofing | \`face_anti_spoofing: bool = False\` by default in \`backend/app/core/config.py\`; do not market it as enabled by default |
| Faculty workflow | Image recognition assisted attendance, manual roll call, dashboard, reports |
| Admin workflow | Accounts, courses, student enrollment and system diagnostics |
| Student workflow | Attendance status/history and face-profile enrollment |
| Exports | CSV and PDF via attendance API |
| Source code | https://github.com/krishujeniya/Hajree |
| Installation | \`python run.py\` or supplied Docker configuration |
| Pricing | No maintained commercial pricing system located. MIT open source is the only claimed access model. |
| Images and videos | No verified product demo video. Landing uses original CSS/SVG-shaped *illustrative* preview; no fake screenshot. |

## Routes and access model

| Path | Purpose | Access |
| --- | --- | --- |
| \`/\` | Product-facing public home | Public; does not call protected APIs |
| \`/login\` | Existing credentials-based application login | Public until authenticated |
| \`/register\` | Existing student self-registration | Public; backend restricts role to student |
| \`/app\` | Existing role-specific application | Authenticated; app logic maintains role tab restrictions |
| \`/docs\` | FastAPI interactive OpenAPI documentation when enabled by the backend environment | Development/test, or production only when configured to expose docs |
| \`/api/*\` | Existing FastAPI routes | API-specific authentication and authorization |

The site’s Docs navigation intentionally points to repository documentation, not the environment-dependent \`/docs\` API UI.

## Marketing content vs. actual data

- “Classroom workflow” visual is explicitly marked **Illustrative** and **Not live biometric data**.
- Three workflow steps are a presentation of the implemented administrative setup, faculty confirmation, and reporting functions.
- The FAQ discloses the default anti-spoofing state and the fallibility of recognition.
- No scores for model accuracy, liveness resistance, or facial matching are claimed because deployment measurements were not provided.
- No external tracking, external video, manufactured sign-up service, checkout, or fabricated user data has been added.

## Security and privacy boundaries

Facial templates are biometric data. Obtain appropriate consent, provide non-biometric alternatives, document retention/deletion procedures, and comply with applicable local laws. Self-hosters must set production secrets, restrict network access, protect exports, configure CORS/trusted hosts and review AI matching thresholds. The marketing UI does not transmit face data.

## Public documentation allowlist

The public site links only to \`README.md\`, \`LICENSE\` and the source repository. It does not auto-publish arbitrary \`docs/\`, private configuration, example credentials or backend state.
