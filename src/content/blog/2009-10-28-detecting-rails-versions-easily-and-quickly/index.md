---
title: Detecting Rails Versions Easily and Quickly
date: '2009-10-29'
tags:
  - ruby
  - rails
  - webdev
---

While doing some routine maintenance on our server, I needed a quick way to
check which actual versions of Rails I needed. Over time, many
versions are installed that can lead to wasted space and confusion later on.
So, I whipped up a quick one-liner that I can run to give me all versions of
Rails running on our server.

This returns all Rails gem versions in a neat, sorted array:
