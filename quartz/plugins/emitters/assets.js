import { joinSegments, slugifyFilePath } from "../../util/path";
import path from "path";
import fs from "fs";
import { glob } from "../../util/glob";
function getPageTypeExtensions(ctx) {
    const extensions = new Set();
    const pageTypes = (ctx.cfg.plugins.pageTypes ?? []);
    for (const pt of pageTypes) {
        if (pt.fileExtensions) {
            for (const ext of pt.fileExtensions) {
                extensions.add(ext);
            }
        }
    }
    return extensions;
}
const filesToCopy = async (argv, cfg, excludeExtensions) => {
    const excludePatterns = ["**/*.md", ...cfg.configuration.ignorePatterns];
    for (const ext of excludeExtensions) {
        excludePatterns.push(`**/*${ext}`);
    }
    return await glob("**", argv.directory, excludePatterns);
};
const copyFile = async (argv, fp) => {
    const src = joinSegments(argv.directory, fp);
    const name = slugifyFilePath(fp);
    const dest = joinSegments(argv.output, name);
    const dir = path.dirname(dest);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.copyFile(src, dest);
    return dest;
};
export const Assets = () => {
    return {
        name: "Assets",
        async *emit(ctx) {
            const excludeExtensions = getPageTypeExtensions(ctx);
            const fps = await filesToCopy(ctx.argv, ctx.cfg, excludeExtensions);
            for (const fp of fps) {
                yield copyFile(ctx.argv, fp);
            }
        },
        async *partialEmit(ctx, _content, _resources, changeEvents) {
            const excludeExtensions = getPageTypeExtensions(ctx);
            for (const changeEvent of changeEvents) {
                const ext = path.extname(changeEvent.path);
                if (ext === ".md" || excludeExtensions.has(ext))
                    continue;
                if (changeEvent.type === "add" || changeEvent.type === "change") {
                    yield copyFile(ctx.argv, changeEvent.path);
                }
                else if (changeEvent.type === "delete") {
                    const name = slugifyFilePath(changeEvent.path);
                    const dest = joinSegments(ctx.argv.output, name);
                    await fs.promises.unlink(dest);
                }
            }
        },
    };
};
