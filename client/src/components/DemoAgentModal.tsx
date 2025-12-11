import React, { useState, useEffect } from 'react';
import { Dialog } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useOpenAIDemoAgent } from '../hooks/useOpenAIDemoAgent';
import { Mic, StopCircle, UploadCloud, Video, X } from 'lucide-react';

interface DemoAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  autofillProduct?: string;
}

const DemoAgentModal: React.FC<DemoAgentModalProps> = ({ isOpen, onClose, autofillProduct }) => {
  const [productInput, setProductInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState('');
  const [qaFlow, setQaFlow] = useState<string[]>([]);
  const [objections, setObjections] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [objectionInput, setObjectionInput] = useState('');

  const agent = useOpenAIDemoAgent();

  useEffect(() => {
    if (autofillProduct) {
      setProductInput(autofillProduct);
      agent.loadPreviousDemo(autofillProduct).then(history => {
        if (history) {
          setConversationHistory(history);
        }
      });
    }
  }, [autofillProduct, agent]);

  const handleDemo = async () => {
    let input = productInput;
    if (file) {
      const isPDF = file.type === 'application/pdf';
      const isDOCX = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      if (isPDF) input = await agent.extractPDFSummary(file);
      else if (isDOCX) input = await agent.extractDocxSummary(file);
      setProductInput(input);
    }
    if (input.startsWith('http')) {
      const enriched = await agent.enrichFromURL(input);
      input = `${input}\n\n${enriched}`;
    }
    const coAnalyzed = await agent.coAnalyzeContent(input);
    const res = await agent.runAgent(coAnalyzed);
    setResult(res);
    await agent.speakAgent(res);
    await agent.saveDemoToSupabase(input, res);
    const questions = await agent.handleQAFlow(input);
    setQaFlow(questions);
    const recs = await agent.suggestNextSteps(input);
    setRecommendations(recs);
    setConversationHistory([`Agent: ${res}`]);
  };

  const handleRecord = async () => {
    setIsRecording(true);
    const transcribed = await agent.startRecording();
    setProductInput(transcribed);
    setIsRecording(false);
  };

  const handleObjection = async () => {
    if (!objectionInput.trim()) return;
    
    const emotion = await agent.detectEmotion(objectionInput);
    const response = await agent.handleObjections(objectionInput);
    setObjections([...objections, `🙋‍♂️ ${objectionInput} (${emotion})\n🤖 ${response}`]);
    setObjectionInput('');
  };

  const handleFollowUp = async () => {
    if (!userMessage.trim()) return;
    
    const intent = await agent.detectIntent(userMessage);
    const reply = await agent.continueConversation(userMessage, conversationHistory);
    const newHistory = [...conversationHistory, `User: ${userMessage} (${intent})`, `Agent: ${reply}`];
    setConversationHistory(newHistory);
    setUserMessage('');
    await agent.speakAgent(reply);
  };

  const handleExportVideo = async () => {
    setIsExportingVideo(true);
    await agent.exportDemoToVideo(conversationHistory);
    await agent.generateTeaserClip(conversationHistory);
    await agent.generateSlidesWithVoiceOver(conversationHistory);
    await agent.addBrandOverlayToVideo();
    await agent.generateSubtitledVideo();
    await agent.applyBrandedSceneByIndustry();
    await agent.triggerLiveScreenRecordingWithVoice();
    await agent.createTimelineWithSceneEditor(conversationHistory);
    setIsExportingVideo(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="p-6 space-y-4 w-full max-w-lg">
        <h2 className="text-xl font-bold">🎤 Demo Any Product</h2>
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Enter product name or URL..."
            value={productInput}
            onChange={(e) => setProductInput(e.target.value)}
          />
          <Button onClick={handleRecord} variant="ghost" title="Speak product name">
            {isRecording ? <StopCircle className="animate-pulse" /> : <Mic />}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
            onChange={(e) => setFile(e.target.files?.[0] || null)} 
            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <UploadCloud className="text-gray-400" />
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={handleDemo} disabled={!productInput && !file} className="w-full">
            Generate Demo
          </Button>
          <Button onClick={agent.recordLiveWalkthrough} variant="outline">
            🎥 Record Live Walkthrough
          </Button>
          <Button onClick={agent.autoThemeSwitchByCategory} variant="outline">
            🎨 Auto Theme by Product Type
          </Button>
          <Button onClick={agent.openTimelineEditor} variant="outline">
            🎞️ Open Timeline Editor
          </Button>
          <Button onClick={agent.previewDemoTeaser} variant="secondary">
            🎬 Preview Teaser Video
          </Button>
          <Button onClick={agent.scheduleDemoWorkflow} variant="secondary">
            🗓️ Schedule Follow-Up Workflow
          </Button>
        </div>

        {result && (
          <div className="bg-gray-50 p-4 rounded shadow mt-4 space-y-4">
            <h3 className="font-semibold">🧠 AI-Generated Demo:</h3>
            <p className="whitespace-pre-line">{result}</p>
            {qaFlow.length > 0 && (
              <div>
                <h4 className="font-semibold mt-4">🔎 Discovery Questions:</h4>
                <ul className="list-disc pl-6">
                  {qaFlow.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              </div>
            )}
            {recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold mt-4">📌 Recommended Next Steps:</h4>
                <ul className="list-disc pl-6">
                  {recommendations.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
            <div className="mt-4 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter objection (e.g., too expensive)..."
                  value={objectionInput}
                  onChange={(e) => setObjectionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleObjection();
                  }}
                />
                <Button onClick={handleObjection} variant="outline">Handle</Button>
              </div>
              {objections.map((o, i) => (
                <p key={i} className="text-sm whitespace-pre-line">{o}</p>
              ))}
            </div>
            <div className="mt-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask a follow-up question..."
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFollowUp();
                  }}
                />
                <Button onClick={handleFollowUp}>Ask</Button>
              </div>
              <div className="mt-4 space-y-2">
                {conversationHistory.map((msg, i) => (
                  <p key={i} className="text-sm whitespace-pre-line">{msg}</p>
                ))}
              </div>
              <Button onClick={handleExportVideo} className="mt-4 w-full" disabled={isExportingVideo}>
                {isExportingVideo ? 'Exporting Demo...' : <><Video className="inline mr-2" /> Export Demo as Video</>}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default DemoAgentModal;