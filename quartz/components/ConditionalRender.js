import { jsx as _jsx } from "preact/jsx-runtime";
export default ((config) => {
    const ConditionalRender = (props) => {
        if (config.condition(props)) {
            return _jsx(config.component, { ...props });
        }
        return null;
    };
    ConditionalRender.afterDOMLoaded = config.component.afterDOMLoaded;
    ConditionalRender.beforeDOMLoaded = config.component.beforeDOMLoaded;
    ConditionalRender.css = config.component.css;
    return ConditionalRender;
});
