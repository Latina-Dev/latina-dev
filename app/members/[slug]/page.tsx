import CountryFlags from "@/components/CountryFlags/CountryFlags";
import { getMemberBySlug, getMembers } from "@/lib/getMembers";

interface Props {
  params: {
    slug: string;
  };
}

// TODO: Update styling for this single member page view
export default async function Member({ params }: Props) {
  // get member data from slug
  const member = await getMemberBySlug(params.slug);
  // console.log({ member });
  // if no member, return 404
  if (!member) return <article>404</article>;
  // otherwise, destructure member data
  const { name, added, linkedin, github, twitter, website, bio, countries } =
    member;
  return (
    <article>
      {name && <p className={"text-xl"}>{name}</p>}
      {added && <p>{added}</p>}
      {countries && <CountryFlags countries={countries} />}
      {linkedin && (
        <p>
          <a
            href={`https://linkedin.com/in/${linkedin}`}
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
        </p>
      )}
      {github && (
        <p>
          <a
            href={`https://github.com/${github}`}
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </p>
      )}
      {twitter && (
        <p>
          <a
            href={`https://twitter.com/${twitter}`}
            target="_blank"
            rel="noreferrer"
          >
            Twitter
          </a>
        </p>
      )}
      {website && (
        <p>
          <a href={website} target="_blank" rel="noreferrer">
            Personal Website
          </a>
        </p>
      )}
      {bio && <div dangerouslySetInnerHTML={{ __html: bio }} />}
    </article>
  );
}

// Generate a list of paths for Next.js to pre-render, based on the members
export async function generateStaticParams() {
  const members = await getMembers();
  return members.map((member) => ({
    slug: member.slug,
  }));
}

// Set the title of the page to be the post title
export async function generateMetadata({ params }: Props) {
  const member = await getMemberBySlug(params.slug);
  return {
    title: `${member?.name} | Members`,
  };
}
