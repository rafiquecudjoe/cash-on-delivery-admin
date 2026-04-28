'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getPresignedUpload, uploadFileToPresignedUrl } from '@/lib/products-api';
import { parseApiError } from '@/lib/format';
import { cn } from '@/lib/utils';

const MAX_FILES = 5;
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
}

export function ImageUploader({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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
      for (const file of files) {
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

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {value.map((url, i) => (
          <div
            key={url}
            className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute right-1 top-1 rounded-full bg-background/80 p-1 opacity-0 transition group-hover:opacity-100"
              aria-label="Remove image"
            >
              <X className="size-4" />
            </button>
          </div>
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
        Max {MAX_FILES} images, up to 5MB each. JPG, PNG, WebP, AVIF, GIF.
      </p>
    </div>
  );
}
