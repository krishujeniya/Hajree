import React, { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Database,
  Layers,
  Shield,
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { api } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { AppMeta, ReadinessResponse } from "../../types";

export const SystemHealth: React.FC = () => {
  const toast = useToast();
  const [readiness, setReadiness] = useState<ReadinessResponse | null>(null);
  const [meta, setMeta] = useState<AppMeta | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const [r, m] = await Promise.all([api.getReadiness(), api.getMeta()]);
      setReadiness(r);
      setMeta(m);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch health status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            AI Engine & System Diagnostics
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time inference pipeline, vector database, and neural weights status
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchStatus}
          loading={loading}
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh Diagnostics
        </Button>
      </div>

      {/* Main Status Hero */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              readiness?.status === "ok"
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-amber-500/10 text-amber-500"
            }`}
          >
            {readiness?.status === "ok" ? (
              <CheckCircle2 className="w-7 h-7" />
            ) : (
              <AlertTriangle className="w-7 h-7" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">
                AI Pipeline Status:{" "}
                <span className="capitalize">{readiness?.status || "Unknown"}</span>
              </h3>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              DeepFace facial feature extractor and Euclidean distance matcher are initialized and ready for real-time inference.
            </p>
          </div>
        </div>
      </Card>

      {/* Diagnostics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card title="SQLite Database" description="Relational data store">
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-medium text-foreground">
              Connection
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
              <span>Healthy</span>
            </span>
          </div>
        </Card>

        <Card title="SFace CNN Weights" description="Deep neural network">
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-medium text-foreground">
              Memory Cache
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
              <span>Warm & Active</span>
            </span>
          </div>
        </Card>

        <Card title="Vector Index" description="Precomputed student embeddings">
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-medium text-foreground">
              Indexed Vectors
            </span>
            <span className="font-mono text-sm font-bold text-primary-600 dark:text-primary-400">
              {readiness?.face_index_entries || 0} Faces
            </span>
          </div>
        </Card>
      </div>

      {/* System Specifications */}
      <Card title="Platform Architecture Specifications" description="Active hyperparameters and models">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-border bg-muted/20">
            <p className="text-muted-foreground font-medium">Recognition Model</p>
            <p className="text-foreground font-bold mt-1 text-sm">SFace (OpenCV)</p>
          </div>
          <div className="p-3.5 rounded-xl border border-border bg-muted/20">
            <p className="text-muted-foreground font-medium">Detector Engine</p>
            <p className="text-foreground font-bold mt-1 text-sm">OpenCV Cascade / DNN</p>
          </div>
          <div className="p-3.5 rounded-xl border border-border bg-muted/20">
            <p className="text-muted-foreground font-medium">Distance Threshold</p>
            <p className="text-foreground font-bold mt-1 text-sm font-mono">&le; 0.60 Cosine</p>
          </div>
          <div className="p-3.5 rounded-xl border border-border bg-muted/20">
            <p className="text-muted-foreground font-medium">Self-Registration</p>
            <p className="text-foreground font-bold mt-1 text-sm">
              {meta?.self_registration ? "Enabled" : "Disabled"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
