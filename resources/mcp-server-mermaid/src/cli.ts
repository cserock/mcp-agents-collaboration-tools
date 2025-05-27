#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { generateMermaidInkUrl } from "./index.js";
import os from 'os';
import path from 'path';
import fs from 'fs/promises';

// Define tool input schema
const MermaidToolSchema = z.object({
    mermaid: z.string().describe("Mermaid diagram code content"),
    type: z.enum(['jpeg', 'png', 'webp', 'svg', 'pdf']).default('svg').describe(
        "Output format:\n" +
        "- jpeg: JPEG image format\n" +
        "- png: PNG image format\n" +
        "- webp: WebP image format\n" +
        "- svg: SVG vector format (default)\n" +
        "- pdf: PDF document format"
    ),
    theme: z.enum(['default', 'neutral', 'dark', 'forest']).default('default').describe(
        "Theme setting:\n" +
        "- default: Default theme for general use\n" +
        "- neutral: Neutral theme suitable for black and white printing\n" +
        "- dark: Dark theme for dark backgrounds\n" +
        "- forest: Forest theme with green color scheme"
    ),
    bgColor: z.string().optional().describe(
        "Background color:\n" +
        "- Hex color code (e.g., 'FF0000' for red)\n" +
        "- Named color with '!' prefix (e.g., '!white')"
    ),
    width: z.number().optional().describe(
        "Image width in pixels\n" +
        "Required for using scale parameter"
    ),
    height: z.number().optional().describe(
        "Image height in pixels\n" +
        "Required for using scale parameter"
    ),
    scale: z.number().min(1).max(3).optional().describe(
        "Scale factor (1-3)\n" +
        "Only effective when width or height is set"
    ),
    fit: z.boolean().optional().describe(
        "PDF auto-fit:\n" +
        "- When true, PDF will automatically adjust to diagram size\n" +
        "- Only effective for PDF output"
    ),
    paper: z.string().optional().describe(
        "PDF paper size (e.g., 'a4', 'a3', 'letter')\n" +
        "Only effective for PDF output when fit=false"
    ),
    landscape: z.boolean().optional().describe(
        "PDF landscape mode:\n" +
        "- When true, PDF will use landscape orientation\n" +
        "- Only effective for PDF output when fit=false"
    )
});

const MermaidToFileSchema = MermaidToolSchema.extend({
    filename: z.string().describe("Output filename (with or without extension)")
});

const MermaidSvgSchema = z.object({
    mermaid: z.string().describe("Mermaid diagram code content"),
    theme: z.enum(['default', 'neutral', 'dark', 'forest']).default('default').describe(
        "Theme setting:\n" +
        "- default: Default theme for general use\n" +
        "- neutral: Neutral theme suitable for black and white printing\n" +
        "- dark: Dark theme for dark backgrounds\n" +
        "- forest: Forest theme with green color scheme"
    ),
    bgColor: z.string().optional().describe(
        "Background color:\n" +
        "- Hex color code (e.g., 'FF0000' for red)\n" +
        "- Named color with '!' prefix (e.g., '!white')"
    ),
    width: z.number().optional().describe(
        "Image width in pixels\n" +
        "Required for using scale parameter"
    ),
    height: z.number().optional().describe(
        "Image height in pixels\n" +
        "Required for using scale parameter"
    ),
    scale: z.number().min(1).max(3).optional().describe(
        "Scale factor (1-3)\n" +
        "Only effective when width or height is set"
    )
});

const PingSchema = z.object({});

enum ToolName {
    MERMAID_URL = "mermaid-to-url",
    // MERMAID_FILE = "mermaid-to-file",
    // MERMAID_SVG = "mermaid-to-svg"
}

async function downloadAndSaveFile(url: string, filename: string, type: string): Promise<string> {
    let fullPath: string;
    
    // Check if filename is an absolute path
    if (path.isAbsolute(filename)) {
        fullPath = filename;
        // Add extension if needed
        const ext = path.extname(fullPath);
        if (!ext || ext.slice(1) !== type) {
            fullPath = `${fullPath}.${type}`;
        }
    } else {
        // Get system downloads directory for relative paths
        const downloadDir = path.join(os.homedir(), 'Downloads');
        
        // Handle filename and extension
        let finalFilename = filename;
        const ext = path.extname(filename);
        if (!ext || ext.slice(1) !== type) {
            finalFilename = `${filename}.${type}`;
        }
        
        fullPath = path.join(downloadDir, finalFilename);
    }
    
    // Ensure the directory exists
    const directory = path.dirname(fullPath);
    await fs.mkdir(directory, { recursive: true });
    
    // Check if file already exists
    try {
        await fs.access(fullPath);
        throw new Error(`File ${path.basename(fullPath)} already exists in target location`);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw error;
        }
    }
    
    // Download file
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    await fs.writeFile(fullPath, Buffer.from(buffer));
    
    return path.basename(fullPath);
}

async function fetchSvgContent(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch SVG: ${response.statusText}`);
    }
    return await response.text();
}

// Create MCP server
export const createServer = () => {
    const server = new Server(
        {
            name: "mcp-mermaid-img",
            version: "1.0.0",
        },
        {
            capabilities: {
                tools: {},
            },
        }
    );

    // Register tool
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: [
            {
                name: ToolName.MERMAID_URL,
                description: "Convert Mermaid diagram code to image URL. " +
                "This tool generates a URL that can be used to:\n" +
                "1. Display the diagram directly in AI/LLM responses\n" +
                "2. Download and save the diagram as an image file\n" +
                "3. Share the diagram through the generated URL\n" +
                "\nNote: For SVG format, it's recommended to use the mermaid-to-svg tool instead " +
                "as it provides direct access to the SVG content.\n" +
                "\nSupports multiple output formats (SVG, PNG, JPEG, WebP, PDF) " +
                "and customization options like themes, colors, and dimensions.",
                // @ts-ignore
                inputSchema: zodToJsonSchema(MermaidToolSchema) as any,
            },
            // {
            //     name: ToolName.MERMAID_FILE,
            //     description: "Convert Mermaid diagram code to image and save to Downloads folder or specified absolute path. " +
            //     "This tool generates an image file from the diagram and saves it to the system Downloads folder or a specified absolute path.\n" +
            //     "The filename can be provided with or without extension - if the extension is missing or doesn't match " +
            //     "the output format, the correct extension will be automatically added.",
            //     inputSchema: zodToJsonSchema(MermaidToFileSchema) as any,
            // },
            // {
            //     name: ToolName.MERMAID_SVG,
            //     description: "Convert Mermaid diagram code to SVG content. " +
            //     "This tool is the recommended way to get SVG output as it provides direct access to the SVG markup, " +
            //     "which can be used for:\n" +
            //     "1. Direct embedding in HTML/XML documents\n" +
            //     "2. Further SVG manipulation or styling\n" +
            //     "3. Vector-based scaling without quality loss\n" +
            //     "\nThe tool returns the raw SVG content as a string, making it ideal for " +
            //     "any use case requiring vector graphics or SVG manipulation.",
            //     inputSchema: zodToJsonSchema(MermaidSvgSchema) as any,
            // }
            ],
        };
    });

    // Handle tool calls
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;

        if (name === ToolName.MERMAID_URL) {
            const validatedArgs = MermaidToolSchema.parse(args);
            const url = generateMermaidInkUrl(validatedArgs.mermaid, {
                type: validatedArgs.type,
                theme: validatedArgs.theme,
                bgColor: validatedArgs.bgColor,
                width: validatedArgs.width,
                height: validatedArgs.height,
                scale: validatedArgs.scale,
                fit: validatedArgs.fit,
                paper: validatedArgs.paper,
                landscape: validatedArgs.landscape,
            });

            return {
                content: [
                    {
                        type: "text",
                        text: url,
                    },
                ],
            };
        }

        // if (name === ToolName.MERMAID_FILE) {
        //     const validatedArgs = MermaidToFileSchema.parse(args);
        //     const url = generateMermaidInkUrl(validatedArgs.mermaid, {
        //         type: validatedArgs.type,
        //         theme: validatedArgs.theme,
        //         bgColor: validatedArgs.bgColor,
        //         width: validatedArgs.width,
        //         height: validatedArgs.height,
        //         scale: validatedArgs.scale,
        //         fit: validatedArgs.fit,
        //         paper: validatedArgs.paper,
        //         landscape: validatedArgs.landscape,
        //     });

        //     try {
        //         const savedFilename = await downloadAndSaveFile(url, validatedArgs.filename, validatedArgs.type);
        //         return {
        //             content: [
        //                 {
        //                     type: "text",
        //                     text: `Image successfully saved as: ${savedFilename}`,
        //                 },
        //             ],
        //         };
        //     } catch (error) {
        //         throw new Error(`Failed to save file: ${(error as Error).message}`);
        //     }
        // }

        // if (name === ToolName.MERMAID_SVG) {
        //     const validatedArgs = MermaidSvgSchema.parse(args);
        //     const url = generateMermaidInkUrl(validatedArgs.mermaid, {
        //         type: 'svg',
        //         theme: validatedArgs.theme,
        //         bgColor: validatedArgs.bgColor,
        //         width: validatedArgs.width,
        //         height: validatedArgs.height,
        //         scale: validatedArgs.scale,
        //     });

        //     try {
        //         const svgContent = await fetchSvgContent(url);
        //         return {
        //             content: [
        //                 {
        //                     type: "text",
        //                     text: svgContent,
        //                 },
        //             ],
        //         };
        //     } catch (error) {
        //         throw new Error(`Failed to fetch SVG content: ${(error as Error).message}`);
        //     }
        // }

        throw new Error(`Unknown tool: ${name}`);
    });

    return server;
};

// CLI entry point
// if (process.argv[1] === import.meta.url) {
    const main = async () => {
        const transport = new StdioServerTransport();
        const server = createServer();
        
        await server.connect(transport);

        // Cleanup handler
        process.on("SIGINT", async () => {
            await server.close();
            process.exit(0);
        });
    };

    main().catch((error) => {
        console.error("Server error:", error);
        process.exit(1);
    });
// }
