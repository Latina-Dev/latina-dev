import {getMemberBySlug, getMembers} from "@/lib/getMembers";
import styles from "./memberpage.module.css";
import GitHubCorner from "@/components/GitHubCorner/GitHubCorner";
import Navbar from "@/components/Navbar/Navbar";
import Image from "next/image";
import SocialLinks from "@/components/Members/Member/SocialLinks";
import Footer from "@/components/Footer/Footer";

interface Props {
  params: {
    slug: string;
  };
}

// TODO: Update styling for this single member page view
export default async function Member({params}: Props) {
  // get member data from slug
  const member = await getMemberBySlug(params.slug);
  // if no member, return 404
  if (!member) return <article>404</article>;
  // otherwise, destructure member data
  const {name, affiliation, level, bio} = member;
  return (
    <section className="py-20">
      <GitHubCorner/>
      <Navbar/>
      <div className="w-full pt-20">
        <div className={styles.topbar}/>
        <article className="max-w-screen-lg relative mx-auto py-16">
          <div className="inline-block text-center">
            <Image
              src={`/img/members/${params.slug}.jpg`}
              alt={name}
              width="250"
              height="250"
              className="rounded-xl y-8"
            />
            <SocialLinks member={member}/>
          </div>
          <h2 className="mt-3">{name}</h2>
          <h3>{affiliation}</h3>
          <h3 className={styles.affiliation}>{level}</h3>
          {bio && <div className={styles.bio} dangerouslySetInnerHTML={{__html: bio}}/>}
          <Footer />
        </article>
      </div>
    </section>
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
export async function generateMetadata({params}: Props) {
  const member = await getMemberBySlug(params.slug);
  return {
    title: `${member?.name} | Members`,
  };
}
