import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Code,
} from 'lucide-react';

const MenuButton = ({ onClick, isActive, disabled, children, title }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 sm:p-1.5 rounded transition-colors touch-manipulation ${
      isActive
        ? 'bg-primary-100 text-primary-700'
        : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);

const Divider = () => (
  <div className="w-px h-6 bg-gray-300 mx-0.5 sm:mx-1 hidden sm:block" />
);

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 sm:gap-1 p-1.5 sm:p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      {/* History */}
      <MenuButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo className="w-4 h-4" />
      </MenuButton>

      <Divider />

      {/* Headings */}
      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="w-4 h-4" />
      </MenuButton>

      <Divider />

      {/* Text formatting */}
      <MenuButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline"
      >
        <UnderlineIcon className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Code"
      >
        <Code className="w-4 h-4" />
      </MenuButton>

      <Divider />

      {/* Lists */}
      <MenuButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </MenuButton>

      <Divider />

      {/* Alignment - Hidden on very small screens */}
      <div className="hidden xs:contents">
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </MenuButton>

        <Divider />
      </div>

      {/* Link */}
      <MenuButton
        onClick={setLink}
        isActive={editor.isActive('link')}
        title="Add Link"
      >
        <LinkIcon className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive('link')}
        title="Remove Link"
      >
        <Unlink className="w-4 h-4" />
      </MenuButton>
    </div>
  );
};

const RichTextEditor = ({ content, onChange, placeholder = 'Start writing...' }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary-600 underline',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none p-3 sm:p-4 min-h-[150px] sm:min-h-[200px] focus:outline-none',
      },
    },
  });

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
