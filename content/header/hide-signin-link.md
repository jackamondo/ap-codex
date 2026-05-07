---
title: Remove the Sign in link from the header
tags: [liquid, handlebars, navigation, auth]
summary: Hides the user-menu sign-in link in the header for help centers that don't want anonymous visitors authenticating.
useCase: Customer wants visitors to browse the help center but never see a sign-in option — typically because authentication is handled upstream via SSO on their main app, or because the help center is public-only and accounts are managed elsewhere.
updated: 2026-04-18
related: [lock-new-request, header-search-toggle]
---

## Approach

The header lives in `templates/header.hbs`. We wrap the user-menu block in a Curlybars conditional that always evaluates false, or just delete the block entirely. Wrapping is safer if you want to flip it back later.

```handlebars title="templates/header.hbs"
{{!-- before --}}
<div class="user-info">
  {{#if signed_in}}
    <a href="{{page_path 'user_profile'}}">{{current_user.name}}</a>
    <a href="{{sign_out_path}}">{{t 'sign_out'}}</a>
  {{else}}
    <a href="{{sign_in_path}}" class="sign-in">{{t 'sign_in'}}</a>
  {{/if}}
</div>
```

```handlebars title="templates/header.hbs"
{{!-- after — keep markup, hide for non-authed visitors --}}
<div class="user-info">
  {{#if signed_in}}
    <a href="{{page_path 'user_profile'}}">{{current_user.name}}</a>
    <a href="{{sign_out_path}}">{{t 'sign_out'}}</a>
  {{/if}}
</div>
```

## Belt-and-braces: hide via CSS too

If the customer is on a managed plan and you can't edit templates, drop this into `style.css`:

```css title="assets/style.css"
.user-info .sign-in,
.header .sign-in-link {
  display: none !important;
}
```

## Gotcha

Don't remove the entire `user-info` block — signed-in agents previewing the help center still need their profile menu, and removing it can break the mobile nav drawer that references `.user-info` as a positioning anchor.
