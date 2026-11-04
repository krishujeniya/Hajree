import React, { useEffect, useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  Mail,
  Download,
  BookOpen,
  Calendar,
  Filter,
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { api } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { Lecture, Subject } from "../../types";

export const ReportsView: React.FC = () => {
  const toast = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedLectureId, setSelectedLectureId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.listSubjects().then((subs) => {
      if (mounted && subs.length > 0) {
        setSubjects(subs);
        setSelectedSubjectId(subs[0].id);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedSubjectId) return;
    setLoading(true);
    api.listSubjectLectures(selectedSubjectId).then((lecs) => {
      setLectures(lecs);
      if (lecs.length > 0) {
        setSelectedLectureId(lecs[0].id);
      } else {
        setSelectedLectureId(null);
      }
      setLoading(false);
    });
  }, [selectedSubjectId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Attendance Reports & Exports
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generate printable PDF attendance registers and CSV data spreadsheets
          </p>
        </div>
      </div>

      {/* Selectors */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Select Subject Course
            </label>
            <select
              value={selectedSubjectId || ""}
              onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary font-medium"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Select Lecture
            </label>
            <select
              value={selectedLectureId || ""}
              onChange={(e) => setSelectedLectureId(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary font-medium"
            >
              {lectures.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.held_on})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card
          title="Official PDF Attendance Sheet"
          description="Print-ready document with institutional header, student roll numbers, and attendance timestamps"
        >
          <div className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-foreground flex items-center justify-center mb-3">
              <FileText className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Standard PDF Document
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mb-5">
              Includes summary statistics, verification signatures, and present/absent breakdown.
            </p>
            {selectedSubjectId ? (
              <a
                href={api.exportPdfUrl(selectedSubjectId)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground hover:bg-foreground/90 text-background font-semibold text-sm shadow-sm tactile-button"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF Report</span>
              </a>
            ) : (
              <Button disabled>No Course Selected</Button>
            )}
          </div>
        </Card>

        <Card
          title="Tabular CSV Spreadsheet"
          description="Raw comma-separated tabular data suitable for Excel, Google Sheets, or ERP integration"
        >
          <div className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-foreground flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Comma-Separated Values (CSV)
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mb-5">
              Contains Student ID, Name, Roll Number, Total Lectures, Attended, and Attendance Percentage.
            </p>
            {selectedSubjectId ? (
              <a
                href={api.exportCsvUrl(selectedSubjectId)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground hover:bg-foreground/90 text-background font-semibold text-sm shadow-sm tactile-button"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV Spreadsheet</span>
              </a>
            ) : (
              <Button disabled>No Course Selected</Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
