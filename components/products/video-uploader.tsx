'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Film, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { getPresignedUpload, uploadFileToPresignedUrl } from '@/lib/products-api';
import { parseApiError } from '@/lib/format';
import { cn } from '@/lib/utils';

const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED = ['video/mp4', 'video/webm', 'video/quicktime'];

interface Props {
  value: string;
  onChange: (url: string) => void;
}

export function VideoUploader({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      toast.error('Unsupported video type. MP4, WebM, or MOV.');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error('Video too large — 50MB max.');
      return;
    }
    setUploading(true);
    try {
      const presigned = await getPresignedUpload(file);
      const publicUrl = await uploadFileToPresignedUrl(file, presigned);
      onChange(publicUrl);
    } catch (err) {
      toast.error(parseApiError(err, 'Upload failed'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function clear() {
    onChange('');
  }

  return (
    <div className="space-y-3">
      {value ? (
        <div className="group relative aspect-video overflow-hidden rounded-md border border-border bg-muted">
          <video
            src={value}
            className="h-full w-full object-cover"
            muted
            playsInline
            controls
            preload="metadata"
          />
          <button
            type="button"
            onClick={clear}
            className="absolute right-2 top-2 rounded-full bg-background/80 p-1 opacity-0 transition group-hover:opacity-100"
            aria-label="Remove video"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            'flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/40 text-muted-foreground transition hover:bg-muted',
            uploading && 'opacity-50',
          )}
        >
          {uploading ? (
            <span className="text-xs">Uploading…</span>
          ) : (
            <>
              <Film className="size-7" />
              <span className="text-xs">Add video</span>
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(',')}
        className="hidden"
        onChange={handleFile}
      />
      <p className="text-xs text-muted-foreground">
        <Upload className="mr-1 inline size-3" />
        One video, up to 50MB. MP4, WebM, MOV.
      </p>
    </div>
  );
}
