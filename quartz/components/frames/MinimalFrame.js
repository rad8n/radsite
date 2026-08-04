import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "preact/jsx-runtime";
/**
 * Minimal page frame — no sidebars, no header/footer chrome. Only the
 * page body is rendered with a thin wrapper, plus the footer for legal/link
 * obligations.
 *
 * Useful for immersive page types like full-screen canvases, kiosks,
 * or custom landing pages that want complete control of the viewport.
 */
export const MinimalFrame = {
    name: "minimal",
    render({ componentData, pageBody: Content, footer }) {
        return (_jsxs(_Fragment, { children: [_jsx("div", { class: "center minimal", children: _jsx(Content, { ...componentData }) }), footer.map((FooterComponent) => (_jsx(FooterComponent, { ...componentData })))] }));
    },
};
