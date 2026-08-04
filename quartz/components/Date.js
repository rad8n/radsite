import { jsx as _jsx } from "preact/jsx-runtime";
export function getDate(data) {
    if (!data.defaultDateType) {
        throw new Error(`Field 'defaultDateType' was not set. Ensure the CreatedModifiedDate plugin is configured with a 'defaultDateType' option. See https://quartz.jzhao.xyz/plugins/CreatedModifiedDate for more details.`);
    }
    return data.dates?.[data.defaultDateType];
}
export function formatDate(d, locale = "en-US") {
    return d.toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "2-digit",
    });
}
export function Date({ date, locale }) {
    return _jsx("time", { datetime: date.toISOString(), children: formatDate(date, locale) });
}
