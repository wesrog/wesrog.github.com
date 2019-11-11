---
layout: post
title: Multi-step decorator for Lettuce
date: '2010-08-27T13:58:51-07:00'
tags:
- webdev
---
Cucumber seriously has me spoiled.<!--more-->Lettuce is great, but it has a lot
of catching up to do. I’m glad to see such active progress on it.

One quick tip I wanted to give out was one of how to write steps that can be
used with minor verbiage differences. For instance:

```
Scenario: Make a new post
    Given I am logged out
    When I follow "/posts/new"
    Then I should see "New post"
    And I should see "Create new post"
```

The “Then” and “And” lines use the same step, but with a special regex to make
it happen. Essentially what you want to do is to create a capture group so you
can group some or’s, but not actually use the capture group. You can achieve
this by using “?:”. The lettuce step looks like this:

```
@step(u'(?:Then|And) I should see "(.*)"')
def i_should_see(step, text):
    world.res.mustcontain(text)
```

Hope that helps someone out there.

