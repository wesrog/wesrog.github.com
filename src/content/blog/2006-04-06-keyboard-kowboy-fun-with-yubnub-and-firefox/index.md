---
title: "Keyboard Kowboy: Fun with YubNub and Firefox"
date: '2006-04-06'
tags:
  - firefox
  - hacks
---

I’m in the process of almost exclusively using my keyboard for my daily tasks. I want to eventually get to a point where most everything I want to do can be accomplished with a keyboard. This works well because I am a programmer. This article will continually be updated as I find more stuff.

### First’s First

[Firefox](http://mozilla.org/firefox) is a very powerful browser with a ton of tweaks available. This, in conjunction with [yubnub](http://yubnub.org/), can transform your web browsing experience into that of a command-line operating system, like UNIX. There are innumerable commands available at yubnub. For instance:

```
m 32312
```

will return the Yahoo! movie listings in my area.

### “I Wanna Do It!”

It’s quite easy to setup. First, open a new tab and type:

```
about:config
```

Next, specify “keyword” in the filter, or just look for keyword.URL. You need to change this to:

```
http://yubnub.org/parser/parse?command=
```

### Ok, Now What?

Now, you have every yubnub command at your little fingertips. So, to reiterate my previous example, go search for movies in your area by typing `m` followed by your zip code.

```
m 32312
```

### More Yubnub

So now that you’ve experienced the yubnub, you will probably want to scour the command list to find something useful. In your address bar, type:

```
ls
```

This will return a listing of every yubnub command. If you are at all familiar with UNIX or Linux, you will immediately recognize this as the list command.

Let’s say you want to search for a command. Simply append `ls` with an argument with what you are searching for.

```
ls mp3
```

This will list out a bunch of commands directly related to mp3. My favorite is `gmp3` to find mp3’s in unprotected directories. It’s pretty amazing what you can find with Google™.

### In the Works…

Since I’m a music snob/addict, my next journey will involve optmizing my listening environment for keyboarding.
