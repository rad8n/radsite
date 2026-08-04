const DEFAULT_SANS_SERIF = 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';
const DEFAULT_MONO = "ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace";
export function getFontSpecificationName(spec) {
    if (typeof spec === "string") {
        return spec;
    }
    return spec.name;
}
function formatFontSpecification(type, spec) {
    if (typeof spec === "string") {
        spec = { name: spec };
    }
    const defaultIncludeWeights = type === "header" ? [400, 700] : [400, 600];
    const defaultIncludeItalic = type === "body";
    const weights = spec.weights ?? defaultIncludeWeights;
    const italic = spec.includeItalic ?? defaultIncludeItalic;
    const features = [];
    if (italic) {
        features.push("ital");
    }
    if (weights.length > 1) {
        const weightSpec = italic
            ? weights
                .flatMap((w) => [`0,${w}`, `1,${w}`])
                .sort()
                .join(";")
            : weights.join(";");
        features.push(`wght@${weightSpec}`);
    }
    if (features.length > 0) {
        return `${spec.name}:${features.join(",")}`;
    }
    return spec.name;
}
export function googleFontHref(theme) {
    const { header, body, code } = theme.typography;
    const headerFont = formatFontSpecification("header", header);
    const bodyFont = formatFontSpecification("body", body);
    const codeFont = formatFontSpecification("code", code);
    return `https://fonts.googleapis.com/css2?family=${headerFont}&family=${bodyFont}&family=${codeFont}&display=swap`;
}
export function googleFontSubsetHref(theme, text) {
    const title = theme.typography.title || theme.typography.header;
    const titleFont = formatFontSpecification("title", title);
    return `https://fonts.googleapis.com/css2?family=${titleFont}&text=${encodeURIComponent(text)}&display=swap`;
}
const fontMimeMap = {
    truetype: "ttf",
    woff: "woff",
    woff2: "woff2",
    opentype: "otf",
};
export async function processGoogleFonts(stylesheet, baseUrl) {
    const fontSourceRegex = /url\((https:\/\/fonts.gstatic.com\/.+(?:\/|(?:kit=))(.+?)[.&].+?)\)\sformat\('(\w+?)'\);/g;
    const fontFiles = [];
    let processedStylesheet = stylesheet;
    let match;
    while ((match = fontSourceRegex.exec(stylesheet)) !== null) {
        const url = match[1];
        const filename = match[2];
        const extension = fontMimeMap[match[3].toLowerCase()];
        const staticUrl = `https://${baseUrl}/static/fonts/${filename}.${extension}`;
        processedStylesheet = processedStylesheet.replace(url, staticUrl);
        fontFiles.push({ url, filename, extension });
    }
    return { processedStylesheet, fontFiles };
}
function hexToHsl(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result)
        return { h: 0, s: 0, l: 0 };
    const r = parseInt(result[1], 16) / 255;
    const g = parseInt(result[2], 16) / 255;
    const b = parseInt(result[3], 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min)
        return { h: 0, s: 0, l: Math.round(l * 100) };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    switch (max) {
        case r:
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            break;
        case g:
            h = ((b - r) / d + 2) / 6;
            break;
        case b:
            h = ((r - g) / d + 4) / 6;
            break;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
export function joinStyles(theme, ...stylesheet) {
    return `
${stylesheet.join("\n\n")}

:root {
  --light: ${theme.colors.lightMode.light};
  --lightgray: ${theme.colors.lightMode.lightgray};
  --gray: ${theme.colors.lightMode.gray};
  --darkgray: ${theme.colors.lightMode.darkgray};
  --dark: ${theme.colors.lightMode.dark};
  --secondary: ${theme.colors.lightMode.secondary};
  --tertiary: ${theme.colors.lightMode.tertiary};
  --highlight: ${theme.colors.lightMode.highlight};
  --textHighlight: ${theme.colors.lightMode.textHighlight};

  --titleFont: "${getFontSpecificationName(theme.typography.title || theme.typography.header)}", ${DEFAULT_SANS_SERIF};
  --headerFont: "${getFontSpecificationName(theme.typography.header)}", ${DEFAULT_SANS_SERIF};
  --bodyFont: "${getFontSpecificationName(theme.typography.body)}", ${DEFAULT_SANS_SERIF};
  --codeFont: "${getFontSpecificationName(theme.typography.code)}", ${DEFAULT_MONO};
}

:root[saved-theme="dark"] {
  --light: ${theme.colors.darkMode.light};
  --lightgray: ${theme.colors.darkMode.lightgray};
  --gray: ${theme.colors.darkMode.gray};
  --darkgray: ${theme.colors.darkMode.darkgray};
  --dark: ${theme.colors.darkMode.dark};
  --secondary: ${theme.colors.darkMode.secondary};
  --tertiary: ${theme.colors.darkMode.tertiary};
  --highlight: ${theme.colors.darkMode.highlight};
  --textHighlight: ${theme.colors.darkMode.textHighlight};
}

:root {
  /* Surface colors */
  --background-primary: var(--light);
  --background-primary-alt: var(--light);
  --background-secondary: var(--lightgray);
  --background-secondary-alt: var(--lightgray);
  --background-modifier-border: var(--lightgray);
  --background-modifier-border-hover: var(--gray);
  --background-modifier-border-focus: var(--secondary);

  /* Text colors */
  --text-normal: var(--darkgray);
  --text-muted: var(--gray);
  --text-faint: var(--gray);
  --text-accent: var(--secondary);
  --text-accent-hover: var(--tertiary);
  --text-on-accent: var(--light);
  --text-on-accent-inverted: var(--dark);
  --text-highlight-bg: var(--textHighlight);

  /* Interactive */
  --interactive-normal: var(--light);
  --interactive-hover: var(--lightgray);
  --interactive-accent: var(--secondary);
  --interactive-accent-hover: var(--tertiary);

  /* Base scale */
  --color-base-00: var(--light);
  --color-base-05: var(--light);
  --color-base-10: var(--light);
  --color-base-20: var(--lightgray);
  --color-base-25: var(--lightgray);
  --color-base-30: var(--lightgray);
  --color-base-35: var(--lightgray);
  --color-base-40: var(--gray);
  --color-base-50: var(--gray);
  --color-base-60: var(--gray);
  --color-base-70: var(--darkgray);
  --color-base-100: var(--dark);

  /* Font aliases */
  --font-text: var(--bodyFont);
  --font-monospace: var(--codeFont);
  --font-interface: var(--bodyFont);

  /* Nav/sidebar */
  --nav-item-color: var(--darkgray);
  --nav-item-color-hover: var(--dark);
  --nav-item-color-active: var(--secondary);
  --nav-item-background-hover: var(--lightgray);
  --nav-item-background-active: var(--highlight);

  /* Tags */
  --tag-background: var(--highlight);
  --tag-color: var(--secondary);
  --tag-background-hover: var(--lightgray);

  /* Misc */
  --icon-color: var(--darkgray);
  --icon-color-hover: var(--dark);
  --icon-color-active: var(--secondary);
  --divider-color: var(--lightgray);
  --link-color: var(--secondary);
  --link-color-hover: var(--tertiary);

  /* Accent HSL (computed from secondary) */
  --accent-h: ${hexToHsl(theme.colors.lightMode.secondary).h};
  --accent-s: ${hexToHsl(theme.colors.lightMode.secondary).s}%;
  --accent-l: ${hexToHsl(theme.colors.lightMode.secondary).l}%;
}

:root[saved-theme="dark"] {
  /* Surface colors */
  --background-primary: var(--light);
  --background-primary-alt: var(--light);
  --background-secondary: var(--lightgray);
  --background-secondary-alt: var(--lightgray);
  --background-modifier-border: var(--lightgray);
  --background-modifier-border-hover: var(--gray);
  --background-modifier-border-focus: var(--secondary);

  /* Text colors */
  --text-normal: var(--darkgray);
  --text-muted: var(--gray);
  --text-faint: var(--gray);
  --text-accent: var(--secondary);
  --text-accent-hover: var(--tertiary);
  --text-on-accent: var(--light);
  --text-on-accent-inverted: var(--dark);
  --text-highlight-bg: var(--textHighlight);

  /* Interactive */
  --interactive-normal: var(--light);
  --interactive-hover: var(--lightgray);
  --interactive-accent: var(--secondary);
  --interactive-accent-hover: var(--tertiary);

  /* Base scale */
  --color-base-00: var(--light);
  --color-base-05: var(--light);
  --color-base-10: var(--light);
  --color-base-20: var(--lightgray);
  --color-base-25: var(--lightgray);
  --color-base-30: var(--lightgray);
  --color-base-35: var(--lightgray);
  --color-base-40: var(--gray);
  --color-base-50: var(--gray);
  --color-base-60: var(--gray);
  --color-base-70: var(--darkgray);
  --color-base-100: var(--dark);

  /* Font aliases */
  --font-text: var(--bodyFont);
  --font-monospace: var(--codeFont);
  --font-interface: var(--bodyFont);

  /* Nav/sidebar */
  --nav-item-color: var(--darkgray);
  --nav-item-color-hover: var(--dark);
  --nav-item-color-active: var(--secondary);
  --nav-item-background-hover: var(--lightgray);
  --nav-item-background-active: var(--highlight);

  /* Tags */
  --tag-background: var(--highlight);
  --tag-color: var(--secondary);
  --tag-background-hover: var(--lightgray);

  /* Misc */
  --icon-color: var(--darkgray);
  --icon-color-hover: var(--dark);
  --icon-color-active: var(--secondary);
  --divider-color: var(--lightgray);
  --link-color: var(--secondary);
  --link-color-hover: var(--tertiary);

  /* Accent HSL (computed from secondary) */
  --accent-h: ${hexToHsl(theme.colors.darkMode.secondary).h};
  --accent-s: ${hexToHsl(theme.colors.darkMode.secondary).s}%;
  --accent-l: ${hexToHsl(theme.colors.darkMode.secondary).l}%;
}
`;
}
