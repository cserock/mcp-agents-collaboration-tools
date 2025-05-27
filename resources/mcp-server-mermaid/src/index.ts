// https://mermaid.ink/
// https://mermaid.live/edit
import { serializeState, deserializeState } from './util/serde.js';

// const _mkUriSafe = (src: string) => src
//     .replace(/=/g, '').replace(/[+\/]/g, (m0) => m0 == '+' ? '-' : '_');

/**
 * Mermaid Ink output format
 * - jpeg: JPEG image format (default)
 * - png: PNG image format
 * - webp: WebP image format
 * - svg: SVG vector format
 * - pdf: PDF document format
 */
export type MermaidInkType = 'jpeg' | 'png' | 'webp' | 'svg' | 'pdf';

/**
 * Mermaid theme
 * - default: Default theme for general use
 * - neutral: Neutral theme suitable for black and white printing
 * - dark: Dark theme for dark backgrounds
 * - forest: Forest theme with green color scheme
 */
export type MermaidTheme = 'default' | 'neutral' | 'dark' | 'forest';

/**
 * Mermaid URL type
 * - editor: Mermaid Live Editor URL
 * - ink: Mermaid Ink URL
 */
export type MermaidUrlType = 'editor' | 'ink';

/**
 * Mermaid Ink options interface
 */
export interface MermaidInkOptions {
    /**
     * Output format
     * - jpeg: JPEG image format (default)
     * - png: PNG image format
     * - webp: WebP image format
     * - svg: SVG vector format
     * - pdf: PDF document format
     * @default 'jpeg'
     */
    type?: MermaidInkType;

    /**
     * Theme setting
     * - default: Default theme for general use
     * - neutral: Neutral theme suitable for black and white printing
     * - dark: Dark theme for dark backgrounds
     * - forest: Forest theme with green color scheme
     * @default 'default'
     */
    theme?: MermaidTheme;

    /**
     * Background color
     * - Use hex color code, e.g., 'FF0000' (red)
     * - Use named color with '!' prefix, e.g., '!white'
     */
    bgColor?: string;

    /**
     * Image width in pixels
     * Required for using scale parameter
     */
    width?: number;

    /**
     * Image height in pixels
     * Required for using scale parameter
     */
    height?: number;

    /**
     * Scale factor
     * - Only effective when width or height is set
     * - Value must be between 1 and 3
     */
    scale?: number;

    /**
     * PDF auto-fit
     * - When true, PDF will automatically adjust to diagram size
     * - Only effective for PDF output
     */
    fit?: boolean;

    /**
     * PDF paper size
     * - e.g., 'a4', 'a3', 'letter'
     * - Only effective for PDF output when fit=false
     * @default 'a4'
     */
    paper?: string;

    /**
     * PDF landscape mode
     * - When true, PDF will use landscape orientation
     * - Only effective for PDF output when fit=false
     */
    landscape?: boolean;
}

/**
 * Encode Mermaid diagram content
 * @param data Mermaid diagram content
 * @returns Encoded string
 */
export function encode(mermaid: string): string {
    return serializeState({
        code: mermaid,
        // mermaid: mermaid,
        // updateDiagram: true,
        // autoSync: true,
        // rough: false
    } as any);
}

/**
 * Decode Mermaid encoded string
 * @param encoded Encoded string
 * @returns Decoded Mermaid diagram content
 */
export function decode(encoded: string): string {
    const { code } = deserializeState(encoded);
    return code;
}

/**
 * Extract encoded string from URL
 * @param url Mermaid Live Editor URL or Mermaid Ink URL
 * @returns Encoded string
 * @throws If unable to extract encoded string from URL
 * 
 * @example
 * // Extract from Mermaid Live Editor URL
 * extractEncodedString('https://mermaid.live/edit#pako:eNpNkM9...');
 * 
 * @example
 * // Extract from Mermaid Ink URL
 * extractEncodedString('https://mermaid.ink/img/pako:eNpNkM9...');
 * extractEncodedString('https://mermaid.ink/svg/pako:eNpNkM9...');
 * extractEncodedString('https://mermaid.ink/pdf/pako:eNpNkM9...');
 */
export function extractEncodedString(url: string): string {
    // Check URL type
    const urlType: MermaidUrlType = url.includes('mermaid.live/edit') ? 'editor' : 'ink';

    let match: RegExpMatchArray | null;

    if (urlType === 'editor') {
        // Handle Mermaid Live Editor URL
        match = url.match(/#(?:pako:)?([^#?&\s]+)/);
    } else {
        // Handle Mermaid Ink URL (img/svg/pdf)
        match = url.match(/\/(?:img|svg|pdf)\/(?:pako:)?([^#?&\s]+)/);
    }

    if (!match) {
        throw new Error('Unable to extract encoded string from URL');
    }

    return match[1];
}

/**
 * Generate Mermaid Ink URL
 * @param encodedString Encoded string
 * @param options Options
 * @returns Mermaid Ink URL
 * @throws If scale value is not between 1-3
 */
export function generateMermaidInkUrl(mermaid: string, options: MermaidInkOptions = {}): string {
    const encodedString = encode(mermaid);
    const {
        type = 'svg',
        theme = 'default',
        bgColor,
        width,
        height,
        scale,
        fit,
        paper,
        landscape
    } = options;

    // Determine base URL path based on output type
    // const basePath = ['jpeg', 'png', 'webp'].includes(type) ? 'img' : type;
    const basePath = 'svg';
    const baseUrl = `https://mermaid.ink/${basePath}/${encodedString}`;
    const params: string[] = [];

    // Handle image type
    if (['jpeg', 'png', 'webp'].includes(type)) {
        params.push(`type=${type}`);
    }

    // Handle other options
    if (theme !== 'default') params.push(`theme=${theme}`);
    if (bgColor) params.push(`bgColor=${bgColor}`);
    if (width) params.push(`width=${width}`);
    if (height) params.push(`height=${height}`);
    if (scale && (width || height)) {
        if (scale >= 1 && scale <= 3) {
            params.push(`scale=${scale}`);
        } else {
            throw new Error('Scale must be between 1 and 3');
        }
    }

    // Handle PDF-specific options
    if (type === 'pdf') {
        if (fit) params.push('fit');
        if (paper && !fit) params.push(`paper=${paper}`);
        if (landscape && !fit) params.push('landscape');
    }

    return params.length > 0 ? `${baseUrl}?${params.join('&')}` : baseUrl;
}

/**
 * Convert Mermaid Live Editor URL to Mermaid Ink URL
 * @param editorUrl Mermaid Live Editor URL
 * @param options Options
 * @returns Mermaid Ink URL
 */
export function convertEditorToInkUrl(editorUrl: string, options: MermaidInkOptions = {}): string {
    const encodedString = extractEncodedString(editorUrl);
    return generateMermaidInkUrl(encodedString, options);
}

/**
 * Extract and decode Mermaid diagram content from URL
 * @param url Mermaid Live Editor URL or Mermaid Ink URL
 * @returns Mermaid diagram content
 * @throws If unable to extract or decode content from URL
 * 
 * @example
 * // Decode from Mermaid Live Editor URL
 * const diagram1 = getMermaidFromUrl('https://mermaid.live/edit#pako:eNpNkM9...');
 * 
 * @example
 * // Decode from Mermaid Ink URL
 * const diagram2 = getMermaidFromUrl('https://mermaid.ink/img/pako:eNpNkM9...');
 */
export function getMermaidFromUrl(url: string): string {
    const encodedString = extractEncodedString(url);
    return decode(encodedString);
}
