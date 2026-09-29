'use strict';

const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// メモはメモリ上に保持する（再起動で消える）
const memos = [];
let nextId = 1;

app.disable('x-powered-by');
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// XSS 対策: ユーザー入力は必ずエスケープしてから HTML に埋め込む
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderPage(query) {
  const q = query.trim().toLowerCase();
  const list = q
    ? memos.filter((m) => m.title.toLowerCase().includes(q) || m.body.toLowerCase().includes(q))
    : memos;

  const items = list.length
    ? list
        .map(
          (m) => `<li><strong>${escapeHtml(m.title)}</strong>
  <small>${escapeHtml(m.createdAt.toLocaleString('ja-JP'))}</small>
  <p>${escapeHtml(m.body).replace(/\n/g, '<br>')}</p></li>`
        )
        .join('\n')
    : '<li>メモはありません。</li>';

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>メモアプリ</title>
<style>
  body { font-family: sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
  form { margin-bottom: 1.5rem; }
  input, textarea { width: 100%; box-sizing: border-box; margin-bottom: .5rem; padding: .5rem; }
  ul { list-style: none; padding: 0; }
  li { border: 1px solid #ccc; border-radius: 6px; padding: .75rem; margin-bottom: .75rem; }
  small { color: #666; margin-left: .5rem; }
</style>
</head>
<body>
<h1>メモアプリ</h1>

<h2>メモを追加</h2>
<form method="post" action="/memos">
  <input name="title" placeholder="タイトル" maxlength="100" required>
  <textarea name="body" rows="4" placeholder="本文" maxlength="2000"></textarea>
  <button type="submit">追加</button>
</form>

<h2>検索</h2>
<form method="get" action="/">
  <input name="q" value="${escapeHtml(query)}" placeholder="キーワード">
  <button type="submit">検索</button>
  ${query ? '<a href="/">クリア</a>' : ''}
</form>

<h2>メモ一覧（${list.length} 件）</h2>
<ul>
${items}
</ul>
</body>
</html>`;
}

app.get('/', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  res.type('html').send(renderPage(q));
});

app.post('/memos', (req, res) => {
  const title = typeof req.body.title === 'string' ? req.body.title.trim().slice(0, 100) : '';
  const body = typeof req.body.body === 'string' ? req.body.body.trim().slice(0, 2000) : '';
  if (!title) {
    res.status(400).type('html').send('<p>タイトルは必須です。<a href="/">戻る</a></p>');
    return;
  }
  memos.unshift({ id: nextId++, title, body, createdAt: new Date() });
  res.redirect(303, '/');
});

app.listen(PORT, () => {
  console.log(`Memo app listening on http://localhost:${PORT}`);
});
