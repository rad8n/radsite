import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "preact/jsx-runtime";
import HeaderConstructor from "../Header";
const Header = HeaderConstructor();
/**
 * Full-width page frame — no sidebars. The center content area spans the
 * full width of the page. Header, beforeBody, body, afterBody, and footer
 * are all rendered in a single column.
 *
 * Useful for page types like Canvas, presentations, or dashboards that
 * need maximum horizontal space.
 */
export const FullWidthFrame = {
    name: "full-width",
    render({ componentData, header, beforeBody, pageBody: Content, afterBody, footer, }) {
        return (_jsxs(_Fragment, { children: [_jsxs("div", { class: "center full-width", children: [_jsxs("div", { class: "page-header", children: [_jsx(Header, { ...componentData, children: header.map((HeaderComponent) => (_jsx(HeaderComponent, { ...componentData }))) }), _jsx("div", { class: "popover-hint", children: beforeBody.map((BodyComponent) => (_jsx(BodyComponent, { ...componentData }))) })] }), _jsx(Content, { ...componentData }), _jsx("hr", {}), _jsx("div", { class: "page-footer", children: afterBody.map((BodyComponent) => (_jsx(BodyComponent, { ...componentData }))) })] }), footer.map((FooterComponent) => (_jsx(FooterComponent, { ...componentData })))] }));
    },
};
