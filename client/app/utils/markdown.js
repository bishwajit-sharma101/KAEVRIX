import DOMPurify from "dompurify";

const codeRegistry = new Map();
let registryCounter = 0;

if (typeof document !== "undefined") {
  document.addEventListener("click", (e) => {
    const button = e.target.closest(".code-copy-btn");
    if (button) {
      const copyId = button.getAttribute("data-copy-id");
      const code = codeRegistry.get(copyId);
      if (code !== undefined) {
        navigator.clipboard.writeText(code).then(() => {
          const prevText = button.innerText;
          button.innerText = '✓ Copied!';
          setTimeout(() => { button.innerText = prevText; }, 2000);
        }).catch(err => {
          console.error("Failed to copy code snippet: ", err);
        });
      }
      return;
    }

    const zoomBtn = e.target.closest(".mermaid-zoom-btn");
    if (zoomBtn) {
      const windowEl = zoomBtn.closest(".mermaid-diagram-window");
      if (!windowEl) return;
      const svgEl = windowEl.querySelector("svg");
      if (!svgEl) return;
      const valEl = windowEl.querySelector(".mermaid-zoom-val");

      let currentZoom = parseFloat(windowEl.getAttribute("data-zoom") || "1.0");

      if (zoomBtn.classList.contains("zoom-in")) {
        currentZoom = Math.min(currentZoom + 0.3, 4.0);
      } else if (zoomBtn.classList.contains("zoom-out")) {
        currentZoom = Math.max(currentZoom - 0.3, 0.4);
      } else if (zoomBtn.classList.contains("zoom-reset")) {
        currentZoom = 1.0;
      }

      windowEl.setAttribute("data-zoom", currentZoom.toString());
      if (valEl) {
        valEl.innerText = `${Math.round(currentZoom * 100)}%`;
      }

      if (currentZoom === 1.0) {
        svgEl.style.setProperty("max-width", "100%", "important");
        svgEl.style.setProperty("width", "100%", "important");
        svgEl.style.setProperty("height", "auto", "important");
        svgEl.style.setProperty("zoom", "1", "important");
        svgEl.style.removeProperty("transform");
        svgEl.style.removeProperty("transform-origin");
      } else {
        svgEl.style.setProperty("max-width", "none", "important");
        svgEl.style.setProperty("width", "auto", "important");
        svgEl.style.setProperty("height", "auto", "important");
        svgEl.style.setProperty("zoom", currentZoom.toString(), "important");
        // Fallback transform for older engines
        svgEl.style.setProperty("transform", `scale(${currentZoom})`, "important");
        svgEl.style.setProperty("transform-origin", "top center", "important");
      }
    }
  });
}

// JavaScript syntax highlighting helper
export function highlightJS(code) {
  // Escape HTML
  let html = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Highlight comments (double slash or block)
  html = html.replace(/(\/\/[^\n]*)/g, '<span style="color: #6a737d; font-style: italic;">$1</span>');
  html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color: #6a737d; font-style: italic;">$1</span>');
  
  // Highlight strings (double quotes, single quotes, backticks)
  html = html.replace(/(["'`])(.*?)\1/g, '<span style="color: #9ecbff;">$1$2$1</span>');
  
  // Highlight keywords: let, const, var, function, return, class, import, export, from, if, else, for, while, async, await, new, try, catch, throw
  const keywords = /\b(let|const|var|function|return|class|import|export|from|if|else|for|while|async|await|new|try|catch|throw|default|switch|case|break|continue|typeof|instanceof)\b/g;
  html = html.replace(keywords, '<span style="color: #ff7b72; font-weight: bold;">$1</span>');

  // Highlight built-ins/globals: console, log, window, document, process, Map, Set, Object, Array, String, Number, Boolean, Symbol, Promise
  const builtins = /\b(console|log|window|document|process|Map|Set|Object|Array|String|Number|Boolean|Symbol|Promise|undefined|null|true|false)\b/g;
  html = html.replace(builtins, '<span style="color: #79c0ff;">$1</span>');

  // Highlight function calls: foo() -> foo is highlighted
  html = html.replace(/\b([a-zA-Z0-9_]+)(?=\()/g, '<span style="color: #d2a8ff;">$1</span>');

  // Highlight numbers
  html = html.replace(/\b(\d+)\b/g, '<span style="color: #ff9e64;">$1</span>');

  return html;
}

export function highlightCode(code, lang) {
  const l = (lang || "").toLowerCase();
  if (l === "javascript" || l === "js" || l === "jsx" || l === "ts" || l === "tsx" || l === "html" || l === "css") {
    return highlightJS(code);
  }
  // Generic escape
  return code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function parseMarkdownToHTML(md) {
  if (!md) return "";
  
  // 1. Separate code blocks from the rest of the text
  const parts = md.split(/```/);
  let isInsideCode = false;
  let resultHtml = "";
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (isInsideCode) {
      // The first line might be the language name
      const firstNewLineIdx = part.indexOf("\n");
      let lang = "javascript";
      let code = part;
      if (firstNewLineIdx !== -1) {
        const potentialLang = part.substring(0, firstNewLineIdx).trim();
        if (potentialLang.length < 15) {
          lang = potentialLang || "javascript";
          code = part.substring(firstNewLineIdx + 1);
        }
      }
      
      // Trim trailing newline
      code = code.replace(/\n$/, "");
      if (lang.toLowerCase() === "mermaid") {
        resultHtml += `
          <div class="mermaid-diagram-window" data-zoom="1.0" style="position: relative; background: rgba(255, 255, 255, 0.015); border-radius: 12px; margin: 24px 0; border: 1px solid var(--glass-border, #e2e8f0); padding: 48px 24px 24px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow-x: auto; min-height: 100px;">
            <style>
              .mermaid-diagram-window svg {
                max-width: 100% !important;
                height: auto !important;
                transition: width 0.2s ease, max-width 0.2s ease;
              }
            </style>
            <div class="mermaid-zoom-controls" style="position: absolute; top: 12px; right: 12px; display: flex; gap: 6px; align-items: center; z-index: 10; user-select: none;">
              <button class="mermaid-zoom-btn zoom-out" title="Zoom Out" style="padding: 4px 10px; border-radius: 6px; border: 1px solid var(--glass-border, #cbd5e1); background: rgba(255,255,255,0.08); color: inherit; cursor: pointer; font-weight: bold; font-size: 13px; transition: all 0.2s;">-</button>
              <span class="mermaid-zoom-val" style="font-size: 11px; font-weight: 800; min-width: 36px; text-align: center; color: var(--text-muted, inherit);">100%</span>
              <button class="mermaid-zoom-btn zoom-in" title="Zoom In" style="padding: 4px 10px; border-radius: 6px; border: 1px solid var(--glass-border, #cbd5e1); background: rgba(255,255,255,0.08); color: inherit; cursor: pointer; font-weight: bold; font-size: 13px; transition: all 0.2s;">+</button>
              <button class="mermaid-zoom-btn zoom-reset" title="Reset Zoom" style="padding: 4px 8px; border-radius: 6px; border: 1px solid var(--glass-border, #cbd5e1); background: rgba(255,255,255,0.08); color: inherit; cursor: pointer; font-size: 11px; transition: all 0.2s;">↺</button>
            </div>
            <pre class="mermaid" style="margin: 0; background: transparent; font-family: inherit; color: inherit; font-size: 14px; width: 100%; display: flex; justify-content: center;">${code}</pre>
          </div>
        `;
      } else {
        const highlighted = highlightCode(code, lang);
        
        // Render code block with window styling (macOS window bar)
        registryCounter++;
        const copyId = `code-snippet-${registryCounter}`;
        codeRegistry.set(copyId, code);

        resultHtml += `
          <div class="code-screenshot-window" style="
            background: #090d16;
            border-radius: 12px;
            margin: 24px 0;
            box-shadow: 0 12px 36px rgba(0,0,0,0.5);
            border: 1px solid #1e293b;
            overflow: hidden;
            font-family: 'Fira Code', 'Courier New', Courier, monospace;
            text-align: left;
          ">
            <div style="
              background: #0d1321;
              padding: 12px 18px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 1px solid #1e293b;
            ">
              <div style="display: flex; gap: 8px;">
                <span style="width: 12px; height: 12px; border-radius: 50%; background: #ff5f56; display: inline-block;"></span>
                <span style="width: 12px; height: 12px; border-radius: 50%; background: #ffbd2e; display: inline-block;"></span>
                <span style="width: 12px; height: 12px; border-radius: 50%; background: #27c93f; display: inline-block;"></span>
              </div>
              <span style="color: #64748b; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">${lang}</span>
              <button 
                class="code-copy-btn"
                data-copy-id="${copyId}"
              >
                📋 Copy
              </button>
            </div>
            <div style="
              padding: 20px 24px;
              margin: 0;
              overflow-x: auto;
              font-size: 14px;
              line-height: 1.65;
              color: #f8fafc;
              background: #05070c;
            ">
              <pre style="margin: 0; white-space: pre; font-family: inherit;"><code>${highlighted}</code></pre>
            </div>
          </div>
        `;
      }
      isInsideCode = false;
    } else {
      let mdText = part
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      
      // Inline code
      mdText = mdText.replace(/`([^`\n]+)`/g, '<code style="background: rgba(255,106,0,0.1); color: var(--neon-orange, #ff6a00); padding: 2px 6px; border-radius: 6px; font-size: 0.9em; font-family: monospace; font-weight: bold;">$1</code>');
      
      // Headers
      mdText = mdText.replace(/^# (.+)$/gm, '<h1 style="font-size: 28px; font-weight: 900; color: var(--text-light); margin: 36px 0 18px; border-bottom: 2px solid var(--glass-border, #e2e8f0); padding-bottom: 10px; letter-spacing: -0.5px;">$1</h1>');
      mdText = mdText.replace(/^## (.+)$/gm, '<h2 style="font-size: 22px; font-weight: 850; color: inherit; margin: 30px 0 14px; border-left: 4px solid var(--neon-orange, #ff6a00); padding-left: 14px; letter-spacing: -0.3px;">$1</h2>');
      mdText = mdText.replace(/^### (.+)$/gm, '<h3 style="font-size: 18px; font-weight: 800; color: inherit; margin: 24px 0 10px;">$1</h3>');
      mdText = mdText.replace(/^#### (.+)$/gm, '<h4 style="font-size: 15px; font-weight: 700; color: inherit; margin: 18px 0 6px;">$1</h4>');
      
      // Tables
      const lines = mdText.split("\n");
      let inTable = false;
      let tableHtml = "";
      let normalLines = [];
      
      for (let j = 0; j < lines.length; j++) {
        const line = lines[j].trim();
        if (line.startsWith("|") && line.endsWith("|")) {
          if (!inTable) {
            inTable = true;
            tableHtml = '<div style="overflow-x: auto; margin: 24px 0; border: 1px solid var(--glass-border, #e2e8f0); border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.02);"><table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">';
          }
          if (line.includes("---") || line.includes("===")) {
            continue;
          }
          const cells = line.split("|").slice(1, -1).map(c => c.trim());
          const isHeader = !tableHtml.includes("</thead>") && !tableHtml.includes("</tr>");
          
          if (isHeader) {
            tableHtml += '<thead style="background: var(--bg-dark-surface, #f8fafc); border-bottom: 2px solid var(--glass-border, #e2e8f0);"><tr>';
            cells.forEach(c => {
              tableHtml += `<th style="padding: 14px 18px; font-weight: 800; color: inherit;">${c}</th>`;
            });
            tableHtml += '</tr></thead><tbody>';
          } else {
            tableHtml += '<tr style="border-bottom: 1px solid var(--glass-border, #f1f5f9); transition: background 0.15s;" onmouseover="this.style.backgroundColor=\'var(--glass-border)\'" onmouseout="this.style.backgroundColor=\'transparent\'">';
            cells.forEach(c => {
              tableHtml += `<td style="padding: 14px 18px; color: inherit; line-height: 1.5;">${c}</td>`;
            });
            tableHtml += '</tr>';
          }
        } else {
          if (inTable) {
            inTable = false;
            tableHtml += '</tbody></table></div>';
            normalLines.push(tableHtml);
            tableHtml = "";
          }
          normalLines.push(lines[j]);
        }
      }
      if (inTable) {
        tableHtml += '</tbody></table></div>';
        normalLines.push(tableHtml);
      }
      mdText = normalLines.join("\n");
      
      // Bold & Italics
      mdText = mdText.replace(/\*\*([^*]+)\*\*/g, '<strong style="color: inherit; font-weight: 700;">$1</strong>');
      mdText = mdText.replace(/\*([^*]+)\*/g, '<em style="font-style: italic;">$1</em>');
      
      // Lists
      mdText = mdText.replace(/^\s*-\s+(.+)$/gm, '<li style="color: inherit; font-size: 15px; line-height: 1.8; margin-bottom: 8px; list-style-type: disc; margin-left: 24px;">$1</li>');
      mdText = mdText.replace(/^\s*\*\s+(.+)$/gm, '<li style="color: inherit; font-size: 15px; line-height: 1.8; margin-bottom: 8px; list-style-type: disc; margin-left: 24px;">$1</li>');
      
      // Group adjacent <li> elements into <ul>
      mdText = mdText.replace(/(<li[^>]*>.*?<\/li>)+/gs, '<ul style="padding-left: 0; margin: 12px 0 20px;">$&</ul>');
      
      // Paragraphs
      const blocks = mdText.split(/\n\n+/);
      const parsedBlocks = blocks.map(block => {
        const trimmed = block.trim();
        if (!trimmed) return "";
        if (trimmed.startsWith("<h") || trimmed.startsWith("<ul") || trimmed.startsWith("<div") || trimmed.startsWith("<table") || trimmed.startsWith("<blockquote")) {
          return trimmed;
        }
        return `<p style="color: inherit; font-size: 15.5px; line-height: 1.8; margin: 0 0 18px;">${trimmed.replace(/\n/g, "<br/>")}</p>`;
      });
      
      resultHtml += parsedBlocks.join("\n");
      isInsideCode = true;
    }
  }
  
  const cleanHtml = DOMPurify.sanitize(resultHtml, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
      'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span', 'button'
    ],
    ALLOWED_ATTR: [
      'style', 'class', 'data-copy-id'
    ]
  });
  return cleanHtml;
}
