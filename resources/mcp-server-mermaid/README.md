# mcp-mermaid-img

Transform Claude's diagrams into beautiful image files! Easily convert Mermaid diagrams into high-quality images 🎨

[繁體中文](README-zhTW.md) | [Español](README-es.md) | [Français](README-fr.md) | [Deutsch](README-de.md) | [Italiano](README-it.md) | [Português](README-pt.md) | [Nederlands](README-nl.md)

## Why This Tool?

When using Claude Desktop, have you encountered these issues:
- Claude can draw beautiful flowcharts, sequence diagrams, Gantt charts...
- But even with mcp-shell, you only save Mermaid code 😅
- Want to share with colleagues or put in presentations, but have to take screenshots (with poor quality)

Don't worry! With mcp-mermaid-img, Claude's diagrams instantly transform into high-quality images!

## Powerful Features

- One-click conversion: Mermaid code → High-quality image URL
- Multiple formats: SVG (ultra-clear), PNG, JPEG, WebP, PDF - your choice
- Fully customizable: Supports various themes, colors, size settings
- Live preview: See the result directly in Claude conversations

## Getting Started

### 🎯 Configure Claude Desktop

1. Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-mermaid-img": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-mermaid-img"
      ]
    }
  }
}
```

2. Restart Claude Desktop, and the tool is ready! 🎉

### 💡 Usage

Just tell Claude: "Convert the current diagram to SVG and save it locally", and it's done in one click!

Claude will automatically:
1. Get the current Mermaid code
2. Use mermaid-to-file tool for conversion
3. Save as SVG file to your downloads folder
4. Show the save result in the conversation

It's that simple! No more worrying about diagrams being stuck in the chat window.

### 🛠️ MCP Tools Description

This package provides three powerful MCP tools:

#### 1. mermaid-to-url
Convert Mermaid diagrams to image URLs. Perfect for:
- Displaying diagrams directly in AI/LLM responses
- Quickly sharing diagram links
- Downloading diagram files

#### 2. mermaid-to-file
Automatically save diagrams to downloads folder or specified path:
- Supports relative paths (to downloads folder) or absolute paths
- Automatic file extension handling
- Prevents overwriting existing files

#### 3. mermaid-to-svg
Specifically for obtaining SVG format diagrams:
- Get SVG source code directly
- Perfect for embedding in web pages or documents
- Convenient for further document processing in AI conversations

---

## For Developers 🔧

Want to use this powerful conversion feature in your own project? No problem!

### 📦 Installation

```bash
npm install mcp-mermaid-img
```

### 💻 Code Example

```typescript
import { generateMermaidInkUrl } from 'mcp-mermaid-img';

// Basic usage
const url = generateMermaidInkUrl('graph TD;A-->B;B-->C;');

// Advanced settings
const url = generateMermaidInkUrl('graph TD;A-->B;B-->C;', {
  type: 'svg',          // Output format
  theme: 'dark',        // Theme style
  bgColor: '!white',    // Background color
  width: 800           // Image width
});
```

### ⚙️ Complete Parameter Description

#### type: Output Format
- `svg`: SVG vector format (default)
  - Best quality, perfect for scaling
  - Ideal for web and presentations
- `jpeg`: JPEG image format
  - Suitable for photo-like diagrams
  - Smaller file size, but may have compression artifacts
- `png`: PNG image format
  - Lossless compression, ideal for line diagrams
  - Optimizes file size while maintaining clarity
- `webp`: WebP image format
  - Best choice for modern web
  - Better compression while maintaining quality
- `pdf`: PDF document format
  - Perfect for printing and document integration
  - Supports special layout settings

#### theme: Theme Style
- `default`: Default theme
  - Universal colors, suitable for most scenarios
  - Clear and readable visual effects
- `neutral`: Neutral theme
  - Black and white colors, suitable for formal occasions
  - Best for printing
- `dark`: Dark theme
  - Dark background, light text
  - Suitable for night mode or dark interfaces
- `forest`: Forest theme
  - Green color scheme
  - Gives a natural, energetic feel

#### bgColor: Background Color
- Supports two formats:
  1. Hexadecimal color code: e.g., `FF0000` (red)
  2. Named colors: use `!` prefix, e.g., `!white`
- Uses theme default if not set

#### width & height: Image Dimensions
- Unit: pixels
- Setting either value triggers auto-scaling
- Recommended to set scale parameter for optimal output quality

#### scale: Scale Ratio
- Range: number between 1 and 3
- Only effective when width or height is set
- Higher value means clearer output image
- Error thrown if out of range

#### PDF-specific Settings
1. fit: Auto-adjust
   - `true`: Diagram auto-fits to page size
   - `false`: Uses specified paper size
2. paper: Paper Size
   - Standard paper sizes: 'a4', 'a3', 'letter', etc.
   - Only effective when fit=false
3. landscape: Landscape Mode
   - `true`: Use landscape layout
   - `false`: Use portrait layout (default)
   - Only effective when fit=false

### 🌟 Features

- Zero dependencies: Lightweight design, no extra baggage
- TypeScript support: Complete type hints for smoother development
- Cross-platform: Works in both browser and Node.js environments
- Flexible design: Supports various customization needs

### 🔄 Complete Interface Definition

```typescript
interface MermaidInkOptions {
  // Output format selection
  type?: 'svg' | 'jpeg' | 'png' | 'webp' | 'pdf';
  
  // Theme style setting
  theme?: 'default' | 'neutral' | 'dark' | 'forest';
  
  // Background color (hex or named color)
  bgColor?: string;
  
  // Image dimension settings (pixels)
  width?: number;
  height?: number;
  
  // Scale ratio (1-3)
  scale?: number;
  
  // PDF-specific settings
  fit?: boolean;        // Auto-adjust size
  paper?: string;       // Paper size
  landscape?: boolean;  // Landscape mode
}
```

## License

MIT License - Feel free to use, happy developing!
