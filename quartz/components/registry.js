/** @internal Exported for testing only. */
export class ComponentRegistry {
    components = new Map();
    instanceCache = new Map();
    optionOverrides = new Map();
    register(name, component, source, manifest) {
        const existing = this.components.get(name);
        if (existing && existing.source !== source) {
            console.warn(`Component "${name}" is being overwritten by ${source}`);
        }
        this.components.set(name, { component, source, manifest });
    }
    get(name) {
        return this.components.get(name);
    }
    getAll() {
        return new Map(this.components);
    }
    /** Store option overrides for a plugin, keyed by plugin directory name. */
    setOptionOverrides(pluginName, opts) {
        if (!opts || Object.keys(opts).length === 0)
            return;
        this.optionOverrides.set(pluginName, { ...this.optionOverrides.get(pluginName), ...opts });
        this.instanceCache.clear();
    }
    getOptionOverrides(pluginName) {
        return this.optionOverrides.get(pluginName);
    }
    /**
     * Instantiate a component constructor with options, returning a cached instance
     * if the same constructor was already called with equivalent options.
     * This prevents duplicate afterDOMLoaded scripts when the same component
     * appears in multiple page-type layouts.
     */
    instantiate(constructor, options) {
        const optsKey = options !== undefined ? JSON.stringify(options) : "";
        // Use constructor identity + serialized options as cache key
        // We store constructor name as a hint but rely on a unique id for identity
        const ctorId = constructor.__cacheId ??
            (constructor.__cacheId =
                `ctor_${this.instanceCache.size}`);
        const cacheKey = `${ctorId}:${optsKey}`;
        const cached = this.instanceCache.get(cacheKey);
        if (cached)
            return cached;
        const instance = constructor(options);
        this.instanceCache.set(cacheKey, instance);
        return instance;
    }
    getAllComponents() {
        // Deduplicate by component reference (same constructor may be registered under multiple keys)
        const seen = new Set();
        const results = [];
        for (const r of this.components.values()) {
            if (seen.has(r.component))
                continue;
            seen.add(r.component);
            try {
                let instance;
                if (typeof r.component === "function") {
                    // Check if this constructor was already instantiated (with any options).
                    // Re-instantiating with `undefined` when options were provided would create
                    // a duplicate instance with separate afterDOMLoaded scripts.
                    const existing = this.findCachedInstance(r.component);
                    instance =
                        existing ?? this.instantiate(r.component, undefined);
                }
                else {
                    instance = r.component;
                }
                if (instance) {
                    results.push(instance);
                }
            }
            catch {
                // Skip components that fail to instantiate
            }
        }
        return results;
    }
    /** @internal For testing only — resets all registry state. */
    clear() {
        this.components.clear();
        this.instanceCache.clear();
        this.optionOverrides.clear();
    }
    findCachedInstance(constructor) {
        const ctorId = constructor.__cacheId;
        if (!ctorId)
            return undefined;
        for (const [key, instance] of this.instanceCache) {
            if (key.startsWith(`${ctorId}:`))
                return instance;
        }
        return undefined;
    }
}
export const componentRegistry = new ComponentRegistry();
export function defineComponent(factory, manifest) {
    ;
    factory.__quartzComponent = { manifest };
    return factory;
}
