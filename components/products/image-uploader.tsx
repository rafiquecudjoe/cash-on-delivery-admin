'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import imageCompression from 'browser-image-compression';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Upload, X, Image as ImageIcon, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { getPresignedUpload, uploadFileToPresignedUrl } from '@/lib/products-api';
import { parseApiError } from '@/lib/format';
import { cn } from '@/lib/utils';

const MAX_FILES = 10;
const MAX_SIZE = 5 * 1024 * 1024; // 5MB raw upload before compression
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

// Files smaller than this skip recompression — re-encoding small files
// can actually make them bigger and adds latency.
const SKIP_COMPRESS_BELOW = 200 * 1024; // 200KB

// Long-edge cap. 1600px is plenty for the PDP square stage (~600px
// rendered) and the 4× DPR retina case.
const MAX_DIMENSION = 1600;
const TARGET_QUALITY = 0.82;
const TARGET_TYPE = 'image/webp';

async function compressIfBig(file: File): Promise<File> {
  // GIFs (animated) lose their animation when re-encoded as WebP single
  // frames — pass through as-is. AVIF is already efficient, leave it.
  if (file.type === 'image/gif' || file.type === 'image/avif') return file;
  if (file.size < SKIP_COMPRESS_BELOW) return file;

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: MAX_DIMENSION,
      fileType: TARGET_TYPE,
      initialQuality: TARGET_QUALITY,
      useWebWorker: true,
    });
    const renamed = file.name.replace(/\.[^.]+$/, '') + '.webp';
    return new File([compressed], renamed, {
      type: TARGET_TYPE,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
}

export function ImageUploader({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // 5px activation distance lets the X (remove) button receive plain
  // clicks without starting a drag. Mobile uses TouchSensor with a
  // small delay so a tap-and-hold reads as drag, not a swipe.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    if (value.length + files.length > MAX_FILES) {
      toast.error(`Max ${MAX_FILES} images per product`);
      return;
    }
    for (const f of files) {
      if (!ALLOWED.includes(f.type)) {
        toast.error(`${f.name}: unsupported type`);
        return;
      }
      if (f.size > MAX_SIZE) {
        toast.error(`${f.name}: over 5MB`);
        return;
      }
    }
    setUploading(true);
    const newUrls: string[] = [];
    try {
      for (const raw of files) {
        const file = await compressIfBig(raw);
        const presigned = await getPresignedUpload(file);
        const publicUrl = await uploadFileToPresignedUrl(file, presigned);
        newUrls.push(publicUrl);
      }
      onChange([...value, ...newUrls]);
    } catch (err) {
      toast.error(parseApiError(err, 'Upload failed'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function removeAt(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = value.indexOf(String(active.id));
    const to = value.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    onChange(arrayMove(value, from, to));
  }

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={value} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 gap-3">
            {value.map((url, i) => (
              <SortableImage
                key={url}
                url={url}
                isCover={i === 0}
                onRemove={() => removeAt(i)}
              />
            ))}
            {value.length < MAX_FILES && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className={cn(
                  'flex aspect-square flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/40 text-muted-foreground transition hover:bg-muted',
                  uploading && 'opacity-50',
                )}
              >
                {uploading ? (
                  <span className="text-xs">Uploading…</span>
                ) : (
                  <>
                    <ImageIcon className="size-6" />
                    <span className="text-xs">Add image</span>
                  </>
                )}
              </button>
            )}
          </div>
        </SortableContext>
      </DndContext>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(',')}
        multiple
        className="hidden"
        onChange={handleFiles}
      />
      <p className="text-xs text-muted-foreground">
        <Upload className="mr-1 inline size-3" />
        Up to {MAX_FILES} images · 5MB each · auto-compressed to WebP. Drag to
        reorder — first image is the cover.
      </p>
    </div>
  );
}

/* ============================================================
   SortableImage — one tile in the sortable grid.
   ============================================================ */
function SortableImage({
  url,
  isCover,
  onRemove,
}: {
  url: string;
  isCover: boolean;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: url });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Lift the dragged tile above siblings so the visible cursor preview
    // stays on top of the grid.
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative aspect-square cursor-grab overflow-hidden rounded-md border bg-muted touch-none',
        isDragging
          ? 'cursor-grabbing border-accent shadow-lg opacity-90'
          : 'border-border',
      )}
      {...attributes}
      {...listeners}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="h-full w-full object-cover" />

      {isCover && (
        <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-full bg-foreground/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-background">
          Cover
        </span>
      )}

      <span
        className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-full bg-background/85 p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100"
        aria-hidden="true"
      >
        <GripVertical className="size-3.5" />
      </span>

      {/* Remove button — `onPointerDown` stops dnd-kit from claiming the
          press as drag start, so a click reliably triggers removal. */}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute right-1 top-1 rounded-full bg-background/80 p-1 opacity-0 transition group-hover:opacity-100"
        aria-label="Remove image"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
