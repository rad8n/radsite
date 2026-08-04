import { jsx as _jsx } from "preact/jsx-runtime";
import { concatenateResources } from "../util/resources";
import { classNames } from "../util/lang";
export default ((config) => {
    const Flex = (props) => {
        const direction = config.direction ?? "row";
        const wrap = config.wrap ?? "nowrap";
        const gap = config.gap ?? "1rem";
        return (_jsx("div", { class: classNames(props.displayClass, "flex-component"), style: `flex-direction: ${direction}; flex-wrap: ${wrap}; gap: ${gap};`, children: config.components.map((c) => {
                const grow = c.grow ? 1 : 0;
                const shrink = (c.shrink ?? true) ? 1 : 0;
                const basis = c.basis ?? "auto";
                const order = c.order ?? 0;
                const align = c.align ?? "center";
                const justify = c.justify ?? "center";
                return (_jsx("div", { style: `flex-grow: ${grow}; flex-shrink: ${shrink}; flex-basis: ${basis}; order: ${order}; align-self: ${align}; justify-self: ${justify};`, children: _jsx(c.Component, { ...props }) }));
            }) }));
    };
    Flex.afterDOMLoaded = concatenateResources(...config.components.map((c) => c.Component.afterDOMLoaded));
    Flex.beforeDOMLoaded = concatenateResources(...config.components.map((c) => c.Component.beforeDOMLoaded));
    Flex.css = concatenateResources(...config.components.map((c) => c.Component.css));
    return Flex;
});
