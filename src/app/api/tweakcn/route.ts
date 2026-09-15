import { NextResponse } from "next/server";
import { parseTweakcnCss, parseTweakcnJson } from "@/lib/themes";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { url, css } = body;

    // Direct CSS snippet provided
    if (css && typeof css === "string") {
      const parsed = parseTweakcnCss(css);
      if (Object.keys(parsed.light).length === 0 && Object.keys(parsed.dark).length === 0) {
        return NextResponse.json(
          { error: "No valid CSS variables found in the provided CSS snippet." },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        theme: {
          name: "Custom Tweakcn Theme",
          vars: parsed,
        },
      });
    }

    // URL provided
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid tweakcn URL or CSS snippet." },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();
    let targetUrl: URL;
    try {
      targetUrl = new URL(trimmedUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format." },
        { status: 400 }
      );
    }

    // Fetch the URL with custom headers
    const res = await fetch(targetUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "application/json, text/css, text/html, */*",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          error: `Could not fetch theme from ${targetUrl.hostname} (Status ${res.status}). You can also copy & paste the theme CSS directly.`,
        },
        { status: 400 }
      );
    }

    const contentType = res.headers.get("content-type") || "";
    const rawText = await res.text();

    // Check if JSON
    if (contentType.includes("application/json") || rawText.trim().startsWith("{")) {
      try {
        const json = JSON.parse(rawText);
        const parsedJson = parseTweakcnJson(json);
        if (
          Object.keys(parsedJson.light).length > 0 ||
          Object.keys(parsedJson.dark).length > 0
        ) {
          return NextResponse.json({
            success: true,
            theme: {
              name: parsedJson.name || "Tweakcn Theme",
              sourceUrl: trimmedUrl,
              vars: { light: parsedJson.light, dark: parsedJson.dark },
            },
          });
        }
      } catch {
        // Fall back to CSS regex search in text
      }
    }

    // Check if HTML contains embedded CSS or JSON state
    const cssVarsMatch = parseTweakcnCss(rawText);
    if (
      Object.keys(cssVarsMatch.light).length > 0 ||
      Object.keys(cssVarsMatch.dark).length > 0
    ) {
      return NextResponse.json({
        success: true,
        theme: {
          name: "Imported Tweakcn Theme",
          sourceUrl: trimmedUrl,
          vars: cssVarsMatch,
        },
      });
    }

    // Check if JSON state is embedded in script tags
    const stateMatch = rawText.match(/"themeState":\s*(\{[\s\S]+?\})\s*,\s*"/);
    if (stateMatch && stateMatch[1]) {
      try {
        const parsedState = JSON.parse(stateMatch[1]);
        const result = parseTweakcnJson({ styles: parsedState.styles });
        return NextResponse.json({
          success: true,
          theme: {
            name: "Imported Tweakcn Theme",
            sourceUrl: trimmedUrl,
            vars: { light: result.light, dark: result.dark },
          },
        });
      } catch {
        // Ignore
      }
    }

    return NextResponse.json(
      {
        error:
          "Could not detect CSS variables from the link. Alternatively, copy the theme CSS from tweakcn and paste it directly.",
      },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while processing the theme.",
      },
      { status: 500 }
    );
  }
}
