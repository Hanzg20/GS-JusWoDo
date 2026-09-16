-- Record-only migration (applied via `supabase db query --linked --file`).
--
-- Pinned welcome post from 小螺号 (see jwd_xiaoluohao_zhenyan_seed memory
-- for her account) as JWD's promotion push begins — invites new visitors
-- to share their own stories in 邻里圈, with concrete how-to-post steps.
-- Uses post_type MOMENT (日常分享/生活瞬间), not NOTICE/is_fact like her
-- earlier news seed posts — this is a personal invitation, not a
-- fact-checkable news item, so no JustTalk consensus voting applies.
-- is_pinned=true so it's the first thing a new visitor sees in the feed.

INSERT INTO community_posts (author_id, title, content, post_type, is_fact, is_pinned, tags)
VALUES (
    '9c2b0ee5-3b88-4534-aaf9-993785bffd40',
    '嗨，我是小螺号，邻里圈缺你这一个故事',
    '大家好呀，我是小螺号🐚，平时在这儿给大家播报渥太华的新闻和市政大事，但说真的，我最想听的从来不是这些——是你的故事。

也许是你刚搬来那年，异国他乡收到的第一份邻居送的饺子；也许是孩子在雪地里堆的那个歪脖子雪人；也许只是今天买菜时和收银员多聊了两句，心情就好了一整天。这些看着不起眼的瞬间，拼起来才是真正的"渥太华邻里"。

不用写得多好，不用多轰动，就是你自己的话，你自己的生活。

📍怎么发：打开"邻里圈"，点右下角（电脑上是右上角）那个"+"号，写下来，点发布，几十秒的事。

我在这儿，等你的故事～',
    'MOMENT',
    false,
    true,
    ARRAY['邻里圈', '分享故事', '欢迎']
)
RETURNING id, title;
