const NULL_CHAR = '\0';

const HEADER_ESCAPES = { '\\n': '\n', '\\r': '\r', '\\c': ':', '\\\\': '\\' };

function decodeHeader(value) {
  return value.replace(/\\[nrc\\]/g, (m) => HEADER_ESCAPES[m]);
}

export function encodeFrame(command, headers = {}, body = '') {
  const lines = [command, ...Object.entries(headers).map(([k, v]) => `${k}:${v}`)];
  return `${lines.join('\n')}\n\n${body}${NULL_CHAR}`;
}

function parseFrame(raw) {
  const match = /\r?\n\r?\n/.exec(raw);
  const head = match ? raw.slice(0, match.index) : raw;
  const body = match ? raw.slice(match.index + match[0].length) : '';
  const [command, ...headerLines] = head.split(/\r?\n/);
  const headers = {};
  for (const line of headerLines) {
    const i = line.indexOf(':');
    if (i <= 0) continue;
    const key = line.slice(0, i);
    if (!(key in headers)) headers[key] = decodeHeader(line.slice(i + 1));
  }
  return { command, headers, body };
}

export function parseFrames(data) {
  return String(data)
    .split(NULL_CHAR)
    .map((chunk) => chunk.replace(/^[\r\n]+/, ''))
    .filter(Boolean)
    .map(parseFrame);
}

export function socketUrl(path = '/api/ws', location = window.location) {
  const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${scheme}://${location.host}${path}`;
}

export function connectRoomTopic(roomId, { onMessage, onConnected, onClosed, url, WebSocketImpl } = {}) {
  const Impl = WebSocketImpl ?? (typeof WebSocket === 'undefined' ? null : WebSocket);
  let closedByUser = false;
  let notifiedClose = false;
  const notifyClosed = () => {
    if (closedByUser || notifiedClose) return;
    notifiedClose = true;
    onClosed?.();
  };

  if (!Impl) {
    setTimeout(notifyClosed, 0);
    return () => {
      closedByUser = true;
    };
  }

  let ws;
  try {
    ws = new Impl(url ?? socketUrl(), ['v12.stomp']);
  } catch {
    setTimeout(notifyClosed, 0);
    return () => {
      closedByUser = true;
    };
  }

  ws.onopen = () => {
    ws.send(encodeFrame('CONNECT', { 'accept-version': '1.2', host: 'hour', 'heart-beat': '0,10000' }));
  };

  ws.onmessage = (event) => {
    for (const frame of parseFrames(event.data)) {
      if (frame.command === 'CONNECTED') {
        ws.send(encodeFrame('SUBSCRIBE', { id: `room-${roomId}`, destination: `/topic/rooms/${roomId}` }));
        onConnected?.();
      } else if (frame.command === 'MESSAGE') {
        onMessage?.(frame.body);
      } else if (frame.command === 'ERROR') {
        ws.close();
        notifyClosed();
      }
    }
  };

  ws.onerror = () => {};
  ws.onclose = notifyClosed;

  return () => {
    closedByUser = true;
    try {
      if (ws.readyState === 1) ws.send(encodeFrame('DISCONNECT'));
      ws.close();
    } catch {
      return;
    }
  };
}
