// src/lib/sanitizeHtml.js
import sanitizeHtml from "sanitize-html";

export function sanitizeFaqHtml(dirtyHtml) {
    return sanitizeHtml(dirtyHtml, {
        allowedTags: [
            "b", "strong", "i", "em", "u",
            "p", "br",
            "ul", "ol", "li",
            "blockquote",
            "a",
            "code", "pre",
            "h1", "h2", "h3"
        ],
        allowedAttributes: { a: ["href", "title", "target", "rel"] },
        allowedSchemes: ["http", "https", "mailto"],
        transformTags: {
            a: (tagName, attribs) => {
                const safe = { ...attribs };
                // force safe rel for external/new-tab links
                if (safe.target === "_blank") safe.rel = "noopener noreferrer";
                return { tagName, attribs: safe };
            },
        },
        disallowedTagsMode: "discard",
    });
}
