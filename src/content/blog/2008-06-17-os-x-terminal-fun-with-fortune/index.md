---
title: OS X Terminal Fun with Fortune
date: '2008-06-17'
tags:
  - mac
  - geek
---

I have known about [Fortune](http://en.wikipedia.org/wiki/Fortune_(Unix)) for several years now, and I randomly thought about it today. I wondered, could I have fortune give me a fortune each time I open a new terminal window. After a little digging and worrying about it being complicated, I simply tried to just place the path of fortune into my .profile. Voila! Now, every time I open Terminal, I am greeted with a neat little fortune.

In order to do this, you&rsquo;ll need [macports](http://macports.org) installed.

If you already have them installed, simply install fortune:
sudo port install fortune

Then, edit your ~/.profile

mate ~/.profile

Add the path to fortune at the end of the file:

/opt/local/bin/fortune

I love it! :)
