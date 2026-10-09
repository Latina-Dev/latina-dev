import { serializeJsonLd } from "@/lib/jsonLd";

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

/** Renders schema.org structured data into the server-rendered HTML */
const JsonLd = ({ data }: JsonLdProps) => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
);

export default JsonLd;
