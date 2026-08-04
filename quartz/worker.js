import sourceMapSupport from "source-map-support";
sourceMapSupport.install(options);
import cfg from "../quartz";
import { createFileParser, createHtmlProcessor, createMarkdownParser, createMdProcessor, } from "./processors/parse";
import { options } from "./util/sourcemap";
// only called from worker thread
export async function parseMarkdown(partialCtx, fps) {
    const ctx = {
        ...partialCtx,
        cfg,
    };
    return await createFileParser(ctx, fps)(createMdProcessor(ctx));
}
// only called from worker thread
export function processHtml(partialCtx, mds) {
    const ctx = {
        ...partialCtx,
        cfg,
    };
    return createMarkdownParser(ctx, mds)(createHtmlProcessor(ctx));
}
