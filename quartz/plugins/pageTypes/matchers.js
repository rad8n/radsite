export const match = {
    ext: (extension) => {
        const normalized = extension.startsWith(".") ? extension : `.${extension}`;
        return ({ slug }) => slug.endsWith(normalized) || !slug.includes(".");
    },
    slugPrefix: (prefix) => {
        return ({ slug }) => slug.startsWith(prefix);
    },
    frontmatter: (key, predicate) => {
        return ({ fileData }) => {
            const fm = fileData.frontmatter;
            return fm ? predicate(fm[key]) : false;
        };
    },
    and: (...matchers) => {
        return (args) => matchers.every((m) => m(args));
    },
    or: (...matchers) => {
        return (args) => matchers.some((m) => m(args));
    },
    not: (matcher) => {
        return (args) => !matcher(args);
    },
    all: () => {
        return () => true;
    },
    none: () => {
        return () => false;
    },
};
