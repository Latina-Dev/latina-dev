// Generate the post, note that this is a "react server component"! it is
import { getMemberBySlug, getMembers } from "@/app/members/getMembers";

// allowed to be async
export default async function Member({ params }: { params: { slug: string } }) {
  const member = await getMemberBySlug(params.slug);
  console.log({ member });
  const title = member?.title;
  const date = member?.date;
  if (!member) {
    return <div>404</div>;
  }
  return (
    <article>
      <h1>{title}</h1>
      <h4>{date}</h4>
      {/* <div dangerouslySetInnerHTML={{ __html: html }} /> */}
    </article>
  );
}

// This function can statically allow nextjs to find all the posts that you
// have made, and statically generate them
export async function generateStaticParams() {
  const members = await getMembers();

  return members.map((member) => ({
    slug: member.slug,
  }));
}

// Set the title of the page to be the post title, note that we no longer use
// e.g. next/head in app dir, and this can be async just like the server
// component
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const member = await getMemberBySlug(params.slug);
  return {
    title: `${member?.title} | Members`,
  };
}
