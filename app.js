'use strict';
(() => {
  const key = 'asset-words.favorites.v1';
  const categories = ['長期投資', '節約', '浪費防止', '複利', '仕事・収入', '人生とお金', '資産形成おじさん'];
  const el = id => document.getElementById(id);
  // 文章を保存IDとして使うため、データの並びを変えてもお気に入りが残ります。
  let favorites = new Set();
  let storageAvailable = true;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(saved)) favorites = new Set(saved.filter(text => QUOTES.some(q => q.text === text)));
  } catch (_) { storageAvailable = false; }
  const announce = message => { el('status').textContent = message; };
  const save = () => {
    try { localStorage.setItem(key, JSON.stringify([...favorites])); storageAvailable = true; return true; }
    catch (_) { storageAvailable = false; announce('保存が制限されています。お気に入りはこのページを開いている間だけ保持します。'); return false; }
  };
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category; option.textContent = category; el('category').append(option);
  });
  // 端末の現地日付を種にする。同じ日・同じデータなら、保存機能がなくても同じ一言。
  const now = new Date();
  const date = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  let seed = 0;
  for (const char of date) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  let current = QUOTES[seed % QUOTES.length];
  function updateFavoriteButton() {
    const selected = favorites.has(current.text);
    el('favorite').textContent = selected ? '♥ 登録済み' : '♡ お気に入り';
    el('favorite').setAttribute('aria-pressed', String(selected));
    el('favorite-count').textContent = favorites.size;
  }
  function display(quote, mode) {
    current = quote;
    el('quote-text').textContent = quote.text;
    el('quote-category').textContent = quote.category;
    el('quote-mode').textContent = mode;
    updateFavoriteButton();
  }
  function next() {
    const category = el('category').value;
    const pool = QUOTES.filter(q => (category === 'すべて' || q.category === category) && q.text !== current.text);
    if (pool.length) display(pool[Math.floor(Math.random() * pool.length)], '今のあなたへ');
    else if (current.category !== category) {
      const only = QUOTES.find(q => q.category === category);
      if (only) display(only, '今のあなたへ');
    }
    announce('');
  }
  function renderFavorites() {
    el('favorite-list').replaceChildren();
    el('empty-favorites').hidden = favorites.size > 0;
    QUOTES.filter(q => favorites.has(q.text)).forEach(quote => {
      const item = document.createElement('li');
      const category = document.createElement('span'); category.className = 'badge'; category.textContent = quote.category;
      const text = document.createElement('p'); text.textContent = quote.text;
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'お気に入りから削除';
      remove.setAttribute('aria-label', `${quote.text} をお気に入りから削除`);
      remove.addEventListener('click', () => {
        const items = [...el('favorite-list').children];
        const index = items.indexOf(item);
        favorites.delete(quote.text); const persisted = save(); renderFavorites(); updateFavoriteButton();
        const remaining = el('favorite-list').children;
        (remaining[Math.min(index, remaining.length - 1)]?.querySelector('button') || el('show-favorites')).focus();
        if (persisted) announce('お気に入りから削除しました。');
      });
      item.append(category, text, remove); el('favorite-list').append(item);
    });
  }
  el('next').addEventListener('click', next);
  el('category').addEventListener('change', next);
  el('favorite').addEventListener('click', () => {
    const removing = favorites.has(current.text);
    if (removing) favorites.delete(current.text); else favorites.add(current.text);
    const persisted = save(); updateFavoriteButton(); renderFavorites();
    if (persisted) announce(removing ? 'お気に入りから削除しました。' : 'お気に入りに保存しました。');
  });
  el('show-favorites').addEventListener('click', () => {
    const show = el('favorites').hidden;
    el('favorites').hidden = !show;
    el('show-favorites').setAttribute('aria-expanded', String(show));
    el('show-favorites').firstChild.textContent = show ? 'お気に入りを閉じる ' : 'お気に入りを見る ';
    renderFavorites();
  });
  async function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(text); return true; } catch (_) { /* 古い方式で再試行 */ }
    }
    const field = document.createElement('textarea');
    field.value = text; field.style.position = 'fixed'; field.style.top = '0'; field.style.left = '-9999px';
    document.body.append(field); field.focus(); field.select(); field.setSelectionRange(0, text.length);
    let success = false;
    try { success = document.execCommand('copy'); } catch (_) { /* 手動コピーへ */ }
    field.remove(); el('share').focus(); return success;
  }
  el('share').addEventListener('click', async () => {
    const text = `「${current.text}」\n\n資産形成おじさんの一言`;
    if (navigator.share) {
      try { await navigator.share({ text }); announce('共有しました。'); return; }
      catch (error) { if (error.name === 'AbortError') return; }
    }
    if (await copy(text)) announce('言葉をコピーしました。');
    else { window.prompt('コピーできませんでした。以下の文章を選択してコピーしてください。', text); announce('文章を手動でコピーできます。'); }
  });
  display(current, '今日の一言'); renderFavorites();
  if (!storageAvailable) announce('保存が制限されています。お気に入りはこのページを開いている間だけ保持します。');
})();
