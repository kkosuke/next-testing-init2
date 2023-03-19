import fetch from 'node-fetch';

export const getAllPostsData = async () => {
  const res = await fetch(
    new URL(`${process.env.NEXT_PUBLIC_RESTAPI_URL}/get-blogs/`)
  );
  const posts = await res.json();
  return posts;
};

// 動的なルーティングをNext.jsで設定する際に使用するために、idを取得する
export const getAllPostIds = async () => {
  const res = await fetch(
    new URL(`${process.env.NEXT_PUBLIC_RESTAPI_URL}/get-blogs/`)
  );
  const posts = await res.json();
  return posts.map((post) => {
    return {
      params: {
        id: String(post.id),
      },
    };
  });
};

// 記事詳細
export const getPostData = async (id: string) => {
  const res = await fetch(
    new URL(`${process.env.NEXT_PUBLIC_RESTAPI_URL}/get-blogs/${id}`)
  );
  const post = await res.json();
  // return {
  //   post,
  // }
  return post;
};
