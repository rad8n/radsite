import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "preact/jsx-runtime";
import { i18n } from "../i18n";
import { getFileExtension, joinSegments, pathToRoot } from "../util/path";
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources";
import { googleFontHref, googleFontSubsetHref } from "../util/theme";
import { unescapeHTML } from "../util/escape";
export default (() => {
    const Head = ({ cfg, fileData, externalResources, ctx, }) => {
        const titleSuffix = cfg.pageTitleSuffix ?? "";
        const title = (fileData.frontmatter?.title ?? i18n(cfg.locale).propertyDefaults.title) + titleSuffix;
        const description = fileData.frontmatter?.socialDescription ??
            fileData.frontmatter?.description ??
            unescapeHTML(fileData.description?.trim() ?? i18n(cfg.locale).propertyDefaults.description);
        const { css, js, additionalHead } = externalResources;
        const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`);
        const path = url.pathname;
        const baseDir = fileData.slug === "404" ? path : pathToRoot(fileData.slug);
        const iconPath = joinSegments(baseDir, "static/icon.png");
        // Url of current page
        const socialUrl = fileData.slug === "404" ? url.toString() : joinSegments(url.toString(), fileData.slug);
        const usesCustomOgImage = ctx.cfg.plugins.emitters.some((e) => e.name === "CustomOgImages");
        const ogImageDefaultPath = `https://${cfg.baseUrl}/static/og-image.png`;
        const coreStylesheet = css[0]?.content;
        const coreScript = js.find((r) => r.loadTime === "beforeDOMReady" && r.contentType === "external");
        return (_jsxs("head", { children: [_jsx("title", { children: title }), _jsx("meta", { charSet: "utf-8" }), coreStylesheet && _jsx("link", { rel: "preload", href: coreStylesheet, as: "style" }), coreScript && coreScript.contentType === "external" && (_jsx("link", { rel: "preload", href: coreScript.src, as: "script" })), cfg.theme.cdnCaching && cfg.theme.fontOrigin === "googleFonts" && (_jsxs(_Fragment, { children: [_jsx("link", { rel: "preconnect", href: "https://fonts.googleapis.com" }), _jsx("link", { rel: "preconnect", href: "https://fonts.gstatic.com" }), _jsx("link", { rel: "stylesheet", href: googleFontHref(cfg.theme) }), cfg.theme.typography.title && (_jsx("link", { rel: "stylesheet", href: googleFontSubsetHref(cfg.theme, cfg.pageTitle) }))] })), _jsx("link", { rel: "preconnect", href: "https://cdnjs.cloudflare.com", crossOrigin: "anonymous" }), _jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1.0" }), _jsx("meta", { name: "og:site_name", content: cfg.pageTitle }), _jsx("meta", { property: "og:title", content: title }), _jsx("meta", { property: "og:type", content: "website" }), _jsx("meta", { name: "twitter:card", content: "summary_large_image" }), _jsx("meta", { name: "twitter:title", content: title }), _jsx("meta", { name: "twitter:description", content: description }), _jsx("meta", { property: "og:description", content: description }), _jsx("meta", { property: "og:image:alt", content: description }), !usesCustomOgImage && (_jsxs(_Fragment, { children: [_jsx("meta", { property: "og:image", content: ogImageDefaultPath }), _jsx("meta", { property: "og:image:url", content: ogImageDefaultPath }), _jsx("meta", { name: "twitter:image", content: ogImageDefaultPath }), _jsx("meta", { property: "og:image:type", content: `image/${getFileExtension(ogImageDefaultPath) ?? "png"}` })] })), cfg.baseUrl && (_jsxs(_Fragment, { children: [_jsx("meta", { property: "twitter:domain", content: cfg.baseUrl }), _jsx("meta", { property: "og:url", content: socialUrl }), _jsx("meta", { property: "twitter:url", content: socialUrl })] })), _jsx("link", { rel: "icon", href: iconPath }), _jsx("meta", { name: "description", content: description }), _jsx("meta", { name: "generator", content: "Quartz" }), css.map((resource) => CSSResourceToStyleElement(resource, true)), js
                    .filter((resource) => resource.loadTime === "beforeDOMReady")
                    .map((res) => JSResourceToScriptElement(res, true)), additionalHead.map((resource) => {
                    if (typeof resource === "function") {
                        return resource(fileData);
                    }
                    else {
                        return resource;
                    }
                })] }));
    };
    return Head;
});
