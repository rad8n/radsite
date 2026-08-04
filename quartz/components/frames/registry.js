class FrameRegistry {
    frames = new Map();
    register(name, frame, source) {
        const existing = this.frames.get(name);
        if (existing && existing.source !== source) {
            console.warn(`Page frame "${name}" from ${source} is overwriting frame from ${existing.source}`);
        }
        this.frames.set(name, { frame, source });
    }
    get(name) {
        return this.frames.get(name);
    }
    getAll() {
        return new Map(this.frames);
    }
    has(name) {
        return this.frames.has(name);
    }
}
export const frameRegistry = new FrameRegistry();
