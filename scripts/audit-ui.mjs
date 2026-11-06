#!/usr/bin/env node
// Audits every authored view, its registration, and shared accessibility basics.
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
const read = f => readFileSync(f,"utf8");
const app=read("frontend/src/App.tsx");
const expected={
 admin:["AdminOverview","SubjectManagement","SystemHealth","UserManagement"],
 auth:["LoginPage","RegisterPage"],
 student:["FaceEnrollmentView","StudentAttendanceHistory","StudentDashboard"],
 teacher:["AIAttendanceView","ManualAttendanceView","ReportsView","TeacherDashboard"],
};
let audited=0;
for(const [group,views] of Object.entries(expected)){
 for(const view of views){
  const file=`frontend/src/views/${group}/${view}.tsx`;
  const content=read(file);
  assert(content.includes("export ")&&content.includes("return "),`Malformed view ${file}`);
  assert(app.includes(`./views/${group}/${view}`),`View missing from router: ${file}`);
  assert(!content.includes("transition-all"),`Indiscriminate transition in ${file}`);
  audited++;
 }
}
const card=read("frontend/src/components/common/Card.tsx");
const css=read("frontend/src/index.css");
const landing=read("frontend/src/marketing/LandingPage.tsx");
assert(card.includes("bg-card")&&!card.includes("transition-all"),"Common cards must use restrained surfaces");
assert(css.includes("prefers-reduced-motion:reduce")&&css.includes(":focus-visible"),"Motion/focus guardrails missing");
assert(landing.includes("hm-register-preview")&&!landing.includes("<ParticleField"),"Human-reviewed register preview missing");
assert(app.includes('window.location.pathname === "/"')&&app.includes("allowedTabsForRole"),"Public landing or role isolation changed");
console.log(`PASS: ${audited} authenticated/authentication views, marketing, role routing and shared UI semantics`);
