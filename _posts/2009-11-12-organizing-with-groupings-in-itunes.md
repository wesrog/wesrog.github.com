---
layout: post
title: Organizing with Groupings in iTunes
date: '2009-11-12T13:16:00-08:00'
tags: []
---
I’ve been trying to use groupings in iTunes lately to help narrow down finding
what I want to hear. <!--more-->[coversrc.com](http://coversrc.com) has helped
a little by consolidating the places I go to find genres/styles/artwork.

Groupings in iTunes can be used for anything you want. I’ve found them to be
particularly useful for granulizing genres. So, for instance, a track can be
tagged with the genre of “Rock”, but what kind of Rock? Prog Rock? Classic
Rock?  The list can go on. There are a lot of distinguishing qualities between
genres/styles.

One thing I noticed when I was inputting the groupings is that 2 groupings can
exist independently of each other, therefore creating duplicate entries. For
example, I can have a grouping called “Experimental, Minimal” and
“Experimental, Noise”. iTunes has no way of separating these groupings so
needless to say, this results in a lot of groupings. To help consolidate the
groupings, I realized I needed to sort them. Rather than go through each track
and sort its groupings, why not utilize my programming prowess.

I made a [gist](http://gist.github.com/231031gist), then wanted to run it in the
command-line without making a file. So, with the help of the pipe command you
can alphabetize your groupings like so:

`curl -s http://gist.github.com/231031.txt | ruby`

How do you organize your music?
