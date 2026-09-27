import type { CmsPost } from "@/lib/cms/posts";
import { listThread, markThreadRead } from "@/lib/cms/thread";
import { THREAD_MAX } from "@/lib/cms/thread-limits";
import { LocalTime } from "./local-time";
import { deleteMessage, sendMessage } from "./thread-actions";
import { ThreadForm } from "./thread-form";

type Props = {
  post: CmsPost;
  viewerId: string;
};

export async function ReviewThread({ post, viewerId }: Props) {
  const [messages, lastRead] = await Promise.all([
    listThread(post.id),
    markThreadRead(post.id, viewerId),
  ]);
  const isOwner = post.author_id === viewerId;
  const lastReadMs = lastRead ? Date.parse(lastRead) : -Infinity;
  const firstNew = messages.find(
    (m) => m.sender_id !== viewerId && Date.parse(m.created_at) > lastReadMs,
  );

  const senderName = (senderId: string) =>
    senderId === viewerId
      ? "You"
      : senderId === post.author_id
        ? (post.author?.username ?? "Author")
        : "Admin";

  const hint = isOwner
    ? post.status === "draft"
      ? "The admin sees new messages once you submit the post for review."
      : "Only you and the admin see this. It's deleted when the post is published."
    : "Only you and the author see this. It's deleted when the post is published.";

  return (
    <section id="thread" className="cms-thread" aria-labelledby="thread-title">
      <h2 id="thread-title" className="cms-thread-title">
        Review thread
      </h2>

      {messages.length === 0 ? (
        <p className="cms-thread-empty">
          {isOwner ? "No messages yet." : "No messages yet. Tell the author what to change."}
        </p>
      ) : (
        <ol className="cms-thread-list">
          {messages.map((m) => (
            <li key={m.id} className="cms-thread-item">
              {m.id === firstNew?.id ? (
                <p className="cms-thread-new" role="note">
                  New reply
                </p>
              ) : null}
              <p className="cms-thread-meta">
                <span className="cms-thread-sender">{senderName(m.sender_id)}</span>
                <LocalTime iso={m.created_at} />
              </p>
              <p className="cms-thread-body">{m.body}</p>
              {m.sender_id === viewerId ? (
                <form action={deleteMessage.bind(null, post.id, m.id)}>
                  <button type="submit" className="cms-thread-delete">
                    Delete
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      {messages.length >= THREAD_MAX ? (
        <p className="cms-field-hint">
          This thread is full ({THREAD_MAX} messages). Delete old ones to write more.
        </p>
      ) : (
        <ThreadForm action={sendMessage.bind(null, post.id)} hint={hint} />
      )}
    </section>
  );
}
