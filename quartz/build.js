import sourceMapSupport from "source-map-support";
sourceMapSupport.install(options);
import path from "path";
import { PerfTimer } from "./util/perf";
import { rm } from "fs/promises";
import { isGitIgnored } from "globby";
import { styleText } from "util";
import { parseMarkdown } from "./processors/parse";
import { filterContent } from "./processors/filter";
import { emitContent } from "./processors/emit";
import cfg from "../quartz";
import { joinSegments, slugifyFilePath } from "./util/path";
import { detectSlugCollisions, formatCollisionWarning } from "./util/slugCollisions";
import chokidar from "chokidar";
import { glob, toPosixPath } from "./util/glob";
import { trace } from "./util/trace";
import { options } from "./util/sourcemap";
import { getStaticResourcesFromPlugins } from "./plugins";
import { randomIdNonSecure } from "./util/random";
import { minimatch } from "minimatch";
function reportSlugCollisions(content) {
    const collisions = detectSlugCollisions(content);
    if (collisions.length === 0)
        return;
    console.warn(styleText("yellow", formatCollisionWarning(collisions)));
}
async function buildQuartz(argv, mut, clientRefresh) {
    const ctx = {
        buildId: randomIdNonSecure(),
        argv,
        cfg,
        allSlugs: [],
        allFiles: [],
        incremental: false,
        virtualPages: [],
    };
    const perf = new PerfTimer();
    const output = argv.output;
    const pluginCount = Object.values(cfg.plugins).flat().length;
    const pluginNames = (key) => (cfg.plugins[key] ?? []).map((plugin) => plugin.name);
    if (argv.verbose) {
        console.log(`Loaded ${pluginCount} plugins`);
        console.log(`  Transformers: ${pluginNames("transformers").join(", ")}`);
        console.log(`  Filters: ${pluginNames("filters").join(", ")}`);
        console.log(`  Emitters: ${pluginNames("emitters").join(", ")}`);
        console.log(`  PageTypes: ${pluginNames("pageTypes").join(", ")}`);
    }
    const release = await mut.acquire();
    perf.addEvent("clean");
    await rm(output, { recursive: true, force: true });
    console.log(`Cleaned output directory \`${output}\` in ${perf.timeSince("clean")}`);
    perf.addEvent("glob");
    const allFiles = await glob("**/*.*", argv.directory, cfg.configuration.ignorePatterns);
    const markdownPaths = allFiles.filter((fp) => fp.endsWith(".md")).sort();
    console.log(`Found ${markdownPaths.length} input files from \`${argv.directory}\` in ${perf.timeSince("glob")}`);
    const filePaths = markdownPaths.map((fp) => joinSegments(argv.directory, fp));
    ctx.allFiles = allFiles;
    ctx.allSlugs = allFiles.map((fp) => slugifyFilePath(fp));
    const parsedFiles = await parseMarkdown(ctx, filePaths);
    reportSlugCollisions(parsedFiles);
    const filteredContent = filterContent(ctx, parsedFiles);
    await emitContent(ctx, filteredContent);
    console.log(styleText("green", `Done processing ${markdownPaths.length} files in ${perf.timeSince()}`));
    release();
    if (argv.watch) {
        ctx.incremental = true;
        return startWatching(ctx, mut, parsedFiles, clientRefresh);
    }
}
// setup watcher for rebuilds
async function startWatching(ctx, mut, initialContent, clientRefresh) {
    const { argv, allFiles } = ctx;
    const contentMap = new Map();
    for (const filePath of allFiles) {
        contentMap.set(filePath, {
            type: "other",
        });
    }
    for (const content of initialContent) {
        const [_tree, vfile] = content;
        const relPath = vfile.data.relativePath;
        if (!relPath) {
            console.warn(`Skipping file with no relativePath: ${vfile.path}`);
            continue;
        }
        contentMap.set(relPath, {
            type: "markdown",
            content,
        });
    }
    const gitIgnoredMatcher = await isGitIgnored();
    const buildData = {
        ctx,
        mut,
        contentMap,
        ignored: (fp) => {
            const pathStr = toPosixPath(fp.toString());
            if (pathStr.startsWith(".git/"))
                return true;
            if (gitIgnoredMatcher(pathStr))
                return true;
            for (const pattern of cfg.configuration.ignorePatterns) {
                if (minimatch(pathStr, pattern)) {
                    return true;
                }
            }
            return false;
        },
        changesSinceLastBuild: {},
        lastBuildMs: 0,
    };
    const watcher = chokidar.watch(".", {
        awaitWriteFinish: { stabilityThreshold: 250 },
        persistent: true,
        cwd: argv.directory,
        ignoreInitial: true,
    });
    const changes = [];
    let rebuildTimeout = null;
    const scheduleRebuild = () => {
        if (rebuildTimeout)
            clearTimeout(rebuildTimeout);
        rebuildTimeout = setTimeout(() => {
            rebuildTimeout = null;
            rebuild(changes, clientRefresh, buildData).catch((err) => {
                console.error(styleText("red", "Rebuild failed:"), err.message ?? err);
            });
        }, 100);
    };
    watcher
        .on("add", (fp) => {
        fp = toPosixPath(fp);
        if (buildData.ignored(fp))
            return;
        changes.push({ path: fp, type: "add" });
        scheduleRebuild();
    })
        .on("change", (fp) => {
        fp = toPosixPath(fp);
        if (buildData.ignored(fp))
            return;
        changes.push({ path: fp, type: "change" });
        scheduleRebuild();
    })
        .on("unlink", (fp) => {
        fp = toPosixPath(fp);
        if (buildData.ignored(fp))
            return;
        changes.push({ path: fp, type: "delete" });
        scheduleRebuild();
    });
    return async () => {
        await watcher.close();
    };
}
async function rebuild(changes, clientRefresh, buildData) {
    const { ctx, contentMap, mut, changesSinceLastBuild } = buildData;
    const { argv, cfg } = ctx;
    const buildId = randomIdNonSecure();
    ctx.buildId = buildId;
    buildData.lastBuildMs = new Date().getTime();
    const numChangesInBuild = changes.length;
    const release = await mut.acquire();
    try {
        // if there's another build after us, release and let them do it
        if (ctx.buildId !== buildId) {
            return;
        }
        const perf = new PerfTimer();
        perf.addEvent("rebuild");
        console.log(styleText("yellow", "Detected change, rebuilding..."));
        // update changesSinceLastBuild
        for (const change of changes) {
            changesSinceLastBuild[change.path] = change.type;
        }
        const staticResources = getStaticResourcesFromPlugins(ctx);
        const pathsToParse = [];
        for (const [fp, type] of Object.entries(changesSinceLastBuild)) {
            if (type === "delete" || path.extname(fp) !== ".md")
                continue;
            const fullPath = joinSegments(argv.directory, toPosixPath(fp));
            pathsToParse.push(fullPath);
        }
        const parsed = await parseMarkdown(ctx, pathsToParse);
        for (const content of parsed) {
            const relPath = content[1].data.relativePath;
            if (!relPath) {
                console.warn(`Skipping file with no relativePath: ${content[1].path}`);
                continue;
            }
            contentMap.set(relPath, {
                type: "markdown",
                content,
            });
        }
        // update state using changesSinceLastBuild
        // we do this weird play of add => compute change events => remove
        // so that partialEmitters can do appropriate cleanup based on the content of deleted files
        for (const [file, change] of Object.entries(changesSinceLastBuild)) {
            if (change === "delete") {
                // universal delete case
                contentMap.delete(file);
            }
            // manually track non-markdown files as processed files only
            // contains markdown files
            if (change === "add" && path.extname(file) !== ".md") {
                contentMap.set(file, {
                    type: "other",
                });
            }
        }
        const changeEvents = Object.entries(changesSinceLastBuild).map(([fp, type]) => {
            const path = fp;
            const processedContent = contentMap.get(path);
            if (processedContent?.type === "markdown") {
                const [_tree, file] = processedContent.content;
                return {
                    type,
                    path,
                    file,
                };
            }
            return {
                type,
                path,
            };
        });
        // update allFiles and then allSlugs with the consistent view of content map
        ctx.allFiles = Array.from(contentMap.keys());
        ctx.allSlugs = ctx.allFiles.map((fp) => slugifyFilePath(fp));
        const markdownContent = Array.from(contentMap.values())
            .filter((file) => file.type === "markdown")
            .map((file) => file.content);
        reportSlugCollisions(markdownContent);
        let processedFiles = filterContent(ctx, markdownContent);
        let emittedFiles = 0;
        // Phase 1: Run PageTypeDispatcher first so it populates ctx.virtualPages
        const dispatcher = cfg.plugins.emitters.find((e) => e.name === "PageTypeDispatcher");
        if (dispatcher) {
            ctx.virtualPages = [];
            const emitFn = dispatcher.partialEmit ?? dispatcher.emit;
            const emitted = await emitFn(ctx, processedFiles, staticResources, changeEvents);
            if (emitted !== null) {
                if (Symbol.asyncIterator in emitted) {
                    for await (const file of emitted) {
                        emittedFiles++;
                        if (ctx.argv.verbose) {
                            console.log(`[emit:${dispatcher.name}] ${file}`);
                        }
                    }
                }
                else {
                    emittedFiles += emitted.length;
                    if (ctx.argv.verbose) {
                        for (const file of emitted) {
                            console.log(`[emit:${dispatcher.name}] ${file}`);
                        }
                    }
                }
            }
        }
        // Phase 2: Run all other emitters with content extended by virtual pages
        const contentWithVirtual = ctx.virtualPages.length > 0 ? [...processedFiles, ...ctx.virtualPages] : processedFiles;
        for (const emitter of cfg.plugins.emitters) {
            if (emitter.name === "PageTypeDispatcher")
                continue;
            // Try to use partialEmit if available, otherwise assume the output is static
            const emitFn = emitter.partialEmit ?? emitter.emit;
            const emitted = await emitFn(ctx, contentWithVirtual, staticResources, changeEvents);
            if (emitted === null) {
                continue;
            }
            if (Symbol.asyncIterator in emitted) {
                // Async generator case
                for await (const file of emitted) {
                    emittedFiles++;
                    if (ctx.argv.verbose) {
                        console.log(`[emit:${emitter.name}] ${file}`);
                    }
                }
            }
            else {
                // Array case
                emittedFiles += emitted.length;
                if (ctx.argv.verbose) {
                    for (const file of emitted) {
                        console.log(`[emit:${emitter.name}] ${file}`);
                    }
                }
            }
        }
        console.log(`Emitted ${emittedFiles} files to \`${argv.output}\` in ${perf.timeSince("rebuild")}`);
        console.log(styleText("green", `Done rebuilding in ${perf.timeSince()}`));
        changes.splice(0, numChangesInBuild);
        clientRefresh();
    }
    finally {
        release();
    }
}
export default async (argv, mut, clientRefresh) => {
    try {
        return await buildQuartz(argv, mut, clientRefresh);
    }
    catch (err) {
        trace("\nExiting Quartz due to a fatal error", err);
    }
};
