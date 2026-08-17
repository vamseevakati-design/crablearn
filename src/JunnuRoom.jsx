import { useEffect, useRef, useState } from "react";
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

export default function JunnuRoom({ apiBaseUrl, roomId, displayName, identifier, password, title }) {
  const localVideoRef = useRef(null);
  const boardRef = useRef(null);
  const peerIdRef = useRef(`p-${crypto.randomUUID()}`);
  const afterRef = useRef(0);
  const peersRef = useRef(new Map());
  const streamRef = useRef(null);
  const sendBoardRef = useRef(async () => {});
  const boardStateRef = useRef(normalizeBoard(null));
  const drawingRef = useRef(null);
  const laserTimerRef = useRef(null);
  const iceServersRef = useRef([{ urls: ["stun:stun.l.google.com:19302"] }]);
  const wsReadyRef = useRef(false);
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

  function redraw() {
    paintPage(boardRef.current, currentPage(boardStateRef.current));
    syncMeta();
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
    const iceQueues = new Map();
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
      setStatus("Allow camera and mic for Junnu HD…");
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: AUDIO_CONSTRAINTS,
          video: VIDEO_CONSTRAINTS
        });
      } catch (_error) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: AUDIO_CONSTRAINTS,
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, aspectRatio: 1.777 }
        });
      }
      stream.getVideoTracks().forEach((track) => {
        track.contentHint = "detail";
      });
      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
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
    if (tool === "text") {
      setTextDraft({ ...point, value: "" });
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
      action: "text",
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
      const payload = await response.json();
      if (payload?.snapshots) {
        setSnapshots(payload.snapshots);
      }
    } catch (_error) {
      // Keep the local PNG download path if class save is unavailable.
    }
  }

  return (
    <div className="junnu-stage junnu-stage--board-focus">
      <div className="junnu-board-pane">
        <div className="junnu-board-tools">
          <strong>Whiteboard</strong>
          <button type="button" disabled={!boardMeta.canUndo} onClick={() => emit({ action: "undo" })}>Undo</button>
          <button type="button" disabled={!boardMeta.canRedo} onClick={() => emit({ action: "redo" })}>Redo</button>
          <button className={tool === "pen" ? "active" : ""} type="button" onClick={() => setTool("pen")}>Pen</button>
          <button className={tool === "highlight" ? "active" : ""} type="button" onClick={() => setTool("highlight")}>Highlight</button>
          <button className={tool === "erase" ? "active" : ""} type="button" onClick={() => setTool("erase")}>Eraser</button>
          <button className={tool === "text" ? "active" : ""} type="button" onClick={() => setTool("text")}>Text</button>
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
          <aside className="junnu-pip" aria-label="Student and educator cameras">
            {remoteTiles.length ? remoteTiles.map((tile) => (
              <figure key={tile.peerId} className="junnu-pip-card">
                <video id={`junnu-remote-${tile.peerId}`} autoPlay playsInline />
                <figcaption>{tile.name}</figcaption>
              </figure>
            )) : (
              <p className="junnu-pip-wait">{status}</p>
            )}
            <figure className="junnu-pip-card junnu-pip-card--self">
              <video ref={localVideoRef} autoPlay muted playsInline />
              <figcaption>You · {displayName}</figcaption>
            </figure>
          </aside>
        </div>
        <p className="junnu-board-hint">
          Whiteboard is the class focus. Student and educator stay in picture-in-picture. Pen strokes are smoothed; Make clear turns messy mouse writing into typed text.
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
      </div>
    </div>
  );
}
