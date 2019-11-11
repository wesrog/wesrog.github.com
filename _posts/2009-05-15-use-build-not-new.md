---
layout: post
title: Use "build", Not "new"
date: '2009-05-15T07:30:00-07:00'
tags: []
---
When working with multiple models and forms in Rails, your associations need to
use `build` instead of `new`. I never knew there was a distinction between the
two. Apparently, I was wrong :\ <!--more-->

For example, this will not work when trying to validate the associations:

```
@account = Account.new(params[:account])
@user = @account.users.new(params[:user])
```

The `new` method doesn’t actually build the association. The `@account` will be
saved, but the `@user` won’t be if it fails validation.

Using the `build` method will automatically take care of the transactional part
for us so the `@account` object won’t be saved until both models are valid:

```
@account = Account.new(params[:account])
@user = @account.users.build(params[:user])
```

It’s handy in the controller too. Instead of calling both `@account.save` and
`@user.save`, you simply call `@account.save` and it saves the `@user`
association.

