/**
 * @jest-environment jsdom
 */
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

import userEvent from '@testing-library/user-event';

import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { getPage } from 'next-page-tester';
import { initTestHelpers } from 'next-page-tester';
import 'setimmediate';

initTestHelpers();

process.env.NEXT_PUBLIC_RESTAPI_URL = 'http://127.0.0.1:8000/api';

const server = setupServer(
  // ブログダミーデータ
  rest.get(
    `${process.env.NEXT_PUBLIC_RESTAPI_URL}/get-blogs/`,
    (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json([
          {
            id: 1,
            title: 'title1',
            content: 'content1',
            username: 'username1',
            tags: [
              { id: 1, name: 'tag1' },
              { id: 2, name: 'tag2' },
            ],
            created_at: '2021-01-12 14:59:41',
          },
          {
            id: 2,
            title: 'title2',
            content: 'content2',
            username: 'username2',
            tags: [
              { id: 1, name: 'tag1' },
              { id: 2, name: 'tag2' },
            ],
            created_at: '2021-01-13 14:59:41',
          },
        ])
      );
    }
  )
);

beforeAll(() => {
  server.listen();
});
afterEach(() => {
  server.resetHandlers();
  cleanup();
  // 値を空に。期限を過去にすることで、
  // テストケースが終わるたびに、クッキーを初期化する。
  document.cookie =
    'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
});
afterAll(() => {
  server.close();
});

describe('BlogPage Test Cases', () => {
  it('タブバーからページ遷移', async () => {
    const { page } = await getPage({
      route: '/',
    });
    render(page);
    userEvent.click(screen.getByTestId('admin-nav'));
    expect(await screen.findByText('Login')).toBeInTheDocument();
    userEvent.click(screen.getByTestId('blog-nav'));
    expect(await screen.findByText('blog page')).toBeInTheDocument();
  });

  it('削除ボタンとログアウトボタンの機能', async () => {
    // Should render delete btn + logout btn when JWT token coockie exist
    // アクセストークンを所持指定場合はログイン済とする
    document.cookie = 'access_token=123xyz';
    const { page } = await getPage({
      route: '/',
    });
    render(page);
    expect(await screen.findByText('blog page')).toBeInTheDocument();
    expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
    expect(screen.getByTestId('btn-1')).toBeInTheDocument();
    expect(screen.getByTestId('btn-2')).toBeInTheDocument();
  });

  it('クッキーがない場合は、削除ボタンやログアウトボタンがないこと', async () => {
    //should not render delete btn + logout btn when no coockie
    const { page } = await getPage({
      route: '/',
    });
    render(page);
    expect(await screen.findByText('blog page')).toBeInTheDocument();
    // 無いことを取得しようとするう場合は、queryByTestId
    expect(screen.queryByTestId('logout-icon')).toBeNull();
    expect(screen.queryByTestId('btn-1')).toBeNull();
    expect(screen.queryByTestId('btn-2')).toBeNull();
  });

  // SSGの生成具合を確認する。
  // getStaticProps を 使っているので、buildをしたときに、
  // blogの一覧も作成されている。

  // ※Next.jsではAPIを叩くときにgetStaticPropsを使うことで、ビルド時にデータを取得して事前にHTMLファイルのレンダリングを行うことができます。ビルド時にデータを取得して事前にHTMLファイルのレンダリングを行うことをSSGと呼びます。
  // https://zenn.dev/mo_ri_regen/articles/implement-ssg-article
  // https://qiita.com/matamatanot/items/1735984f40540b8bdf91#getserversideprops
  it('Should render the list of blogs pre-fetched by getStaticProps', async () => {
    const { page } = await getPage({
      route: '/',
    });
    render(page);
    expect(await screen.findByText('blog page')).toBeInTheDocument();
    expect(screen.getByText('title1')).toBeInTheDocument();
    expect(screen.getByText('title2')).toBeInTheDocument();
  });
});
