// Materials: on narrow screens compare any two materials side by side.
const table = document.querySelector('[data-testid="materials-table"]');
const a = document.getElementById('cmp-a');
const b = document.getElementById('cmp-b');
if (table && a && b) {
  const apply = changed => {
    if (a.value === b.value) {
      const other = ['pvc', 'mediena', 'aliuminis'].find(m => m !== a.value);
      (changed === a ? b : a).value = other;
    }
    const hidden = ['pvc', 'mediena', 'aliuminis'].find(m => m !== a.value && m !== b.value);
    table.dataset.hide = hidden;
  };
  a.addEventListener('change', () => apply(a));
  b.addEventListener('change', () => apply(b));
  apply(a);
  document.documentElement.classList.add('js-compare');
}
