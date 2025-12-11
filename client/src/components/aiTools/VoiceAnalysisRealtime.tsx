import React, { useState, useRef, useEffect } from 'react';
import { useGemini } from '../../services/geminiService';
import { Mic, MicOff, Play, Pause, RefreshCw, AlertCircle, BarChart3, Volume2, Save, FileText, Wand } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceAnalysisRealtimeProps {
  onAnalysisComplete?: (analysis: any) => void;
  simulationMode?: boolean;
}

const VoiceAnalysisRealtime: React.FC<VoiceAnalysisRealtimeProps> = ({ 
  onAnalysisComplete,
  simulationMode = true // Use simulation mode for the demo
}) => {
  const gemini = useGemini();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sentiment, setSentiment] = useState<{
    score: number;
    emotions: string[];
    keyPhrases: string[];
  } | null>(null);
  
  const [liveAnalysis, setLiveAnalysis] = useState<{
    currentSentiment: number;
    pacing: 'good' | 'too fast' | 'too slow';
    keywordDetected: string | null;
    talkRatio: number;
  }>({
    currentSentiment: 0,
    pacing: 'good',
    keywordDetected: null,
    talkRatio: 0.5 // 50% talking, 50% listening
  });
  
  const [realTimeFeedback, setRealTimeFeedback] = useState<string[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const simulatedTranscripts = [
    "Hello, this is John from Acme Sales. I wanted to follow up on our conversation about the enterprise software package we discussed last week.",
    "I understand your team has concerns about the implementation timeline, but I want to assure you that we have a dedicated support team to help with the transition.",
    "We've helped companies similar to yours successfully implement our solution in under 45 days, and we're confident we can meet your deadline.",
    "Our platform includes all the features you mentioned as requirements, plus additional analytics capabilities that should provide value to your marketing team.",
    "Would you be available this Thursday or Friday for a brief demo with our technical team to address any remaining questions?"
  ];
  
  const startRecording = async () => {
    if (simulationMode) {
      // Simulate recording
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
        
        // Every 5 seconds, add a new piece of real-time feedback
        if ((recordingTime + 1) % 5 === 0 && recordingTime < 30) {
          simulateRealTimeFeedback();
        }
        
        // Update live analysis values periodically
        updateLiveAnalysisSimulation();
      }, 1000);
      
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        
        // Get transcript from the recording
        transcribeAudio(audioBlob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };
  
  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsRecording(false);
    
    if (simulationMode) {
      // Simulate a recording
      const blob = new Blob([JSON.stringify(simulatedTranscripts)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      setAudioBlob(blob);
      setAudioUrl(url);
      
      // Simulate transcription
      simulateTranscription();
      return;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };
  
  const transcribeAudio = async (blob: Blob) => {
    setIsAnalyzing(true);
    
    try {
      // In a real implementation, send the audio to a speech-to-text service
      // For this demo, we'll use a placeholder
      setTimeout(() => {
        setTranscript("This is a simulated transcript from the recorded audio. In a real implementation, this would be generated by a speech-to-text service.");
        
        // Analyze sentiment
        analyzeSentiment("This is a simulated transcript from the recorded audio. In a real implementation, this would be generated by a speech-to-text service.");
      }, 1500);
    } catch (error) {
      console.error('Error transcribing audio:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const simulateTranscription = () => {
    setIsAnalyzing(true);
    
    // Simulate a delay for transcription
    setTimeout(() => {
      const fullTranscript = simulatedTranscripts.join(' ');
      setTranscript(fullTranscript);
      
      // Analyze sentiment
      analyzeSentiment(fullTranscript);
    }, 1500);
  };
  
  const analyzeSentiment = async (text: string) => {
    try {
      const sentimentResult = await gemini.analyzeSentimentRealTime(text);
      setSentiment(sentimentResult);
      
      if (onAnalysisComplete) {
        onAnalysisComplete({
          transcript: text,
          sentiment: sentimentResult
        });
      }
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
    } else if (simulationMode) {
      // Simulate playing audio
      setIsPlaying(true);
      setTimeout(() => {
        setIsPlaying(false);
      }, 3000);
    }
  };
  
  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  };
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const updateLiveAnalysisSimulation = () => {
    setLiveAnalysis(prev => {
      // Randomly adjust sentiment
      const newSentiment = Math.min(1, Math.max(-1, prev.currentSentiment + (Math.random() * 0.4 - 0.2)));
      
      // Randomly change pacing
      const paces: ('good' | 'too fast' | 'too slow')[] = ['good', 'too fast', 'too slow'];
      const newPace = Math.random() > 0.9 ? paces[Math.floor(Math.random() * paces.length)] : prev.pacing;
      
      // Detect keywords occasionally
      const keywords = ['pricing', 'implementation', 'timeline', 'support', 'features', null, null];
      const newKeyword = Math.random() > 0.8 ? keywords[Math.floor(Math.random() * keywords.length)] : prev.keywordDetected;
      
      // Adjust talk ratio slightly
      const newTalkRatio = Math.min(0.9, Math.max(0.1, prev.talkRatio + (Math.random() * 0.1 - 0.05)));
      
      return {
        currentSentiment: newSentiment,
        pacing: newPace,
        keywordDetected: newKeyword,
        talkRatio: newTalkRatio
      };
    });
  };
  
  const simulateRealTimeFeedback = () => {
    const feedbackOptions = [
      "Try to pause more frequently to let the client respond",
      "Good job highlighting the product benefits!",
      "Consider asking an open-ended question now",
      "Detected potential objection - address concerns about timeline",
      "Opportunity to mention case study",
      "Great use of social proof",
      "Speak a bit slower when discussing technical details",
      "Opportunity to discuss pricing strategy",
      "Consider transitioning to next steps soon"
    ];
    
    const newFeedback = feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)];
    setRealTimeFeedback(prev => [...prev, newFeedback]);
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Handle ending of audio playback
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-purple-50 to-indigo-50">
        <h3 className="text-lg font-semibold flex items-center">
          <Mic size={20} className="text-purple-600 mr-2" />
          Real-time Voice Analysis
        </h3>
      </div>
      
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Recording Controls */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col items-center">
            {!isRecording && !audioBlob ? (
              <div className="text-center">
                <button
                  onClick={startRecording}
                  className="h-24 w-24 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-colors mb-4 relative"
                >
                  <span className="absolute inset-0 bg-purple-400 rounded-full animate-ping opacity-20"></span>
                  <Mic size={36} />
                </button>
                <p className="text-gray-700 font-medium">Click to Start Recording</p>
                <p className="text-xs text-gray-500 mt-1">Get real-time feedback as you speak</p>
              </div>
            ) : isRecording ? (
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="h-24 w-24 rounded-full bg-red-600 text-white flex items-center justify-center relative">
                    <span className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-30"></span>
                    <div className="h-4 w-4 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                <p className="text-xl font-mono mb-4">{formatTime(recordingTime)}</p>
                <button
                  onClick={stopRecording}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 flex items-center"
                >
                  <MicOff size={18} className="mr-2" />
                  Stop Recording
                </button>
              </div>
            ) : (
              <div className="w-full">
                {audioUrl && (
                  <audio 
                    ref={audioRef} 
                    src={audioUrl} 
                    onEnded={handleAudioEnded} 
                    className="w-full mb-4" 
                    controls
                  />
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Recording: {formatTime(recordingTime)}</span>
                  <div>
                    <button
                      onClick={isPlaying ? pauseAudio : playAudio}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 mr-2 inline-flex items-center"
                    >
                      {isPlaying ? (
                        <>
                          <Pause size={16} className="mr-1.5" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play size={16} className="mr-1.5" />
                          Play
                        </>
                      )}
                    </button>
                    <button
                      onClick={startRecording}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 inline-flex items-center"
                    >
                      <Mic size={16} className="mr-1.5" />
                      Record New
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Live Analysis Panel - Only visible when recording */}
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 overflow-hidden"
            >
              <h4 className="text-sm font-medium text-indigo-900 mb-3 flex items-center">
                <BarChart3 size={16} className="text-indigo-600 mr-1.5" />
                Live Analysis
              </h4>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-3 rounded border border-indigo-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-500">Current Sentiment</span>
                    <span className={`text-xs font-medium ${
                      liveAnalysis.currentSentiment > 0.3 ? 'text-green-600' :
                      liveAnalysis.currentSentiment > -0.3 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {liveAnalysis.currentSentiment > 0.3 ? 'Positive' :
                       liveAnalysis.currentSentiment > -0.3 ? 'Neutral' : 'Negative'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        liveAnalysis.currentSentiment > 0.3 ? 'bg-green-500' :
                        liveAnalysis.currentSentiment > -0.3 ? 'bg-blue-500' : 'bg-red-500'
                      }`}
                      style={{ 
                        width: `${Math.min(100, Math.max(0, (liveAnalysis.currentSentiment + 1) * 50))}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded border border-indigo-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-500">Speaking Pace</span>
                    <span className={`text-xs font-medium ${
                      liveAnalysis.pacing === 'good' ? 'text-green-600' :
                      liveAnalysis.pacing === 'too fast' ? 'text-yellow-600' : 'text-blue-600'
                    }`}>
                      {liveAnalysis.pacing === 'good' ? 'Good Pace' :
                       liveAnalysis.pacing === 'too fast' ? 'Too Fast' : 'Too Slow'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="text-xs text-gray-500">Slow</div>
                    <div className="flex-1 mx-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          liveAnalysis.pacing === 'good' ? 'bg-green-500' :
                          liveAnalysis.pacing === 'too fast' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}
                        style={{ 
                          width: liveAnalysis.pacing === 'good' ? '50%' :
                                liveAnalysis.pacing === 'too fast' ? '80%' : '20%',
                          marginLeft: liveAnalysis.pacing === 'good' ? '25%' : '0'
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">Fast</div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded border border-indigo-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-500">Talk/Listen Ratio</span>
                    <span className="text-xs font-medium text-indigo-600">
                      {Math.round(liveAnalysis.talkRatio * 100)}% / {Math.round((1 - liveAnalysis.talkRatio) * 100)}%
                    </span>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-indigo-500"
                      style={{ width: `${liveAnalysis.talkRatio * 100}%` }}
                    ></div>
                    <div 
                      className="h-full bg-green-500"
                      style={{ width: `${(1 - liveAnalysis.talkRatio) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-indigo-600">You</span>
                    <span className="text-xs text-green-600">Client</span>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded border border-indigo-100">
                  <div className="mb-1">
                    <span className="text-xs font-medium text-gray-500">Keyword Detection</span>
                  </div>
                  {liveAnalysis.keywordDetected ? (
                    <div className="flex items-center">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {liveAnalysis.keywordDetected}
                      </span>
                    </div>
                  ) : (
                    <div className="text-center py-1.5">
                      <span className="text-xs text-gray-500">Listening for keywords...</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Real-time Feedback */}
          {isRecording && realTimeFeedback.length > 0 && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Wand size={16} className="text-purple-600 mr-1.5" />
                Real-time Coaching
              </h4>
              
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {realTimeFeedback.map((feedback, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start"
                  >
                    <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-2 flex-shrink-0">
                      <AlertCircle size={12} />
                    </div>
                    <p className="text-sm text-gray-700">{feedback}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {/* Transcript */}
          {(isAnalyzing || transcript) && (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center">
                  <FileText size={16} className="text-gray-500 mr-1.5" />
                  Transcript
                </h4>
                <div className="flex space-x-2">
                  {transcript && (
                    <button className="text-xs flex items-center text-blue-600 hover:text-blue-800">
                      <Save size={14} className="mr-1" />
                      Save
                    </button>
                  )}
                </div>
              </div>
              
              {isAnalyzing ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw size={24} className="text-blue-500 animate-spin mr-3" />
                  <span className="text-gray-600">Transcribing audio...</span>
                </div>
              ) : transcript ? (
                <div className="bg-gray-50 p-3 rounded-lg text-gray-700 max-h-48 overflow-y-auto">
                  {transcript}
                </div>
              ) : null}
            </div>
          )}
        </div>
        
        {/* Sentiment Analysis */}
        <div className="space-y-6">
          {sentiment ? (
            <>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <BarChart3 size={16} className="text-blue-600 mr-1.5" />
                  Call Sentiment Analysis
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-500">Sentiment Score</span>
                      <span className={`text-xs font-medium ${
                        sentiment.score > 0.3 ? 'text-green-600' :
                        sentiment.score > -0.3 ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {sentiment.score.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className={`h-2 rounded-full ${
                          sentiment.score > 0.3 ? 'bg-green-500' :
                          sentiment.score > -0.3 ? 'bg-blue-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, (sentiment.score + 1) * 50))}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Negative</span>
                      <span>Neutral</span>
                      <span>Positive</span>
                    </div>
                  </div>
                  
                  {sentiment.emotions.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-gray-700 mb-2">Detected Emotions</h5>
                      <div className="flex flex-wrap gap-2">
                        {sentiment.emotions.map((emotion, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {emotion}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {sentiment.keyPhrases && sentiment.keyPhrases.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-gray-700 mb-2">Key Phrases</h5>
                      <ul className="space-y-1">
                        {sentiment.keyPhrases.map((phrase, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start">
                            <div className="h-4 w-4 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-2 flex-shrink-0 text-xs">
                              {idx+1}
                            </div>
                            "{phrase}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Recommendations</h4>
                <ul className="space-y-2">
                  {sentiment.score < -0.2 && (
                    <li className="text-sm text-gray-700 flex items-start">
                      <AlertCircle size={16} className="text-yellow-600 mr-2 flex-shrink-0" />
                      Consider using more positive language and emphasizing benefits
                    </li>
                  )}
                  <li className="text-sm text-gray-700 flex items-start">
                    <AlertCircle size={16} className="text-blue-600 mr-2 flex-shrink-0" />
                    Follow up with specific points about implementation timeline
                  </li>
                  <li className="text-sm text-gray-700 flex items-start">
                    <AlertCircle size={16} className="text-green-600 mr-2 flex-shrink-0" />
                    Schedule a technical demo to address remaining concerns
                  </li>
                </ul>
              </div>
            </>
          ) : isRecording ? (
            <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100 text-center">
              <Volume2 size={32} className="mx-auto text-indigo-500 mb-4" />
              <div className="space-y-3">
                <div className="text-sm font-medium text-indigo-900">Recording in progress...</div>
                <p className="text-xs text-indigo-700">
                  Real-time analysis will appear here as you speak
                </p>
                
                <div className="flex justify-center space-x-1 pt-2">
                  <div className="w-2 h-8 bg-indigo-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-8 bg-indigo-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-8 bg-indigo-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  <div className="w-2 h-8 bg-indigo-500 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
                  <div className="w-2 h-8 bg-indigo-500 rounded-full animate-pulse" style={{animationDelay: '0.8s'}}></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
              <Mic size={32} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-700">
                Record a call or meeting to get real-time voice analysis
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceAnalysisRealtime;