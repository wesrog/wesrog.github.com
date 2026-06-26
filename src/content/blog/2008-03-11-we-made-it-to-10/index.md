---
title: "We Made it to 1.0!"
date: '2008-03-11'
tags:
  - lastfm
  - lastfmtagger
  - programming
  - ruby
  - mac
---

I made a nice improvement that I feel warrants a 1.0 release. That improvement is simply a hash that stores genres for the life of the process so that an additional query to last.fm is not needed. I fixed a bug where “q” wasn’t cleanly aborting the process. Also, I did a little spring cleaning with the code… moved everything out of a main file and into separate files for better organization.

I’m happy to say that [build.last.fm](http://build.last.fm) accepted my application! So you can now find the tagger on [build.last.fm](http://build.last.fm/item/298).

If anyone out there would like a feature added, just let me know and I’ll see about implementing it.

[Get 1.0 now](/code/lastfm_tagger-1.0.zip)!
