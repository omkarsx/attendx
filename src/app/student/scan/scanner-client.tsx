"use client";

import { useEffect, useRef, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { Html5Qrcode } from "html5-qrcode";
import { markAttendanceAction } from "@/app/actions/attendance";
import { MarkAttendanceResult } from "@/lib/attendance/verification";

export function ScannerClient() {
  const [isPending, startTransition] = useTransition();
  const [scanResult, setScanResult] = useState<MarkAttendanceResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const handleProcessScan = useCallback((qrString: string) => {
    startTransition(async () => {
      try {
        const result = await markAttendanceAction(qrString.trim());
        setScanResult(result);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Attendance processing failed.";
        setScanResult({
          success: false,
          code: "UNAUTHORIZED",
          message: msg,
        });
      }
    });
  }, []);

  useEffect(() => {
    const scannerId = "qr-reader-container";
    const html5QrCode = new Html5Qrcode(scannerId);
    scannerRef.current = html5QrCode;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    html5QrCode
      .start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          if (scannerRef.current?.isScanning) {
            scannerRef.current.pause(true);
          }
          handleProcessScan(decodedText);
        },
        () => {
          // Frame error (ignore normal scanning frames)
        },
      )
      .then(() => {
        setCameraError(null);
      })
      .catch((err) => {
        console.warn("Camera start error:", err);
        setCameraError(
          "Camera access unavailable or permission denied. You can paste the code below.",
        );
      });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [handleProcessScan]);

  const handleResetScan = () => {
    setScanResult(null);
    setManualCode("");
    if (scannerRef.current) {
      try {
        scannerRef.current.resume();
      } catch {
        // Resume if paused
      }
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Scanner Viewport Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden space-y-4 text-center">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Attendance QR Scanner
          </h2>
          <Link
            href="/student/dashboard"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            ✕ Close
          </Link>
        </div>

        {/* Viewfinder Element */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 min-h-[280px] flex items-center justify-center">
          <div id="qr-reader-container" className="w-full h-full"></div>

          {isPending && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-2 z-10">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-semibold">Verifying Attendance...</span>
            </div>
          )}
        </div>

        {cameraError && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-left">
            {cameraError}
          </div>
        )}

        <p className="text-xs text-slate-400">
          Point your device camera at the active lecture QR code displayed by your instructor.
        </p>

        {/* Manual Code Fallback */}
        <div className="pt-3 border-t border-slate-100 flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Paste code manually if camera fails..."
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={() => handleProcessScan(manualCode)}
            disabled={!manualCode || isPending}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold text-xs rounded-xl transition-all"
          >
            Submit
          </button>
        </div>
      </div>

      {/* Result Modal / Overlay */}
      {scanResult && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-200">
          {scanResult.success ? (
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto shadow-sm">
                ✓
              </div>
              <div>
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                  Attendance Recorded
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {scanResult.details.courseName}
                </h3>
                <p className="text-xs text-slate-500">
                  {scanResult.details.courseCode} • Instructor: {scanResult.details.teacherName}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600 grid grid-cols-2 gap-2 text-left">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Division / Batch</span>
                  <span className="font-semibold text-slate-900">
                    Div {scanResult.details.divisionName} {scanResult.details.batchName ? `• ${scanResult.details.batchName}` : ""}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Marked At</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(scanResult.details.markedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetScan}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
                >
                  Scan Another
                </button>
                <Link
                  href="/student/dashboard"
                  className="flex-1 py-2.5 bg-[#10B981] hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-sm transition-all text-center"
                >
                  View Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto shadow-sm">
                ✕
              </div>
              <div>
                <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                  Attendance Failed
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {scanResult.code}
                </h3>
                <p className="text-xs text-red-700 mt-2 bg-red-50 p-3 rounded-xl border border-red-100 leading-relaxed">
                  {scanResult.message}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetScan}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
                >
                  Try Again
                </button>
                <Link
                  href="/student/dashboard"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all text-center"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
