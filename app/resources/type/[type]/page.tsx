import ResourceViewPage, {
  resourceViewMetadata,
  resourceViewParams,
} from "@/components/ResourceDirectory/ResourceViewPage";

interface Props {
  params: Promise<{ type: string }>;
}

// One page per type, e.g. /resources/type/job-board, so each can rank for its own question
export const dynamicParams = false;

export function generateStaticParams() {
  return resourceViewParams("type").map((type) => ({ type }));
}

export async function generateMetadata({ params }: Props) {
  return resourceViewMetadata("type", (await params).type);
}

export default async function ResourceTypePage({ params }: Props) {
  return <ResourceViewPage kind="type" slug={(await params).type} />;
}
