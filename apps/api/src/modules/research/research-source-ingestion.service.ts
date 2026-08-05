import {
  lookup,
} from "node:dns/promises";

import {
  request as httpRequest,
} from "node:http";

import type {
  IncomingHttpHeaders,
  RequestOptions,
} from "node:http";

import {
  request as httpsRequest,
} from "node:https";

import {
  isIP,
} from "node:net";

import {
  Injectable,
} from "@nestjs/common";

const MAX_REDIRECTS =
  3;

const REQUEST_TIMEOUT_MS =
  12_000;

const MAX_RESPONSE_BYTES =
  1_500_000;

const MAX_TEXT_CHARACTERS =
  120_000;

const MIN_USEFUL_CHARACTERS =
  120;

const USER_AGENT =
  "AIMERS-Research-Source-Ingestion/1.0";

type PublicAddress = {
  address: string;
  family:
    | 4
    | 6;
};

type HttpResponse = {
  statusCode: number;
  headers: IncomingHttpHeaders;
  body: Buffer;
};

export type ResearchSourceExcerptInput = {
  quote: string;
  locator: string;
  startOffset: number;
  endOffset: number;
};

export type ResearchSourceIngestionResult = {
  finalUrl: string;
  pageTitle: string | null;
  author: string | null;
  publisher: string | null;
  description: string | null;
  language: string | null;
  contentType: string;
  rawContent: string;
  summary: string;
  wordCount: number;
  excerpts:
    ResearchSourceExcerptInput[];
};

function ipv4Number(
  address: string,
): number | null {
  const parts =
    address
      .split(".")
      .map(Number);

  if (
    parts.length !== 4 ||
    parts.some(
      (part) =>
        !Number.isInteger(part) ||
        part < 0 ||
        part > 255,
    )
  ) {
    return null;
  }

  return (
    (
      parts[0] * 2 ** 24
    ) +
    (
      parts[1] * 2 ** 16
    ) +
    (
      parts[2] * 2 ** 8
    ) +
    parts[3]
  ) >>> 0;
}

function inIpv4Cidr(
  address: number,
  base: string,
  prefix: number,
): boolean {
  const baseNumber =
    ipv4Number(
      base,
    );

  if (
    baseNumber === null
  ) {
    return false;
  }

  const mask =
    prefix === 0
      ? 0
      : (
          0xffffffff <<
          (
            32 -
            prefix
          )
        ) >>> 0;

  return (
    address &
    mask
  ) === (
    baseNumber &
    mask
  );
}

function isPrivateOrReservedIpv4(
  address: string,
): boolean {
  const value =
    ipv4Number(
      address,
    );

  if (
    value === null
  ) {
    return true;
  }

  const ranges:
    Array<[
      string,
      number,
    ]> = [
      ["0.0.0.0", 8],
      ["10.0.0.0", 8],
      ["100.64.0.0", 10],
      ["127.0.0.0", 8],
      ["169.254.0.0", 16],
      ["172.16.0.0", 12],
      ["192.0.0.0", 24],
      ["192.0.2.0", 24],
      ["192.168.0.0", 16],
      ["198.18.0.0", 15],
      ["198.51.100.0", 24],
      ["203.0.113.0", 24],
      ["224.0.0.0", 4],
      ["240.0.0.0", 4],
    ];

  return ranges.some(
    (
      [
        base,
        prefix,
      ],
    ) =>
      inIpv4Cidr(
        value,
        base,
        prefix,
      ),
  );
}

function isPrivateOrReservedIpv6(
  address: string,
): boolean {
  const normalized =
    address
      .toLowerCase()
      .split("%")[0];

  if (
    normalized === "::" ||
    normalized === "::1"
  ) {
    return true;
  }

  if (
    normalized.startsWith(
      "::ffff:",
    )
  ) {
    const mapped =
      normalized.slice(
        "::ffff:".length,
      );

    return (
      isIP(mapped) !== 4 ||
      isPrivateOrReservedIpv4(
        mapped,
      )
    );
  }

  return (
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith("ff") ||
    normalized.startsWith(
      "2001:db8",
    )
  );
}

function isPrivateOrReservedAddress(
  address: string,
): boolean {
  const family =
    isIP(
      address,
    );

  if (
    family === 4
  ) {
    return isPrivateOrReservedIpv4(
      address,
    );
  }

  if (
    family === 6
  ) {
    return isPrivateOrReservedIpv6(
      address,
    );
  }

  return true;
}

function blockedHostname(
  hostname: string,
): boolean {
  const normalized =
    hostname
      .toLowerCase()
      .replace(
        /\.$/,
        "",
      );

  return (
    normalized === "localhost" ||
    normalized.endsWith(
      ".localhost",
    ) ||
    normalized.endsWith(
      ".local",
    ) ||
    normalized.endsWith(
      ".internal",
    ) ||
    normalized.endsWith(
      ".lan",
    ) ||
    normalized.endsWith(
      ".home",
    )
  );
}

async function resolvePublicAddress(
  target: URL,
): Promise<PublicAddress> {
  if (
    target.protocol !== "http:" &&
    target.protocol !== "https:"
  ) {
    throw new Error(
      "Only HTTP and HTTPS webpage sources are supported.",
    );
  }

  if (
    target.username ||
    target.password
  ) {
    throw new Error(
      "Webpage URLs cannot contain embedded credentials.",
    );
  }

  const expectedPort =
    target.protocol === "https:"
      ? "443"
      : "80";

  if (
    target.port &&
    target.port !== expectedPort
  ) {
    throw new Error(
      "Webpage sources may use only the standard HTTP or HTTPS port.",
    );
  }

  if (
    blockedHostname(
      target.hostname,
    )
  ) {
    throw new Error(
      "Local or private network addresses cannot be ingested.",
    );
  }

  const literalFamily =
    isIP(
      target.hostname,
    );

  if (
    literalFamily
  ) {
    if (
      isPrivateOrReservedAddress(
        target.hostname,
      )
    ) {
      throw new Error(
        "Private, loopback or reserved IP addresses cannot be ingested.",
      );
    }

    return {
      address:
        target.hostname,

      family:
        literalFamily as
          | 4
          | 6,
    };
  }

  let addresses:
    Array<{
      address: string;
      family: number;
    }>;

  try {
    addresses =
      await lookup(
        target.hostname,
        {
          all:
            true,
          verbatim:
            true,
        },
      );
  } catch {
    throw new Error(
      "The webpage hostname could not be resolved.",
    );
  }

  if (
    !addresses.length
  ) {
    throw new Error(
      "The webpage hostname did not resolve to an address.",
    );
  }

  if (
    addresses.some(
      (entry) =>
        isPrivateOrReservedAddress(
          entry.address,
        ),
    )
  ) {
    throw new Error(
      "The webpage hostname resolves to a private or reserved network.",
    );
  }

  const selected =
    addresses[0];

  return {
    address:
      selected.address,

    family:
      selected.family as
        | 4
        | 6,
  };
}

function requestOnce(
  target: URL,
  resolved: PublicAddress,
): Promise<HttpResponse> {
  return new Promise(
    (
      resolve,
      reject,
    ) => {
      const options:
        RequestOptions & {
          servername?: string;
        } = {
          protocol:
            target.protocol,

          hostname:
            resolved.address,

          servername:
            target.protocol ===
            "https:"
              ? target.hostname
              : undefined,

          port:
            target.port ||
            undefined,

          method:
            "GET",

          path:
            `${target.pathname}${target.search}`,

          headers: {
            Host:
              target.host,

            Accept:
              "text/html,application/xhtml+xml,text/plain;q=0.9",

            "Accept-Encoding":
              "identity",

            "User-Agent":
              USER_AGENT,
          },
        };

      const requester =
        target.protocol ===
        "https:"
          ? httpsRequest
          : httpRequest;

      const request =
        requester(
          options,
          (response) => {
            const chunks:
              Buffer[] = [];

            let total =
              0;

            response.on(
              "data",
              (
                chunk:
                  Buffer
                  | string,
              ) => {
                const buffer =
                  Buffer.isBuffer(
                    chunk,
                  )
                    ? chunk
                    : Buffer.from(
                        chunk,
                      );

                total +=
                  buffer.length;

                if (
                  total >
                  MAX_RESPONSE_BYTES
                ) {
                  request.destroy(
                    new Error(
                      "The webpage exceeded the maximum ingestion size.",
                    ),
                  );

                  return;
                }

                chunks.push(
                  buffer,
                );
              },
            );

            response.on(
              "end",
              () => {
                resolve({
                  statusCode:
                    response.statusCode ??
                    0,

                  headers:
                    response.headers,

                  body:
                    Buffer.concat(
                      chunks,
                    ),
                });
              },
            );

            response.on(
              "error",
              reject,
            );
          },
        );

      request.setTimeout(
        REQUEST_TIMEOUT_MS,
        () => {
          request.destroy(
            new Error(
              "The webpage request timed out.",
            ),
          );
        },
      );

      request.on(
        "error",
        reject,
      );

      request.end();
    },
  );
}

async function fetchPublicPage(
  initialUrl: string,
): Promise<{
  finalUrl: URL;
  contentType: string;
  html: string;
}> {
  let current: URL;

  try {
    current =
      new URL(
        initialUrl,
      );
  } catch {
    throw new Error(
      "Enter a valid absolute webpage URL.",
    );
  }

  for (
    let redirectCount = 0;
    redirectCount <=
      MAX_REDIRECTS;
    redirectCount += 1
  ) {
    const resolved =
      await resolvePublicAddress(
        current,
      );

    const response =
      await requestOnce(
        current,
        resolved,
      );

    if (
      response.statusCode >=
        300 &&
      response.statusCode <
        400
    ) {
      const location =
        response.headers
          .location;

      if (
        !location
      ) {
        throw new Error(
          "The webpage returned an invalid redirect.",
        );
      }

      if (
        redirectCount ===
        MAX_REDIRECTS
      ) {
        throw new Error(
          "The webpage redirected too many times.",
        );
      }

      current =
        new URL(
          location,
          current,
        );

      continue;
    }

    if (
      response.statusCode <
        200 ||
      response.statusCode >=
        300
    ) {
      throw new Error(
        `The webpage returned HTTP ${response.statusCode}.`,
      );
    }

    const contentType =
      (
        response.headers[
          "content-type"
        ] ??
        ""
      )
        .toString()
        .toLowerCase();

    const supported =
      contentType.includes(
        "text/html",
      ) ||
      contentType.includes(
        "application/xhtml+xml",
      ) ||
      contentType.includes(
        "text/plain",
      );

    if (
      !supported
    ) {
      throw new Error(
        "This URL did not return a supported webpage or plain-text document.",
      );
    }

    return {
      finalUrl:
        current,

      contentType,

      html:
        response.body
          .toString(
            "utf8",
          ),
    };
  }

  throw new Error(
    "The webpage could not be retrieved.",
  );
}

function decodeEntities(
  value: string,
): string {
  const named:
    Record<
      string,
      string
    > = {
      amp: "&",
      apos: "'",
      gt: ">",
      hellip: "…",
      laquo: "«",
      ldquo: "“",
      lsquo: "‘",
      lt: "<",
      nbsp: " ",
      ndash: "–",
      quot: '"',
      raquo: "»",
      rdquo: "”",
      rsquo: "’",
      mdash: "—",
    };

  return value.replace(
    /&(#x?[0-9a-f]+|[a-z]+);/gi,
    (
      entity,
      code: string,
    ) => {
      if (
        code.startsWith(
          "#x",
        ) ||
        code.startsWith(
          "#X",
        )
      ) {
        const point =
          Number.parseInt(
            code.slice(2),
            16,
          );

        return Number.isFinite(
          point,
        )
          ? String.fromCodePoint(
              point,
            )
          : entity;
      }

      if (
        code.startsWith("#")
      ) {
        const point =
          Number.parseInt(
            code.slice(1),
            10,
          );

        return Number.isFinite(
          point,
        )
          ? String.fromCodePoint(
              point,
            )
          : entity;
      }

      return (
        named[
          code.toLowerCase()
        ] ??
        entity
      );
    },
  );
}

function cleanInlineText(
  value:
    | string
    | null,
): string | null {
  if (
    !value
  ) {
    return null;
  }

  const cleaned =
    decodeEntities(
      value
        .replace(
          /<[^>]*>/g,
          " ",
        )
        .replace(
          /\s+/g,
          " ",
        )
        .trim(),
    );

  return cleaned ||
    null;
}

function escapedPattern(
  value: string,
): string {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
}

function metaContent(
  html: string,
  key: string,
): string | null {
  const escaped =
    escapedPattern(
      key,
    );

  const patterns = [
    new RegExp(
      `<meta[^>]+(?:name|property)\\s*=\\s*["']${escaped}["'][^>]+content\\s*=\\s*["']([^"']+)["'][^>]*>`,
      "i",
    ),

    new RegExp(
      `<meta[^>]+content\\s*=\\s*["']([^"']+)["'][^>]+(?:name|property)\\s*=\\s*["']${escaped}["'][^>]*>`,
      "i",
    ),
  ];

  for (
    const pattern
    of patterns
  ) {
    const match =
      html.match(
        pattern,
      );

    const cleaned =
      cleanInlineText(
        match?.[1] ??
        null,
      );

    if (
      cleaned
    ) {
      return cleaned;
    }
  }

  return null;
}

function extractLanguage(
  html: string,
): string | null {
  const match =
    html.match(
      /<html[^>]+lang\s*=\s*["']([^"']+)["']/i,
    );

  return cleanInlineText(
    match?.[1] ??
    null,
  );
}

export type ResearchSourceIngestionContext = {
  sourceTitle?: string | null;
  projectTitle?: string | null;
  researchQuestion?: string | null;
  description?: string | null;
  subjectName?: string | null;
  chapterName?: string | null;
  topicName?: string | null;
};

type RankedParagraph = {
  text: string;
  section: string | null;
  startOffset: number;
  score: number;
  tokens: Set<string>;
};

type ExcerptBuildResult = {
  excerpts: ResearchSourceExcerptInput[];
  candidateCount: number;
  contextTermCount: number;
};

const CONTEXT_STOP_WORDS = new Set([
  "a",
  "about",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "because",
  "by",
  "can",
  "chapter",
  "concept",
  "does",
  "for",
  "from",
  "how",
  "in",
  "into",
  "is",
  "it",
  "its",
  "of",
  "on",
  "or",
  "project",
  "question",
  "research",
  "source",
  "study",
  "that",
  "the",
  "their",
  "this",
  "to",
  "topic",
  "using",
  "was",
  "what",
  "when",
  "where",
  "which",
  "why",
  "with",
]);

const BOILERPLATE_PATTERNS = [
  /this article has multiple issues/i,
  /please help improve/i,
  /learn how and when to remove/i,
  /this article needs additional citations/i,
  /additional citations for verification/i,
  /find sources:/i,
  /unsourced material may be challenged/i,
  /this section needs expansion/i,
  /for other uses, see/i,
  /from wikipedia, the free encyclopedia/i,
  /navigation menu/i,
  /privacy policy/i,
  /terms of use/i,
  /retrieved from/i,
  /citation needed/i,
];

function removeHtmlBlock(
  html: string,
  tagName: string,
): string {
  const escapedTag = escapedPattern(tagName);

  return html.replace(
    new RegExp(
      `<${escapedTag}\\b[^>]*>[\\s\\S]*?<\\/${escapedTag}\\s*>`,
      "gi",
    ),
    " ",
  );
}

function removeElementsByMarker(
  html: string,
  marker: RegExp,
): string {
  const pattern =
    /<([a-z][a-z0-9:-]*)\b([^>]*)>[\s\S]*?<\/\1\s*>/gi;

  return html.replace(
    pattern,
    (
      complete,
      _tagName: string,
      attributes: string,
    ) =>
      marker.test(attributes)
        ? " "
        : complete,
  );
}

function isolateReadableHtml(
  html: string,
): string {
  return (
    html.match(
      /<main\b[^>]*>([\s\S]*?)<\/main>/i,
    )?.[1] ??
    html.match(
      /<article\b[^>]*>([\s\S]*?)<\/article>/i,
    )?.[1] ??
    html
  );
}

function normalizeReadableText(
  html: string,
): string {
  let preferred = isolateReadableHtml(html);

  preferred = preferred.replace(
    /<!--[\s\S]*?-->/g,
    " ",
  );

  for (const tagName of [
    "script",
    "style",
    "noscript",
    "svg",
    "template",
    "canvas",
    "iframe",
    "form",
    "nav",
    "footer",
    "header",
    "aside",
    "table",
    "figure",
  ]) {
    preferred = removeHtmlBlock(
      preferred,
      tagName,
    );
  }

  preferred = removeElementsByMarker(
    preferred,
    /(?:class|id)\s*=\s*["'][^"']*(?:mw-editsection|navbox|vertical-navbox|infobox|metadata|ambox|hatnote|shortdescription|reflist|references|reference|toc|sidebar|portal|noprint|thumb|gallery|sistersitebox|catlinks|authority-control|printfooter)[^"']*["']/i,
  );

  const withBreaks = preferred
    /* AIMERS RESEARCH AI — PRESERVE MATH SCRIPTS V3 */
      .replace(
        /<sup\b[^>]*>([\s\S]*?)<\/sup>/gi,
        "^$1",
      )
      .replace(
        /<sub\b[^>]*>([\s\S]*?)<\/sub>/gi,
        "_$1",
      )
      .replace(
      /<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi,
      "\n\n$1\n\n",
    )
    .replace(
      /<br\s*\/?>/gi,
      "\n",
    )
    .replace(
      /<\/(p|div|section|article|li|blockquote|tr|dd|dt)>/gi,
      "\n\n",
    )
    .replace(
      /<[^>]+>/g,
      " ",
    );

  const decoded = decodeEntities(withBreaks)
    .replace(
      /<[^>]+>/g,
      " ",
    )
    .replace(
      /\{\|[\s\S]*?\|\}/g,
      " ",
    )
    .replace(
      /\{\{[\s\S]*?\}\}/g,
      " ",
    )
    .replace(
      /\[\[(?:File|Image|Category):[^\]]+\]\]/gi,
      " ",
    )
    .replace(
      /\[(?:\d+(?:\s*,\s*\d+)*)\]/g,
      " ",
    )
    .replace(
      /\[\s*citation needed\s*\]/gi,
      " ",
    );

  /* AIMERS RESEARCH AI — NORMALIZE MATH OPERATORS V1 */
  const normalizedMath =
    decoded.replace(
      /(?:[×x]\s*){2,}/gi,
      "× ",
    );

  return normalizedMath
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .split(/\n{2,}/)
    .map((part) =>
      part
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean)
    .join("\n\n")
    .trim()
    .slice(0, MAX_TEXT_CHARACTERS);
}

function tokenizeResearchText(
  value: string | null | undefined,
): string[] {
  if (!value) {
    return [];
  }

  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .match(/[\p{L}\p{N}]+/gu) ??
    []
  )
    .map((token) => token.trim())
    .filter(
      (token) =>
        token.length >= 2 &&
        !CONTEXT_STOP_WORDS.has(token),
    );
}

function addWeightedTerms(
  target: Map<string, number>,
  value: string | null | undefined,
  weight: number,
): void {
  for (const token of tokenizeResearchText(value)) {
    target.set(
      token,
      Math.max(
        target.get(token) ?? 0,
        weight,
      ),
    );
  }
}

function buildContextTerms(
  context: ResearchSourceIngestionContext,
): Map<string, number> {
  const terms = new Map<string, number>();

  addWeightedTerms(
    terms,
    context.researchQuestion,
    6,
  );
  addWeightedTerms(
    terms,
    context.topicName,
    5,
  );
  addWeightedTerms(
    terms,
    context.chapterName,
    4,
  );
  addWeightedTerms(
    terms,
    context.sourceTitle,
    4,
  );
  addWeightedTerms(
    terms,
    context.projectTitle,
    4,
  );
  addWeightedTerms(
    terms,
    context.description,
    3,
  );
  addWeightedTerms(
    terms,
    context.subjectName,
    2,
  );

  return terms;
}

function isHeadingLike(
  paragraph: string,
): boolean {
  const words = paragraph
    .split(/\s+/)
    .filter(Boolean);

  return (
    paragraph.length <= 110 &&
    words.length <= 14 &&
    !/[.!?]$/.test(paragraph) &&
    !/[{}<>\\|]/.test(paragraph)
  );
}

/* AIMERS RESEARCH AI — WIKIPEDIA EXCERPT POLISH V2 */
/* AIMERS RESEARCH AI — WIKIPEDIA FRAGMENT CLEANUP V1 */
function normalizeSectionLabel(
  value: string,
): string | null {
  const cleaned = value
    .replace(
      /\[\s*edit\s*\]/gi,
      " ",
    )
    .replace(
      /\(\s*learn how and when to remove this message\s*\)/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();

  const startsLikeHeading =
    /^[A-Z0-9]/.test(cleaned);

  const endsLikeFragment =
    /\b(?:and|or|of|to|with|by|for|at|in|on|from|as|is|are|was|were|be|being|the|a|an)$/i
      .test(cleaned);

  if (
    cleaned.length < 3 ||
    containsBoilerplate(cleaned) ||
    /^[a-z]$/i.test(cleaned) ||
    !startsLikeHeading ||
    endsLikeFragment
  ) {
    return null;
  }

  return cleaned.slice(0, 90);
}

function isFormulaFragment(
  value: string,
): boolean {
  const cleaned =
    value.trim();

  return /^(?:[A-Za-z]|[A-Za-z]_[A-Za-z0-9]+|[A-Za-z]\^[0-9]+)$/
    .test(cleaned);
}

function cleanExcerptQuote(
  value: string,
  maximumLength: number,
): string {
  let quote = value
    .replace(
      /\[\s*edit\s*\]/gi,
      " ",
    )
    .replace(
      /\(\s*learn how and when to remove this message\s*\)/gi,
      " ",
    )
    .replace(
      /\[\s*\d+(?:\s*,\s*\d+)*\s*\]/g,
      " ",
    )
    .replace(
      /(^|[\s.,;:!?()[\]])\^\s*\d+(?=$|[\s.,;:!?()[\]])/g,
      "$1",
    )
    .replace(
      /([.!?])\s*\^(?=$|\s)/g,
      "$1",
    )
    .replace(
      /\s+\^(?=$|\s)/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();

  if (quote.length > maximumLength) {
    const clipped = quote.slice(
      0,
      maximumLength,
    );

    const sentenceEnd = Math.max(
      clipped.lastIndexOf("."),
      clipped.lastIndexOf("?"),
      clipped.lastIndexOf("!"),
    );

    quote =
      sentenceEnd >= maximumLength * 0.58
        ? clipped.slice(
            0,
            sentenceEnd + 1,
          )
        : clipped;
  }

  return quote
    .replace(
      /\s+([,.;:!?])/g,
      "$1",
    )
    .replace(
      /^[\s,;:)\]}]+/,
      "",
    )
    .replace(
      /[\s([{,:;^]+$/,
      "",
    )
    .trim();
}

function isUsefulExcerptQuote(
  value: string,
): boolean {
  const words = value
    .split(/\s+/)
    .filter(Boolean);

  const hasCompleteEnding =
    /[.!?]["')\]]?$/.test(value);

  const startsCleanly =
    /^[A-Z0-9"'(]/.test(value) ||
    /^(?:g|v|u|x|y|t|h|r)\s+(?:is|=)\b/i
      .test(value);

  return (
    value.length >= 140 &&
    words.length >= 24 &&
    startsCleanly &&
    (
      hasCompleteEnding ||
      value.length >= 260
    )
  );
}

function containsBoilerplate(
  paragraph: string,
): boolean {
  return BOILERPLATE_PATTERNS.some(
    (pattern) => pattern.test(paragraph),
  );
}

function hasMarkupNoise(
  paragraph: string,
): boolean {
  if (
    /(?:<\/?math\b|mw:|["']template["']|["']params["']|["']target["'])/i.test(
      paragraph,
    )
  ) {
    return true;
  }

  const noisyCharacters =
    (paragraph.match(/[{}<>\\|]/g) ?? [])
      .length;

  if (
    noisyCharacters /
      Math.max(1, paragraph.length) >
    0.035
  ) {
    return true;
  }

  const urlCount =
    (paragraph.match(/https?:\/\//gi) ?? [])
      .length;

  return urlCount >= 3;
}

/* AIMERS RESEARCH AI — TOPIC DRIFT GUARD V2 */
const ADVANCED_APPLICATION_TERMS =
  new Set([
    "spacecraft",
    "spaceflight",
    "missile",
    "missiles",
    "intercontinental",
    "kepler",
    "keplerian",
    "planetary",
    "orbit",
    "orbital",
  ]);

function topicDriftPenalty(
  tokens: Set<string>,
  contextTerms: Map<string, number>,
): number {
  const projectRequestsAdvancedApplication =
    [...ADVANCED_APPLICATION_TERMS]
      .some((term) =>
        contextTerms.has(term),
      );

  if (projectRequestsAdvancedApplication) {
    return 0;
  }

  let matches = 0;

  for (
    const term
    of ADVANCED_APPLICATION_TERMS
  ) {
    if (tokens.has(term)) {
      matches += 1;
    }
  }

  return Math.min(
    30,
    matches * 6,
  );
}

function paragraphQualityScore(
  paragraph: string,
): number {
  const words = paragraph
    .split(/\s+/)
    .filter(Boolean);

  let score = Math.min(
    4,
    words.length / 45,
  );

  if (/[.!?]/.test(paragraph)) {
    score += 1.25;
  }

  if (
    /(?:equation|formula|therefore|because|defined|represents|means|derived|velocity|acceleration|mass|mole|force|energy|range|trajectory|angle|gravity|particle|atom|molecule)/i.test(
      paragraph,
    )
  ) {
    score += 1.5;
  }

  if (paragraph.length > 1400) {
    score -= 1;
  }

  return score;
}

function splitLongParagraph(
  paragraph: string,
): string[] {
  if (paragraph.length <= 1500) {
    return [paragraph];
  }

  const sentences =
    paragraph.match(
      /[^.!?]+[.!?]+|[^.!?]+$/g,
    ) ?? [paragraph];

  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const next = current
      ? `${current} ${sentence.trim()}`
      : sentence.trim();

    if (
      next.length > 1350 &&
      current.length >= 220
    ) {
      chunks.push(current);
      current = sentence.trim();
    } else {
      current = next;
    }
  }

  if (current.length >= 100) {
    chunks.push(current);
  }

  return chunks.length
    ? chunks
    : [paragraph.slice(0, 1350)];
}

function tokenSimilarity(
  left: Set<string>,
  right: Set<string>,
): number {
  if (!left.size || !right.size) {
    return 0;
  }

  let intersection = 0;

  for (const token of left) {
    if (right.has(token)) {
      intersection += 1;
    }
  }

  const union =
    left.size +
    right.size -
    intersection;

  return union
    ? intersection / union
    : 0;
}

function buildExcerpts(
  text: string,
  context: ResearchSourceIngestionContext,
): ExcerptBuildResult {
  const contextTerms =
    buildContextTerms(context);

  const blocks = text
    .split(/\n{2,}/)
    .map((paragraph) =>
      paragraph
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);

  const candidates: RankedParagraph[] = [];
  let currentSection: string | null = null;
  let pendingFragment = "";
  let searchOffset = 0;

  blocks.forEach((block, blockIndex) => {
    const blockOffset = text.indexOf(
      block,
      searchOffset,
    );

    if (blockOffset >= 0) {
      searchOffset =
        blockOffset + block.length;
    }

    if (isHeadingLike(block)) {
      const section =
        normalizeSectionLabel(block);

      if (section) {
        currentSection = section;
        pendingFragment = "";
      } else if (
        isFormulaFragment(block)
      ) {
        pendingFragment = [
          pendingFragment,
          block,
        ]
          .filter(Boolean)
          .join(" ");
      } else {
        currentSection = null;
        pendingFragment = "";
      }

      return;
    }

    for (
      const segment
      of splitLongParagraph(block)
    ) {
      const candidateText =
        pendingFragment
          ? `${pendingFragment} ${segment}`
          : segment;

      pendingFragment = "";

      const words = candidateText
        .split(/\s+/)
        .filter(Boolean);

      if (
        candidateText.length < 100 ||
        words.length < 18 ||
        containsBoilerplate(candidateText) ||
        hasMarkupNoise(candidateText)
      ) {
        continue;
      }

      const tokens = new Set(
        tokenizeResearchText(candidateText),
      );

      let relevanceScore = 0;

      for (
        const [term, weight]
        of contextTerms
      ) {
        if (tokens.has(term)) {
          relevanceScore += weight;
        }
      }

      const positionBonus = Math.max(
        0,
        2.5 - blockIndex * 0.04,
      );

      const sectionBonus = currentSection
        ? tokenizeResearchText(
            currentSection,
          ).reduce(
            (total, term) =>
              total +
              (contextTerms.get(term) ?? 0),
            0,
          ) * 0.4
        : 0;

      const segmentOffset =
        blockOffset >= 0
          ? blockOffset +
            Math.max(
              0,
              block.indexOf(segment),
            )
          : 0;

      candidates.push({
        text: candidateText,
        section: currentSection,
        startOffset: segmentOffset,
        score:
          relevanceScore +
          positionBonus +
          sectionBonus +
          paragraphQualityScore(
            candidateText,
          ) -
          topicDriftPenalty(
            tokens,
            contextTerms,
          ),
        tokens,
      });
    }
  });

  const selected: RankedParagraph[] = [];

  for (
    const candidate
    of [...candidates].sort(
      (left, right) =>
        right.score - left.score ||
        left.startOffset -
          right.startOffset,
    )
  ) {
    const driftPenalty =
      topicDriftPenalty(
        candidate.tokens,
        contextTerms,
      );

    if (driftPenalty >= 12) {
      continue;
    }

    const previewQuote =
      cleanExcerptQuote(
        candidate.text,
        1200,
      );

    if (
      !isUsefulExcerptQuote(
        previewQuote,
      )
    ) {
      continue;
    }

    const duplicate = selected.some(
      (existing) =>
        tokenSimilarity(
          existing.tokens,
          candidate.tokens,
        ) >= 0.76,
    );

    if (duplicate) {
      continue;
    }

    selected.push(candidate);

    if (selected.length === 5) {
      break;
    }
  }

  const excerpts = selected.map(
    (item, excerptIndex) => {
      const quote = cleanExcerptQuote(
        item.text,
        1200,
      );

      const section = item.section
        ? normalizeSectionLabel(
            item.section,
          )
        : null;

      return {
        quote,
        locator: section
          ? `${section} · Relevant passage ${excerptIndex + 1}`
          : `Relevant passage ${excerptIndex + 1}`,
        startOffset: Math.max(
          0,
          item.startOffset,
        ),
        endOffset:
          Math.max(
            0,
            item.startOffset,
          ) + quote.length,
      };
    },
  );

  return {
    excerpts,
    candidateCount: candidates.length,
    contextTermCount: contextTerms.size,
  };
}

function buildSummary(
  description: string | null,
  excerpts: ResearchSourceExcerptInput[],
  text: string,
): string {
  const usableDescription =
    description &&
    !containsBoilerplate(description)
      ? description
      : null;

  const evidenceSummary = excerpts
    .slice(0, 3)
    .map((excerpt) => excerpt.quote)
    .join(" ");

  const fallback =
    text
      .split(/\n{2,}/)
      .find(
        (part) =>
          part.length >= 100 &&
          !containsBoilerplate(part) &&
          !hasMarkupNoise(part),
      ) ?? "";

  return [
    usableDescription,
    evidenceSummary || fallback,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1400);
}

@Injectable()
export class ResearchSourceIngestionService {
  async ingestWebpage(
    sourceUrl: string,
    context: ResearchSourceIngestionContext = {},
  ): Promise<
    ResearchSourceIngestionResult & {
      candidateCount: number;
      contextTermCount: number;
      excerptStrategy: "PROJECT_RELEVANCE_V2";
    }
  > {
    const fetched = await fetchPublicPage(
      sourceUrl,
    );

    const isPlainText =
      fetched.contentType.includes(
        "text/plain",
      );

    const rawContent = isPlainText
      ? fetched.html
          .replace(/\r/g, "")
          .trim()
          .slice(0, MAX_TEXT_CHARACTERS)
      : normalizeReadableText(fetched.html);

    if (
      rawContent.length <
      MIN_USEFUL_CHARACTERS
    ) {
      throw new Error(
        "The webpage did not contain enough readable text to use as research evidence.",
      );
    }

    const pageTitle = isPlainText
      ? null
      : cleanInlineText(
          fetched.html.match(
            /<title\b[^>]*>([\s\S]*?)<\/title>/i,
          )?.[1] ?? null,
        );

    const description = isPlainText
      ? null
      : metaContent(
          fetched.html,
          "description",
        ) ??
        metaContent(
          fetched.html,
          "og:description",
        );

    const author = isPlainText
      ? null
      : metaContent(
          fetched.html,
          "author",
        ) ??
        metaContent(
          fetched.html,
          "article:author",
        );

    const publisher = isPlainText
      ? null
      : metaContent(
          fetched.html,
          "og:site_name",
        ) ?? fetched.finalUrl.hostname;

    const wordCount = rawContent
      .split(/\s+/)
      .filter(Boolean)
      .length;

    const excerptBuild = buildExcerpts(
      rawContent,
      context,
    );

    return {
      finalUrl: fetched.finalUrl.toString(),
      pageTitle,
      author,
      publisher,
      description,
      language: isPlainText
        ? null
        : extractLanguage(fetched.html),
      contentType: fetched.contentType,
      rawContent,
      summary: buildSummary(
        description,
        excerptBuild.excerpts,
        rawContent,
      ),
      wordCount,
      excerpts: excerptBuild.excerpts,
      candidateCount:
        excerptBuild.candidateCount,
      contextTermCount:
        excerptBuild.contextTermCount,
      excerptStrategy:
        "PROJECT_RELEVANCE_V2",
    };
  }
}
