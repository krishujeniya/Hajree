import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export const FaceEnrollmentView: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [faceStatus, setFaceStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const fetchStatus = async () => {
    if (!user) return;
    try {
      const res = await api.getUserFaceStatus(user.id);
      setFaceStatus(res);
    } catch (err: any) {
      toast.error("Failed to load face enrollment status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    return () => {
      stopCamera();
    };
  }, [user]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 640 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      toast.error("Camera access failed. Check browser permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleCaptureSelfie = () => {
    if (!videoRef.current || !canvasRef.current || !user) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, 640, 640);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      setUploading(true);
      try {
        const file = new File([blob], `selfie_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        const res = await api.uploadUserFace(user.id, file);
        toast.success(`Face image enrolled (${res.count}/${res.target}).`);
        await fetchStatus();
        await refreshUser();
      } catch (err: any) {
        toast.error(err.message || "Failed to process face photo.");
      } finally {
        setUploading(false);
      }
    }, "image/jpeg", 0.95);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    const file = e.target.files[0];

    setUploading(true);
    try {
      const res = await api.uploadUserFace(user.id, file);
      toast.success(`Face image enrolled (${res.count}/${res.target}).`);
      await fetchStatus();
      await refreshUser();
    } catch (err: any) {
      toast.error(err.message || "Failed to process face photo");
    } finally {
      setUploading(false);
    }
  };

  const handleResetFace = async () => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to reset your face profile? All enrolled face photos will be deleted.")) {
      return;
    }
    setResetting(true);
    try {
      const res = await api.resetUserFace(user.id);
      toast.success(res.message || "Face profile reset successfully.");
      await fetchStatus();
      await refreshUser();
    } catch (err: any) {
      toast.error(err.message || "Failed to reset face profile.");
    } finally {
      setResetting(false);
    }
  };

  const enrolledCount = faceStatus?.count ?? 0;
  const target = faceStatus?.target ?? 10;
  const isComplete = faceStatus?.ready ?? (enrolledCount >= target);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Biometric Face Enrollment
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Train the AI neural network with your photos to enable automated attendance recognition
          </p>
        </div>
        {enrolledCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFace}
            loading={resetting}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Reset Face Profile
          </Button>
        )}
      </div>

      {/* Progress Hero */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                isComplete
                  ? "bg-foreground text-background border border-foreground/20 shadow-sm"
                  : "bg-muted text-foreground border border-border"
              }`}
            >
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">
                  Enrollment Progress: {enrolledCount} of {target} Photos
                </h3>
                {isComplete && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-foreground text-background shadow-xs">
                    Complete & Ready
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-lg">
                For highest accuracy in classroom lighting and angles, we recommend uploading at least 10 varied selfie photos.
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full sm:w-48">
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden mb-1.5">
              <div
                className="bg-foreground h-full rounded-full transition-colors duration-500"
                style={{
                  width: `${Math.min((enrolledCount / target) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground text-right font-medium">
              {((enrolledCount / target) * 100).toFixed(0)}% Completed
            </p>
          </div>
        </div>
      </Card>

      {/* Camera / Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Live Selfie Capture */}
        <Card
          title="Option 1: Live Webcam Selfie"
          description="Capture front and angle snapshots directly using your webcam"
        >
          <div className="space-y-4">
            <div className="relative aspect-square max-w-xs mx-auto rounded-2xl overflow-hidden bg-black/90 border border-border flex items-center justify-center">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </>
              ) : (
                <div className="text-center p-6 text-muted-foreground">
                  <Camera className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Camera is currently inactive</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3">
              {!cameraActive ? (
                <Button
                  onClick={startCamera}
                  icon={<Camera className="w-4 h-4" />}
                >
                  Start Camera
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleCaptureSelfie}
                    loading={uploading}
                    icon={<Camera className="w-4 h-4" />}
                  >
                    Take & Enroll Photo
                  </Button>
                  <Button variant="secondary" onClick={stopCamera}>
                    Stop
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* File Upload */}
        <Card
          title="Option 2: Upload Photo File"
          description="Upload existing portrait images from your computer or phone"
        >
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center aspect-square max-w-xs mx-auto rounded-2xl border-2 border-dashed border-border hover:border-foreground/40 cursor-pointer p-6 text-center transition-colors bg-muted/10">
              <Upload className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm font-semibold text-foreground">
                Select Photo File
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG, WebP (Max 10MB)
              </p>
              <span className="mt-4 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 tactile-button shadow-sm">
                Choose File
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>

            {/* Best Practice Tips */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground space-y-1.5">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-foreground" />
                <span>Tips for 100% recognition accuracy:</span>
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Good ambient lighting on your face</li>
                <li>Remove dark sunglasses or masks</li>
                <li>Capture slight head tilts (left, right, slight smile)</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
