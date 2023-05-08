import fs from "fs";
import grayMatter from "gray-matter";
import remarkParse from "remark-parse";
import remarkHtml from "remark-html";
import { unified } from "unified";

type MemberData = {
  title: string;
  date: string;
  slug: string;
  path: string;
  html: string;
};

export const getMembers = async (): Promise<MemberData[]> => {
  const files = fs.readdirSync(`app/_members`);
  // console.log({ files });

  const members = files.map(async (filename) => {
    // console.log({ filename });
    const markdownWithMetadata = fs
      .readFileSync(`app/_members/${filename}`)
      .toString();

    const { data, content } = grayMatter(markdownWithMetadata);

    const html = await unified()
      .use(remarkParse)
      .use(remarkHtml)
      .process(content);

    console.log({ html });

    const htmlData = html.value.toString();

    // Front Matter
    const slug = filename.replace(".md", "");
    const path = `/members/${slug}`;
    const title = data.title;
    const date = data.date;

    // Parse Markdown

    return {
      title,
      date,
      slug,
      path,
      html: htmlData,
    };
  });

  // console.log({ members });

  return Promise.all(members);
};

export const getMemberBySlug = async (slug: string) => {
  const members = await getMembers();
  const member = members.find((member) => member.slug === slug);
  console.log({ member });
  return member;
};
