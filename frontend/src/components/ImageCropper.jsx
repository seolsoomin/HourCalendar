import React, { useEffect, useRef, useState } from 'react';

const FRAME_W = 240;
const FRAME_H = 320;
const OUT_W = 600;
const OUT_H = 800;
const MAX_ZOOM = 4;

export default function ImageCropper({ file, onCancel, onDone }) {
  const [src, setSrc] = useState(null);
  const [img, setImg] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [error, setError] = useState('');
  const dragRef = useRef(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const baseScale = img ? Math.max(FRAME_W / img.w, FRAME_H / img.h) : 1;
  const scale = baseScale * zoom;

  const clamp = (x, y, s = scale) => {
    if (!img) return { x, y };
    const minX = FRAME_W - img.w * s;
    const minY = FRAME_H - img.h * s;
    return { x: Math.min(0, Math.max(minX, x)), y: Math.min(0, Math.max(minY, y)) };
  };

  const handleLoad = (e) => {
    const el = e.currentTarget;
    const w = el.naturalWidth;
    const h = el.naturalHeight;
    const s = Math.max(FRAME_W / w, FRAME_H / h);
    setImg({ el, w, h });
    setZoom(1);
    setPos({ x: (FRAME_W - w * s) / 2, y: (FRAME_H - h * s) / 2 });
  };

  const handleZoom = (e) => {
    const nextZoom = Number(e.target.value);
    const nextScale = baseScale * nextZoom;
    const cx = (FRAME_W / 2 - pos.x) / scale;
    const cy = (FRAME_H / 2 - pos.y) / scale;
    setZoom(nextZoom);
    setPos(clamp(FRAME_W / 2 - cx * nextScale, FRAME_H / 2 - cy * nextScale, nextScale));
  };

  const handlePointerDown = (e) => {
    if (!img) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origin: pos };
  };

  const handlePointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    setPos(clamp(drag.origin.x + e.clientX - drag.startX, drag.origin.y + e.clientY - drag.startY));
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleDone = () => {
    if (!img) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUT_W;
    canvas.height = OUT_H;
    const ctx = canvas.getContext('2d');
    const sx = -pos.x / scale;
    const sy = -pos.y / scale;
    ctx.drawImage(img.el, sx, sy, FRAME_W / scale, FRAME_H / scale, 0, 0, OUT_W, OUT_H);
    canvas.toBlob(
      (blob) => {
        if (blob) onDone(blob, URL.createObjectURL(blob));
        else setError('사진을 자르지 못했습니다. 다른 사진으로 시도해 주세요.');
      },
      'image/jpeg',
      0.9
    );
  };

  return (
    <div className="cropper">
      <div
        className="cropper-frame"
        style={{ width: FRAME_W, height: FRAME_H }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {src && (
          <img
            src={src}
            alt="자를 사진"
            className="cropper-image"
            draggable={false}
            onLoad={handleLoad}
            onError={() => setError('이 사진은 열 수 없습니다. JPG 또는 PNG 사진을 골라 주세요.')}
            style={
              img
                ? { width: img.w * scale, height: img.h * scale, transform: `translate(${pos.x}px, ${pos.y}px)` }
                : { visibility: 'hidden' }
            }
          />
        )}
      </div>

      <label className="cropper-zoom">
        <span>확대</span>
        <input type="range" min="1" max={MAX_ZOOM} step="0.01" value={zoom} onChange={handleZoom} disabled={!img} />
      </label>
      <p className="field-hint">사진을 끌어서 위치를 맞추세요. (3:4 비율로 잘립니다)</p>

      {error && <div className="form-error" role="alert">{error}</div>}

      <div className="actions actions--top">
        <button type="button" className="cyber-button" onClick={onCancel}>취소</button>
        <button type="button" className="cyber-button" onClick={handleDone} disabled={!img}>자르기</button>
      </div>
    </div>
  );
}
