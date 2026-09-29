'use strict';

const express = require('express');

const app = express();
app.disable('x-powered-by');
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

const MAX_LENGTH = 1000;
const memos = [];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderPage(list, query) {
  const items = list.length
    ? list
        .map(
          (m) =>
            `<li>${escapeHtml(m.text)} <small>(${escapeHtml(m.createdAt.toLocaleString('ja-JP'))})</small></li>`
        )
        .join('\n')
    : '<li>メモはありません</li>';

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>メモアプリ</title>
</head>
<body>
<h1>メモアプリ</h1>
<form method="post" action="/memos">
  <input type="text" name="text" maxlength="${MAX_LENGTH}" required>
  <button type="submit">追加</button>
</form>
<form method="get" action="/">
  <input type="search" name="q" value="${escapeHtml(query)}">
  <button type="submit">検索</button>
</form>
<ul>
${items}
</ul>
</body>
</html>`;
}

app.get('/', (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const list = query
    ? memos.filter((m) => m.text.toLowerCase().includes(query.toLowerCase()))
    : memos;
  res.type('html').send(renderPage(list, query));
});

app.post('/memos', (req, res) => {
  const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
  if (!text || text.length > MAX_LENGTH) {
    res.status(400).type('text').send('メモは 1〜1000 文字で入力してください');
    return;
  }
  memos.push({ text, createdAt: new Date() });
  res.redirect(303, '/');
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`Memo app listening on http://localhost:${port}`);
});
