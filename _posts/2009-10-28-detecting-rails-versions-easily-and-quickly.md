---
layout: post
title: Detecting Rails Versions Easily and Quickly
date: '2009-10-28T21:03:00-07:00'
tags:
- ruby
- rails
- webdev
---
While doing some routine maintenance on our server, I needed a quick way to
check which actual versions of Rails I needed. <!--more-->Over time, many
versions are installed that can lead to wasted space and confusion later on.
So, I whipped up a quick one-liner that I can run to give me all versions of
Rails running on our server.

<script src="http://gist.github.com/221125.js"></script>

This returns all Rails gem versions in a neat, sorted array:

<script src="http://gist.github.com/221138.js"></script>

