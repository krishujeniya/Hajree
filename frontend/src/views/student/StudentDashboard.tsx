import React, { useEffect, useState } from "react";
import {
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { api } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { StudentReportOut } from "../../types";

interface StudentDashboardProps {
  onNavigate: (tabId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigate,
}) => {
  const toast = useToast();
  const [report, setReport] = useState<StudentReportOut | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api
      .getMyReport()
      .then((rep) => {
        if (mounted) {
          setReport(rep);
          setLoading(false);
        }
      })
      .catch((err) => {
        toast.error("Failed to load student attendance record");
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const overall = report?.overall_percentage || 0;
  const isEligible = overall >= 75;

  return (
    <div className="space-y-6">
      {/* Top Hero Gauge Card */}
      <Card className="p-8 overflow-hidden relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-muted/60 text-foreground border border-border">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personal Attendance Summary</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Overall Attendance: {overall.toFixed(1)}%
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-lg">
              {isEligible
                ? "You meet the mandatory minimum attendance threshold (75%) required for end-semester examinations."
                : "Attention: Your attendance is currently below the 75% institutional requirement. Please attend upcoming lectures."}
            </p>

            <div className="mt-4 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  isEligible
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                {isEligible ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Exam Eligible</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span>Attendance Shortage</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Radial Circular Progress Display */}
          <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-muted/40"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-foreground transition-all"
                strokeWidth="10"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * Math.min(overall, 100)) / 100}
                strokeLinecap="round"
                fill="none"
                style={{
                  transition: "stroke-dashoffset 1s cubic-bezier(0.23, 1, 0.32, 1)",
                }}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-extrabold text-foreground font-mono">
                {overall.toFixed(0)}%
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Overall
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Subject-Wise Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold tracking-tight text-foreground">
            Course-Wise Breakdown
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigate("student-history")}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Full Lecture History
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {loading ? (
            <p className="text-xs text-muted-foreground col-span-full py-8 text-center">
              Loading course analytics...
            </p>
          ) : !report?.subjects || report.subjects.length === 0 ? (
            <p className="text-xs text-muted-foreground col-span-full py-8 text-center">
              No subjects registered yet.
            </p>
          ) : (
            report.subjects.map((sub) => {
              const subEligible = sub.percentage >= 75;
              return (
                <Card key={sub.subject_id} className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-muted-foreground uppercase">
                        COURSE #{sub.subject_id}
                      </span>
                      <span
                        className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                          subEligible
                            ? "bg-foreground text-background shadow-xs"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {sub.percentage.toFixed(1)}%
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-foreground">
                      {sub.subject}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Attended {sub.present} of {sub.total_lectures} lectures
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50">
                    {/* Progress Bar */}
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          subEligible ? "bg-foreground" : "bg-muted-foreground/60"
                        }`}
                        style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Threshold: 75%</span>
                      <span>
                        {subEligible
                          ? "Status: Good Standing"
                          : "Status: Below Threshold"}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
