import { useState, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Download, FileText, Eye, Code, Maximize2, Minimize2, FileType, FileImage, Upload, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { asBlob } from 'html-docx-js-typescript';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const SAMPLE_TEMPLATES = {
  readme: `# Project Name ✨

A brief description of what this project does and who it's for.

## Installation

\`\`\`bash
npm install my-project
cd my-project
npm start
\`\`\`

## Usage

\`\`\`javascript
import { MyComponent } from 'my-project';

function App() {
  return <MyComponent title="Hello World" />;
}
\`\`\`

## Features

- 🚀 Fast and lightweight
- 📦 Easy to install
- 🎨 Customizable themes
- 📱 Mobile responsive

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

## License

[MIT](https://choosealicense.com/licenses/mit/)
`,

  blogPost: `# How to Build Amazing Web Applications

*Published on January 29, 2026 • 5 min read*

---

In today's fast-paced digital world, creating stunning web applications has never been more accessible. Let me share my journey and the lessons I've learned along the way.

## The Beginning

> "The journey of a thousand miles begins with a single step." — Lao Tzu

When I first started coding, everything seemed overwhelming. The syntax, the frameworks, the endless possibilities...

## Key Takeaways

1. **Start Small** - Don't try to build Facebook on day one
2. **Learn by Doing** - Theory is important, but practice is essential
3. **Embrace Failure** - Every bug is a learning opportunity

## Code That Changed My Life

\`\`\`python
def never_give_up():
    while True:
        try:
            succeed()
            break
        except Failure:
            learn_and_retry()
\`\`\`

## Conclusion

The path to becoming a great developer is paved with curiosity, persistence, and lots of coffee ☕

---

*Thanks for reading! Follow me for more content.*
`,

  documentation: `# API Documentation

## Overview

This document describes the REST API endpoints available in our service.

## Authentication

All API requests require an API key passed in the header:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Endpoints

### Get All Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | \`/api/users\` | Retrieve all users |
| GET | \`/api/users/:id\` | Retrieve single user |
| POST | \`/api/users\` | Create new user |
| DELETE | \`/api/users/:id\` | Delete user |

### Request Example

\`\`\`json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "admin"
}
\`\`\`

### Response

\`\`\`json
{
  "success": true,
  "data": {
    "id": "usr_123",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-01-29T10:00:00Z"
  }
}
\`\`\`

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Internal Server Error |

## Rate Limiting

- **Free tier**: 100 requests/hour
- **Pro tier**: 10,000 requests/hour

---

For support, contact api-support@example.com
`
};

interface MarkdownEditorProps {
  className?: string;
}

export const MarkdownEditor = ({ className }: MarkdownEditorProps) => {
  const [markdown, setMarkdown] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  const charCount = markdown.length;
  const lineCount = markdown.split('\n').length;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const mdFile = files.find(file => 
      file.name.endsWith('.md') || 
      file.name.endsWith('.markdown') || 
      file.type === 'text/markdown'
    );

    if (mdFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setMarkdown(content);
        toast.success(`Loaded ${mdFile.name}`);
      };
      reader.onerror = () => {
        toast.error('Failed to read file');
      };
      reader.readAsText(mdFile);
    } else if (files.length > 0) {
      toast.error('Please drop a .md or .markdown file');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setMarkdown(content);
        toast.success(`Loaded ${file.name}`);
      };
      reader.onerror = () => {
        toast.error('Failed to read file');
      };
      reader.readAsText(file);
    }
  }, []);

  const handleDownloadMd = useCallback(() => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Markdown file downloaded!');
  }, [markdown]);

  const getStyledHtmlContent = useCallback(() => {
    const htmlContent = document.querySelector('.markdown-preview')?.innerHTML || '';
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; color: #333; }
    h1 { font-size: 2rem; margin-bottom: 1rem; border-bottom: 2px solid #f59e0b; padding-bottom: 0.5rem; }
    h2 { font-size: 1.5rem; margin-top: 1.5rem; margin-bottom: 0.75rem; }
    h3 { font-size: 1.25rem; margin-top: 1.25rem; margin-bottom: 0.5rem; }
    p { margin-bottom: 1rem; }
    pre { background: #1e1e1e; color: #d4d4d4; padding: 1rem; border-radius: 8px; overflow-x: auto; margin: 1rem 0; }
    code { background: #f0f0f0; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: 'Fira Code', monospace; }
    pre code { background: transparent; padding: 0; }
    blockquote { border-left: 4px solid #f59e0b; padding-left: 1rem; margin: 1rem 0; color: #666; font-style: italic; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #ddd; padding: 0.5rem 1rem; text-align: left; }
    th { background: #f5f5f5; font-weight: 600; }
    ul, ol { margin-bottom: 1rem; padding-left: 1.5rem; }
    li { margin-bottom: 0.25rem; }
    img { max-width: 100%; height: auto; }
    hr { border: none; border-top: 1px solid #ddd; margin: 2rem 0; }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`;
  }, []);

  const handleDownloadHtml = useCallback(() => {
    const fullHtml = getStyledHtmlContent();
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('HTML file downloaded!');
  }, [getStyledHtmlContent]);

  const handleDownloadPdf = useCallback(() => {
    const htmlContent = getStyledHtmlContent();
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to download PDF');
      return;
    }
    
    printWindow.document.write(`
      ${htmlContent.replace('</head>', `
        <style>
          @media print {
            body { margin: 0; padding: 20px; }
            @page { margin: 15mm; }
          }
        </style>
      </head>`)}
    `);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };
    
    toast.success('Print dialog opened - select "Save as PDF"');
  }, [getStyledHtmlContent]);

  const handleDownloadDocx = useCallback(async () => {
    const htmlContent = getStyledHtmlContent();
    
    try {
      const blob = await asBlob(htmlContent) as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document.docx';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('DOCX file downloaded!');
    } catch (err) {
      toast.error('Failed to generate DOCX');
    }
  }, [getStyledHtmlContent]);

  const handleClear = useCallback(() => {
    setMarkdown('');
    toast.success('Editor cleared!');
  }, []);

  const loadTemplate = useCallback((template: keyof typeof SAMPLE_TEMPLATES) => {
    setMarkdown(SAMPLE_TEMPLATES[template]);
    toast.success('Template loaded!');
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Handle fullscreen change events
  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  // Add fullscreen event listener
  useState(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  });

  // Resizable panel handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Clamp between 20% and 80%
    setLeftPanelWidth(Math.min(80, Math.max(20, newWidth)));
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add mouse event listeners for resizing
  useState(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  });

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col h-screen bg-background ${className || ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,text/markdown"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/90 border-2 border-dashed border-primary rounded-lg">
          <div className="text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
            <p className="text-xl font-semibold text-foreground">Drop your .md file here</p>
            <p className="text-sm text-muted-foreground mt-1">Release to load the file</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-toolbar-bg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">MarkdownPro</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-3 mr-4">
            <span className="stats-badge">{wordCount} words</span>
            <span className="stats-badge">{charCount} chars</span>
            <span className="stats-badge">{lineCount} lines</span>
          </div>

          {/* Sample Templates Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="toolbar-btn flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Templates</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-toolbar-bg border-border">
              <DropdownMenuItem onClick={() => loadTemplate('readme')} className="cursor-pointer">
                📦 README Template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => loadTemplate('blogPost')} className="cursor-pointer">
                ✍️ Blog Post Template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => loadTemplate('documentation')} className="cursor-pointer">
                📚 API Documentation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Upload Button */}
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="toolbar-btn flex items-center gap-1.5"
            title="Upload .md file or drag & drop"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </button>

          <button onClick={handleClear} className="toolbar-btn">
            Clear
          </button>
          <button onClick={handleDownloadMd} className="toolbar-btn flex items-center gap-1.5">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">.md</span>
          </button>
          <button onClick={handleDownloadHtml} className="toolbar-btn flex items-center gap-1.5">
            <Code className="w-4 h-4" />
            <span className="hidden sm:inline">.html</span>
          </button>
          <button onClick={handleDownloadPdf} className="toolbar-btn flex items-center gap-1.5">
            <FileImage className="w-4 h-4" />
            <span className="hidden sm:inline">.pdf</span>
          </button>
          <button onClick={handleDownloadDocx} className="toolbar-btn flex items-center gap-1.5">
            <FileType className="w-4 h-4" />
            <span className="hidden sm:inline">.docx</span>
          </button>
          <button 
            onClick={toggleFullscreen} 
            className="toolbar-btn ml-2"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Editor Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Editor Panel */}
        <div 
          className="flex flex-col min-w-0"
          style={{ width: `${leftPanelWidth}%` }}
        >
          <div className="panel-header">
            <span className="panel-title flex items-center gap-2">
              <Code className="w-4 h-4" />
              Markdown
            </span>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {markdown === '' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="text-center text-muted-foreground">
                  <Upload className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Start typing or drag & drop a .md file</p>
                  <p className="text-xs mt-1 opacity-70">Or use Templates to load sample content</p>
                </div>
              </div>
            )}
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="editor-textarea flex-1 relative z-0"
              placeholder=""
              spellCheck={false}
            />
          </div>
        </div>

        {/* Resizable Divider */}
        <div 
          className={`pane-divider cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors ${isResizing ? 'bg-primary' : ''}`}
          onMouseDown={handleMouseDown}
          title="Drag to resize"
        />

        {/* Preview Panel */}
        <div 
          className="flex flex-col min-w-0"
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          <div className="panel-header">
            <span className="panel-title flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </span>
          </div>
          <div className="markdown-preview flex-1 overflow-auto">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        borderRadius: '0.5rem',
                        fontSize: '13px',
                      }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Mobile Stats Footer */}
      <div className="md:hidden flex items-center justify-center gap-4 py-2 border-t border-border bg-toolbar-bg">
        <span className="stats-badge">{wordCount} words</span>
        <span className="stats-badge">{charCount} chars</span>
        <span className="stats-badge">{lineCount} lines</span>
      </div>
    </div>
  );
};
