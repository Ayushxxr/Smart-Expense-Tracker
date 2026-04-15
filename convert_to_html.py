import re
import sys
import os

# ── Read the source markdown ──────────────────────────────────────────────────
MD_PATH = r"C:\Users\ayush\.gemini\antigravity\brain\3c37e0c5-bec8-479f-b37c-9dacaac25849\process_step_by_step.md"
OUT_PATH = r"C:\Users\ayush\Desktop\SMART EXPENSE TRACKER\process_step_by_step.html"

with open(MD_PATH, "r", encoding="utf-8") as f:
    md = f.read()

# ── Helper: escape HTML inside non-mermaid code blocks ───────────────────────
def escape_html(text):
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

# ── Convert markdown to HTML (custom, no extra deps needed) ───────────────────
def md_to_html(md):
    lines = md.split("\n")
    html_lines = []
    i = 0
    in_table = False
    in_ul = False
    in_ol = False

    def close_lists():
        nonlocal in_ul, in_ol
        if in_ul:
            html_lines.append("</ul>")
            in_ul = False
        if in_ol:
            html_lines.append("</ol>")
            in_ol = False

    def close_table():
        nonlocal in_table
        if in_table:
            html_lines.append("</tbody></table>")
            in_table = False

    def inline(text):
        # Bold + italic
        text = re.sub(r'\*\*\*(.+?)\*\*\*', r'<strong><em>\1</em></strong>', text)
        # Bold
        text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
        # Italic
        text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', text)
        # Inline code
        text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
        # Link
        text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2" target="_blank">\1</a>', text)
        return text

    while i < len(lines):
        line = lines[i]

        # ── Fenced code blocks (mermaid or regular) ──────────────────────────
        if line.strip().startswith("```"):
            lang = line.strip()[3:].strip().lower()
            close_lists()
            close_table()
            code_lines = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                code_lines.append(lines[i])
                i += 1
            code_body = "\n".join(code_lines)
            if lang == "mermaid":
                html_lines.append(f'<div class="mermaid-wrap"><pre class="mermaid">{code_body}</pre></div>')
            else:
                label = f'<span class="code-lang">{lang}</span>' if lang else ''
                html_lines.append(f'<div class="code-block">{label}<pre><code>{escape_html(code_body)}</code></pre></div>')
            i += 1
            continue

        # ── Horizontal rule ───────────────────────────────────────────────────
        if re.match(r'^-{3,}$', line.strip()):
            close_lists()
            close_table()
            html_lines.append('<hr>')
            i += 1
            continue

        # ── Headings ──────────────────────────────────────────────────────────
        m = re.match(r'^(#{1,4})\s+(.*)', line)
        if m:
            close_lists()
            close_table()
            level = len(m.group(1))
            text = inline(m.group(2))
            html_lines.append(f'<h{level}>{text}</h{level}>')
            i += 1
            continue

        # ── Blockquote ────────────────────────────────────────────────────────
        if line.startswith("> "):
            close_lists()
            close_table()
            text = inline(line[2:])
            html_lines.append(f'<blockquote>{text}</blockquote>')
            i += 1
            continue

        # ── Table ─────────────────────────────────────────────────────────────
        if "|" in line and re.match(r'^\|', line.strip()):
            if re.match(r'^\|[\s\-|:]+\|', lines[i].strip()):
                i += 1
                continue
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if not in_table:
                close_lists()
                html_lines.append('<table><tbody>')
                in_table = True
            row_html = "".join(f"<td>{inline(c)}</td>" for c in cells)
            html_lines.append(f"<tr>{row_html}</tr>")
            i += 1
            continue
        else:
            close_table()

        # ── Unordered list ────────────────────────────────────────────────────
        m = re.match(r'^(\s*)[-*]\s+(.*)', line)
        if m:
            indent = len(m.group(1))
            text = inline(m.group(2))
            if not in_ul:
                close_ol = in_ol
                if close_ol:
                    html_lines.append("</ol>")
                    in_ol = False
                html_lines.append('<ul>')
                in_ul = True
            html_lines.append(f'<li>{text}</li>')
            i += 1
            continue
        else:
            if in_ul:
                html_lines.append("</ul>")
                in_ul = False

        # ── Ordered list ──────────────────────────────────────────────────────
        m = re.match(r'^\d+\.\s+(.*)', line)
        if m:
            text = inline(m.group(1))
            if not in_ol:
                if in_ul:
                    html_lines.append("</ul>")
                    in_ul = False
                html_lines.append('<ol>')
                in_ol = True
            html_lines.append(f'<li>{text}</li>')
            i += 1
            continue
        else:
            if in_ol:
                html_lines.append("</ol>")
                in_ol = False

        # ── Blank line ────────────────────────────────────────────────────────
        if line.strip() == "":
            i += 1
            continue

        # ── Paragraph ─────────────────────────────────────────────────────────
        html_lines.append(f'<p>{inline(line)}</p>')
        i += 1

    close_lists()
    close_table()
    return "\n".join(html_lines)


body_html = md_to_html(md)

# ── Full HTML template ────────────────────────────────────────────────────────
html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Smart Expense Tracker — Process Step by Step</title>

  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"/>

  <!-- Mermaid.js -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    mermaid.initialize({{
      startOnLoad: true,
      theme: 'base',
      themeVariables: {{
        primaryColor: '#6c63ff',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#5a52d5',
        lineColor: '#a0a0c0',
        secondaryColor: '#1e1e3a',
        tertiaryColor: '#2a2a4a',
        background: '#ffffff',
        mainBkg: '#6c63ff',
        nodeBorder: '#5a52d5',
        clusterBkg: '#f0eeff',
        titleColor: '#2d2d5e',
        edgeLabelBackground: '#f0eeff',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px'
      }},
      flowchart: {{ curve: 'basis', padding: 20 }},
      sequence: {{ actorMargin: 80 }}
    }});
  </script>

  <style>
    /* ── Reset & Base ──────────────────────────────────────────────── */
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

    body {{
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      line-height: 1.75;
      color: #1a1a2e;
      background: #ffffff;
      max-width: 900px;
      margin: 0 auto;
      padding: 48px 40px;
    }}

    /* ── Headings ───────────────────────────────────────────────────── */
    h1 {{
      font-size: 28px;
      font-weight: 700;
      color: #2d2d5e;
      border-bottom: 3px solid #6c63ff;
      padding-bottom: 12px;
      margin: 40px 0 20px;
    }}
    h2 {{
      font-size: 22px;
      font-weight: 700;
      color: #3a3a6e;
      border-left: 4px solid #6c63ff;
      padding-left: 14px;
      margin: 36px 0 14px;
    }}
    h3 {{
      font-size: 17px;
      font-weight: 600;
      color: #4a4a8a;
      margin: 28px 0 10px;
    }}
    h4 {{
      font-size: 15px;
      font-weight: 600;
      color: #5a5a9a;
      margin: 20px 0 8px;
    }}

    /* ── Paragraphs & Text ──────────────────────────────────────────── */
    p {{ margin: 10px 0; color: #333355; }}
    strong {{ color: #2d2d5e; font-weight: 700; }}
    em {{ color: #5a5a9a; }}
    a {{ color: #6c63ff; text-decoration: none; }}
    a:hover {{ text-decoration: underline; }}

    /* ── Lists ──────────────────────────────────────────────────────── */
    ul, ol {{ margin: 12px 0 12px 28px; }}
    li {{ margin: 5px 0; color: #333355; }}

    /* ── Blockquote ─────────────────────────────────────────────────── */
    blockquote {{
      border-left: 4px solid #6c63ff;
      background: #f0eeff;
      padding: 14px 18px;
      border-radius: 0 8px 8px 0;
      margin: 16px 0;
      color: #3a3a6e;
      font-style: italic;
    }}
    blockquote strong {{ color: #4a2d9e; }}

    /* ── Inline Code ────────────────────────────────────────────────── */
    code {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 12.5px;
      background: #eeeeff;
      color: #5a2d9e;
      padding: 2px 6px;
      border-radius: 4px;
    }}

    /* ── Code Blocks ────────────────────────────────────────────────── */
    .code-block {{
      position: relative;
      background: #1a1a2e;
      border-radius: 10px;
      margin: 18px 0;
      overflow: hidden;
      border: 1px solid #2d2d5e;
    }}
    .code-lang {{
      display: block;
      background: #2d2d5e;
      color: #a0a0d0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      padding: 4px 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}
    .code-block pre {{
      padding: 16px 20px;
      overflow-x: auto;
      margin: 0;
    }}
    .code-block pre code {{
      background: transparent;
      color: #c8c8f0;
      font-size: 12.5px;
      padding: 0;
    }}

    /* ── Mermaid Diagrams ───────────────────────────────────────────── */
    .mermaid-wrap {{
      background: #f8f7ff;
      border: 1px solid #dddaff;
      border-radius: 12px;
      padding: 28px 16px;
      margin: 20px 0;
      text-align: center;
      overflow-x: auto;
    }}
    .mermaid svg {{
      max-width: 100%;
    }}

    /* ── Tables ─────────────────────────────────────────────────────── */
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(108,99,255,0.08);
    }}
    tr:first-child td {{
      background: #6c63ff;
      color: #ffffff;
      font-weight: 600;
    }}
    td {{
      padding: 11px 16px;
      border-bottom: 1px solid #e8e6ff;
      color: #333355;
      font-size: 13.5px;
    }}
    tr:nth-child(odd):not(:first-child) td {{ background: #f8f7ff; }}
    tr:nth-child(even) td {{ background: #ffffff; }}
    tr:last-child td {{ font-weight: 700; color: #2d2d5e; }}

    /* ── Horizontal Rule ────────────────────────────────────────────── */
    hr {{
      border: none;
      border-top: 1.5px solid #e0ddff;
      margin: 36px 0;
    }}

    /* ── Print Styles ───────────────────────────────────────────────── */
    @media print {{
      body {{ padding: 20px 24px; font-size: 12.5px; max-width: 100%; }}
      .mermaid-wrap {{ break-inside: avoid; page-break-inside: avoid; }}
      .code-block {{ break-inside: avoid; page-break-inside: avoid; }}
      h1, h2, h3 {{ page-break-after: avoid; }}
      table {{ break-inside: avoid; }}
    }}
  </style>
</head>
<body>
{body_html}
</body>
</html>"""

# ── Write output ──────────────────────────────────────────────────────────────
with open(OUT_PATH, "w", encoding="utf-8") as f:
    f.write(html)

print(f"\n✅ Done! File saved to:\n   {OUT_PATH}")
print("\n📌 Next steps:")
print("   1. Open the file in Google Chrome")
print("   2. Wait 3-4 seconds for diagrams to fully render")
print("   3. Press Ctrl+P → Change Destination to 'Save as PDF'")
print("   4. Set: Margins = None, Scale = 85%, ✅ Background graphics")
print("   5. Click Save → Your PDF is ready!")
