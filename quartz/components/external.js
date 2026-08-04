import { componentRegistry } from "./registry";
export function External(name, options) {
    const registered = componentRegistry.get(name);
    if (!registered) {
        throw new Error(`External component "${name}" not found. ` +
            `Make sure the plugin is installed and components are loaded before layouts are evaluated.`);
    }
    const { component } = registered;
    if (typeof component === "function") {
        return component(options);
    }
    return component;
}
