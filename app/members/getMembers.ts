import fs from "fs";
import matter from "gray-matter";

type PostData = {
  title: string;
  date: string;
  slug: string;
  path: string;
};

export const getMembers = async (): Promise<PostData[]> => {
  const files = fs.readdirSync(`app/_members`);
  // console.log({ files });

  const members = files.map((filename) => {
    // console.log({ filename });
    const markdownWithMetadata = fs
      .readFileSync(`app/_members/${filename}`)
      .toString();

    // console.log({ markdownWithMetadata });
    const { data, content: markdown } = matter(markdownWithMetadata);

    const title = data.title;
    // console.log({ title });
    const date = data.date;
    // console.log({ date });
    const slug = filename.replace(".md", "");
    // console.log({ slug });
    const path = `/members/${slug}`;
    // console.log({ path });

    return {
      title,
      date,
      slug,
      path,
    };
  });

  // console.log({ members });

  return members;
};

export const getMemberBySlug = async (slug: string) => {
  const members = await getMembers();
  const member = members.find((member) => member.slug === slug);
  console.log({ member });
  return member;
};
