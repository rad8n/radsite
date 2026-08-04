import test, { describe } from "node:test";
import assert from "node:assert";
import { renderTranscludes, pageResources } from "./renderPage";
function makeTranscludeBlockquote(targetSlug, block) {
    return {
        type: "element",
        tagName: "blockquote",
        properties: {
            className: ["transclude"],
            ...(block ? { dataBlock: block } : {}),
        },
        children: [
            {
                type: "element",
                tagName: "a",
                properties: {
                    href: `./${targetSlug}`,
                    "data-slug": targetSlug,
                    className: ["transclude-inner"],
                },
                children: [{ type: "text", value: `Transclude of ${targetSlug}` }],
            },
        ],
    };
}
function makePageData(slug, htmlAst, extra) {
    return {
        slug: slug,
        htmlAst,
        frontmatter: { title: slug, tags: [] },
        ...extra,
    };
}
const cfg = { locale: "en-US" };
function makeComponentData(allFiles) {
    return { allFiles, cfg };
}
describe("renderTranscludes", () => {
    test("resolves a single page transclusion", () => {
        const root = {
            type: "root",
            children: [makeTranscludeBlockquote("target")],
        };
        const targetHtml = {
            type: "root",
            children: [
                {
                    type: "element",
                    tagName: "p",
                    properties: {},
                    children: [{ type: "text", value: "Target content" }],
                },
            ],
        };
        const allFiles = [makePageData("target", targetHtml)];
        const visited = new Set(["current"]);
        renderTranscludes(root, cfg, "current", makeComponentData(allFiles), visited);
        const bq = root.children[0];
        const texts = JSON.stringify(bq.children);
        assert.ok(texts.includes("Target content"), "transcluded content should be inlined");
    });
    test("allows the same page to be embedded twice as siblings", () => {
        const root = {
            type: "root",
            children: [makeTranscludeBlockquote("target"), makeTranscludeBlockquote("target")],
        };
        const targetHtml = {
            type: "root",
            children: [
                {
                    type: "element",
                    tagName: "p",
                    properties: {},
                    children: [{ type: "text", value: "Duplicated content" }],
                },
            ],
        };
        const allFiles = [makePageData("target", targetHtml)];
        const visited = new Set(["current"]);
        renderTranscludes(root, cfg, "current", makeComponentData(allFiles), visited);
        const first = root.children[0];
        const second = root.children[1];
        const firstText = JSON.stringify(first.children);
        const secondText = JSON.stringify(second.children);
        assert.ok(firstText.includes("Duplicated content"), "first embed should resolve");
        assert.ok(secondText.includes("Duplicated content"), "second embed should resolve, not be rejected as circular");
        assert.ok(!secondText.includes("Circular transclusion"), "should not show circular warning");
    });
    test("allows different sections of the same page to be embedded", () => {
        const root = {
            type: "root",
            children: [
                makeTranscludeBlockquote("target", "#intro"),
                makeTranscludeBlockquote("target", "#details"),
            ],
        };
        const targetHtml = {
            type: "root",
            children: [
                {
                    type: "element",
                    tagName: "h2",
                    properties: { id: "intro" },
                    children: [{ type: "text", value: "Intro" }],
                },
                {
                    type: "element",
                    tagName: "p",
                    properties: {},
                    children: [{ type: "text", value: "Intro text" }],
                },
                {
                    type: "element",
                    tagName: "h2",
                    properties: { id: "details" },
                    children: [{ type: "text", value: "Details" }],
                },
                {
                    type: "element",
                    tagName: "p",
                    properties: {},
                    children: [{ type: "text", value: "Details text" }],
                },
            ],
        };
        const allFiles = [makePageData("target", targetHtml)];
        const visited = new Set(["current"]);
        renderTranscludes(root, cfg, "current", makeComponentData(allFiles), visited);
        const first = root.children[0];
        const second = root.children[1];
        const firstText = JSON.stringify(first.children);
        const secondText = JSON.stringify(second.children);
        assert.ok(firstText.includes("Intro text"), "first header section should resolve");
        assert.ok(!firstText.includes("Details text"), "first section should not include second section");
        assert.ok(secondText.includes("Details text"), "second header section should resolve");
        assert.ok(!secondText.includes("Circular transclusion"), "should not show circular warning");
    });
    test("detects actual circular transclusion (A -> B -> A)", () => {
        // Page A embeds B, and B's htmlAst contains a transclusion of A
        const bTranscludesA = makeTranscludeBlockquote("pageA");
        const pageB_htmlAst = {
            type: "root",
            children: [
                {
                    type: "element",
                    tagName: "p",
                    properties: {},
                    children: [{ type: "text", value: "Page B content" }],
                },
                bTranscludesA,
            ],
        };
        const pageA_htmlAst = {
            type: "root",
            children: [
                {
                    type: "element",
                    tagName: "p",
                    properties: {},
                    children: [{ type: "text", value: "Page A content" }],
                },
            ],
        };
        const root = {
            type: "root",
            children: [makeTranscludeBlockquote("pageB")],
        };
        const allFiles = [makePageData("pageA", pageA_htmlAst), makePageData("pageB", pageB_htmlAst)];
        const visited = new Set(["pageA"]);
        renderTranscludes(root, cfg, "pageA", makeComponentData(allFiles), visited);
        const bq = root.children[0];
        const fullText = JSON.stringify(bq.children);
        assert.ok(fullText.includes("Page B content"), "page B content should be inlined");
        assert.ok(fullText.includes("Circular transclusion"), "circular A->B->A should be detected");
        assert.ok(!fullText.includes("Page A content"), "page A should not be re-inlined inside B");
    });
    test("self-referencing transclusion is blocked", () => {
        const root = {
            type: "root",
            children: [makeTranscludeBlockquote("self")],
        };
        const selfHtml = {
            type: "root",
            children: [
                {
                    type: "element",
                    tagName: "p",
                    properties: {},
                    children: [{ type: "text", value: "Self content" }],
                },
            ],
        };
        const allFiles = [makePageData("self", selfHtml)];
        const visited = new Set(["self"]);
        renderTranscludes(root, cfg, "self", makeComponentData(allFiles), visited);
        const bq = root.children[0];
        const text = JSON.stringify(bq.children);
        assert.ok(text.includes("Circular transclusion"), "self-reference should be blocked");
    });
});
describe("pageResources", () => {
    const emptyResources = {
        css: [],
        js: [],
        additionalHead: [],
    };
    test("uses baseDir prefix for resource paths in production mode", () => {
        const result = pageResources("/quartz", emptyResources);
        assert.ok(result.css[0].content.startsWith("/quartz/"), `expected css path to start with /quartz/, got: ${result.css[0].content}`);
        const externalJs = result.js.find((j) => j.contentType === "external" && "src" in j);
        assert.ok(externalJs && "src" in externalJs);
        assert.ok(externalJs.src.startsWith("/quartz/"), `expected js src to start with /quartz/, got: ${externalJs.src}`);
    });
    test("omits subpath prefix when baseDir is empty (serve mode)", () => {
        const result = pageResources(".", emptyResources);
        for (const css of result.css) {
            assert.ok(!css.content.includes("/quartz/"), `css path should not contain /quartz/, got: ${css.content}`);
        }
        for (const js of result.js) {
            if (js.contentType === "external" && "src" in js) {
                assert.ok(!js.src.includes("/quartz/"), `js src should not contain /quartz/, got: ${js.src}`);
            }
        }
    });
    test("contentIndex path reflects baseDir", () => {
        const withPrefix = pageResources("/quartz", emptyResources);
        const inlineJs = withPrefix.js.find((j) => j.contentType === "inline" && "script" in j);
        assert.ok(inlineJs && "script" in inlineJs);
        assert.ok(inlineJs.script.includes("/quartz/static/contentIndex.json"), `expected contentIndex fetch to include /quartz/ prefix, got: ${inlineJs.script}`);
        const withoutPrefix = pageResources(".", emptyResources);
        const inlineJsServe = withoutPrefix.js.find((j) => j.contentType === "inline" && "script" in j);
        assert.ok(inlineJsServe && "script" in inlineJsServe);
        assert.ok(!inlineJsServe.script.includes("/quartz/static/contentIndex.json"), `expected contentIndex fetch without /quartz/ prefix in serve mode, got: ${inlineJsServe.script}`);
    });
});
