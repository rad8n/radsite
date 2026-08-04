import { frameRegistry } from "../../components/frames/registry";
import { getPluginSubpathEntry, toFileUrl } from "./gitLoader";
export async function loadFramesFromPackage(pluginName, manifest) {
    if (!manifest?.frames)
        return;
    try {
        const framesPath = getPluginSubpathEntry(pluginName, "./frames");
        let framesModule;
        if (framesPath) {
            framesModule = await import(toFileUrl(framesPath));
        }
        else {
            framesModule = await import(`${pluginName}/frames`);
        }
        for (const [exportName, _frameMeta] of Object.entries(manifest.frames)) {
            const frame = framesModule[exportName];
            if (!frame) {
                console.warn(`Frame "${exportName}" declared in manifest but not found in ${pluginName}/frames`);
                continue;
            }
            const pageFrame = frame;
            if (!pageFrame.name || typeof pageFrame.render !== "function") {
                console.warn(`Frame "${exportName}" from ${pluginName} is not a valid PageFrame (missing name or render)`);
                continue;
            }
            // Register under the frame's declared name
            frameRegistry.register(pageFrame.name, pageFrame, pluginName);
        }
    }
    catch {
        if (manifest.frames && Object.keys(manifest.frames).length > 0) {
            console.warn(`Plugin "${pluginName}" declares frames but failed to load them`);
        }
    }
}
