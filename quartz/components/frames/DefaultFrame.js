import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "preact/jsx-runtime";
import HeaderConstructor from "../Header";
const Header = HeaderConstructor();
/**
 * The default page frame — three-column layout with left sidebar, center
 * content (header + body + afterBody), and right sidebar, followed by a footer.
 *
 * This is the original Quartz layout, extracted from renderPage.tsx.
 */
export const DefaultFrame = {
    name: "default",
    render({ componentData, header, beforeBody, pageBody: Content, afterBody, left, right, footer, }) {
        return (_jsxs(_Fragment, { children: [_jsx("div", { class: "left sidebar", children: left.map((BodyComponent) => (_jsx(BodyComponent, { ...componentData }))) }), _jsxs("div", { class: "center", children: [_jsxs("div", { class: "page-header", children: [_jsx(Header, { ...componentData, children: header.map((HeaderComponent) => (_jsx(HeaderComponent, { ...componentData }))) }), _jsx("div", { class: "popover-hint", children: beforeBody.map((BodyComponent) => (_jsx(BodyComponent, { ...componentData }))) })] }), _jsx(Content, { ...componentData }), _jsx("hr", {}), _jsx("div", { class: "page-footer", children: afterBody.map((BodyComponent) => (_jsx(BodyComponent, { ...componentData }))) })] }), _jsx("div", { class: "right sidebar", children: right.map((BodyComponent) => (_jsx(BodyComponent, { ...componentData }))) }), footer.map((FooterComponent) => (_jsx(FooterComponent, { ...componentData })))] }));
    },
};
