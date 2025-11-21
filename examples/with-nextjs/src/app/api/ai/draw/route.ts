import { type NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const prompt = (body?.prompt ?? "").toString();
  const targetFormat = (body?.target_format ?? "mermaid").toString();
  const model = (body?.model ?? process.env.DEFAULT_MODEL ?? "google/gemini-3-pro-preview").toString();

  const defaultBase = "https://openrouter.ai/api/v1";
  const baseUrl = process.env.GATEWAY_BASE_URL || defaultBase;

  let apiKey = process.env.GATEWAY_API_KEY;
  if (!apiKey) {
    try {
      const filePath = path.resolve("/Users/momohome/Desktop/AI开发/07.vibedraw/.trae/documents/LLM Key");
      const raw = fs.readFileSync(filePath, "utf-8");
      const match = raw.match(/sk-or-[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*/);
      if (match) apiKey = match[0];
    } catch {}
  }

  if (!prompt || !targetFormat) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const safeFormat = targetFormat === "svg" ? "svg" : "mermaid";
  const maxPrompt = 4000;
  const clippedPrompt = prompt.length > maxPrompt ? prompt.slice(0, maxPrompt) : prompt;

  if (!baseUrl || !apiKey) {
    const code = safeFormat === "svg"
      ? `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='120'><rect x='10' y='10' width='100' height='40' rx='6' fill='#4e79a7'/><text x='60' y='35' text-anchor='middle' fill='white' font-size='12'>A</text><rect x='190' y='10' width='100' height='40' rx='6' fill='#f28e2b'/><text x='240' y='35' text-anchor='middle' fill='white' font-size='12'>B</text><line x1='110' y1='30' x2='190' y2='30' stroke='#333' stroke-width='2' marker-end='url(#arrow)'/><defs><marker id='arrow' markerWidth='10' markerHeight='10' refX='6' refY='3' orient='auto'><path d='M0,0 L0,6 L6,3 z' fill='#333'/></marker></defs></svg>`
      : `flowchart LR\nA[Start] --> B[Process] --> C[End]`;
    return NextResponse.json({ format: safeFormat, code, meta: { model, mock: true } });
  }

  try {
    const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "Referer": "http://localhost:3005",
        "X-Title": "vibedraw-nextjs-example",
      },
      body: JSON.stringify({
        model: model || "google/gemini-3-pro-preview",
        messages: [
          { role: "system", content: `你是图形绘制助手。仅返回${safeFormat}代码，不要任何解释。` },
          { role: "user", content: clippedPrompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`OpenRouter error: ${res.status} ${res.statusText}`, errorText);
      return NextResponse.json({ error: "upstream_error", details: errorText }, { status: 502 });
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    let code = content;
    let format = safeFormat;
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object" && parsed.code) {
        code = parsed.code;
        format = parsed.format ?? targetFormat;
      }
    } catch {}

    return NextResponse.json({ format, code, meta: { model } });
  } catch {
    return NextResponse.json({ error: "gateway_unavailable" }, { status: 503 });
  }
}
