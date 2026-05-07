---
title: Make the header sticky on scroll
tags: [css, navigation]
summary: Pins the header to the top of the viewport with a soft shadow on scroll.
useCase: Long article pages where users want to keep search and category nav within reach without scrolling back to the top.
updated: 2026-04-12
related: [header-search-toggle]
---

```css title="assets/style.css"
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--brand-bg, #fff);
  transition: box-shadow .2s ease;
}

.header.is-scrolled {
  box-shadow: 0 1px 0 rgba(0,0,0,.06), 0 8px 24px -16px rgba(0,0,0,.18);
}
```

```javascript title="assets/script.js"
const header = document.querySelector('.header');
const onScroll = () => {
  header.classList.toggle('is-scrolled', window.scrollY > 4);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
```
