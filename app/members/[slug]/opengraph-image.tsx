import { ImageResponse } from "next/og";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { getMemberBySlug, getMembers } from "@/lib/getMembers";
import { siteName } from "@/lib/site";

export const alt = "Latina Dev member profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const primaryColor = "#9e0001";
const primaryColorDark = "#7d0000";

function publicFile(...segments: string[]) {
  return readFile(path.join(process.cwd(), "public", ...segments));
}

async function dataUrl(mimeType: string, ...segments: string[]) {
  const file = await publicFile(...segments);
  return `data:${mimeType};base64,${file.toString("base64")}`;
}

// Some photos saved as .jpg are really PNGs, so read the type from the file itself
async function photoDataUrl(slug: string) {
  const file = await publicFile("img", "members", `${slug}.jpg`);
  const isPng = file.subarray(0, 4).toString("hex") === "89504e47";
  return `data:image/${isPng ? "png" : "jpeg"};base64,${file.toString("base64")}`;
}

export async function generateStaticParams() {
  const members = await getMembers();
  return members.map(({ slug }) => ({ slug }));
}

// Only uses fields from the member's data file: name, level, affiliation and photo
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = await getMemberBySlug(slug);
  if (!member) throw new Error(`No member with slug ${slug}`);

  const [heavy, medium, photo, logo] = await Promise.all([
    publicFile("fonts", "Latina-Heavy.woff"),
    publicFile("fonts", "Latina-Medium.woff"),
    photoDataUrl(slug),
    dataUrl("image/svg+xml", "img", "logos", "logo-white.svg"),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 64,
        padding: "0 80px",
        color: "#ffffff",
        backgroundColor: primaryColor,
        backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColorDark} 100%)`,
        fontFamily: "Latina Medium",
      }}>
      <img
        src={photo}
        alt=""
        width={340}
        height={340}
        style={{ borderRadius: 32, border: "8px solid #ffffff", objectFit: "cover" }}
      />
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            padding: "8px 20px",
            borderRadius: 999,
            backgroundColor: "#ffffff",
            color: primaryColor,
            fontSize: 28,
          }}>
          {member.level}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontFamily: "Latina Heavy",
            fontSize: member.name.length > 22 ? 64 : 80,
            lineHeight: 1.05,
          }}>
          {member.name}
        </div>
        {member.affiliation && (
          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontSize: 32,
              lineHeight: 1.3,
              opacity: 0.9,
              maxHeight: 84,
              overflow: "hidden",
            }}>
            {member.affiliation}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 48 }}>
          <img src={logo} alt="" width={26} height={50} />
          <div style={{ display: "flex", fontFamily: "Latina Heavy", fontSize: 36 }}>
            {siteName}
          </div>
          <div style={{ display: "flex", fontSize: 28, opacity: 0.85 }}>latina.dev</div>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Latina Heavy", data: heavy, weight: 900, style: "normal" },
        { name: "Latina Medium", data: medium, weight: 500, style: "normal" },
      ],
    }
  );
}
