/**
 * @jest-environment jsdom
 */
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// ユーザー操作を検証したいので
import userEvent from '@testing-library/user-event';

// APIのテストをしたいので
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { getPage } from 'next-page-tester';
import { initTestHelpers } from 'next-page-tester';
import 'setimmediate';

initTestHelpers();

// testには、envが効かないので、改めて作成しておく
process.env.NEXT_PUBLIC_RESTAPI_URL = 'http://127.0.0.1:8000/api';

const handlers = [
  rest.post(
    `${process.env.NEXT_PUBLIC_RESTAPI_URL}/jwt/create/`,
    (req, res, ctx) => {
      return res(ctx.status(200), ctx.json({ access: '123xyz' }));
    }
  ),
  rest.post(
    `${process.env.NEXT_PUBLIC_RESTAPI_URL}/register/`,
    (req, res, ctx) => {
      return res(ctx.status(201));
    }
  ),
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
  ),
];
const server = setupServer(...handlers);
beforeAll(() => {
  server.listen();
});
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => {
  server.close();
});

describe('AdminPage Test Cases', () => {
  it('ログイン成功時ルートディレクトリに遷移するか', async () => {
    const { page } = await getPage({
      route: '/admin-page',
    });
    render(page);
    expect(await screen.findByText('Login')).toBeInTheDocument();
    // placeholderからdomを取得
    userEvent.type(screen.getByPlaceholderText('Username'), 'user1');
    userEvent.type(screen.getByPlaceholderText('Password'), 'password');
    // テキストからdomを取得
    userEvent.click(screen.getByText('Login with JWT'));
    expect(await screen.findByText('blog page')).toBeInTheDocument();
  });
  //
  it('ログイン失敗時の挙動は、ページ遷移をしない', async () => {
    // APIサーバーをわざと400にして失敗させる
    server.use(
      rest.post(
        `${process.env.NEXT_PUBLIC_RESTAPI_URL}/jwt/create/`,
        (req, res, ctx) => {
          return res(ctx.status(400));
        }
      )
    );
    const { page } = await getPage({
      route: '/admin-page',
    });
    render(page);
    expect(await screen.findByText('Login')).toBeInTheDocument();

    userEvent.type(screen.getByPlaceholderText('Username'), 'user1');
    userEvent.type(screen.getByPlaceholderText('Password'), 'password');
    userEvent.click(screen.getByText('Login with JWT'));
    // ログインの挙動をまつので、await
    expect(await screen.findByText('Login Error'));
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.queryByText('blog page')).toBeNull();
  });

  it('ログインモードとサインアップの切り替えができるか', async () => {
    const { page } = await getPage({
      route: '/admin-page',
    });
    render(page);
    expect(await screen.findByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Login with JWT')).toBeInTheDocument();
    // 切り替えボタンを押下する
    userEvent.click(screen.getByTestId('mode-change'));
    expect(screen.getByText('Sign up')).toBeInTheDocument();
    expect(screen.getByText('Create new user')).toBeInTheDocument();
  });

  it('サインアップ成功時にはルートに移動するか', async () => {
    // ※ このtestは、rest.postは200を返すように設定しているので
    // かならずサインアップが成功する
    const { page } = await getPage({
      route: '/admin-page',
    });
    render(page);
    expect(await screen.findByText('Login')).toBeInTheDocument();
    userEvent.click(screen.getByTestId('mode-change'));

    userEvent.type(screen.getByPlaceholderText('Username'), 'user1');
    userEvent.type(screen.getByPlaceholderText('Password'), 'password');
    userEvent.click(screen.getByText('Create new user'));
    screen.debug();
    expect(await screen.findByText('blog page')).toBeInTheDocument();
    screen.debug();
  });

  it('サインアップ失敗時にはページ遷移しない', async () => {
    server.use(
      rest.post(
        `${process.env.NEXT_PUBLIC_RESTAPI_URL}/register/`,
        (req, res, ctx) => {
          return res(ctx.status(400));
        }
      )
    );
    const { page } = await getPage({
      route: '/admin-page',
    });
    render(page);
    expect(await screen.findByText('Login')).toBeInTheDocument();
    userEvent.click(screen.getByTestId('mode-change'));
    userEvent.type(screen.getByPlaceholderText('Username'), 'user1');
    userEvent.type(screen.getByPlaceholderText('Password'), 'password');
    userEvent.click(screen.getByText('Create new user'));
    expect(await screen.findByText('Registration Error'));
    expect(screen.getByText('Sign up')).toBeInTheDocument();
    expect(screen.queryByText('blog page')).toBeNull();
  });
});
