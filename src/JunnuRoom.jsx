import { useEffect, useRef, useState } from "react";
import { SelfieSegmentation } from "@mediapipe/selfie_segmentation";
import { Camera, ChevronDown, CircleEllipsis, Hand, LayoutPanelTop, Mic, MonitorUp, PhoneOff, SmilePlus, UsersRound, MessageCircle } from "lucide-react";
import { applyBoardOp, currentPage, normalizeBoard } from "../shared/junnuBoard.js";

const AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 1
};

const VIDEO_CONSTRAINTS = {
  aspectRatio: { ideal: 1.777 },
  width: { min: 1280, ideal: 1920, max: 1920 },
  height: { min: 720, ideal: 1080, max: 1080 },
  frameRate: { ideal: 30, max: 60 },
  facingMode: "user"
};

const BOARD_COLORS = ["#111827", "#dc2626", "#2563eb", "#059669", "#d97706"];

function shouldOffer(localId, remoteId) {
  return String(localId) < String(remoteId);
}

function junnuWsUrl(apiBaseUrl) {
  if (apiBaseUrl) {
    const base = new URL(apiBaseUrl, window.location.origin);
    base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
    base.pathname = "/junnu-ws";
    base.search = "";
    return base.toString();
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/junnu-ws`;
}

function pointFromEvent(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / rect.width,
    y: (event.clientY - rect.top) / rect.height
  };
}

function paintBackground(ctx, width, height, kind) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  if (kind === "ruled") {
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    const step = height / 22;
    for (let y = step; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }
  if (kind === "graph") {
    ctx.strokeStyle = "#dbeafe";
    ctx.lineWidth = 1;
    const step = width / 24;
    for (let x = 0; x <= width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }
}

function paintVideoBackground(ctx, width, height, kind) {
  const colors = kind === "dawn" ? ["#f97316", "#fef3c7"] : kind === "forest" ? ["#14532d", "#bbf7d0"] : ["#075985", "#a5f3fc"];
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function chaikin(points, rounds = 2) {
  let next = points;
  for (let pass = 0; pass < rounds; pass += 1) {
    if (next.length < 3) {
      break;
    }
    const smoothed = [next[0]];
    for (let i = 0; i < next.length - 1; i += 1) {
      const a = next[i];
      const b = next[i + 1];
      smoothed.push({ x: 0.75 * a.x + 0.25 * b.x, y: 0.75 * a.y + 0.25 * b.y });
      smoothed.push({ x: 0.25 * a.x + 0.75 * b.x, y: 0.25 * a.y + 0.75 * b.y });
    }
    smoothed.push(next[next.length - 1]);
    next = smoothed;
  }
  return next;
}

function paintStroke(ctx, stroke, width, height) {
  if (!stroke?.points?.length) {
    return;
  }
  const pts = stroke.points.map((point) => ({ x: point.x * width, y: point.y * height }));
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const highlight = stroke.mode === "highlight";
  ctx.globalAlpha = highlight ? 0.35 : 1;
  ctx.globalCompositeOperation = stroke.mode === "erase" ? "destination-out" : "source-over";
  ctx.lineWidth = Math.max(2.4, (Number(stroke.size) || 3) * (width / 720) * (highlight ? 2.4 : 1));
  ctx.strokeStyle = stroke.color || "#111827";
  ctx.beginPath();
  if (pts.length === 1) {
    ctx.arc(pts[0].x, pts[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  } else if (pts.length === 2) {
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.stroke();
  } else {
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i += 1) {
      const midX = (pts[i].x + pts[i + 1].x) / 2;
      const midY = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }
  ctx.restore();
}

function paintShape(ctx, shape, width, height) {
  const x1 = shape.x1 * width;
  const y1 = shape.y1 * height;
  const x2 = shape.x2 * width;
  const y2 = shape.y2 * height;
  ctx.save();
  ctx.strokeStyle = shape.color || "#111827";
  ctx.lineWidth = Math.max(2, (Number(shape.size) || 3) * (width / 720));
  ctx.beginPath();
  if (shape.kind === "line") {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  } else if (shape.kind === "ellipse") {
    ctx.ellipse((x1 + x2) / 2, (y1 + y2) / 2, Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 2, 0, 0, Math.PI * 2);
  } else {
    ctx.rect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
  }
  ctx.stroke();
  ctx.restore();
}

function paintPage(canvas, page) {
  if (!canvas) {
    return;
  }
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  paintBackground(ctx, width, height, page?.background || "white");
  (page?.strokes || []).forEach((stroke) => paintStroke(ctx, stroke, width, height));
  (page?.shapes || []).forEach((shape) => paintShape(ctx, shape, width, height));
  (page?.texts || []).forEach((item) => {
    if (item.sticky) {
      const x = item.x * width;
      const y = item.y * height;
      const size = Math.max(16, (Number(item.size) || 18) * (width / 900));
      ctx.fillStyle = "#fef08a";
      ctx.fillRect(x - 12, y - size, Math.min(width * 0.28, Math.max(120, item.text.length * size * 0.6)), size * 1.55);
    }
    ctx.fillStyle = item.color || "#111827";
    ctx.font = `${Math.max(16, (Number(item.size) || 18) * (width / 900))}px sans-serif`;
    ctx.fillText(item.text, item.x * width, item.y * height);
  });
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

async function applyCrystalSenders(pc) {
  for (const sender of pc.getSenders()) {
    if (sender.track?.kind !== "video") {
      continue;
    }
    sender.track.contentHint = "detail";
    const params = sender.getParameters();
    if (!params.encodings?.length) {
      params.encodings = [{}];
    }
    params.encodings[0].maxBitrate = 4500000;
    params.encodings[0].maxFramerate = 30;
    params.degradationPreference = "maintain-resolution";
    try {
      await sender.setParameters(params);
    } catch (_error) {
      // Some browsers reject bitrate hints; HD capture still applies.
    }
  }
}

export default function JunnuRoom({ apiBaseUrl, roomId, displayName, identifier, password, title, userRole, onLeave }) {
  const localVideoRef = useRef(null);
  const boardRef = useRef(null);
  const peerIdRef = useRef(`p-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`}`);
  const afterRef = useRef(0);
  const peersRef = useRef(new Map());
  const streamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const virtualStreamRef = useRef(null);
  const videoBackgroundRef = useRef("none");
  const shareModeRef = useRef("camera");
  const sendBoardRef = useRef(async () => {});
  const sendControlRef = useRef(async () => {});
  const sendChatRef = useRef(async () => {});
  const boardStateRef = useRef(normalizeBoard(null));
  const drawingRef = useRef(null);
  const laserTimerRef = useRef(null);
  const iceServersRef = useRef([{ urls: ["stun:stun.l.google.com:19302"] }]);
  const wsReadyRef = useRef(false);
  const connectionsRef = useRef(new Map());
  const [status, setStatus] = useState("Starting Junnu…");
  const [remoteTiles, setRemoteTiles] = useState([]);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#111827");
  const [brush, setBrush] = useState(4);
  const [laser, setLaser] = useState(null);
  const [textDraft, setTextDraft] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [aiStatus, setAiStatus] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [shareMode, setShareMode] = useState("camera");
  const [workspace, setWorkspace] = useState("video");
  const [theme, setTheme] = useState("ocean");
  const [videoBackground, setVideoBackground] = useState("none");
  const [cameraReady, setCameraReady] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [presenter, setPresenter] = useState(null);
  const [boardMeta, setBoardMeta] = useState({
    pageIndex: 0,
    pageCount: 1,
    canUndo: false,
    canRedo: false,
    background: "white"
  });
  const initials = String(displayName || "J").trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  function syncLocalSenders(pc) {
    const cameraStream = streamRef.current;
    const screenStream = screenStreamRef.current;
    const activeStream = shareModeRef.current === "screen" && screenStream ? screenStream : cameraStream;
    const activeVideo = (shareModeRef.current === "camera" ? virtualStreamRef.current?.getVideoTracks?.()[0] : null) || activeStream?.getVideoTracks?.()[0] || null;
    const activeAudio = cameraStream?.getAudioTracks?.()[0] || null;
    if (activeVideo) {
      const currentSender = pc.getSenders().find((sender) => sender.track?.kind === "video");
      if (currentSender) {
        currentSender.replaceTrack(activeVideo).catch(() => {});
      } else {
        pc.addTrack(activeVideo, activeStream);
      }
    }
    if (activeAudio) {
      const currentSender = pc.getSenders().find((sender) => sender.track?.kind === "audio");
      if (currentSender) {
        currentSender.replaceTrack(activeAudio).catch(() => {});
      } else {
        pc.addTrack(activeAudio, cameraStream);
      }
    }
  }

  function toggleAudio() {
    const nextEnabled = !audioEnabled;
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = nextEnabled;
    });
    setAudioEnabled(nextEnabled);
  }

  function toggleVideo() {
    const nextEnabled = !videoEnabled;
    streamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = nextEnabled;
    });
    screenStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = nextEnabled;
    });
    setVideoEnabled(nextEnabled);
  }

  function syncMeta() {
    const board = boardStateRef.current;
    setBoardMeta({
      pageIndex: board.pageIndex,
      pageCount: board.pages.length,
      canUndo: Boolean(board.undo?.length),
      canRedo: Boolean(board.redo?.length),
      background: currentPage(board).background || "white"
    });
  }

  function applyChatMessage(message) {
    if (message.type === "chat" && message.data?.id) {
      setChatMessages((items) => items.some((item) => item.id === message.data.id) ? items : [...items, {
        ...message.data,
        from: message.from,
        name: message.data.name || peersRef.current.get(message.from) || "Classmate"
      }]);
    }
    if (message.type === "chat-reaction" && message.data?.messageId) {
      setChatMessages((items) => items.map((item) => item.id !== message.data.messageId ? item : {
        ...item,
        reactions: {
          ...(item.reactions || {}),
          [message.data.emoji]: [...new Set([...(item.reactions?.[message.data.emoji] || []), message.from])]
        }
      }));
    }
    if (message.type === "file" && message.data?.id) {
      setSharedFiles((items) => items.some((item) => item.id === message.data.id) ? items : [...items, message.data]);
    }
  }

  async function shareFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || file.size > 6 * 1024 * 1024) {
      return;
    }
    const data = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
    const payload = await fetch(`${apiBaseUrl}/api/junnu/file`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password, roomId, file: { name: file.name, size: file.size, data } })
    }).then((response) => response.json());
    if (payload.file) {
      setSharedFiles((items) => [...items, payload.file]);
    }
  }

  function submitChat(event) {
    event.preventDefault();
    const text = chatText.trim();
    if (!text) {
      return;
    }
    const message = {
      id: `chat-${peerIdRef.current}-${Date.now()}`,
      text,
      replyTo: replyTo?.id || null,
      name: displayName
    };
    applyChatMessage({ type: "chat", from: peerIdRef.current, data: message });
    sendChatRef.current("chat", message);
    setChatText("");
    setReplyTo(null);
  }

  useEffect(() => {
    const cameraStream = streamRef.current;
    if (!cameraStream || videoBackgroundRef.current === "none") {
      virtualStreamRef.current?.getTracks().forEach((track) => track.stop());
      virtualStreamRef.current = null;
      if (localVideoRef.current && shareModeRef.current === "camera") {
        localVideoRef.current.srcObject = cameraStream || null;
      }
      connectionsRef.current.forEach((item) => syncLocalSenders(item.pc));
      return undefined;
    }

    const source = document.createElement("video");
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    let cancelled = false;
    let frameId = 0;
    let processing = false;
    let lastFrameAt = 0;
    const segmentation = new SelfieSegmentation({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
    });

    segmentation.setOptions({ modelSelection: 1 });
    segmentation.onResults((results) => {
      if (cancelled || !context) {
        return;
      }
      context.save();
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);
      context.globalCompositeOperation = "source-in";
      context.drawImage(results.image, 0, 0, canvas.width, canvas.height);
      context.globalCompositeOperation = "destination-atop";
      paintVideoBackground(context, canvas.width, canvas.height, videoBackgroundRef.current);
      context.restore();
    });

    source.srcObject = cameraStream;
    source.muted = true;
    source.playsInline = true;
    source.play().then(() => {
      if (cancelled) {
        return;
      }
      const sourceWidth = source.videoWidth || 1280;
      const sourceHeight = source.videoHeight || 720;
      canvas.width = Math.min(sourceWidth, 640);
      canvas.height = Math.round(canvas.width * sourceHeight / sourceWidth);
      const virtualStream = canvas.captureStream(15);
      virtualStreamRef.current = virtualStream;
      if (localVideoRef.current && shareModeRef.current === "camera") {
        localVideoRef.current.srcObject = virtualStream;
      }
      connectionsRef.current.forEach((item) => syncLocalSenders(item.pc));
      const render = async (timestamp) => {
        if (cancelled) {
          return;
        }
        if (!processing && timestamp - lastFrameAt >= 66) {
          processing = true;
          lastFrameAt = timestamp;
          try {
            await segmentation.send({ image: source });
          } catch (_error) {
          } finally {
            processing = false;
          }
        }
        frameId = requestAnimationFrame(render);
      };
      frameId = requestAnimationFrame(render);
    }).catch(() => {});

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      segmentation.close();
      virtualStreamRef.current?.getTracks().forEach((track) => track.stop());
      virtualStreamRef.current = null;
      connectionsRef.current.forEach((item) => syncLocalSenders(item.pc));
    };
  }, [cameraReady, videoBackground === "none"]);

  function redraw() {
    paintPage(boardRef.current, currentPage(boardStateRef.current));
    syncMeta();
  }

  async function toggleScreenShare() {
    if (shareModeRef.current === "screen" && screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
      shareModeRef.current = "camera";
      setShareMode("camera");
      setPresenter(null);
      sendControlRef.current({ active: false });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = streamRef.current || null;
      }
      connectionsRef.current.forEach((item) => syncLocalSenders(item.pc));
      setStatus("Camera is back on. Whiteboard remains live.");
      return;
    }
    try {
      const capture = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: false
      });
      const videoTrack = capture.getVideoTracks()[0];
      if (!videoTrack) {
        throw new Error("No display video track was captured.");
      }
      videoTrack.onended = () => {
        if (screenStreamRef.current === capture) {
          toggleScreenShare();
        }
      };
      screenStreamRef.current = capture;
      shareModeRef.current = "screen";
      setShareMode("screen");
      setPresenter({ peerId: peerIdRef.current, name: displayName });
      sendControlRef.current({ active: true, name: displayName });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = capture;
      }
      connectionsRef.current.forEach((item) => syncLocalSenders(item.pc));
      setStatus("Screen share is live. You can switch back to your camera anytime.");
    } catch (_error) {
      setStatus("Screen share was blocked. Your camera remains active.");
    }
  }

  function applyLocalOp(op, fromSelf = false) {
    if (!op || op.action === "laser") {
      return;
    }
    if (fromSelf && (op.action === "move" || op.action === "end" || op.action === "shape-move")) {
      redraw();
      return;
    }
    boardStateRef.current = applyBoardOp(boardStateRef.current, op);
    redraw();
  }

  useEffect(() => {
    const canvas = boardRef.current;
    if (!canvas) {
      return undefined;
    }
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const nextWidth = Math.max(960, Math.round(rect.width * 2));
      const nextHeight = Math.max(540, Math.round(rect.height * 2));
      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
        redraw();
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const connections = new Map();
      connectionsRef.current = connections;
    let socket;

    function updateTiles() {
      setRemoteTiles([...connections.entries()].map(([peerId, item]) => ({
        peerId,
        name: item.name || "Classmate",
        stream: item.stream
      })));
    }

    async function post(path, body) {
      const response = await fetch(`${apiBaseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(`Junnu server returned an invalid response (${response.status}).`);
      }
      const payload = await response.json();
      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.message || "Junnu request failed.");
      }
      return payload;
    }

    async function sendSignal(to, type, data) {
      if (socket?.readyState === WebSocket.OPEN && wsReadyRef.current) {
        socket.send(JSON.stringify({
          type: "signal",
          to,
          signalType: type,
          data
        }));
        return;
      }
      await post("/api/junnu/signal", {
        identifier,
        password,
        roomId,
        from: peerIdRef.current,
        to,
        type,
        data
      });
    }

    sendBoardRef.current = (data) => sendSignal("*", "board", data);
    sendControlRef.current = (data) => sendSignal("*", "presenter", data);
    sendChatRef.current = (type, data) => sendSignal("*", type, data);

    function attachLocal(pc) {
      const stream = streamRef.current;
      if (!stream) {
        return;
      }
      stream.getTracks().forEach((track) => {
        if (track.kind === "video") {
          track.contentHint = "detail";
        }
        if (!pc.getSenders().some((sender) => sender.track === track)) {
          pc.addTrack(track, stream);
        }
      });
      syncLocalSenders(pc);
      applyCrystalSenders(pc);
    }

    async function flushIce(peerId) {
      const pc = connections.get(peerId)?.pc;
      const queued = iceQueues.get(peerId) || [];
      if (!pc?.remoteDescription) {
        return;
      }
      iceQueues.set(peerId, []);
      for (const candidate of queued) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (_error) {
          // Ignore stale candidates after a renegotiation.
        }
      }
    }

    function ensureConnection(peerId, name) {
      const existing = connections.get(peerId);
      if (existing) {
        existing.name = name || existing.name;
        return existing.pc;
      }
      const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
      const entry = { pc, name: name || "Classmate", stream: null };
      connections.set(peerId, entry);
      iceQueues.set(peerId, []);
      attachLocal(pc);
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(peerId, "ice", event.candidate.toJSON()).catch(() => {});
        }
      };
      pc.ontrack = (event) => {
        entry.stream = event.streams[0] || new MediaStream([event.track]);
        updateTiles();
        setStatus("Junnu HD connected");
      };
      pc.onconnectionstatechange = () => {
        if (["failed", "disconnected", "closed"].includes(pc.connectionState) && connections.size < 2) {
          setStatus("Waiting for the other person to join Junnu…");
        }
      };
      updateTiles();
      return pc;
    }

    async function makeOffer(peerId, name) {
      const pc = ensureConnection(peerId, name);
      if (pc.signalingState !== "stable") {
        return;
      }
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal(peerId, "offer", offer);
    }

    async function handleMessage(message) {
      if (message.type === "presenter") {
        setPresenter(message.data?.active ? {
          peerId: message.from,
          name: message.data.name || peersRef.current.get(message.from) || "Presenter"
        } : null);
        return;
      }
      if (message.type === "board") {
        if (message.data?.action === "laser") {
          setLaser({ x: message.data.x, y: message.data.y });
          clearTimeout(laserTimerRef.current);
          laserTimerRef.current = setTimeout(() => setLaser(null), 700);
          return;
        }
        applyLocalOp(message.data);
        return;
      }
      if (["chat", "chat-reaction", "file"].includes(message.type)) {
        applyChatMessage(message);
        return;
      }
      if (message.type === "leave") {
        const item = connections.get(message.from);
        item?.pc.close();
        connections.delete(message.from);
        iceQueues.delete(message.from);
        updateTiles();
        if (!connections.size) {
          setStatus("Waiting for the other person to join Junnu…");
        }
        return;
      }
      if (message.type === "offer") {
        const pc = ensureConnection(message.from, peersRef.current.get(message.from));
        await pc.setRemoteDescription(new RTCSessionDescription(message.data));
        await flushIce(message.from);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendSignal(message.from, "answer", answer);
        return;
      }
      if (message.type === "answer") {
        const pc = connections.get(message.from)?.pc;
        if (!pc) {
          return;
        }
        await pc.setRemoteDescription(new RTCSessionDescription(message.data));
        await flushIce(message.from);
        return;
      }
      if (message.type === "ice" && message.data) {
        const pc = connections.get(message.from)?.pc;
        if (!pc?.remoteDescription) {
          const queued = iceQueues.get(message.from) || [];
          queued.push(message.data);
          iceQueues.set(message.from, queued);
          return;
        }
        try {
          await pc.addIceCandidate(message.data);
        } catch (_error) {
          // Drop candidates that arrive after the peer left.
        }
      }
    }

    async function syncPeers(list) {
      const seen = new Set(list.map((item) => item.peerId));
      list.forEach((item) => peersRef.current.set(item.peerId, item.name));
      for (const peer of list) {
        if (shouldOffer(peerIdRef.current, peer.peerId) && !connections.has(peer.peerId)) {
          await makeOffer(peer.peerId, peer.name);
        }
      }
      for (const [peerId, item] of connections) {
        if (!seen.has(peerId)) {
          item.pc.close();
          connections.delete(peerId);
        }
      }
      updateTiles();
    }

    function openSocket() {
      try {
        socket = new WebSocket(junnuWsUrl(apiBaseUrl));
      } catch (_error) {
        return;
      }
      socket.onopen = () => {
        socket.send(JSON.stringify({
          type: "hello",
          identifier,
          password,
          roomId,
          peerId: peerIdRef.current
        }));
      };
      socket.onmessage = (event) => {
        let payload;
        try {
          payload = JSON.parse(event.data);
        } catch (_error) {
          return;
        }
        if (payload.kind === "ready") {
          wsReadyRef.current = true;
          return;
        }
        if (payload.kind === "signal" && payload.message) {
          handleMessage(payload.message);
        }
      };
      socket.onclose = () => {
        wsReadyRef.current = false;
      };
    }

    async function start() {
      setStatus("Opening Junnu… allow camera and mic if the browser asks.");
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: AUDIO_CONSTRAINTS,
          video: VIDEO_CONSTRAINTS
        });
      } catch (_hdError) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: AUDIO_CONSTRAINTS,
            video: true
          });
        } catch (_basicError) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS, video: false });
            setStatus("Camera is blocked. Whiteboard is open with microphone only.");
          } catch (_audioError) {
            setStatus("Camera and mic were blocked. Whiteboard is still open.");
          }
        }
      }
      if (cancelled) {
        stream?.getTracks().forEach((track) => track.stop());
        return;
      }
      if (stream) {
        stream.getVideoTracks().forEach((track) => {
          track.contentHint = "detail";
        });
        streamRef.current = stream;
        setCameraReady(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }
      const joined = await post("/api/junnu/join", {
        identifier,
        password,
        roomId,
        peerId: peerIdRef.current,
        name: displayName
      });
      if (cancelled) {
        return;
      }
      iceServersRef.current = joined.iceServers || iceServersRef.current;
      afterRef.current = joined.after || 0;
      boardStateRef.current = normalizeBoard(joined.board);
      setSnapshots(joined.snapshots || []);
      setPresenter(joined.presenter || null);
      setChatMessages(joined.chat || []);
      setSharedFiles(joined.files || []);
      redraw();
      setStatus(joined.peers?.length ? "Connecting Junnu HD…" : "Waiting for the other person to join Junnu…");
      openSocket();
      await syncPeers(joined.peers || []);

      async function poll() {
        if (cancelled) {
          return;
        }
        try {
          const snapshot = await post("/api/junnu/poll", {
            identifier,
            password,
            roomId,
            peerId: peerIdRef.current,
            after: afterRef.current
          });
          afterRef.current = snapshot.after || afterRef.current;
          iceServersRef.current = snapshot.iceServers || iceServersRef.current;
          if (snapshot.snapshots) {
            setSnapshots(snapshot.snapshots);
          }
          setPresenter(snapshot.presenter || null);
          await syncPeers(snapshot.peers || []);
          if (!wsReadyRef.current) {
            for (const message of snapshot.messages || []) {
              await handleMessage(message);
            }
          }
        } catch (_error) {
          if (!cancelled) {
            setStatus("Junnu lost the class connection. Rejoining…");
          }
        }
      }

      const timer = window.setInterval(poll, wsReadyRef.current ? 2000 : 280);
      await poll();
      return () => window.clearInterval(timer);
    }

    let stopPoll = () => {};
    start()
      .then((cleanup) => {
        if (typeof cleanup === "function") {
          stopPoll = cleanup;
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setStatus(error.message || "Could not start Junnu.");
        }
      });

    return () => {
      cancelled = true;
      stopPoll();
      wsReadyRef.current = false;
      socket?.close();
      post("/api/junnu/leave", {
        identifier,
        password,
        roomId,
        peerId: peerIdRef.current
      }).catch(() => {});
      connections.forEach((item) => item.pc.close());
      connections.clear();
      connectionsRef.current = new Map();
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
      shareModeRef.current = "camera";
      setShareMode("camera");
      setPresenter(null);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [apiBaseUrl, roomId, displayName, identifier, password]);

  useEffect(() => {
    remoteTiles.forEach((tile) => {
      const node = document.getElementById(`junnu-remote-${tile.peerId}`);
      if (node && tile.stream && node.srcObject !== tile.stream) {
        node.srcObject = tile.stream;
      }
    });
  }, [remoteTiles]);

  function emit(op) {
    applyLocalOp(op, true);
    sendBoardRef.current(op);
  }

  function onBoardPointerDown(event) {
    const canvas = boardRef.current;
    if (!canvas || textDraft) {
      return;
    }
    event.preventDefault();
    const point = pointFromEvent(event, canvas);
    if (tool === "text" || tool === "sticky") {
      setTextDraft({ ...point, value: "", sticky: tool === "sticky" });
      return;
    }
    if (tool === "laser") {
      sendBoardRef.current({ action: "laser", x: point.x, y: point.y });
      setLaser(point);
      return;
    }
    canvas.setPointerCapture(event.pointerId);
    const id = `s-${peerIdRef.current}-${Date.now()}`;
    if (["rect", "ellipse", "line"].includes(tool)) {
      drawingRef.current = { id, kind: tool };
      const op = { action: "shape-start", id, kind: tool, color, size: brush, x1: point.x, y1: point.y, x2: point.x, y2: point.y };
      boardStateRef.current = applyBoardOp(boardStateRef.current, op);
      redraw();
      sendBoardRef.current(op);
      return;
    }
    const mode = tool === "erase" ? "erase" : tool === "highlight" ? "highlight" : "pen";
    const stroke = { id, color, size: brush, mode, points: [point] };
    drawingRef.current = { ...stroke, pending: [] };
    const op = { action: "start", id, color, size: brush, mode, x: point.x, y: point.y };
    boardStateRef.current = applyBoardOp(boardStateRef.current, op);
    redraw();
    sendBoardRef.current(op);
  }

  function onBoardPointerMove(event) {
    const canvas = boardRef.current;
    const drawing = drawingRef.current;
    const point = canvas ? pointFromEvent(event, canvas) : null;
    if (tool === "laser" && point && event.buttons) {
      sendBoardRef.current({ action: "laser", x: point.x, y: point.y });
      setLaser(point);
      return;
    }
    if (!canvas || !drawing || !point) {
      return;
    }
    if (drawing.kind) {
      const op = { action: "shape-move", id: drawing.id, x2: point.x, y2: point.y };
      boardStateRef.current = applyBoardOp(boardStateRef.current, op);
      redraw();
      sendBoardRef.current(op);
      return;
    }
    drawing.pending.push(point);
    const page = currentPage(boardStateRef.current);
    const stroke = page.strokes.find((item) => item.id === drawing.id);
    const last = stroke?.points?.[stroke.points.length - 1];
    if (last && distance(last, point) < 0.006) {
      return;
    }
    if (stroke) {
      stroke.points.push(point);
    }
    redraw();
    const minBatch = wsReadyRef.current ? 1 : 3;
    if (drawing.pending.length >= minBatch) {
      const batch = drawing.pending.splice(0, drawing.pending.length);
      sendBoardRef.current({ action: "move", id: drawing.id, points: batch });
    }
  }

  function onBoardPointerUp(event) {
    const drawing = drawingRef.current;
    if (!drawing) {
      return;
    }
    if (drawing.pending?.length) {
      sendBoardRef.current({ action: "move", id: drawing.id, points: drawing.pending });
    }
    if (!drawing.kind) {
      sendBoardRef.current({ action: "end", id: drawing.id, points: [] });
      const page = currentPage(boardStateRef.current);
      const stroke = page.strokes.find((item) => item.id === drawing.id);
      if (stroke?.points?.length > 2) {
        const points = chaikin(stroke.points, 2);
        const op = { action: "smooth-stroke", id: drawing.id, points };
        boardStateRef.current = applyBoardOp(boardStateRef.current, op);
        redraw();
        sendBoardRef.current(op);
      }
    }
    drawingRef.current = null;
    try {
      boardRef.current?.releasePointerCapture(event.pointerId);
    } catch (_error) {
      // Capture may already be released.
    }
  }

  function commitText(event) {
    event.preventDefault();
    const draft = textDraft;
    setTextDraft(null);
    if (!draft?.value?.trim()) {
      return;
    }
    const op = {
      action: draft.sticky ? "sticky" : "text",
      id: `t-${peerIdRef.current}-${Date.now()}`,
      x: draft.x,
      y: draft.y,
      text: draft.value.trim(),
      color,
      size: Math.max(14, brush * 4)
    };
    boardStateRef.current = applyBoardOp(boardStateRef.current, op);
    redraw();
    sendBoardRef.current(op);
    setTextDraft(null);
  }

  function renderPageDataUrl(page) {
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 900;
    paintPage(canvas, page);
    return canvas.toDataURL("image/png");
  }

  function savePng() {
    const page = currentPage(boardStateRef.current);
    downloadDataUrl(renderPageDataUrl(page), `Junnu-Board-${boardMeta.pageIndex + 1}.png`);
  }

  function savePdf() {
    const printWindow = window.open("", "junnu-board");
    if (!printWindow) {
      return;
    }
    const images = boardStateRef.current.pages.map((page, index) => `<img src="${renderPageDataUrl(page)}" alt="Board ${index + 1}" />`);
    printWindow.document.write(`<!doctype html><title>Junnu board</title><style>img{width:100%;page-break-after:always}</style>${images.join("")}</body>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  async function makeWritingClear() {
    const page = currentPage(boardStateRef.current);
    if (!page.strokes.length) {
      setAiStatus("Write with the pen first, then click Make clear.");
      return;
    }
    setAiBusy(true);
    setAiStatus("Reading handwriting…");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 900;
      const ctx = canvas.getContext("2d");
      paintBackground(ctx, canvas.width, canvas.height, "white");
      page.strokes.forEach((stroke) => paintStroke(ctx, { ...stroke, size: Math.max(stroke.size || 4, 6) }, canvas.width, canvas.height));
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      await worker.setParameters({
        tessedit_char_whitelist: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+-×÷=().,/? "
      });
      const result = await worker.recognize(canvas);
      await worker.terminate();
      const text = String(result?.data?.text || "").replace(/\s+/g, " ").trim();
      if (!text) {
        setAiStatus("Could not read that writing. Try larger, slower letters, then Make clear again.");
        return;
      }
      const bounds = page.strokes.flatMap((stroke) => stroke.points);
      const xs = bounds.map((point) => point.x);
      const ys = bounds.map((point) => point.y);
      const op = {
        action: "ai-text",
        id: `ai-${peerIdRef.current}-${Date.now()}`,
        text,
        x: Math.max(0.06, Math.min(...xs)),
        y: Math.max(0.12, Math.min(...ys) + 0.04),
        color,
        size: 32
      };
      boardStateRef.current = applyBoardOp(boardStateRef.current, op);
      redraw();
      sendBoardRef.current(op);
      setAiStatus(`Cleared to: ${text}`);
    } catch (_error) {
      setAiStatus("AI text could not run in this browser. The pen is still smoothed as you write.");
    } finally {
      setAiBusy(false);
    }
  }

  async function saveToClass() {
    const page = currentPage(boardStateRef.current);
    try {
      const response = await fetch(`${apiBaseUrl}/api/junnu/snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          password,
          roomId,
          pageIndex: boardMeta.pageIndex,
          title: title || "Junnu board",
          image: renderPageDataUrl(page)
        })
      });
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(`Junnu server returned an invalid response (${response.status}).`);
      }
      const payload = await response.json();
      if (payload?.snapshots) {
        setSnapshots(payload.snapshots);
      }
    } catch (_error) {
      // Keep the local PNG download path if class save is unavailable.
    }
  }

  return (
    <div className={`junnu-stage junnu-stage--teams junnu-stage--${theme}`}>
      <header className="junnu-call-header">
        <div><strong>{title || "Junnu class"}</strong><span>{status}</span></div>
        <div className="junnu-header-tools">
          <button type="button" title="People"><UsersRound size={19} /><span>People</span></button>
          <button className={chatOpen ? "active" : ""} type="button" title="Chat" onClick={() => setChatOpen((open) => !open)}><MessageCircle size={19} /><span>Chat</span></button>
          <button type="button" title="Raise hand"><Hand size={19} /><span>Raise</span></button>
          <button type="button" title="React"><SmilePlus size={19} /><span>React</span></button>
          <button type="button" title="View"><LayoutPanelTop size={19} /><span>View</span></button>
          <button type="button" title="More options"><CircleEllipsis size={19} /><span>More</span></button>
        </div>
      </header>
      {workspace === "video" ? <div className={`junnu-call-body${chatOpen ? " has-chat" : ""}`}>
        <section className="junnu-video-canvas" aria-label="Live cameras">
          {remoteTiles.length ? remoteTiles.map((tile) => (
            <figure key={tile.peerId} className="junnu-main-video">
              <video id={`junnu-remote-${tile.peerId}`} autoPlay playsInline />
              <figcaption>{tile.name}{presenter?.peerId === tile.peerId ? <span className="junnu-presenter-badge">Presenter</span> : null}</figcaption>
            </figure>
          )) : (
            <div className="junnu-waiting-state"><span>{initials}</span><strong>Waiting for others to join...</strong></div>
          )}
          <figure className="junnu-self-preview">
            <video ref={localVideoRef} autoPlay muted playsInline />
            <figcaption>You · {displayName}</figcaption>
          </figure>
          <div className="junnu-media-dock">
            <button className={!videoEnabled ? "is-off" : ""} type="button" title={videoEnabled ? "Stop camera" : "Start camera"} onClick={toggleVideo}><Camera size={20} /><span>Camera</span><ChevronDown size={13} /></button>
            <button className={!audioEnabled ? "is-off" : ""} type="button" title={audioEnabled ? "Mute microphone" : "Unmute microphone"} onClick={toggleAudio}><Mic size={20} /><span>Mic</span><ChevronDown size={13} /></button>
            <button className={shareMode === "screen" ? "is-on" : ""} type="button" title="Share screen" onClick={toggleScreenShare}><MonitorUp size={20} /><span>Share</span></button>
            <button type="button" title="Background options"><label><span>Background</span><select value={videoBackground} onChange={(event) => { videoBackgroundRef.current = event.target.value; setVideoBackground(event.target.value); }}><option value="none">None</option><option value="ocean">Ocean</option><option value="dawn">Dawn</option><option value="forest">Forest</option></select></label></button>
            {["student", "teacher"].includes(String(userRole || "").toLowerCase()) ? <button type="button" title="Open digital notes" onClick={() => setWorkspace("notes")}><LayoutPanelTop size={20} /><span>Notes</span></button> : null}
            <button className="junnu-leave-control" type="button" title="Leave meeting" onClick={onLeave}><PhoneOff size={21} /><span>Leave</span></button>
          </div>
        </section>
      {chatOpen ? <section className="junnu-chat" aria-label="Meeting chat">
        <div className="junnu-chat-header"><strong>Chat</strong>{replyTo ? <button type="button" onClick={() => setReplyTo(null)}>Cancel reply</button> : null}</div>
        <div className="junnu-chat-list">
          {chatMessages.map((message) => (
            <article className="junnu-chat-message" key={message.id}>
              <strong>{message.name}</strong>
              {message.replyTo ? <span className="junnu-chat-reply">Replying to a message</span> : null}
              <p>{message.text}</p>
              <div className="junnu-chat-actions">
                <button type="button" onClick={() => setReplyTo(message)}>Reply</button>
                {["👍", "❤️", "😂"].map((emoji) => <button key={emoji} type="button" onClick={() => sendChatRef.current("chat-reaction", { messageId: message.id, emoji })}>{emoji}{message.reactions?.[emoji]?.length ? ` ${message.reactions[emoji].length}` : ""}</button>)}
              </div>
            </article>
          ))}
        </div>
        <form className="junnu-chat-compose" onSubmit={submitChat}>
          <input value={chatText} onChange={(event) => setChatText(event.target.value)} placeholder={replyTo ? `Reply to ${replyTo.name}` : "Message everyone"} maxLength="1200" />
          <button type="submit">Send</button>
        </form>
        <div className="junnu-files">
          <label>Share file<input type="file" onChange={shareFile} /></label>
          {sharedFiles.map((file) => <a key={file.id} href={file.url} target="_blank" rel="noreferrer">{file.name}</a>)}
        </div>
      </section> : null}</div> : null}
      {workspace === "notes" ? <div className="junnu-board-pane">
        <div className="junnu-notes-header"><button type="button" onClick={() => setWorkspace("video")}>Back to video</button><label>Theme<select value={theme} onChange={(event) => setTheme(event.target.value)}><option value="ocean">Ocean</option><option value="dawn">Dawn</option><option value="forest">Forest</option></select></label></div>
        <div className="junnu-board-tools">
          <strong>Whiteboard</strong>
          <button type="button" disabled={!boardMeta.canUndo} onClick={() => emit({ action: "undo" })}>Undo</button>
          <button type="button" disabled={!boardMeta.canRedo} onClick={() => emit({ action: "redo" })}>Redo</button>
          <button className={tool === "pen" ? "active" : ""} type="button" onClick={() => setTool("pen")}>Pen</button>
          <button className={tool === "highlight" ? "active" : ""} type="button" onClick={() => setTool("highlight")}>Highlight</button>
          <button className={tool === "erase" ? "active" : ""} type="button" onClick={() => setTool("erase")}>Eraser</button>
          <button className={tool === "text" ? "active" : ""} type="button" onClick={() => setTool("text")}>Text</button>
          <button className={tool === "sticky" ? "active" : ""} type="button" onClick={() => setTool("sticky")}>Sticky note</button>
          <button className={tool === "line" ? "active" : ""} type="button" onClick={() => setTool("line")}>Line</button>
          <button className={tool === "rect" ? "active" : ""} type="button" onClick={() => setTool("rect")}>Box</button>
          <button className={tool === "ellipse" ? "active" : ""} type="button" onClick={() => setTool("ellipse")}>Circle</button>
          <button className={tool === "laser" ? "active" : ""} type="button" onClick={() => setTool("laser")}>Laser</button>
          {BOARD_COLORS.map((value) => (
            <button
              key={value}
              className={`junnu-swatch${color === value ? " active" : ""}`}
              type="button"
              style={{ background: value }}
              onClick={() => setColor(value)}
              aria-label={`Ink ${value}`}
            />
          ))}
          <label>
            Size
            <input type="range" min="2" max="18" value={brush} onChange={(event) => setBrush(Number(event.target.value))} />
          </label>
          <button className={boardMeta.background === "white" ? "active" : ""} type="button" onClick={() => emit({ action: "background", value: "white" })}>Blank</button>
          <button className={boardMeta.background === "ruled" ? "active" : ""} type="button" onClick={() => emit({ action: "background", value: "ruled" })}>Lined</button>
          <button className={boardMeta.background === "graph" ? "active" : ""} type="button" onClick={() => emit({ action: "background", value: "graph" })}>Graph</button>
          <button type="button" onClick={() => emit({ action: "page", dir: "prev" })}>Prev</button>
          <span className="junnu-page-flag">Board {boardMeta.pageIndex + 1} / {boardMeta.pageCount}</span>
          <button type="button" onClick={() => emit({ action: "page", dir: "next" })}>Next</button>
          <button type="button" onClick={() => emit({ action: "page", dir: "add" })}>New board</button>
          <button type="button" disabled={aiBusy} onClick={makeWritingClear}>{aiBusy ? "Reading…" : "Make clear"}</button>
          <button type="button" onClick={() => emit({ action: "clear" })}>Clear</button>
          <button type="button" onClick={savePng}>PNG</button>
          <button type="button" onClick={savePdf}>PDF</button>
          <button type="button" onClick={saveToClass}>Save to class</button>
        </div>
        <div className="junnu-board-wrap">
          <canvas
            ref={boardRef}
            className="junnu-board"
            onPointerDown={onBoardPointerDown}
            onPointerMove={onBoardPointerMove}
            onPointerUp={onBoardPointerUp}
          />
          {laser ? <span className="junnu-laser" style={{ left: `${laser.x * 100}%`, top: `${laser.y * 100}%` }} /> : null}
          {textDraft ? (
            <form className="junnu-text-draft" style={{ left: `${textDraft.x * 100}%`, top: `${textDraft.y * 100}%` }} onSubmit={commitText}>
              <input
                autoFocus
                value={textDraft.value}
                onChange={(event) => setTextDraft({ ...textDraft, value: event.target.value })}
                onBlur={commitText}
                placeholder="Type and press Enter"
              />
            </form>
          ) : null}
        </div>
        <p className="junnu-board-hint">
          Faces stay in the video strip. The board below is for writing together.
          {aiStatus ? ` ${aiStatus}` : ""}
          {snapshots.length ? ` Saved: ${snapshots.length} snapshot${snapshots.length === 1 ? "" : "s"}.` : ""}
        </p>
        {snapshots.length ? (
          <div className="junnu-snapshots">
            {snapshots.slice(-4).map((item) => (
              <a key={item.id} href={item.url} target="_blank" rel="noreferrer">Board {(item.page_index || 0) + 1}</a>
            ))}
          </div>
        ) : null}
      </div> : null}
    </div>
  );
}
