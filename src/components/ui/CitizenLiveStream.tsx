import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radio, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Users, 
  Sparkles, 
  Check, 
  X, 
  MessageSquare, 
  Send, 
  Signal, 
  Info,
  Clock,
  ShieldCheck,
  Award,
  Play,
  Pause,
  Download,
  RotateCcw,
  Film,
  Camera,
  Share2,
  Tv
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface CitizenLiveStreamProps {
  groupId: string;
  groupName: string;
  wardName: string;
  leaderName: string;
  isLeader: boolean;
  onClose?: () => void;
}

interface ChatMessage {
  id: string;
  senderName: string;
  text: string;
  timestamp: string;
  isLeader?: boolean;
}

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
}

export default function CitizenLiveStream({
  groupId,
  groupName,
  wardName,
  leaderName,
  isLeader,
  onClose
}: CitizenLiveStreamProps) {
  const { user } = useAuth();

  // Mode: 'live_stream' (broadcasting/viewing live) or 'recorded_review' (viewing recorded video)
  const [viewMode, setViewMode] = useState<'live_stream' | 'recorded_review'>('live_stream');
  
  // Camera Source: 'assembly_sim' (live assembly chamber floor video) or 'webcam' (user camera)
  const [cameraSource, setCameraSource] = useState<'assembly_sim' | 'webcam'>('assembly_sim');

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedBlobSize, setRecordedBlobSize] = useState<string>('');
  const [recordSuccessNotice, setRecordSuccessNotice] = useState<string | null>(null);

  // Live Stream State
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVolumeMuted, setIsVolumeMuted] = useState(true);
  const [streamQuality, setStreamQuality] = useState<'1080p' | '720p' | '360p'>('1080p');
  const [selectedFeedAngle, setSelectedFeedAngle] = useState<'podium' | 'floor' | 'resolutions'>('podium');

  // Elapsed Live Broadcast Time
  const [elapsedSeconds, setElapsedSeconds] = useState(1530); // ~25 mins in
  const [viewerCount, setViewerCount] = useState(48);

  // Audio simulation level
  const [audioLevel, setAudioLevel] = useState(65);

  // Active Transcript Ticker
  const transcripts = [
    `Hon. ${leaderName || 'Convener'}: "Wananchi wamekutana kurekodi maazimio ya kilimo endelevu na ulinzi wa ardhi kwa ajili ya National Citizen Assembly ya Dec 10."`,
    `Delegate (Sikhendu): "Hatua ya kwanza ni kuhakikisha fedha za CDF na Ward Development Fund zinasaidia miradi ya maji ya kijiji badala ya miradi hewa."`,
    `Mama Mboga Representative: "Kodi ndogo ndogo masokoni zisitishwe na usalama wa soko uimarishwe."`,
    `Youth Representative: "Bunge hili la wananchi ndiyo njia pekee ya sauti yetu kusikika kabla ya mkutano mkuu wa kitaifa."`,
    `Assembly Clerk: "Azimio nambari 04 limepitishwa kwa kauli moja na wajumbe wote 42 waliohudhuria."`
  ];
  const [transcriptIndex, setTranscriptIndex] = useState(0);

  // Chat and Reactions
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      senderName: leaderName || 'Assembly Convener',
      text: `Karibuni kwenye kikao rasmi cha wananchi cha ${groupName || wardName}. Video ya proceedings inarekodiwa na kurushwa mubashara sasa.`,
      timestamp: '10:04 AM',
      isLeader: true
    },
    {
      id: 'm2',
      senderName: 'Citizen Delegate (Sibembe)',
      text: `Tunaunga mkono azimio la kusitisha matumizi ya mbolea za kemikali zinazoharibu udongo na kuwekeza kwenye mbegu asili.`,
      timestamp: '10:09 AM'
    },
    {
      id: 'm3',
      senderName: 'Youth Representative',
      text: `Maazimio yote yanayopitishwa hapa yatawasilishwa moja kwa moja kwenye National Citizen Assembly Summit mnamo 10 Desemba 2026.`,
      timestamp: '10:14 AM'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [reactionsCount, setReactionsCount] = useState<Record<string, number>>({
    '👏': 72,
    '✊': 56,
    '🌾': 89,
    '📢': 44,
    '❤️': 97
  });

  // Media Refs
  const mainVideoRef = useRef<HTMLVideoElement | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasStreamRef = useRef<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Initialize Canvas Live Video Stream (Generates a real, high-resolution 1280x720 video stream)
  useEffect(() => {
    const canvas = hiddenCanvasRef.current;
    if (!canvas) return;

    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;

    const renderFrame = () => {
      frameCount++;
      const timeStr = new Date().toLocaleTimeString('en-GB');

      // 1. Draw Assembly Chamber Background (Deep navy/gradient with mahogany accents)
      const grad = ctx.createLinearGradient(0, 0, 1280, 720);
      grad.addColorStop(0, '#020617'); // slate-950
      grad.addColorStop(0.5, '#0b192c'); // deep assembly blue
      grad.addColorStop(1, '#051923');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);

      // Subtle architectural grid & chamber lights
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 1280; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 720);
        ctx.stroke();
      }
      for (let y = 0; y < 720; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1280, y);
        ctx.stroke();
      }

      // 2. Chamber Stage & Podium Architecture
      // Top Kenyan Flag Accent Stripe
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, 1280 / 3, 10);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(1280 / 3, 0, 1280 / 3, 10);
      ctx.fillStyle = '#059669';
      ctx.fillRect((1280 / 3) * 2, 0, 1280 / 3, 10);

      // Podium / Assembly Table
      const podiumGrad = ctx.createLinearGradient(440, 480, 840, 720);
      podiumGrad.addColorStop(0, '#451a03'); // mahogany wood
      podiumGrad.addColorStop(1, '#1c1917');
      ctx.fillStyle = podiumGrad;
      ctx.beginPath();
      ctx.moveTo(420, 720);
      ctx.lineTo(470, 460);
      ctx.lineTo(810, 460);
      ctx.lineTo(860, 720);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Official CSRG / Citizen Assembly Seal on Podium
      ctx.beginPath();
      ctx.arc(640, 560, 44, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CSRG KENYA', 640, 555);
      ctx.font = '9px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('WANANCHI ASSEMBLY', 640, 572);

      // 3. Speaker / Convener Dynamic Deliberation Figure
      // Dynamic head & body animation
      const headBob = Math.sin(frameCount * 0.08) * 4;
      const armGesture = Math.cos(frameCount * 0.06) * 8;

      // Speaker Torso
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(560, 460);
      ctx.lineTo(600, 320);
      ctx.lineTo(680, 320);
      ctx.lineTo(720, 460);
      ctx.closePath();
      ctx.fill();

      // Speaker Collar & Lapel
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(632, 320);
      ctx.lineTo(640, 390);
      ctx.lineTo(648, 320);
      ctx.closePath();
      ctx.fill();

      // Speaker Head
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(640, 270 + headBob, 38, 0, Math.PI * 2);
      ctx.fill();

      // Speaker Hair / Glasses
      ctx.fillStyle = '#171717';
      ctx.beginPath();
      ctx.arc(640, 255 + headBob, 40, Math.PI, 0);
      ctx.fill();

      // Podium Gooseneck Microphones
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(530, 460);
      ctx.quadraticCurveTo(560, 410, 600, 370);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(600, 370, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();

      // 4. Multi-Camera Feed Elements
      if (selectedFeedAngle === 'floor') {
        // Floor Delegates overlay
        ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
        ctx.fillRect(80, 100, 320, 220);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(80, 100, 320, 220);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('CAM 02: ASSEMBLED DELEGATES', 96, 126);

        // Simple delegate silhouettes
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.arc(120 + i * 55, 230, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(104 + i * 55, 246, 32, 50);
        }
      } else if (selectedFeedAngle === 'resolutions') {
        // Resolutions Document Screen overlay
        ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
        ctx.fillRect(80, 90, 420, 260);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.strokeRect(80, 90, 420, 260);

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('OFFICIAL RESOLUTION DRAFT - DEC 10 SUMMIT', 96, 120);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '11px sans-serif';
        ctx.fillText('1. Protection of Indigenous Native Seeds & Zero Synthetic Agrochemicals', 96, 150);
        ctx.fillText('2. Allocation of 15% County Agriculture Budget to Agroecology Hubs', 96, 175);
        ctx.fillText('3. Immediate Desilting & Solar Pumping for Village Water Dams', 96, 200);
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('STATUS: UNANIMOUSLY PASSED BY 48 ASSEMBLED WANANCHI', 96, 235);
      }

      // 5. Soundwave Visualizer on Screen
      ctx.fillStyle = '#10b981';
      for (let i = 0; i < 24; i++) {
        const waveH = Math.sin(frameCount * 0.15 + i * 0.5) * 16 + 20;
        ctx.fillRect(520 + i * 10, 430 - waveH / 2, 6, waveH);
      }

      // 6. Top Left Live Broadcast Watermark
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(40, 40, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('LIVE VIDEO PROCEEDINGS', 58, 46);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`${timeStr} EAT • 1080p HD`, 58, 64);

      // 7. Lower Third Broadcast Banner
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.fillRect(50, 620, 1180, 75);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(50, 620, 1180, 75);

      // Lower Third Left Pill
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(50, 620, 16, 75);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('NATIONAL CITIZEN ASSEMBLY • MINI-CAUCUS DELIBERATION FLOOR', 80, 644);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`Presiding Convener: ${leaderName || 'Hon. Assembly Convener'} • ${groupName} (${wardName} Ward)`, 80, 672);

      animationFrameRef.current = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    // Capture the dynamic canvas stream as an actual HTML5 MediaStream
    try {
      const stream = canvas.captureStream(30);
      canvasStreamRef.current = stream;

      if (mainVideoRef.current && cameraSource === 'assembly_sim' && viewMode === 'live_stream') {
        mainVideoRef.current.srcObject = stream;
        mainVideoRef.current.play().catch(() => {});
      }
    } catch (e) {
      console.warn('Canvas captureStream error:', e);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [leaderName, groupName, wardName, selectedFeedAngle, cameraSource, viewMode]);

  // Timers: elapsed time, recording time, transcripts
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
      if (isRecording) {
        setRecordingSeconds(prev => prev + 1);
      }
      if (Math.random() > 0.6) {
        setViewerCount(prev => prev + (Math.random() > 0.5 ? 1 : -1));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

  useEffect(() => {
    const tTimer = setInterval(() => {
      setTranscriptIndex(prev => (prev + 1) % transcripts.length);
    }, 6500);
    return () => clearInterval(tTimer);
  }, [transcripts.length]);

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      stopWebcamStream();
    };
  }, []);

  const stopWebcamStream = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach(track => track.stop());
      webcamStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // =========================================================================
  // CORE FEATURE: START RECORDING & STREAM LIVE PROCEEDINGS
  // =========================================================================
  const handleStartRecording = async (useWebcam: boolean = false) => {
    try {
      recordedChunksRef.current = [];
      setRecordingSeconds(0);
      setRecordSuccessNotice(null);

      let targetStream: MediaStream | null = null;

      if (useWebcam) {
        // Request actual camera & microphone
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true
        });
        webcamStreamRef.current = stream;
        targetStream = stream;
        setCameraSource('webcam');
        setIsCameraActive(true);

        if (mainVideoRef.current) {
          mainVideoRef.current.srcObject = stream;
          mainVideoRef.current.play().catch(() => {});
        }
      } else {
        // Record active assembly video stream
        targetStream = canvasStreamRef.current;
        if (!targetStream && hiddenCanvasRef.current) {
          targetStream = hiddenCanvasRef.current.captureStream(30);
          canvasStreamRef.current = targetStream;
        }
        setCameraSource('assembly_sim');

        if (mainVideoRef.current && targetStream) {
          mainVideoRef.current.srcObject = targetStream;
          mainVideoRef.current.play().catch(() => {});
        }
      }

      if (!targetStream) {
        alert('Could not initialize video stream for recording.');
        return;
      }

      // Initialize browser MediaRecorder
      let mimeType = 'video/webm';
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        mimeType = 'video/webm;codecs=vp9';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      }

      const recorder = new MediaRecorder(targetStream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        const sizeMb = (blob.size / (1024 * 1024)).toFixed(2);
        setRecordedBlobSize(`${sizeMb} MB`);
        setIsRecording(false);
        setViewMode('recorded_review');

        // Automatically point the main video to the newly recorded video file
        if (mainVideoRef.current) {
          mainVideoRef.current.srcObject = null;
          mainVideoRef.current.src = url;
          mainVideoRef.current.controls = true;
          mainVideoRef.current.play().catch(() => {});
        }

        setRecordSuccessNotice(`Recording finalized! ${sizeMb} MB proceedings video ready to watch and save.`);
      };

      recorder.start(1000); // 1-second chunks
      setIsRecording(true);
      setViewMode('live_stream');

      // Post notification to live deliberation room
      const speaker = user?.name || (isLeader ? `${leaderName} (Leader)` : 'Convener');
      setMessages(prev => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          senderName: 'Recording Engine',
          text: `🔴 ${speaker} started recording the live proceedings. All wananchi can now watch the active video on site.`,
          timestamp: 'Just Now',
          isLeader: true
        }
      ]);
    } catch (err: any) {
      console.warn('Could not start video recording with camera:', err);
      // Fallback: If webcam denied, record the live assembly chamber video feed instead
      if (useWebcam) {
        handleStartRecording(false);
      }
    }
  };

  // Stop Recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Return to Live Stream View
  const handleReturnToLive = () => {
    setViewMode('live_stream');
    setRecordSuccessNotice(null);
    if (mainVideoRef.current) {
      mainVideoRef.current.src = '';
      mainVideoRef.current.controls = false;
      const stream = cameraSource === 'webcam' && webcamStreamRef.current ? webcamStreamRef.current : canvasStreamRef.current;
      if (stream) {
        mainVideoRef.current.srcObject = stream;
        mainVideoRef.current.play().catch(() => {});
      }
    }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? `${h.toString().padStart(2, '0')}:` : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Send Reaction
  const handleReaction = (emoji: string) => {
    setReactionsCount(prev => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + 1
    }));
    const id = Date.now() + Math.random();
    const x = Math.floor(Math.random() * 80) + 10;
    setFloatingEmojis(prev => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(item => item.id !== id));
    }, 2200);
  };

  // Send Chat message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const sender = user?.name || (isLeader ? `${leaderName || 'Irene Nyongesa'} (Leader)` : 'Wananchi Citizen');
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderName: sender,
      text: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLeader: isLeader || sender.includes('Leader') || sender.includes('Nyongesa')
    };

    setMessages(prev => [...prev, newMsg]);
    setInputMessage('');
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const streamContent = (
    <div className="relative w-full max-w-5xl bg-stone-950 text-white rounded-3xl border border-stone-800 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col font-sans">
      
      {/* Hidden 1280x720 Canvas Generator for the Live Assembly Video Stream */}
      <canvas ref={hiddenCanvasRef} className="hidden" />

      {/* Top Stream Header */}
      <div className="bg-gradient-to-r from-stone-900 via-sky-950 to-stone-900 p-3.5 sm:p-4 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md shadow-red-900/50">
            <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-amber-300 animate-ping' : 'bg-white animate-pulse'}`} />
            <span>{isRecording ? '🔴 RECORDING LIVE VIDEO' : '🔴 LIVE PROCEEDINGS'}</span>
          </div>

          <div>
            <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <span>{groupName}</span>
              <span className="text-sky-300 text-xs font-medium">• {wardName}</span>
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
              <span className="text-amber-300 font-semibold">2-Hour Mini-Caucus Deliberations</span>
              <span>•</span>
              <span>Time Elapsed: <strong className="text-white">{formatTime(elapsedSeconds)}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="bg-stone-800/90 px-3 py-1.5 rounded-xl border border-stone-700/60 flex items-center gap-1.5 text-xs font-bold text-stone-200">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>{viewerCount} Citizens Streaming Live</span>
          </div>

          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
              title="Close Stream (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* SUCCESS / RECORDING NOTIFICATION STRIP */}
      {recordSuccessNotice && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/40 p-2.5 px-4 text-xs font-bold text-emerald-200 flex items-center justify-between gap-2 shrink-0">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{recordSuccessNotice}</span>
          </span>
          <div className="flex items-center gap-2">
            {recordedVideoUrl && (
              <a 
                href={recordedVideoUrl} 
                download={`${groupName.replace(/\s+/g, '-')}-Proceedings-Recording.webm`}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs font-black inline-flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> Download Video
              </a>
            )}
            <button 
              onClick={() => setRecordSuccessNotice(null)} 
              className="text-stone-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Streaming Stage & Deliberation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 min-h-[460px] max-h-[600px] overflow-hidden">
        
        {/* Left Column: Live Video Player & Controls (8 Cols) */}
        <div className="lg:col-span-8 bg-black flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-stone-800">
          
          {/* Floating Emoji Layer */}
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
            {floatingEmojis.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 1, y: 340, x: `${item.x}%`, scale: 0.8 }}
                animate={{ opacity: 0, y: 20, scale: 1.6 }}
                transition={{ duration: 2.1, ease: 'easeOut' }}
                className="absolute text-3xl select-none"
              >
                {item.emoji}
              </motion.div>
            ))}
          </div>

          {/* REAL VIDEO ELEMENT CONTAINER (Plays the live proceedings video or recorded video) */}
          <div className="w-full flex-1 relative bg-stone-950 flex items-center justify-center overflow-hidden min-h-[340px]">
            <video 
              ref={mainVideoRef} 
              autoPlay 
              playsInline 
              muted={isVolumeMuted}
              className="w-full h-full object-cover max-h-[520px]"
            />

            {/* In-Video Recording Overlay Badge */}
            {isRecording && (
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-red-600/95 text-white px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <span>REC PROCEEDINGS: {formatTime(recordingSeconds)}</span>
              </div>
            )}

            {/* In-Video Live Watermark for viewers */}
            {!isRecording && viewMode === 'live_stream' && (
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-xl text-xs font-bold border border-white/10">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>LIVE VIDEO PROCEEDINGS • {streamQuality}</span>
              </div>
            )}

            {/* In-Video Recorded Review Notice */}
            {viewMode === 'recorded_review' && (
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-amber-500 text-stone-950 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg">
                <Film className="w-4 h-4" />
                <span>REVIEWING RECORDED VIDEO ({recordedBlobSize})</span>
              </div>
            )}
          </div>

          {/* Dynamic Lower Third / Live Transcript Strip */}
          <div className="bg-stone-900/90 border-t border-stone-800 p-2.5 px-4 flex items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="bg-sky-500/20 text-sky-400 font-bold px-2 py-0.5 rounded text-[10px] uppercase shrink-0">
                Live Subtitles
              </span>
              <p className="text-stone-300 font-medium truncate">
                {transcripts[transcriptIndex]}
              </p>
            </div>
            <span className="text-[10px] text-amber-300 font-bold shrink-0 hidden sm:inline">
              Dec 10 National Assembly Minutes
            </span>
          </div>

          {/* PRIMARY VIDEO RECORDING & STREAM CONTROL BAR */}
          <div className="bg-stone-900 p-3 sm:p-4 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3 z-20 shrink-0">
            
            {/* Left Controls: Recording Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {isRecording ? (
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg transition-all cursor-pointer animate-pulse"
                  title="Stop recording and prepare the video"
                >
                  <span className="w-2.5 h-2.5 bg-white rounded-xs" />
                  <span>Stop Recording ({formatTime(recordingSeconds)})</span>
                </button>
              ) : viewMode === 'recorded_review' ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReturnToLive}
                    className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Return to Live Stream</span>
                  </button>
                  {recordedVideoUrl && (
                    <a
                      href={recordedVideoUrl}
                      download={`${groupName.replace(/\s+/g, '-')}-Caucus-Recording.webm`}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Video ({recordedBlobSize})</span>
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {/* BUTTON 1: Record & Stream Live Camera */}
                  <button
                    type="button"
                    onClick={() => handleStartRecording(true)}
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-black px-4 py-2 rounded-xl text-xs shadow-lg transition-transform hover:scale-105 cursor-pointer"
                    title="Turn on camera and record live proceedings"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Record Camera & Stream Live</span>
                  </button>

                  {/* BUTTON 2: Record Live Proceedings Video Feed */}
                  <button
                    type="button"
                    onClick={() => handleStartRecording(false)}
                    className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black px-3.5 py-2 rounded-xl text-xs shadow-md transition-transform hover:scale-105 cursor-pointer"
                    title="Record the active citizen assembly floor proceedings"
                  >
                    <Film className="w-4 h-4" />
                    <span>Record Assembly Floor</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right Controls: Camera Angle & Audio Mute */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setIsVolumeMuted(!isVolumeMuted)}
                className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                title={isVolumeMuted ? 'Unmute Live Audio' : 'Mute Audio'}
              >
                {isVolumeMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                <span className="text-[11px] font-bold hidden sm:inline">{isVolumeMuted ? 'Unmute' : 'Audio On'}</span>
              </button>

              {/* Feed angle switcher for assembly camera */}
              <div className="flex items-center bg-stone-800/80 rounded-xl p-0.5 border border-stone-700">
                <button
                  type="button"
                  onClick={() => setSelectedFeedAngle('podium')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    selectedFeedAngle === 'podium' ? 'bg-sky-600 text-white shadow-xs' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Podium
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFeedAngle('floor')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    selectedFeedAngle === 'floor' ? 'bg-sky-600 text-white shadow-xs' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Delegates
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFeedAngle('resolutions')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    selectedFeedAngle === 'resolutions' ? 'bg-sky-600 text-white shadow-xs' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Resolutions
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Reactions & Citizen Floor Deliberations Chat (4 Cols) */}
        <div className="lg:col-span-4 bg-stone-900 flex flex-col justify-between h-full border-t lg:border-t-0">
          
          {/* Reaction Bar */}
          <div className="p-2.5 border-b border-stone-800 bg-stone-900/80 flex items-center justify-between gap-1 overflow-x-auto shrink-0">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0 mr-1">
              Reactions:
            </span>
            {(['👏', '✊', '🌾', '📢', '❤️'] as const).map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReaction(emoji)}
                className="inline-flex items-center gap-1 bg-stone-800 hover:bg-stone-700 hover:scale-110 active:scale-95 px-2 py-1 rounded-lg text-xs transition-all cursor-pointer shadow-xs"
              >
                <span>{emoji}</span>
                <span className="text-[10px] font-bold text-stone-300">{reactionsCount[emoji] || 0}</span>
              </button>
            ))}
          </div>

          {/* Chat Messages Feed */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 text-xs">
            <div className="bg-sky-950/40 p-2.5 rounded-xl border border-sky-800/40 text-[11px] text-sky-200 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
              <span>
                <strong>Official Floor Minutes:</strong> Statements and recorded video here are compiled directly for the December 10 National Assembly Summit.
              </span>
            </div>

            {messages.map(msg => (
              <div 
                key={msg.id} 
                className={`p-2.5 rounded-2xl border ${
                  msg.isLeader 
                    ? 'bg-amber-400/10 border-amber-400/30 text-amber-100' 
                    : 'bg-stone-800/60 border-stone-700/50 text-stone-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`font-bold flex items-center gap-1 ${msg.isLeader ? 'text-amber-300' : 'text-stone-300'}`}>
                    {msg.senderName}
                    {msg.isLeader && (
                      <span className="bg-amber-400 text-stone-950 text-[9px] font-black px-1.5 py-0.2 rounded-md">
                        LEADER
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-stone-500">{msg.timestamp}</span>
                </div>
                <p className="text-xs leading-relaxed text-stone-300">{msg.text}</p>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-2.5 border-t border-stone-800 bg-stone-900/95 flex gap-2 shrink-0">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Join deliberation / submit point..."
              className="flex-1 bg-stone-800 border border-stone-700 px-3 py-2 rounded-xl text-xs text-white placeholder-stone-500 focus:ring-1 focus:ring-amber-400 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-black p-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
              title="Submit Point to Assembly Floor"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  if (onClose) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-stone-950/85 backdrop-blur-md overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {streamContent}
      </div>
    );
  }

  return streamContent;
}
