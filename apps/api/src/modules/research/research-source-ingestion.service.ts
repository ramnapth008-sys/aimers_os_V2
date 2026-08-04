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

function normalizeReadableText(
  html: string,
): string {
  const preferred =
    html.match(
      /<main\b[^>]*>([\s\S]*?)<\/main>/i,
    )?.[1] ??
    html.match(
      /<article\b[^>]*>([\s\S]*?)<\/article>/i,
    )?.[1] ??
    html;

  const withBreaks =
    preferred
      .replace(
        /<!--[\s\S]*?-->/g,
        " ",
      )
      .replace(
        /<(script|style|noscript|svg|template|canvas|iframe|form|nav|footer|header|aside)\b[^>]*>[\s\S]*?<\/\1>/gi,
        " ",
      )
      .replace(
        /<br\s*\/?>/gi,
        "\n",
      )
      .replace(
        /<\/(p|div|section|article|li|h[1-6]|blockquote|tr)>/gi,
        "\n\n",
      )
      .replace(
        /<[^>]+>/g,
        " ");

  const decoded =
    decodeEntities(
      withBreaks,
    );

  return decoded
    .replace(
      /\r/g,
      "",
    )
    .replace(
      /[ \t]+/g,
      " ",
    )
    .replace(
      / *\n */g,
      "\n",
    )
    .replace(
      /\n{3,}/g,
      "\n\n",
    )
    .trim()
    .slice(
      0,
      MAX_TEXT_CHARACTERS,
    );
}

function buildExcerpts(
  text: string,
): ResearchSourceExcerptInput[] {
  const paragraphs =
    text
      .split(
        /\n{2,}/,
      )
      .map(
        (paragraph) =>
          paragraph
            .replace(
              /\s+/g,
              " ",
            )
            .trim(),
      )
      .filter(
        (paragraph) =>
          paragraph.length >=
          100,
      );

  const selected =
    paragraphs
      .map(
        (
          paragraph,
          index,
        ) => ({
          paragraph,
          index,
        }),
      )
      .sort(
        (
          left,
          right,
        ) =>
          right.paragraph
            .length -
          left.paragraph
            .length,
      )
      .slice(
        0,
        5,
      )
      .sort(
        (
          left,
          right,
        ) =>
          left.index -
          right.index,
      );

  return selected.map(
    (
      item,
      excerptIndex,
    ) => {
      const quote =
        item.paragraph
          .slice(
            0,
            1200,
          );

      const startOffset =
        text.indexOf(
          item.paragraph,
        );

      return {
        quote,

        locator:
          `Extracted passage ${excerptIndex + 1}`,

        startOffset:
          Math.max(
            0,
            startOffset,
          ),

        endOffset:
          Math.max(
            0,
            startOffset,
          ) +
          quote.length,
      };
    },
  );
}

function buildSummary(
  description: string | null,
  text: string,
): string {
  const introduction =
    text
      .split(
        /\n{2,}/,
      )
      .map(
        (part) =>
          part.trim(),
      )
      .filter(
        (part) =>
          part.length >=
          60,
      )
      .slice(
        0,
        3,
      )
      .join(" ");

  const parts = [
    description,
    introduction,
  ].filter(Boolean);

  return parts
    .join(" ")
    .replace(
      /\s+/g,
      " ",
    )
    .trim()
    .slice(
      0,
      1400,
    );
}

@Injectable()
export class ResearchSourceIngestionService {
  async ingestWebpage(
    sourceUrl: string,
  ): Promise<ResearchSourceIngestionResult> {
    const fetched =
      await fetchPublicPage(
        sourceUrl,
      );

    const isPlainText =
      fetched.contentType
        .includes(
          "text/plain",
        );

    const rawContent =
      isPlainText
        ? fetched.html
            .replace(
              /\r/g,
              "",
            )
            .trim()
            .slice(
              0,
              MAX_TEXT_CHARACTERS,
            )
        : normalizeReadableText(
            fetched.html,
          );

    if (
      rawContent.length <
      MIN_USEFUL_CHARACTERS
    ) {
      throw new Error(
        "The webpage did not contain enough readable text to use as research evidence.",
      );
    }

    const pageTitle =
      isPlainText
        ? null
        : cleanInlineText(
            fetched.html.match(
              /<title\b[^>]*>([\s\S]*?)<\/title>/i,
            )?.[1] ??
            null,
          );

    const description =
      isPlainText
        ? null
        : (
            metaContent(
              fetched.html,
              "description",
            ) ??
            metaContent(
              fetched.html,
              "og:description",
            )
          );

    const author =
      isPlainText
        ? null
        : (
            metaContent(
              fetched.html,
              "author",
            ) ??
            metaContent(
              fetched.html,
              "article:author",
            )
          );

    const publisher =
      isPlainText
        ? null
        : (
            metaContent(
              fetched.html,
              "og:site_name",
            ) ??
            fetched.finalUrl
              .hostname
          );

    const wordCount =
      rawContent
        .split(
          /\s+/,
        )
        .filter(Boolean)
        .length;

    return {
      finalUrl:
        fetched.finalUrl
          .toString(),

      pageTitle,
      author,
      publisher,
      description,

      language:
        isPlainText
          ? null
          : extractLanguage(
              fetched.html,
            ),

      contentType:
        fetched.contentType,

      rawContent,

      summary:
        buildSummary(
          description,
          rawContent,
        ),

      wordCount,

      excerpts:
        buildExcerpts(
          rawContent,
        ),
    };
  }
}
