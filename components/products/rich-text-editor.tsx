'use client';

import { useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Quote,
  Palette,
  Undo2,
  Redo2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Curated palette — brand-aligned plus a few common emphasis colors.
// Admin can also pick any hex via the native color input below.
const PRESET_COLORS = [
  { hex: '#1A1A1A', label: 'Default' },
  { hex: '#D97757', label: 'Accent' },
  { hex: '#DC2626', label: 'Red' },
  { hex: '#16A34A', label: 'Green' },
  { hex: '#2563EB', label: 'Blue' },
  { hex: '#9333EA', label: 'Purple' },
  { hex: '#CA8A04', label: 'Gold' },
];

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

/**
 * Tiptap rich-text editor for product descriptions. Output is HTML
 * (sanitized server-side before render). Toolbar covers the formatting
 * options the public PDP CSS knows about — anything else is stripped
 * by the sanitizer, so adding more buttons without matching CSS is a
 * silent no-op.
 */
export function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
    ],
    content: value || '',
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[140px] px-3 py-2.5 outline-none focus:outline-none',
      },
    },
  });

  if (!editor) {
    return (
      <div className="rounded-md border border-input bg-card px-3 py-3 text-sm text-muted-foreground">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-input bg-card focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border-subtle bg-secondary/40 px-1.5 py-1.5">
      <Btn
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        label="Bold"
      >
        <Bold className="size-3.5" />
      </Btn>
      <Btn
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        label="Italic"
      >
        <Italic className="size-3.5" />
      </Btn>
      <Btn
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        label="Underline"
      >
        <UnderlineIcon className="size-3.5" />
      </Btn>
      <Btn
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        label="Strikethrough"
      >
        <Strikethrough className="size-3.5" />
      </Btn>

      <Sep />

      <Btn
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        label="Heading 2"
      >
        <Heading2 className="size-3.5" />
      </Btn>
      <Btn
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        label="Heading 3"
      >
        <Heading3 className="size-3.5" />
      </Btn>

      <Sep />

      <Btn
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        label="Bullet list"
      >
        <List className="size-3.5" />
      </Btn>
      <Btn
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        label="Numbered list"
      >
        <ListOrdered className="size-3.5" />
      </Btn>
      <Btn
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        label="Quote"
      >
        <Quote className="size-3.5" />
      </Btn>

      <Sep />

      <Btn
        active={editor.isActive('link')}
        onClick={() => {
          const previous = editor.getAttributes('link').href;
          const url = window.prompt('URL (leave blank to remove)', previous ?? '');
          if (url === null) return;
          if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
          }
          editor
            .chain()
            .focus()
            .extendMarkRange('link')
            .setLink({ href: url })
            .run();
        }}
        label="Link"
      >
        <LinkIcon className="size-3.5" />
      </Btn>

      <ColorPickerBtn editor={editor} />

      <Sep />

      <Btn
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        label="Undo"
      >
        <Undo2 className="size-3.5" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        label="Redo"
      >
        <Redo2 className="size-3.5" />
      </Btn>
    </div>
  );
}

/* Color picker — preset palette + native picker for arbitrary hex.
   The current selection's color (from TextStyle/Color marks) seeds
   the swatch outline so admin sees what's active. */
function ColorPickerBtn({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const current: string | undefined = editor.getAttributes('textStyle').color;
  function applyColor(hex: string) {
    if (hex.toUpperCase() === '#1A1A1A') {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(hex).run();
    }
    setOpen(false);
  }
  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Text color"
        title="Text color"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-card hover:text-foreground',
          open && 'bg-accent/15 text-accent',
        )}
      >
        <Palette className="size-3.5" />
        <span
          className="absolute bottom-1 left-1 right-1 h-0.5 rounded-full"
          style={{ background: current || 'currentColor' }}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-card p-2 shadow-md">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              title={c.label}
              aria-label={c.label}
              onClick={() => applyColor(c.hex)}
              className={cn(
                'size-5 rounded-full border transition-transform hover:scale-110',
                current?.toLowerCase() === c.hex.toLowerCase()
                  ? 'border-foreground ring-2 ring-accent ring-offset-1'
                  : 'border-border',
              )}
              style={{ background: c.hex }}
            />
          ))}
          <span className="mx-1 h-4 w-px bg-border-subtle" aria-hidden="true" />
          <input
            type="color"
            value={current ?? '#1A1A1A'}
            onChange={(e) => applyColor(e.target.value)}
            className="size-5 cursor-pointer rounded-full border border-border bg-transparent p-0"
            aria-label="Custom color"
            title="Custom color"
          />
        </div>
      )}
    </div>
  );
}

function Btn({
  active,
  disabled,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40',
        active && 'bg-accent/15 text-accent',
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="mx-1 h-4 w-px bg-border-subtle" aria-hidden="true" />;
}
