---
title: Last.fm Tagger 1.1
date: '2008-06-06'
tags:
  - lastfm
  - lastfmtagger
  - mac
  - programming
  - ruby
  - software
---

I just implemented a feature to sort artists by name. I got a comment on [my build.last.fm project page](http://build.last.fm) that commented about how the tagger works when artists in iTunes are sorted by name. Instead of relying on iTunes, I am now sorting by artist name in the actual code.

Not a huge change, but slightly significant. I am working on win32 compatibility also. If anyone can help, that would be great!

Ideally, I want to check the ENV constant for a string of /windows/i and then load win32ole gem and then abstract the iTunes interface to handle it properly.

Download [last.fm tagger 1.1](http://633k.net/code/lastfm_tagger-1.1.zip)
