import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Upload, Copy, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { transcribeAudio, MAX_TRANSCRIBE_BYTES } from '../../services/aiGenerate';

/**
 * Speech to Text: record in the browser or upload an audio file, transcribed with the user's
 * OpenAI key (POST /api/ai/transcribe, OpenAI Audio API).
 */
const SpeechToTextContent: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    []
  );

  const transcribe = async (audio: Blob, filename: string) => {
    setIsTranscribing(true);
    setError(null);
    setTranscript('');
    try {
      setTranscript(await transcribeAudio(audio, filename, prompt.trim() || undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed');
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Recording is not supported in this browser. Upload an audio file instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = recorder.mimeType || 'audio/webm';
        const ext = type.includes('mp4') ? 'mp4' : type.includes('ogg') ? 'ogg' : 'webm';
        transcribe(new Blob(chunksRef.current, { type }), `recording.${ext}`);
      };
      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      setError(err instanceof Error ? `Microphone unavailable: ${err.message}` : 'Microphone unavailable');
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setIsRecording(false);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) transcribe(file, file.name);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Record audio or upload a file (mp3, mp4, m4a, wav, webm, ogg, flac; max{' '}
        {Math.round(MAX_TRANSCRIBE_BYTES / 1024 / 1024)} MB). Transcribed with your OpenAI API key.
      </p>

      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Optional: names or terms to help recognition (e.g. company or product names)"
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
      />

      <div className="flex flex-wrap gap-3">
        {isRecording ? (
          <button
            onClick={stopRecording}
            className="flex items-center px-4 py-2 rounded-md bg-red-600 text-white text-sm"
          >
            <Square size={16} className="mr-2" /> Stop and transcribe
          </button>
        ) : (
          <button
            onClick={startRecording}
            disabled={isTranscribing}
            className="flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm disabled:opacity-50"
          >
            <Mic size={16} className="mr-2" /> Record
          </button>
        )}
        <label
          className={`flex items-center px-4 py-2 rounded-md border border-gray-300 text-sm cursor-pointer ${
            isRecording || isTranscribing ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <Upload size={16} className="mr-2" /> Upload audio
          <input type="file" accept="audio/*,video/mp4,video/webm" className="hidden" onChange={onFile} aria-label="Upload audio" />
        </label>
      </div>

      {isRecording && <p className="text-sm text-red-600">Recording… click Stop when you are done.</p>}
      {isTranscribing && (
        <p className="flex items-center text-sm text-gray-600">
          <RefreshCw size={16} className="mr-2 animate-spin" /> Transcribing…
        </p>
      )}

      {error && (
        <div className="flex items-start p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {transcript && (
        <div className="border border-gray-200 rounded-md p-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-800">Transcript</h4>
            <button onClick={copy} className="flex items-center text-xs text-gray-600">
              {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm text-gray-800">{transcript}</p>
        </div>
      )}
    </div>
  );
};

export default SpeechToTextContent;
