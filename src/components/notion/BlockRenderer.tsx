/**
 * Re-export block rendering components from the new modular blocks directory.
 *
 * @deprecated Import from '@/components/notion/blocks' instead for new code.
 * This file is kept for backward compatibility.
 */
export { BlockRenderer, BlockListRenderer, RichText } from "./blocks";
export type { BlockProps, BlockContext } from "./blocks";
