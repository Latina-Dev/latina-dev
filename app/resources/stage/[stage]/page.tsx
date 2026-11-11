import ResourceViewPage, {
  resourceViewMetadata,
  resourceViewParams,
} from "@/components/ResourceDirectory/ResourceViewPage";

interface Props {
  params: Promise<{ stage: string }>;
}

// One page per stage, e.g. /resources/stage/leadership, so each can rank for its own question
export const dynamicParams = false;

export function generateStaticParams() {
  return resourceViewParams("stage").map((stage) => ({ stage }));
}

export async function generateMetadata({ params }: Props) {
  return resourceViewMetadata("stage", (await params).stage);
}

export default async function ResourceStagePage({ params }: Props) {
  return <ResourceViewPage kind="stage" slug={(await params).stage} />;
}
