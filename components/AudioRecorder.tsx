"use client";

import { useRef, useState } from "react";

export function AudioRecorder({
  onRecorded,
  disabled,
}: {
  onRecorded: (file: File) => void;
  disabled?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: "audio/webm" });
        onRecorded(file);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError("لم نتمكن من الوصول للميكروفون. تأكد من السماح بالوصول.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="flex flex-col gap-1">
      {!recording ? (
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          className="focus-ring rounded-full border-2 border-teal px-3 py-1.5 text-xs font-bold text-teal transition hover:bg-teal-light disabled:opacity-60"
        >
          🎙️ تسجيل مباشر
        </button>
      ) : (
        <button
          type="button"
          onClick={stopRecording}
          className="focus-ring animate-pulse rounded-full bg-coral px-3 py-1.5 text-xs font-bold text-cream"
        >
          ⏹️ إيقاف التسجيل
        </button>
      )}
      {error && <span className="text-xs text-coral">{error}</span>}
    </div>
  );
}
