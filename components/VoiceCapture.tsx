"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { transcribeAudio, TranscribeResult } from "@/lib/api";
import { toast } from "sonner";

interface VoiceCaptureProps {
  onTranscribed: (data: TranscribeResult) => void;
  compact?: boolean;
}

export function VoiceCapture({ onTranscribed, compact = false }: VoiceCaptureProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    audioChunksRef.current = [];
    setSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size === 0) {
          toast.error("No audio recorded.");
          return;
        }

        setIsProcessing(true);
        const toastId = toast.loading("Processing audio with Gemini...");

        try {
          const result = await transcribeAudio(audioBlob, mimeType);
          toast.success("Voice note transcribed", { id: toastId });
          onTranscribed(result);
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : "Failed to process audio";
          toast.error(errMsg, { id: toastId });
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      toast.error(
        "Could not access microphone. Please check browser permissions."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {isRecording ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={stopRecording}
            className="flex items-center gap-1.5 h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
          >
            <Square className="h-3 w-3 fill-current" />
            <span>Stop ({formatTime(seconds)})</span>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isProcessing}
            onClick={startRecording}
            className="flex items-center gap-1.5 h-8 text-xs border-zinc-700 bg-zinc-850 text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            {isProcessing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Mic className="h-3.5 w-3.5 text-zinc-400" />
            )}
            <span>{isProcessing ? "Transcribing..." : "Record Audio"}</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-zinc-800 text-zinc-300 shrink-0">
          <Mic className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-zinc-200">
            Voice Capture
          </h4>
          <p className="text-[11px] text-zinc-500">
            Record a conversation recap to auto-extract CRM contact fields.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isRecording ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-red-400 font-medium">
              {formatTime(seconds)}
            </span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={stopRecording}
              className="h-8 text-xs flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <Square className="h-3 w-3 fill-current" />
              Stop & Extract
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            disabled={isProcessing}
            onClick={startRecording}
            className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs flex items-center gap-1.5"
            size="sm"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Mic className="h-3.5 w-3.5" />
                <span>Start Recording</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
