'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Icon } from './Icon';

const SWIPE_THRESHOLD = 40;

/**
 * Fills its relative/aspect-ratio parent. Tap the right half to advance, the
 * left half to go back; drag also works. Taps are suppressed after a real
 * drag so browsing photos doesn't also trigger a parent <Link>'s navigation.
 */
export function PhotoCarousel({ photos, alt }: { photos: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const dragStartX = useRef<number | null>(null);
  const wasDrag = useRef(false);
  const [dragDx, setDragDx] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-brand-300">
        <Icon name="person" size={48} />
      </div>
    );
  }

  function goTo(next: number) {
    setIndex(Math.max(0, Math.min(next, photos.length - 1)));
  }

  function onPointerDown(e: React.PointerEvent) {
    dragStartX.current = e.clientX;
    wasDrag.current = false;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (dragStartX.current === null) return;
    const dx = e.clientX - dragStartX.current;
    if (Math.abs(dx) > 8) wasDrag.current = true;
    setDragDx(dx);
  }

  function endDrag() {
    if (Math.abs(dragDx) > SWIPE_THRESHOLD) {
      goTo(index + (dragDx < 0 ? 1 : -1));
    }
    dragStartX.current = null;
    setDragDx(0);
  }

  function onClick(e: React.MouseEvent) {
    if (wasDrag.current) {
      e.preventDefault();
      return;
    }
    if (photos.length < 2) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const tappedRight = e.clientX - rect.left > rect.width / 2;
    goTo(index + (tappedRight ? 1 : -1));
  }

  return (
    <div
      className="absolute inset-0 select-none"
      style={{ touchAction: 'pan-y' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={onClick}
    >
      <Image src={photos[index]} alt={`${alt} photo ${index + 1}`} fill sizes="480px" className="object-cover" />

      {photos.length > 1 && (
        <div className="absolute inset-x-2 top-2 flex gap-1">
          {photos.map((_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i === index ? 'bg-white' : 'bg-white/40'}`} />
          ))}
        </div>
      )}
    </div>
  );
}
