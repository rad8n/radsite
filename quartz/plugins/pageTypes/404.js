import { match } from "./matchers";
import { NotFound } from "../../components";
import { defaultProcessedContent } from "../vfile";
import { i18n } from "../../i18n";
export const NotFoundPageType = () => ({
    name: "404",
    priority: -1,
    match: match.none(),
    generate({ cfg }) {
        const notFound = i18n(cfg.locale).pages.error.title;
        const slug = "404";
        const [, vfile] = defaultProcessedContent({
            slug,
            text: notFound,
            description: notFound,
            frontmatter: { title: notFound, tags: [] },
        });
        return [
            {
                slug,
                title: notFound,
                data: vfile.data,
            },
        ];
    },
    layout: "404",
    frame: "minimal",
    body: NotFound,
});
