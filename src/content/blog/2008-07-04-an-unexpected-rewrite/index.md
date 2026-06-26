---
title: An Unexpected Rewrite...
date: '2008-07-04'
tags:
  - lastfm
  - lastfmtagger
  - mac
  - programming
  - ruby
  - software
  - rubycocoa
---

After asking a few friends to beta test the app, I found out that it wouldn’t run on any machine but mine. Luckily, I have another mac around and was able to test. I ended up having to rewrite the whole thing! My problem was when I was trying to match the sender of the ‘tableView\_objectValueForTableColumn\_row’ delegate method to an NSTableView object. This wasn’t working on any other machine for some reason. So, I ended up rewriting it all and refactoring things into separate controllers which is really nice.

The app will close out properly if no playlist with the name of 'lastfmtagger’ exists. I am working on integrating a way to create the playlist on demand so that the app will continue running.

I would also like to be able to refresh the list of artists on demand, or on a timed observe of some sort so that when you add artists to the playlist, the app is updated accordingly. Tons of ideas, tons of time!

Here’s an updated screenshot:

And the [download link](/last.fm-tagger.zip) of course.
