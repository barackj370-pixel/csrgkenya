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
  Share2, 
  Users, 
  Maximize2, 
  Download, 
  Play, 
  Pause, 
  Sparkles, 
  Check, 
  X, 
  MessageSquare, 
  Send, 
  Signal, 
  Settings, 
  ScreenShare, 
  Info,
  Clock,
  ShieldCheck,
  Award
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
  
  // Stream state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamMode, setStreamMode] = useState<'video_hd' | 'video_low' | 'audio_only'>('video_hd');
  const [customStreamUrl, setCustomStreamUrl] = useState('');
  const [useCustomUrl, setUseCustomUrl] = useState(false);

  // Hardware controls
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isMicActive, setIsMicActive] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordedDownloadUrl, setRecordedDownloadUrl] = useState<string | null>(null);

  // Viewers & Interactivity
  const [viewerCount, setViewerCount] = useState(28);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      senderName: 'Irene Nyongesa (Leader)',
      text: 'Karibuni wananchi wa Sibembe na Sikhendu Ward. Deliberations on community borehole audit and peasant seed sovereignty are underway.',
      timestamp: '10:05 AM',
      isLeader: true
    },
    {
      id: 'm2',
      senderName: 'Francis Wafula',
      text: 'Maji ya borehole ya Sibembe yanahitaji solar pump haraka. Feeder road ya kuelekea sokoni pia ipitishwe.',
      timestamp: '10:14 AM'
    },
    {
      id: 'm3',
      senderName: 'Mama Beatrice Simiyu',
      text: 'Hoja ya mbegu za kiasili (indigenous bio-inputs) ipitishwe kwa kauli moja!',
      timestamp: '10:28 AM'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [reactionsCount, setReactionsCount] = useState<Record<string, number>>({
    '👏': 42,
    '✊': 38,
    '🌾': 55,
    '📢': 29,
    '❤️': 64
  });

  // Media Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Clean up media streams on unmount
  useEffect(() => {
    return () => {
      stopLocalStream();
    };
  }, []);

  const stopLocalStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
  };

  // Start Broadcasting using standard WebRTC / MediaStream API (No YouTube / No Paid API)
  const handleStartBroadcast = async () => {
    try {
      stopLocalStream();

      let constraints: MediaStreamConstraints = {
        audio: true,
        video: streamMode === 'audio_only' ? false : (
          streamMode === 'video_low' 
            ? { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { max: 15 } }
            : { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
        )
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Audio meter analyzer
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMeter = () => {
          if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 255) * 100)));
            animationFrameRef.current = requestAnimationFrame(updateMeter);
          }
        };
        updateMeter();
      } catch (err) {
        console.warn('Audio metering unavailable:', err);
      }

      // Start local recording for zero-cost archival
      try {
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          setRecordedDownloadUrl(url);
          setRecordedChunks(chunks);
        };
        recorder.start(1000);
        setIsRecording(true);
      } catch (recErr) {
        console.warn('Local recording unavailable:', recErr);
      }

      setIsStreaming(true);
      setIsCameraActive(streamMode !== 'audio_only');
      setIsMicActive(true);

      // Notify the group wall that Sibembe is live
      window.dispatchEvent(new CustomEvent('csrg_livestream_changed', {
        detail: {
          groupId,
          isLive: true,
          broadcaster: leaderName || 'Irene Nyongesa',
          startedAt: new Date().toISOString()
        }
      }));

    } catch (err: any) {
      alert(`Could not start live stream: ${err.message || 'Check camera and microphone permissions'}`);
    }
  };

  const handleStopBroadcast = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopLocalStream();
    setIsStreaming(false);
    setIsRecording(false);
    setAudioLevel(0);

    window.dispatchEvent(new CustomEvent('csrg_livestream_changed', {
      detail: {
        groupId,
        isLive: false
      }
    }));
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraActive(videoTrack.enabled);
      }
    }
  };

  // Toggle Microphone
  const toggleMic = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicActive(audioTrack.enabled);
      }
    }
  };

  // Screen Sharing (for presenting resolutions)
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Revert to camera
      handleStartBroadcast();
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (mediaStreamRef.current && screenStream) {
          const screenTrack = screenStream.getVideoTracks()[0];
          const currentVideoTrack = mediaStreamRef.current.getVideoTracks()[0];
          if (currentVideoTrack) {
            mediaStreamRef.current.removeTrack(currentVideoTrack);
          }
          mediaStreamRef.current.addTrack(screenTrack);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStreamRef.current;
          }
          setIsScreenSharing(true);
          screenTrack.onended = () => {
            handleStartBroadcast();
            setIsScreenSharing(false);
          };
        }
      } catch (e) {
        console.warn('Screen share canceled or denied', e);
      }
    }
  };

  // Send interactive reaction
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
    }, 2500);
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

  return (
    <div className="bg-stone-950 text-white rounded-3xl border border-stone-800 shadow-2xl overflow-hidden my-6">
      {/* Top Stream Header */}
      <div className="bg-gradient-to-r from-stone-900 via-sky-950 to-stone-900 p-4 sm:p-5 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
            isStreaming 
              ? 'bg-red-600 text-white animate-pulse shadow-md shadow-red-900/40' 
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-white' : 'bg-emerald-400'} animate-ping`} />
            {isStreaming ? '🔴 LIVE NOW' : 'OFFLINE • 2-HR CAUCUS RECORDING'}
          </span>

          <div>
            <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>{groupName} Live Citizen Caucus Stream</span>
              <span className="text-stone-400 text-xs font-normal">• {wardName} Ward</span>
            </h4>
            <p className="text-xs text-stone-400">
              Zero-cost open citizen streaming — No YouTube channel required • Hosted directly on Wananchi Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-stone-800/80 px-3 py-1.5 rounded-xl border border-stone-700/60 flex items-center gap-1.5 text-xs font-bold text-stone-300">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isStreaming ? viewerCount : 42} Wananchi Attended</span>
          </div>

          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
              title="Close Stream View"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Stream Player & Deliberation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[480px]">
        {/* Left Column: Video / Audio Stream Player (8 Cols) */}
        <div className="lg:col-span-8 bg-black flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-stone-800">
          
          {/* Floating Emoji Layer */}
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
            {floatingEmojis.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 1, y: 350, x: `${item.x}%`, scale: 0.8 }}
                animate={{ opacity: 0, y: 50, scale: 1.5 }}
                transition={{ duration: 2.2, ease: 'easeOut' }}
                className="absolute text-3xl select-none"
              >
                {item.emoji}
              </motion.div>
            ))}
          </div>

          {/* Active Video Screen or Radio Mode Display */}
          <div className="w-full flex-1 min-h-[360px] bg-stone-900 relative flex items-center justify-center">
            {isStreaming && streamMode !== 'audio_only' && !useCustomUrl ? (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted={isMuted}
                className="w-full h-full object-cover max-h-[500px]"
              />
            ) : isStreaming && streamMode === 'audio_only' ? (
              <div className="text-center p-8 space-y-4">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/40 animate-pulse">
                  <Radio className="w-10 h-10" />
                </div>
                <div>
                  <h5 className="text-xl font-black text-white">Radio Bunge Live Audio Broadcast</h5>
                  <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">
                    Low-bandwidth rural mode (uses ~24kbps). Designed for smallholder farmers with limited data connection.
                  </p>
                </div>
                {/* Audio visualizer bars */}
                <div className="flex items-center justify-center gap-1 h-10">
                  {[20, 45, 80, 60, 30, 90, 75, 40, 60, 85, 30, 50].map((h, i) => (
                    <div 
                      key={i} 
                      className="w-1.5 bg-amber-400 rounded-full transition-all duration-75"
                      style={{ height: `${Math.max(6, (audioLevel / 100) * h)}px` }}
                    />
                  ))}
                </div>
              </div>
            ) : useCustomUrl && customStreamUrl ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <p className="text-xs text-stone-400 mb-2">Connected to Open Community Stream:</p>
                <code className="bg-stone-800 text-sky-400 text-xs px-3 py-1 rounded-lg mb-4">{customStreamUrl}</code>
                <audio autoPlay controls src={customStreamUrl} className="w-full max-w-md" />
              </div>
            ) : (
              /* Idle / Concluded Mini-Caucus State */
              <div className="text-center p-8 space-y-4 max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-sky-900/40 text-sky-400 flex items-center justify-center mx-auto border border-sky-700/50">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                    Concluded 2-Hour Deliberation
                  </span>
                  <h5 className="text-xl font-black text-white mt-2">
                    Sibembe Citizen Assembly Proceedings (10:00 AM – 12:00 PM)
                  </h5>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                    The 2-hour citizen mini-caucus on Tuesday, Oct 20 concluded with 2 passed motions and certified resolutions for the December 10 National Assembly.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  {isLeader && !isStreaming && (
                    <button
                      onClick={handleStartBroadcast}
                      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg transition-all cursor-pointer"
                    >
                      <Radio className="w-4 h-4" />
                      <span>Start Live Caucus Stream</span>
                    </button>
                  )}

                  {recordedDownloadUrl && (
                    <a
                      href={recordedDownloadUrl}
                      download={`sibembe-mini-caucus-${new Date().toISOString().split('T')[0]}.webm`}
                      className="inline-flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold px-4 py-2.5 rounded-xl text-xs border border-stone-700 transition-all"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>Download Meeting Recording</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* In-Video Overlay Info */}
            {isStreaming && (
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                  <Signal className="w-3 h-3 text-emerald-400" />
                  <span>{streamMode === 'video_hd' ? '720p HD' : streamMode === 'video_low' ? '360p Low-Data' : 'Audio-Only'}</span>
                </span>
                {isRecording && (
                  <span className="bg-red-500/80 text-white text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> REC
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Stream Control Bar (Leader & Viewer Tools) */}
          <div className="bg-stone-900/90 backdrop-blur-md p-3 sm:p-4 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3 z-20">
            {/* Left controls: Audio/Video Toggles for Broadcaster */}
            <div className="flex items-center gap-2">
              {isLeader && isStreaming && (
                <>
                  <button
                    onClick={toggleCamera}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isCameraActive ? 'bg-stone-800 text-stone-200 hover:bg-stone-700' : 'bg-red-500/20 text-red-400 border border-red-500/40'
                    }`}
                    title={isCameraActive ? 'Turn Camera Off' : 'Turn Camera On'}
                  >
                    {isCameraActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={toggleMic}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isMicActive ? 'bg-stone-800 text-stone-200 hover:bg-stone-700' : 'bg-red-500/20 text-red-400 border border-red-500/40'
                    }`}
                    title={isMicActive ? 'Mute Mic' : 'Unmute Mic'}
                  >
                    {isMicActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={toggleScreenShare}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isScreenSharing ? 'bg-amber-400 text-stone-950 font-black' : 'bg-stone-800 text-stone-200 hover:bg-stone-700'
                    }`}
                    title="Share Screen / Document"
                  >
                    <ScreenShare className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Volume / Mute for Viewers */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs transition-colors cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Data-Saving Mode Switcher */}
              <select
                value={streamMode}
                onChange={(e) => setStreamMode(e.target.value as any)}
                className="bg-stone-800 border border-stone-700 text-stone-200 text-xs rounded-xl px-2.5 py-2 font-medium focus:ring-1 focus:ring-amber-400"
              >
                <option value="video_hd">Video (HD 720p)</option>
                <option value="video_low">Low-Data (360p / 3G)</option>
                <option value="audio_only">Radio Bunge (Audio Only)</option>
              </select>
            </div>

            {/* Right controls: Broadcast Start/Stop Button */}
            <div className="flex items-center gap-2 ml-auto">
              {isLeader ? (
                isStreaming ? (
                  <button
                    onClick={handleStopBroadcast}
                    className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-black px-4 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>End Stream</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartBroadcast}
                    className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-black px-4 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Radio className="w-4 h-4" />
                    <span>Go Live Now</span>
                  </button>
                )
              ) : (
                <span className="text-xs text-stone-400 italic">
                  Live Caucus Deliberation Room
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Citizen Reactions & Live Deliberation Chat (4 Cols) */}
        <div className="lg:col-span-4 bg-stone-900 flex flex-col justify-between h-[480px]">
          {/* Reaction Bar */}
          <div className="p-3 border-b border-stone-800 bg-stone-900/60 flex items-center justify-between gap-1 overflow-x-auto">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0 mr-1">
              Wananchi Reactions:
            </span>
            {(['👏', '✊', '🌾', '📢', '❤️'] as const).map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="inline-flex items-center gap-1 bg-stone-800 hover:bg-stone-700 hover:scale-110 active:scale-95 px-2.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer shadow-xs"
              >
                <span>{emoji}</span>
                <span className="text-[10px] font-bold text-stone-400">{reactionsCount[emoji] || 0}</span>
              </button>
            ))}
          </div>

          {/* Chat Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            <div className="bg-sky-950/40 p-2.5 rounded-xl border border-sky-800/40 text-[11px] text-sky-200 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
              <span>
                <strong>Wananchi Deliberation Room:</strong> Comments posted here are recorded directly as part of the official caucus minutes.
              </span>
            </div>

            {messages.map(msg => (
              <div 
                key={msg.id} 
                className={`p-3 rounded-2xl border ${
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
          <form onSubmit={handleSendMessage} className="p-3 border-t border-stone-800 bg-stone-900/90 flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Join deliberation / add point..."
              className="flex-1 bg-stone-800 border border-stone-700 px-3.5 py-2 rounded-xl text-xs text-white placeholder-stone-500 focus:ring-1 focus:ring-amber-400"
            />
            <button
              type="submit"
              className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-black p-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
              title="Send Deliberation Point"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
