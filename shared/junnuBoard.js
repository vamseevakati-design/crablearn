export function emptyPage() {
  return {
    background: "white",
    strokes: [],
    texts: [],
    shapes: []
  };
}

export function emptyBoard() {
  return {
    pageIndex: 0,
    pages: [emptyPage()],
    undo: [],
    redo: []
  };
}

export function normalizeBoard(raw) {
  if (!raw || typeof raw !== "object") {
    return emptyBoard();
  }
  if (Array.isArray(raw.strokes) && !Array.isArray(raw.pages)) {
    return {
      pageIndex: 0,
      pages: [{ background: "white", strokes: raw.strokes, texts: [], shapes: [] }],
      undo: [],
      redo: []
    };
  }
  const pages = (Array.isArray(raw.pages) && raw.pages.length ? raw.pages : [emptyPage()]).map((page) => ({
    background: ["ruled", "graph"].includes(page?.background) ? page.background : "white",
    strokes: Array.isArray(page?.strokes) ? page.strokes : [],
    texts: Array.isArray(page?.texts) ? page.texts : [],
    shapes: Array.isArray(page?.shapes) ? page.shapes : []
  }));
  const pageIndex = Math.min(Math.max(0, Number(raw.pageIndex) || 0), pages.length - 1);
  return {
    pageIndex,
    pages,
    undo: Array.isArray(raw.undo) ? raw.undo : [],
    redo: Array.isArray(raw.redo) ? raw.redo : []
  };
}

function clonePages(board) {
  return JSON.parse(JSON.stringify({
    pageIndex: board.pageIndex,
    pages: board.pages
  }));
}

export function currentPage(board) {
  const next = normalizeBoard(board);
  return next.pages[next.pageIndex] || next.pages[0];
}

export function pushUndo(board) {
  board.undo = board.undo || [];
  board.undo.push(clonePages(board));
  if (board.undo.length > 40) {
    board.undo.shift();
  }
  board.redo = [];
  return board;
}

export function applyBoardOp(board, data) {
  const next = normalizeBoard(board);
  const op = data || {};
  const page = () => next.pages[next.pageIndex];

  if (op.action === "undo") {
    if (!next.undo.length) {
      return next;
    }
    next.redo.push(clonePages(next));
    const prev = next.undo.pop();
    next.pageIndex = prev.pageIndex;
    next.pages = prev.pages;
    return next;
  }

  if (op.action === "redo") {
    if (!next.redo.length) {
      return next;
    }
    next.undo.push(clonePages(next));
    const future = next.redo.pop();
    next.pageIndex = future.pageIndex;
    next.pages = future.pages;
    return next;
  }

  if (op.action === "page") {
    if (op.dir === "add") {
      pushUndo(next);
      next.pages.push(emptyPage());
      next.pageIndex = next.pages.length - 1;
    } else if (op.dir === "prev") {
      next.pageIndex = Math.max(0, next.pageIndex - 1);
    } else if (op.dir === "next") {
      next.pageIndex = Math.min(next.pages.length - 1, next.pageIndex + 1);
    } else if (op.dir === "goto" && Number.isFinite(Number(op.index))) {
      next.pageIndex = Math.min(next.pages.length - 1, Math.max(0, Number(op.index)));
    }
    return next;
  }

  if (op.action === "background") {
    pushUndo(next);
    page().background = ["ruled", "graph"].includes(op.value) ? op.value : "white";
    return next;
  }

  if (op.action === "clear") {
    pushUndo(next);
    page().strokes = [];
    page().texts = [];
    page().shapes = [];
    return next;
  }

  if (op.action === "smooth-stroke" && op.id && Array.isArray(op.points)) {
    const stroke = page().strokes.find((item) => item.id === op.id);
    if (stroke) {
      stroke.points = op.points;
    }
    return next;
  }

  if (op.action === "ai-text") {
    pushUndo(next);
    page().strokes = [];
    page().texts.push({
      id: op.id || `ai-${Date.now()}`,
      x: Number(op.x) || 0.08,
      y: Number(op.y) || 0.22,
      text: String(op.text || "").slice(0, 400),
      color: op.color || "#111827",
      size: Number(op.size) || 28
    });
    return next;
  }

  if (op.action === "text" && op.id) {
    pushUndo(next);
    page().texts.push({
      id: op.id,
      x: Number(op.x) || 0,
      y: Number(op.y) || 0,
      text: String(op.text || "").slice(0, 240),
      color: op.color || "#111827",
      size: Number(op.size) || 18
    });
    return next;
  }

  if (op.action === "shape-start" && op.id) {
    pushUndo(next);
    page().shapes.push({
      id: op.id,
      kind: op.kind || "rect",
      color: op.color || "#111827",
      size: Number(op.size) || 3,
      x1: Number(op.x1) || 0,
      y1: Number(op.y1) || 0,
      x2: Number(op.x2) || 0,
      y2: Number(op.y2) || 0
    });
    return next;
  }

  if (op.action === "shape-move" && op.id) {
    const shape = page().shapes.find((item) => item.id === op.id);
    if (shape) {
      shape.x2 = Number(op.x2);
      shape.y2 = Number(op.y2);
    }
    return next;
  }

  if (op.action === "start" && op.id) {
    pushUndo(next);
    page().strokes.push({
      id: op.id,
      color: op.color || "#111827",
      size: Number(op.size) || 3,
      mode: op.mode || "pen",
      points: op.x == null ? [] : [{ x: op.x, y: op.y }]
    });
    return next;
  }

  if ((op.action === "move" || op.action === "end") && op.id) {
    const stroke = page().strokes.find((item) => item.id === op.id);
    if (stroke && Array.isArray(op.points)) {
      stroke.points.push(...op.points);
    }
    return next;
  }

  return next;
}
