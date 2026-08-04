export function isLoadedPlugin(plugin) {
    return (typeof plugin === "object" &&
        plugin !== null &&
        "plugin" in plugin &&
        "manifest" in plugin &&
        "type" in plugin &&
        typeof plugin.plugin === "function");
}
export function getPluginInstance(plugin, options) {
    if (isLoadedPlugin(plugin)) {
        const factory = plugin.plugin;
        return factory(options);
    }
    return plugin;
}
