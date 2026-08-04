import { styleText } from "util";
import { parsePluginSource, installPlugin, getPluginEntryPoint, toFileUrl, isLocalSource, validatePluginExternals, } from "./gitLoader";
const MINIMUM_QUARTZ_VERSION = "4.5.0";
function satisfiesVersion(required, current) {
    if (!required)
        return true;
    const parseVersion = (v) => {
        const parts = v.replace(/^v/, "").split(".");
        return {
            major: parseInt(parts[0]) || 0,
            minor: parseInt(parts[1]) || 0,
            patch: parseInt(parts[2]) || 0,
        };
    };
    const req = parseVersion(required);
    const cur = parseVersion(current);
    if (cur.major > req.major)
        return true;
    if (cur.major < req.major)
        return false;
    if (cur.minor > req.minor)
        return true;
    if (cur.minor < req.minor)
        return false;
    return cur.patch >= req.patch;
}
async function tryImportPlugin(packageName) {
    try {
        const module = await import(packageName);
        const manifest = module.manifest ?? null;
        return { module, manifest };
    }
    catch (error) {
        throw new Error(`Failed to import package: ${error instanceof Error ? error.message : String(error)}`);
    }
}
function detectPluginType(module) {
    if (!module || typeof module !== "object")
        return null;
    const mod = module;
    if (typeof mod.default === "function") {
        return null;
    }
    const hasPageTypeProps = ["match", "body", "layout"].every((key) => key in mod);
    const hasTransformerProps = ["textTransform", "markdownPlugins", "htmlPlugins"].some((key) => key in mod && (typeof mod[key] === "function" || mod[key] === undefined));
    const hasFilterProps = ["shouldPublish"].some((key) => key in mod && typeof mod[key] === "function");
    const hasEmitterProps = ["emit"].some((key) => key in mod && typeof mod[key] === "function");
    if (hasPageTypeProps)
        return "pageType";
    if (hasEmitterProps)
        return "emitter";
    if (hasFilterProps)
        return "filter";
    if (hasTransformerProps)
        return "transformer";
    return null;
}
function extractPluginFactory(module, type) {
    if (!module || typeof module !== "object")
        return null;
    const mod = module;
    const factory = mod.default ?? mod[type] ?? mod.plugin ?? null;
    if (typeof factory === "function") {
        return factory;
    }
    return null;
}
function isGitSource(source) {
    // Check if it's a Git-based or local file path source
    return (isLocalSource(source) ||
        source.startsWith("github:") ||
        source.startsWith("git+") ||
        source.startsWith("https://github.com/") ||
        source.startsWith("https://gitlab.com/") ||
        source.startsWith("https://bitbucket.org/"));
}
async function resolveSinglePlugin(specifier, options) {
    let packageName;
    let manifest = {};
    let pluginSource = "npm";
    if (typeof specifier === "string") {
        packageName = specifier;
        // Check if it's a Git-based source
        if (isGitSource(specifier)) {
            pluginSource = "git";
        }
    }
    else if ("name" in specifier) {
        packageName = specifier.name;
        if (isGitSource(specifier.name)) {
            pluginSource = "git";
        }
    }
    else if ("plugin" in specifier) {
        const rawType = specifier.manifest?.category ?? "transformer";
        const type = Array.isArray(rawType) ? rawType[0] : rawType;
        return {
            plugin: {
                plugin: specifier.plugin,
                manifest: {
                    name: specifier.manifest?.name ?? "inline-plugin",
                    displayName: specifier.manifest?.displayName ?? "Inline Plugin",
                    description: specifier.manifest?.description ?? "Inline plugin instance",
                    version: specifier.manifest?.version ?? "1.0.0",
                    category: rawType,
                    ...specifier.manifest,
                },
                type,
                source: "inline",
            },
            error: null,
        };
    }
    else {
        return {
            plugin: null,
            error: {
                plugin: "unknown",
                message: "Invalid plugin specifier format",
                type: "invalid-manifest",
            },
        };
    }
    if (pluginSource === "git") {
        try {
            const gitSpec = parsePluginSource(packageName);
            await installPlugin(gitSpec, { verbose: options.verbose });
            const entryPoint = getPluginEntryPoint(gitSpec.name);
            // Import the plugin
            const module = await import(toFileUrl(entryPoint));
            const importedManifest = module.manifest ?? null;
            validatePluginExternals(gitSpec.name, entryPoint, { verbose: options.verbose });
            manifest = importedManifest ?? {};
            const categoryOrCategories = manifest.category ?? detectPluginType(module);
            if (!categoryOrCategories) {
                return {
                    plugin: null,
                    error: {
                        plugin: packageName,
                        message: "Could not detect plugin type from Git source",
                        type: "invalid-manifest",
                    },
                };
            }
            // Normalize to single processing category for factory extraction
            const processingCategories = ["transformer", "filter", "emitter", "pageType"];
            const detectedType = Array.isArray(categoryOrCategories)
                ? categoryOrCategories[0]
                : categoryOrCategories;
            const processingType = Array.isArray(categoryOrCategories)
                ? categoryOrCategories.find((c) => processingCategories.includes(c))
                : processingCategories.includes(categoryOrCategories)
                    ? categoryOrCategories
                    : undefined;
            // Component-only plugins don't have a processing factory
            if (!processingType) {
                const fullManifest = {
                    name: manifest.name ?? gitSpec.name,
                    displayName: manifest.displayName ?? gitSpec.name,
                    description: manifest.description ?? "No description provided",
                    version: manifest.version ?? "1.0.0",
                    author: manifest.author,
                    homepage: manifest.homepage,
                    keywords: manifest.keywords,
                    category: manifest.category ?? detectedType,
                    quartzVersion: manifest.quartzVersion,
                    configSchema: manifest.configSchema,
                };
                if (options.verbose) {
                    console.log(styleText("green", `\u2713`) +
                        ` Loaded ${detectedType} plugin: ${styleText("cyan", fullManifest.displayName)}@${fullManifest.version} ${styleText("gray", `(from ${gitSpec.repo})`)}`);
                }
                return { plugin: null, error: null };
            }
            const factory = extractPluginFactory(module, processingType);
            if (!factory) {
                return {
                    plugin: null,
                    error: {
                        plugin: packageName,
                        message: "Could not find plugin factory in Git source",
                        type: "invalid-manifest",
                    },
                };
            }
            const fullManifest = {
                name: manifest.name ?? gitSpec.name,
                displayName: manifest.displayName ?? gitSpec.name,
                description: manifest.description ?? "No description provided",
                version: manifest.version ?? "1.0.0",
                author: manifest.author,
                homepage: manifest.homepage,
                keywords: manifest.keywords,
                category: manifest.category ?? detectedType,
                quartzVersion: manifest.quartzVersion,
                configSchema: manifest.configSchema,
            };
            const loadedPlugin = {
                plugin: factory,
                manifest: fullManifest,
                type: detectedType,
                source: gitSpec.local ? `local:${gitSpec.repo}` : `${gitSpec.repo}#${gitSpec.ref}`,
            };
            if (options.verbose) {
                console.log(styleText("green", `✓`) +
                    ` Loaded ${detectedType} plugin: ${styleText("cyan", fullManifest.displayName)}@${fullManifest.version} ${styleText("gray", `(from ${gitSpec.repo})`)}`);
            }
            return { plugin: loadedPlugin, error: null };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                plugin: null,
                error: {
                    plugin: packageName,
                    message: `Failed to load Git plugin: ${errorMessage}`,
                    type: "import-error",
                },
            };
        }
    }
    try {
        const { module: importedModule, manifest: importedManifest } = await tryImportPlugin(packageName);
        manifest = importedManifest ?? {};
        // Load components if the plugin declares any
        if (manifest.components && Object.keys(manifest.components).length > 0) {
            const { loadComponentsFromPackage } = await import("./componentLoader");
            await loadComponentsFromPackage(packageName, manifest);
        }
        const categoryOrCategories = manifest.category ?? detectPluginType(importedModule);
        if (!categoryOrCategories) {
            return {
                plugin: null,
                error: {
                    plugin: packageName,
                    message: `Could not detect plugin type. Ensure the plugin exports a valid factory function or has a 'category' field in its manifest.`,
                    type: "invalid-manifest",
                },
            };
        }
        // Normalize to single processing category for factory extraction
        const processingCategories = ["transformer", "filter", "emitter", "pageType"];
        const detectedType = Array.isArray(categoryOrCategories)
            ? categoryOrCategories[0]
            : categoryOrCategories;
        const processingType = Array.isArray(categoryOrCategories)
            ? categoryOrCategories.find((c) => processingCategories.includes(c))
            : processingCategories.includes(categoryOrCategories)
                ? categoryOrCategories
                : undefined;
        if (manifest.quartzVersion &&
            !satisfiesVersion(manifest.quartzVersion, options.quartzVersion)) {
            return {
                plugin: null,
                error: {
                    plugin: packageName,
                    message: `Plugin requires Quartz ${manifest.quartzVersion} but current version is ${options.quartzVersion}`,
                    type: "version-mismatch",
                },
            };
        }
        // Component-only plugins don't have a processing factory
        if (!processingType) {
            const fullManifest = {
                name: manifest.name ?? packageName,
                displayName: manifest.displayName ?? packageName,
                description: manifest.description ?? "No description provided",
                version: manifest.version ?? "1.0.0",
                author: manifest.author,
                homepage: manifest.homepage,
                keywords: manifest.keywords,
                category: manifest.category ?? detectedType,
                quartzVersion: manifest.quartzVersion,
                configSchema: manifest.configSchema,
            };
            if (options.verbose) {
                console.log(styleText("green", `\u2713`) +
                    ` Loaded ${detectedType} plugin: ${styleText("cyan", fullManifest.displayName)}@${fullManifest.version}`);
            }
            return { plugin: null, error: null };
        }
        const factory = extractPluginFactory(importedModule, processingType);
        if (!factory) {
            return {
                plugin: null,
                error: {
                    plugin: packageName,
                    message: `Could not find plugin factory in module. Expected 'export default' or '${processingType}' export.`,
                    type: "invalid-manifest",
                },
            };
        }
        const fullManifest = {
            name: manifest.name ?? packageName,
            displayName: manifest.displayName ?? packageName,
            description: manifest.description ?? "No description provided",
            version: manifest.version ?? "1.0.0",
            author: manifest.author,
            homepage: manifest.homepage,
            keywords: manifest.keywords,
            category: manifest.category ?? detectedType,
            quartzVersion: manifest.quartzVersion,
            configSchema: manifest.configSchema,
        };
        const loadedPlugin = {
            plugin: factory,
            manifest: fullManifest,
            type: detectedType,
            source: packageName,
        };
        if (options.verbose) {
            console.log(styleText("green", `✓`) +
                ` Loaded ${detectedType} plugin: ${styleText("cyan", fullManifest.displayName)}@${fullManifest.version}`);
        }
        return { plugin: loadedPlugin, error: null };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("Cannot find module") || errorMessage.includes("MODULE_NOT_FOUND")) {
            return {
                plugin: null,
                error: {
                    plugin: packageName,
                    message: `Plugin package not found. Run 'npm install ${packageName}' to install it.`,
                    type: "not-found",
                },
            };
        }
        return {
            plugin: null,
            error: {
                plugin: packageName,
                message: errorMessage,
                type: "import-error",
            },
        };
    }
}
export async function resolvePlugins(specifiers, options) {
    const plugins = [];
    const errors = [];
    if (options.verbose) {
        console.log(styleText("cyan", `Resolving ${specifiers.length} external plugin(s)...`));
    }
    for (const specifier of specifiers) {
        const { plugin, error } = await resolveSinglePlugin(specifier, options);
        if (plugin) {
            plugins.push(plugin);
        }
        else if (error) {
            errors.push(error);
            console.error(styleText("red", `✗`) +
                ` Failed to load plugin: ${styleText("yellow", error.plugin)}\n` +
                `  ${error.message}`);
        }
    }
    if (options.verbose && plugins.length > 0) {
        const byType = plugins.reduce((acc, p) => {
            acc[p.type] = (acc[p.type] || 0) + 1;
            return acc;
        }, {});
        console.log(styleText("cyan", `External plugins loaded:`) +
            ` ${byType.transformer ?? 0} transformers, ${byType.filter ?? 0} filters, ${byType.emitter ?? 0} emitters, ${byType.pageType ?? 0} pageTypes`);
    }
    return { plugins, errors };
}
export function instantiatePlugin(loadedPlugin, options) {
    const factory = loadedPlugin.plugin;
    return factory(options);
}
export { satisfiesVersion, MINIMUM_QUARTZ_VERSION };
