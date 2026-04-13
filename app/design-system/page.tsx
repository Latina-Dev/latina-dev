export const metadata = {
  title: "Design System | Latina Dev",
  description: "Design tokens, typography, colors, and spacing used across Latina Dev.",
};

const colors = [
  { name: "--primary-color", value: "#9e0001", label: "Primary" },
  { name: "--primary-color-dark", value: "#7d0000", label: "Primary Dark" },
  { name: "--warning-color", value: "#ffc101", label: "Warning" },
  { name: "--success-color", value: "#3f784c", label: "Success" },
  { name: "--error-color", value: "#7d1128", label: "Error" },
  { name: "--text-color", value: "#151515", label: "Text" },
  { name: "--white-color", value: "#ffffff", label: "White" },
  { name: "--black-color", value: "#000000", label: "Black" },
];

const fontFamilies = [
  { name: "Latina Light", weight: "300", sample: "The quick brown fox" },
  { name: "Latina Light Italic", weight: "300", style: "italic", sample: "The quick brown fox" },
  { name: "Latina Medium", weight: "500", sample: "The quick brown fox" },
  { name: "Latina Bold", weight: "700", sample: "The quick brown fox" },
  { name: "Latina Heavy", weight: "900", sample: "The quick brown fox" },
];

const typescale = [
  { element: "h1", size: "clamp(2.5rem, 10vw, 79px)", family: "Latina Heavy", weight: "900" },
  { element: "h2", size: "40px", family: "Latina Heavy", weight: "900" },
  { element: "h3", size: "23px", family: "Latina Bold", weight: "700" },
  { element: "h4–h6", size: "inherit", family: "Latina Bold", weight: "700" },
  {
    element: "body / p",
    size: "inherit (browser default ~16px)",
    family: "Latina Light",
    weight: "300",
  },
];

const spacing = [
  { token: "8px", usage: "xs — tight gaps, small icon padding" },
  { token: "16px", usage: "sm — inner padding (navbar gap base)" },
  { token: "24px", usage: "md — logo margin, navbar margin, description top padding" },
  { token: "48px", usage: "lg — description bottom padding" },
  { token: "80px", usage: "xl — section padding (About, Members, Maintainers)" },
  { token: "100px", usage: "2xl — hero vertical margin" },
];

const borderRadius = [
  { token: "--border-radius: 8px", usage: "Buttons, member cards" },
  { token: "50%", usage: "Footer icon links" },
];

export default function DesignSystemPage() {
  return (
    <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "80px 24px" }}>
      <h1 style={{ marginBottom: "16px" }}>Design System</h1>
      <p style={{ marginBottom: "80px", color: "var(--text-color)", opacity: 0.7 }}>
        Tokens, typography, and spacing used across Latina Dev.
      </p>

      {/* Colors */}
      <section style={{ marginBottom: "80px" }}>
        <h2 style={{ marginBottom: "24px" }}>Colors</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "16px",
          }}>
          {colors.map((color) => (
            <div key={color.name}>
              <div
                style={{
                  background: color.value,
                  height: "80px",
                  borderRadius: "var(--border-radius)",
                  border: color.value === "#ffffff" ? "1px solid #e0e0e0" : undefined,
                  marginBottom: "8px",
                }}
              />
              <p
                style={{
                  fontFamily: "Latina Bold, sans-serif",
                  fontSize: "14px",
                  marginBottom: "4px",
                }}>
                {color.label}
              </p>
              <p style={{ fontFamily: "ui-monospace, monospace", fontSize: "12px", opacity: 0.6 }}>
                {color.value}
              </p>
              <p style={{ fontFamily: "ui-monospace, monospace", fontSize: "11px", opacity: 0.45 }}>
                {color.name}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Typography — Font Families */}
      <section style={{ marginBottom: "80px" }}>
        <h2 style={{ marginBottom: "24px" }}>Font Families</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {fontFamilies.map((font) => (
            <div
              key={font.name}
              style={{ borderBottom: "1px solid #e0e0e0", paddingBottom: "24px" }}>
              <p
                style={{
                  fontFamily: "ui-monospace, monospace",
                  fontSize: "12px",
                  opacity: 0.5,
                  marginBottom: "8px",
                }}>
                {font.name} · weight {font.weight}
              </p>
              <p
                style={{
                  fontFamily: `"${font.name}", sans-serif`,
                  fontWeight: Number(font.weight),
                  fontStyle: font.style ?? "normal",
                  fontSize: "28px",
                }}>
                {font.sample}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Typography — Typescale */}
      <section style={{ marginBottom: "80px" }}>
        <h2 style={{ marginBottom: "24px" }}>Typescale</h2>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "Latina Light, sans-serif",
          }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--primary-color)", textAlign: "left" }}>
              {["Element", "Size", "Font Family", "Weight"].map((col) => (
                <th
                  key={col}
                  style={{
                    padding: "8px 12px",
                    fontFamily: "Latina Bold, sans-serif",
                    fontSize: "14px",
                  }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {typescale.map((row) => (
              <tr key={row.element} style={{ borderBottom: "1px solid #e0e0e0" }}>
                <td
                  style={{
                    padding: "12px",
                    fontFamily: "ui-monospace, monospace",
                    fontSize: "13px",
                  }}>
                  {row.element}
                </td>
                <td
                  style={{
                    padding: "12px",
                    fontFamily: "ui-monospace, monospace",
                    fontSize: "13px",
                  }}>
                  {row.size}
                </td>
                <td style={{ padding: "12px", fontSize: "14px" }}>{row.family}</td>
                <td
                  style={{
                    padding: "12px",
                    fontFamily: "ui-monospace, monospace",
                    fontSize: "13px",
                  }}>
                  {row.weight}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Spacing */}
      <section style={{ marginBottom: "80px" }}>
        <h2 style={{ marginBottom: "24px" }}>Spacing</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {spacing.map((s) => (
            <div key={s.token} style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <div
                style={{
                  background: "var(--primary-color)",
                  opacity: 0.15,
                  height: "24px",
                  width: s.token,
                  borderRadius: "4px",
                  flexShrink: 0,
                  minWidth: "8px",
                }}
              />
              <span
                style={{
                  fontFamily: "ui-monospace, monospace",
                  fontSize: "13px",
                  minWidth: "48px",
                }}>
                {s.token}
              </span>
              <span style={{ fontSize: "14px", opacity: 0.7 }}>{s.usage}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Border Radius */}
      <section style={{ marginBottom: "80px" }}>
        <h2 style={{ marginBottom: "24px" }}>Border Radius</h2>
        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
          {borderRadius.map((br) => (
            <div
              key={br.token}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
              }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  background: "var(--primary-color)",
                  borderRadius: br.token.includes("50%") ? "50%" : "8px",
                }}
              />
              <p
                style={{
                  fontFamily: "ui-monospace, monospace",
                  fontSize: "12px",
                  textAlign: "center",
                }}>
                {br.token}
              </p>
              <p style={{ fontSize: "12px", opacity: 0.6, textAlign: "center" }}>{br.usage}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Components */}
      <section style={{ marginBottom: "80px" }}>
        <h2 style={{ marginBottom: "24px" }}>Components</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
          <div>
            <p style={{ fontFamily: "Latina Bold, sans-serif", marginBottom: "16px" }}>Button</p>
            <a
              href="#"
              style={{
                display: "inline-flex",
                padding: "18px 46px",
                background: "var(--primary-color)",
                color: "var(--white-color)",
                borderRadius: "var(--border-radius)",
                fontFamily: "Latina Bold, sans-serif",
                textDecoration: "none",
              }}>
              Button Label
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
