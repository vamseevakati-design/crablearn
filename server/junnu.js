import {
  addJunnuSnapshot,
  getClassesForUser,
  listJunnuSnapshots,
  loadJunnuBoard,
  saveJunnuBoard
} from "./db.js";
import { applyBoardOp, emptyBoard, normalizeBoard } from "../shared/junnuBoard.js";

const rooms = new Map();
const sockets = new Map();
const persistTimers = new Map();

export function isAllowedJunnuRoomActor(actor, roomId) {
  if (!actor || !roomId) {
    return false;
  }
  const role = String(actor.role || "").trim().toLowerCase();
  if (role === "admin" || role === "supervisor") {
    return true;
  }
  const roomKey = String(roomId || "").trim();
  const sessions = getClassesForUser(actor)?.sessions || [];
  for (const session of sessions) {
    const directId = session?.meeting_id || session?.id;
    if (!directId) {
      continue;
    }
    const candidates = new Set([
      `Junnu-${directId}`,
      String(directId),
      `Class${directId}`
    ]);
    if (candidates.has(roomKey)) {
      return true;
    }
  }
  return false;
}

function iceServers() {
  const servers = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];
  const turnUrl = String(process.env.JUNNU_TURN_URL || "").trim();
  if (turnUrl) {
    servers.push({
      urls: turnUrl,
      username: process.env.JUNNU_TURN_USER || "",
      credential: process.env.JUNNU_TURN_PASS || ""
    });
  }
  return servers;
}

function persistBoard(roomId, board) {
  clearTimeout(persistTimers.get(roomId));
  persistTimers.set(roomId, setTimeout(() => {
    try {
      saveJunnuBoard(roomId, board);
    } catch (_error) {
      // Keep the live board even if disk write fails.
    }
  }, 700));
}

function getRoom(roomId) {
  const id = String(roomId || "").trim();
  if (!id) {
    return null;
  }
  if (!rooms.has(id)) {
    rooms.set(id, {
      peers: new Map(),
      signals: [],
      chat: [],
      files: [],
      nextSignal: 1,
      presenter: null,
      board: normalizeBoard(loadJunnuBoard(id) || emptyBoard())
    });
  }
  return rooms.get(id);
}

function publicPeers(room, exceptId) {
  return [...room.peers.values()]
    .filter((peer) => peer.peerId !== exceptId)
    .map((peer) => ({ peerId: peer.peerId, name: peer.name }));
}

function pruneRoom(room, roomId) {
  const cutoff = Date.now() - 20000;
  for (const [peerId, peer] of room.peers) {
    if (peer.seenAt < cutoff) {
      room.peers.delete(peerId);
      room.signals.push({
        id: room.nextSignal++,
        from: peerId,
        to: "*",
        type: "leave",
        data: null
      });
    }
  }
  if (room.signals.length > 800) {
    room.signals = room.signals.filter((item) => item.type === "board" || item.id > room.nextSignal - 200);
  }
  if (!room.peers.size) {
    persistBoard(roomId, room.board);
    rooms.delete(roomId);
  }
}

export function junnuBindSocket(roomId, peerId, socket) {
  const id = String(roomId || "").trim();
  if (!id || !peerId || !socket) {
    return;
  }
  if (!sockets.has(id)) {
    sockets.set(id, new Map());
  }
  sockets.get(id).set(peerId, socket);
}

export function junnuUnbindSocket(roomId, peerId) {
  const id = String(roomId || "").trim();
  sockets.get(id)?.delete(peerId);
  if (sockets.get(id) && !sockets.get(id).size) {
    sockets.delete(id);
  }
}

export function junnuBroadcast(roomId, message, exceptPeerId) {
  const roomSockets = sockets.get(String(roomId || "").trim());
  if (!roomSockets) {
    return;
  }
  const payload = JSON.stringify(message);
  for (const [peerId, socket] of roomSockets) {
    if (peerId === exceptPeerId || socket.readyState !== 1) {
      continue;
    }
    socket.send(payload);
  }
}

export function junnuJoin({ roomId, peerId, name }) {
  const room = getRoom(roomId);
  if (!room || !peerId) {
    throw new Error("ROOM_REQUIRED");
  }
  room.peers.set(peerId, {
    peerId,
    name: String(name || "Guest").trim() || "Guest",
    seenAt: Date.now()
  });
  pruneRoom(room, roomId);
  const live = getRoom(roomId) || room;
  if (!live.peers.has(peerId)) {
    live.peers.set(peerId, {
      peerId,
      name: String(name || "Guest").trim() || "Guest",
      seenAt: Date.now()
    });
  }
  return {
    peerId,
    peers: publicPeers(live, peerId),
    iceServers: iceServers(),
    after: live.nextSignal - 1,
    presenter: live.presenter,
    board: live.board,
    chat: live.chat,
    files: live.files,
    snapshots: listJunnuSnapshots(roomId)
  };
}

export function junnuSignal({ roomId, from, to, type, data }) {
  const room = getRoom(roomId);
  if (!room || !from || !to || !type) {
    throw new Error("SIGNAL_REQUIRED");
  }
  const peer = room.peers.get(from);
  if (peer) {
    peer.seenAt = Date.now();
  }
  if (type === "presenter") {
    if (data?.active) {
      room.presenter = {
        peerId: from,
        name: peer?.name || String(data.name || "Presenter").trim() || "Presenter"
      };
    } else if (room.presenter?.peerId === from) {
      room.presenter = null;
    }
  }
  if (type === "board" && data?.action !== "laser") {
    room.board = applyBoardOp(room.board, data);
    persistBoard(roomId, room.board);
  }
  if (type === "chat" && String(data?.text || "").trim()) {
    room.chat.push({
      id: String(data.id || `${from}-${Date.now()}`),
      from,
      name: peer?.name || "Classmate",
      text: String(data.text).trim().slice(0, 1200),
      replyTo: data.replyTo ? String(data.replyTo) : null,
      reactions: {}
    });
    if (room.chat.length > 200) {
      room.chat.shift();
    }
  }
  if (type === "chat-reaction" && data?.messageId && data?.emoji) {
    const chat = room.chat.find((item) => item.id === String(data.messageId));
    if (chat) {
      const emoji = String(data.emoji).slice(0, 8);
      chat.reactions[emoji] = [...new Set([...(chat.reactions[emoji] || []), from])];
    }
  }
  if (type === "file" && data?.id && data?.url) {
    room.files.push({
      id: String(data.id),
      name: String(data.name || "Shared file").slice(0, 180),
      url: String(data.url),
      type: String(data.type || "application/octet-stream"),
      size: Number(data.size) || 0,
      from,
      nameBy: peer?.name || "Classmate"
    });
    if (room.files.length > 50) {
      room.files.shift();
    }
  }
  const message = {
    id: room.nextSignal++,
    from,
    to,
    type: String(type),
    data: data ?? null
  };
  if (type !== "board" || data?.action !== "laser") {
    room.signals.push(message);
  }
  junnuBroadcast(roomId, { kind: "signal", message }, from);
  return { id: message.id, board: room.board };
}

export function junnuPoll({ roomId, peerId, after }) {
  const room = getRoom(roomId);
  if (!room || !peerId) {
    throw new Error("ROOM_REQUIRED");
  }
  pruneRoom(room, roomId);
  const live = getRoom(roomId);
  if (!live) {
    return { peers: [], messages: [], after: Number(after) || 0, iceServers: iceServers(), board: emptyBoard(), presenter: null, snapshots: listJunnuSnapshots(roomId) };
  }
  const peer = live.peers.get(peerId);
  if (peer) {
    peer.seenAt = Date.now();
  } else {
    return { peers: [], messages: [], after: Number(after) || 0, iceServers: iceServers(), board: emptyBoard(), presenter: null, snapshots: listJunnuSnapshots(roomId) };
  }
  const cursor = Number(after) || 0;
  const messages = live.signals.filter((item) => item.id > cursor && (item.to === peerId || item.to === "*") && item.from !== peerId);
  return {
    peers: publicPeers(live, peerId),
    messages,
    after: live.nextSignal - 1,
    iceServers: iceServers(),
    board: live.board,
    presenter: live.presenter,
    snapshots: listJunnuSnapshots(roomId),
    files: live.files
  };
}

export function junnuLeave({ roomId, peerId }) {
  const room = getRoom(roomId);
  if (!room || !peerId) {
    return { ok: true };
  }
  room.peers.delete(peerId);
  if (room.presenter?.peerId === peerId) {
    room.presenter = null;
    room.signals.push({
      id: room.nextSignal++,
      from: peerId,
      to: "*",
      type: "presenter",
      data: { active: false }
    });
  }
  junnuUnbindSocket(roomId, peerId);
  room.signals.push({
    id: room.nextSignal++,
    from: peerId,
    to: "*",
    type: "leave",
    data: null
  });
  junnuBroadcast(roomId, {
    kind: "signal",
    message: { from: peerId, to: "*", type: "leave", data: null }
  }, peerId);
  pruneRoom(room, roomId);
  return { ok: true };
}

export function junnuSaveSnapshot({ roomId, pageIndex, filename, url, title, createdBy }) {
  return addJunnuSnapshot({ roomId, pageIndex, filename, url, title, createdBy });
}
