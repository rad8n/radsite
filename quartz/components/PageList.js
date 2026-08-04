import { jsx as _jsx, jsxs as _jsxs } from "preact/jsx-runtime";
import { isFolderPath, resolveRelative } from "../util/path";
import { Date, getDate } from "./Date";
export function byDateAndAlphabetical() {
    return (f1, f2) => {
        // Sort by date/alphabetical
        if (f1.dates && f2.dates) {
            // sort descending
            return getDate(f2).getTime() - getDate(f1).getTime();
        }
        else if (f1.dates && !f2.dates) {
            // prioritize files with dates
            return -1;
        }
        else if (!f1.dates && f2.dates) {
            return 1;
        }
        // otherwise, sort lexographically by title
        const f1Title = f1.frontmatter?.title.toLowerCase() ?? "";
        const f2Title = f2.frontmatter?.title.toLowerCase() ?? "";
        return f1Title.localeCompare(f2Title);
    };
}
export function byDateAndAlphabeticalFolderFirst() {
    return (f1, f2) => {
        // Sort folders first
        const f1IsFolder = isFolderPath(f1.slug ?? "");
        const f2IsFolder = isFolderPath(f2.slug ?? "");
        if (f1IsFolder && !f2IsFolder)
            return -1;
        if (!f1IsFolder && f2IsFolder)
            return 1;
        // If both are folders or both are files, sort by date/alphabetical
        if (f1.dates && f2.dates) {
            // sort descending
            return getDate(f2).getTime() - getDate(f1).getTime();
        }
        else if (f1.dates && !f2.dates) {
            // prioritize files with dates
            return -1;
        }
        else if (!f1.dates && f2.dates) {
            return 1;
        }
        // otherwise, sort lexographically by title
        const f1Title = f1.frontmatter?.title.toLowerCase() ?? "";
        const f2Title = f2.frontmatter?.title.toLowerCase() ?? "";
        return f1Title.localeCompare(f2Title);
    };
}
export const PageList = ({ cfg, fileData, allFiles, limit, sort }) => {
    const sorter = sort ?? byDateAndAlphabeticalFolderFirst();
    let list = allFiles.sort(sorter);
    if (limit) {
        list = list.slice(0, limit);
    }
    return (_jsx("ul", { class: "section-ul", children: list.map((page) => {
            const title = page.frontmatter?.title;
            const tags = page.frontmatter?.tags ?? [];
            return (_jsx("li", { class: "section-li", children: _jsxs("div", { class: "section", children: [_jsx("p", { class: "meta", children: page.dates && _jsx(Date, { date: getDate(page), locale: cfg.locale }) }), _jsx("div", { class: "desc", children: _jsx("h3", { children: _jsx("a", { href: resolveRelative(fileData.slug, page.slug), class: "internal internal-link", children: title }) }) }), _jsx("ul", { class: "tags", children: tags.map((tag) => (_jsx("li", { children: _jsx("a", { class: "internal tag-link", href: resolveRelative(fileData.slug, `tags/${tag}`), children: tag }) }))) })] }) }));
        }) }));
};
PageList.css = `
.section h3 {
  margin: 0;
}

.section > .tags {
  margin: 0;
}
`;
