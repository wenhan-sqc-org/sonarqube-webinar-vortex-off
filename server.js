const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// メモはメモリ上に保持する（再起動で消える）
const memos = [];
let nextId = 1;

app.disable('x-powered-by');
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// HTML 特殊文字をエスケープして XSS を防ぐ
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderPage(query, list) {
  const items = list.length
    ? list
        .map(
          (m) => `<li><strong>${escapeHtml(m.title)}</strong>
        <small>${escapeHtml(m.createdAt.toLocaleString('ja-JP'))}</small>
        <p>${escapeHtml(m.body).replace(/\n/g, '<br>')}</p></li>`
        )
        .join('\n')
    : '<li>メモがありません</li>';

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>メモアプリ</title>
  <style>
    body { font-family: sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
    form { margin-bottom: 1.5rem; }
    input[type=text], textarea { width: 100%; box-sizing: border-box; margin-bottom: .5rem; }
    ul { list-style: none; padding: 0; }
    li { border: 1px solid #ccc; border-radius: 4px; padding: .75rem; margin-bottom: .5rem; }
    small { color: #666; margin-left: .5rem; }
  </style>
</head>
<body>
  <h1>メモアプリ</h1>
  <form method="post" action="/memos">
    <input type="text" name="title" placeholder="タイトル" maxlength="100" required>
    <textarea name="body" rows="4" placeholder="本文" maxlength="2000"></textarea>
    <button type="submit">追加</button>
  </form>
  <form method="get" action="/">
    <input type="text" name="q" value="${escapeHtml(query)}" placeholder="キーワードで検索">
    <button type="submit">検索</button>
  </form>
  <h2>${query ? `「${escapeHtml(query)}」の検索結果（${list.length} 件）` : `一覧（${list.length} 件）`}</h2>
  <ul>
${items}
  </ul>
</body>
</html>`;
}

app.get('/', (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const keyword = query.toLowerCase();
  const list = memos
    .filter((m) => !keyword || m.title.toLowerCase().includes(keyword) || m.body.toLowerCase().includes(keyword))
    .slice()
    .reverse();
  res.type('html').send(renderPage(query, list));
});

app.post('/memos', (req, res) => {
  const title = typeof req.body.title === 'string' ? req.body.title.trim().slice(0, 100) : '';
  const body = typeof req.body.body === 'string' ? req.body.body.trim().slice(0, 2000) : '';
  if (!title) {
    return res.status(400).type('html').send('<p>タイトルは必須です。</p><a href="/">戻る</a>');
  }
  memos.push({ id: nextId++, title, body, createdAt: new Date() });
  res.redirect(303, '/');
});

app.listen(PORT, () => {
  console.log(`Memo app listening on http://localhost:${PORT}`);
});
