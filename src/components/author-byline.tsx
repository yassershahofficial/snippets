import Image from "next/image";
import type { PublicAuthor } from "@/lib/posts/author";
import "./author-byline.css";

type Props = {
  author: PublicAuthor | null | undefined;
  className?: string;
};

/** Username + Google avatar. Not linked (future `/authors/[username]`). */
export function AuthorByline({ author, className = "author-byline" }: Props) {
  if (!author) return null;

  return (
    <p className={className}>
      {author.avatar_url ? (
        <Image
          src={author.avatar_url}
          alt=""
          width={28}
          height={28}
          className="author-byline-avatar"
        />
      ) : null}
      <span className="author-byline-name">{author.username}</span>
    </p>
  );
}
