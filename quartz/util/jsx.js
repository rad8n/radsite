import { jsx as _jsx } from "preact/jsx-runtime";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { Fragment, jsx, jsxs } from "preact/jsx-runtime";
import { h } from "preact";
import { trace } from "./trace";
function childrenToString(children) {
    if (typeof children === "string")
        return children;
    if (Array.isArray(children))
        return children.map(childrenToString).join("");
    return String(children ?? "");
}
const customComponents = {
    table: (props) => (_jsx("div", { class: "table-container", children: _jsx("table", { ...props }) })),
    style: ({ children, ...rest }) => h("style", { ...rest, dangerouslySetInnerHTML: { __html: childrenToString(children) } }),
    script: ({ children, ...rest }) => h("script", { ...rest, dangerouslySetInnerHTML: { __html: childrenToString(children) } }),
};
export function htmlToJsx(fp, tree) {
    try {
        return toJsxRuntime(tree, {
            Fragment,
            jsx: jsx,
            jsxs: jsxs,
            elementAttributeNameCase: "html",
            components: customComponents,
        });
    }
    catch (e) {
        trace(`Failed to parse Markdown in \`${fp}\` into JSX`, e);
    }
}
