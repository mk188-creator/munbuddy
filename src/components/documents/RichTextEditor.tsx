import { useCallback, useEffect, useRef } from "react";
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
};

const actions = [
  { command: "bold", label: "Bold", icon: Bold },
  { command: "italic", label: "Italic", icon: Italic },
  { command: "underline", label: "Underline", icon: UnderlineIcon },
  { command: "formatBlock:<h1>", label: "Heading 1", icon: Heading1 },
  { command: "formatBlock:<h2>", label: "Heading 2", icon: Heading2 },
  { command: "insertUnorderedList", label: "Bulleted list", icon: List },
  { command: "insertOrderedList", label: "Numbered list", icon: ListOrdered },
  { command: "formatBlock:<blockquote>", label: "Quote", icon: Quote },
  { command: "undo", label: "Undo", icon: Undo2 },
  { command: "redo", label: "Redo", icon: Redo2 },
];

/**
 * Lightweight contentEditable editor. Stores HTML so exports keep structure.
 */
export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!ref.current || hydrated.current) return;
    hydrated.current = true;
    ref.current.innerHTML = value || "";
  }, [value]);

  const run = useCallback((command: string) => {
    const editor = ref.current;
    if (!editor) return;
    editor.focus();
    if (command.startsWith("formatBlock:")) {
      document.execCommand("formatBlock", false, command.split(":")[1]);
    } else {
      document.execCommand(command);
    }
    onChange(editor.innerHTML);
  }, [onChange]);

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border/70 bg-background/40 px-2 py-1.5">
        {actions.map((action) => (
          <Button
            key={action.command}
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={action.label}
            title={action.label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(action.command)}
          >
            <action.icon className="size-4" />
          </Button>
        ))}
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Document body"
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        className="prose-editor min-h-[26rem] px-6 py-5 text-sm leading-relaxed outline-none"
      />
    </div>
  );
}
