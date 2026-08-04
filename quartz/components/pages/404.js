import { jsx as _jsx, jsxs as _jsxs } from "preact/jsx-runtime";
import { i18n } from "../../i18n";
const NotFound = ({ cfg, ctx }) => {
    const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`);
    const baseDir = ctx.argv.serve ? "/" : url.pathname;
    return (_jsxs("article", { class: "popover-hint", children: [_jsx("h1", { children: "404" }), _jsx("p", { children: i18n(cfg.locale).pages.error.notFound }), _jsx("a", { href: baseDir, children: i18n(cfg.locale).pages.error.home }), _jsx("script", { dangerouslySetInnerHTML: {
                    __html: `
          if (typeof fetchData !== "undefined") {
            fetchData.then(function(index) {
              var basePath = document.body.dataset.basepath || "";
              if (basePath.length > 1 && basePath.endsWith("/")) {
                basePath = basePath.slice(0, -1);
              }
              var pathname = window.location.pathname;
              var hasBasePrefix = basePath.length > 1 && pathname.startsWith(basePath);
              if (hasBasePrefix) {
                pathname = pathname.slice(basePath.length);
              }
              if (pathname.startsWith("/")) {
                pathname = pathname.slice(1);
              }
              if (pathname.endsWith("/")) {
                pathname = pathname.slice(0, -1);
              }
              if (pathname.endsWith(".html")) {
                pathname = pathname.slice(0, -5);
              }
              if (pathname.endsWith("/index")) {
                pathname = pathname.slice(0, -6);
              }
              var lowered = pathname.toLowerCase();
              if (lowered !== pathname && index[lowered] != null) {
                var prefix = hasBasePrefix ? basePath : "";
                var target = prefix + (prefix.endsWith("/") ? "" : "/") + lowered;
                window.location.replace(target);
              }
            });
          }
          `,
                } })] }));
};
export default (() => NotFound);
