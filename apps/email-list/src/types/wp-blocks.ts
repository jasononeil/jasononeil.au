import { z } from 'zod';

// Footnote schema
export const footnoteSchema = z.object({
  id: z.string(),
  content: z.string(),
});

export type Footnote = z.infer<typeof footnoteSchema>;

export const footnotesSchema = z.array(footnoteSchema);

/**
 * Parse footnotes from a JSON string in post metadata
 * @param footnoteJson JSON string from post.meta.footnotes
 * @returns Array of parsed footnotes, or empty array if no footnotes
 */
export function parseFootnotes(footnoteJson?: string): Footnote[] | undefined {
  if (!footnoteJson) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(footnoteJson);
    return footnotesSchema.parse(parsed);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse footnotes: ${error.message}`);
    }
    throw error;
  }
}

// Base attributes that all blocks might have
const baseAttributesSchema = z.object({}).passthrough();

// Base inner block schema (recursive)
const innerBlockSchema: z.ZodType<any> = z.lazy(() => blockSchema);

// Base block schema
const blockSchema = z.object({
  name: z.string(),
  attributes: baseAttributesSchema,
  innerBlocks: z.array(innerBlockSchema).optional(),
});

// Type for core/paragraph
const paragraphAttributesSchema = z
  .object({
    content: z.string(),
    dropCap: z.boolean().optional(),
  })
  .passthrough();

const paragraphBlockSchema = blockSchema.extend({
  name: z.literal('core/paragraph'),
  attributes: paragraphAttributesSchema,
});

// Type for core/heading
const headingAttributesSchema = z
  .object({
    content: z.string(),
    level: z.number().int().min(1).max(6),
  })
  .passthrough();

const headingBlockSchema = blockSchema.extend({
  name: z.literal('core/heading'),
  attributes: headingAttributesSchema,
});

// Type for core/preformatted
const preformattedAttributesSchema = z.object({
  content: z.string(),
});
const preformattedBlockSchema = blockSchema.extend({
  name: z.literal('core/preformatted'),
  attributes: preformattedAttributesSchema,
});

// Type for core/image
const imageAttributesSchema = z
  .object({
    url: z.string().url(),
    alt: z.string().optional(),
    caption: z.string().optional(),
    id: z.number().optional(),
    href: z.string().url().optional(),
    linkDestination: z.string().optional(),
    sizeSlug: z.string().optional(),
    width: z.union([z.string(), z.number()]).optional(),
    height: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

const imageBlockSchema = blockSchema.extend({
  name: z.literal('core/image'),
  attributes: imageAttributesSchema,
});

// Type for core/list-item
const listItemAttributesSchema = z
  .object({
    content: z.string(),
  })
  .passthrough();

const listItemBlockSchema = blockSchema.extend({
  name: z.literal('core/list-item'),
  attributes: listItemAttributesSchema,
});

// Type for core/list
const listAttributesSchema = z
  .object({
    ordered: z.boolean().optional(),
    values: z.string().optional(),
  })
  .passthrough();

const listBlockSchema = blockSchema.extend({
  name: z.literal('core/list'),
  attributes: listAttributesSchema,
  innerBlocks: z.array(listItemBlockSchema).optional(),
});

// Type for core/quote
const quoteAttributesSchema = z
  .object({
    citation: z.string().optional(),
    value: z.string().optional(),
  })
  .passthrough();

const quoteBlockSchema = blockSchema.extend({
  name: z.literal('core/quote'),
  attributes: quoteAttributesSchema,
  innerBlocks: z.array(innerBlockSchema).optional(),
});

// Type for core/pullquote
const pullquoteAttributesSchema = z
  .object({
    value: z.string(),
  })
  .passthrough();

const pullquoteBlockSchema = blockSchema.extend({
  name: z.literal('core/pullquote'),
  attributes: pullquoteAttributesSchema,
});

// Type for core/separator
const separatorAttributesSchema = z
  .object({
    opacity: z.string().optional(),
  })
  .passthrough();

const separatorBlockSchema = blockSchema.extend({
  name: z.literal('core/separator'),
  attributes: separatorAttributesSchema,
});

// Type for core/embed
const embedAttributesSchema = z
  .object({
    url: z.string().url(),
    type: z.string().optional(),
    providerNameSlug: z.string().optional(),
    responsive: z.boolean().optional(),
    className: z.string().optional(),
  })
  .passthrough();

const embedBlockSchema = blockSchema.extend({
  name: z.literal('core/embed'),
  attributes: embedAttributesSchema,
});

// Type for core/video
const videoAttributesSchema = z
  .object({
    src: z.string().url(),
    id: z.number().optional(),
    caption: z.string().optional(),
    controls: z.string().optional(),
    loop: z.string().optional(),
    preload: z.string().optional(),
    tracks: z.array(z.any()).optional(),
  })
  .passthrough();

const videoBlockSchema = blockSchema.extend({
  name: z.literal('core/video'),
  attributes: videoAttributesSchema,
});

// Type for core/table cell
const tableCellSchema = z.object({
  content: z.string(),
  tag: z.enum(['td', 'th']),
});

// Type for table row
const tableRowSchema = z.object({
  cells: z.array(tableCellSchema),
});

// Type for core/table
const tableAttributesSchema = z
  .object({
    body: z.array(tableRowSchema),
    head: z.array(tableRowSchema).optional(),
    foot: z.array(tableRowSchema).optional(),
    caption: z.string().optional(),
    hasFixedLayout: z.boolean().optional(),
  })
  .passthrough();

const tableBlockSchema = blockSchema.extend({
  name: z.literal('core/table'),
  attributes: tableAttributesSchema,
});

// Type for core/gallery
const galleryAttributesSchema = z
  .object({
    ids: z.array(z.number()).optional(),
    images: z.array(z.any()).optional(),
    columns: z.number().optional(),
    linkTo: z.string().optional(),
    sizeSlug: z.string().optional(),
  })
  .passthrough();

const galleryBlockSchema = blockSchema.extend({
  name: z.literal('core/gallery'),
  attributes: galleryAttributesSchema,
  innerBlocks: z.array(imageBlockSchema).optional(),
});

// Type for core/footnotes
const footnotesAttributesSchema = z.object({}).passthrough();

const footnotesBlockSchema = blockSchema.extend({
  name: z.literal('core/footnotes'),
  attributes: footnotesAttributesSchema,
});

// Type for core/block (reusable block)
const reusableBlockAttributesSchema = z
  .object({
    ref: z.number(),
  })
  .passthrough();

const reusableBlockSchema = blockSchema.extend({
  name: z.literal('core/block'),
  attributes: reusableBlockAttributesSchema,
  innerBlocks: z.array(innerBlockSchema),
});

// Union of all block types
export const wpBlockSchema = z.discriminatedUnion('name', [
  paragraphBlockSchema,
  headingBlockSchema,
  preformattedBlockSchema,
  imageBlockSchema,
  listBlockSchema,
  quoteBlockSchema,
  pullquoteBlockSchema,
  separatorBlockSchema,
  embedBlockSchema,
  videoBlockSchema,
  tableBlockSchema,
  galleryBlockSchema,
  footnotesBlockSchema,
  reusableBlockSchema,
]);

// Type for an array of blocks
export const wpBlocksSchema = z.array(wpBlockSchema);

export const wpBlockApiResponseSchema = z
  .object({
    blocks: wpBlocksSchema,
  })
  .passthrough();

// TypeScript types derived from the schemas
export type WpBlock = z.infer<typeof wpBlockSchema>;
export type WpBlocks = z.infer<typeof wpBlocksSchema>;

// Specific block types
export type ParagraphBlock = z.infer<typeof paragraphBlockSchema>;
export type HeadingBlock = z.infer<typeof headingBlockSchema>;
export type PreformattedBlock = z.infer<typeof preformattedBlockSchema>;
export type ImageBlock = z.infer<typeof imageBlockSchema>;
export type ListBlock = z.infer<typeof listBlockSchema>;
export type QuoteBlock = z.infer<typeof quoteBlockSchema>;
export type PullquoteBlock = z.infer<typeof pullquoteBlockSchema>;
export type SeparatorBlock = z.infer<typeof separatorBlockSchema>;
export type EmbedBlock = z.infer<typeof embedBlockSchema>;
export type VideoBlock = z.infer<typeof videoBlockSchema>;
export type TableBlock = z.infer<typeof tableBlockSchema>;
export type GalleryBlock = z.infer<typeof galleryBlockSchema>;
export type FootnotesBlock = z.infer<typeof footnotesBlockSchema>;
export type ReusableBlock = z.infer<typeof reusableBlockSchema>;

// Helper function to parse blocks
export function parseBlocks(response: unknown): WpBlocks {
  try {
    return wpBlockApiResponseSchema.parse(response).blocks;
  } catch (error) {
    if (
      response &&
      typeof response === 'object' &&
      'blocks' in response &&
      Array.isArray(response.blocks)
    ) {
      // Check if there are any unknown block types
      const unknownBlocks = response.blocks.filter(
        (block) =>
          typeof block === 'object' &&
          block !== null &&
          'name' in block &&
          !isKnownBlockType(block.name as string)
      );

      if (unknownBlocks.length > 0) {
        const unknownTypes = unknownBlocks.map((b) => b.name).join(', ');
        throw new Error(`Unknown block types encountered: ${unknownTypes}`);
      }
    }
    throw error;
  }
}

// Helper function to parse a single block
export function parseBlock(data: unknown): WpBlock {
  try {
    return wpBlockSchema.parse(data);
  } catch (error) {
    if (
      typeof data === 'object' &&
      data !== null &&
      'name' in data &&
      !isKnownBlockType(data.name as string)
    ) {
      throw new Error(`Unknown block type: ${data.name}`);
    }
    throw error;
  }
}

// Helper function to check if a block type is known
function isKnownBlockType(name: string): boolean {
  return [
    'core/paragraph',
    'core/heading',
    'core/preformatted',
    'core/image',
    'core/list',
    'core/quote',
    'core/pullquote',
    'core/separator',
    'core/embed',
    'core/video',
    'core/table',
    'core/gallery',
    'core/footnotes',
    'core/block',
  ].includes(name);
}

// Type guard functions
export function isParagraphBlock(block: WpBlock): block is ParagraphBlock {
  return block.name === 'core/paragraph';
}

export function isHeadingBlock(block: WpBlock): block is HeadingBlock {
  return block.name === 'core/heading';
}

export function isPreformattedBlock(block: WpBlock): block is PreformattedBlock {
  return block.name === 'core/preformatted';
}

export function isImageBlock(block: WpBlock): block is ImageBlock {
  return block.name === 'core/image';
}

export function isListBlock(block: WpBlock): block is ListBlock {
  return block.name === 'core/list';
}

export function isQuoteBlock(block: WpBlock): block is QuoteBlock {
  return block.name === 'core/quote';
}

export function isPullquoteBlock(block: WpBlock): block is PullquoteBlock {
  return block.name === 'core/pullquote';
}

export function isSeparatorBlock(block: WpBlock): block is SeparatorBlock {
  return block.name === 'core/separator';
}

export function isEmbedBlock(block: WpBlock): block is EmbedBlock {
  return block.name === 'core/embed';
}

export function isVideoBlock(block: WpBlock): block is VideoBlock {
  return block.name === 'core/video';
}

export function isTableBlock(block: WpBlock): block is TableBlock {
  return block.name === 'core/table';
}

export function isGalleryBlock(block: WpBlock): block is GalleryBlock {
  return block.name === 'core/gallery';
}

export function isFootnotesBlock(block: WpBlock): block is FootnotesBlock {
  return block.name === 'core/footnotes';
}

export function isReusableBlock(block: WpBlock): block is ReusableBlock {
  return block.name === 'core/block';
}
