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

```ruby
Dir['*'].map { |d| `cat #{d}/config/environment.rb | grep RAILS_GEM_VERSION`.scan(/[\d\.]+/) }.flatten.uniq.sort
```

This returns all Rails gem versions in a neat, sorted array:

```ruby
["1.2.2", "1.2.3", "1.2.5", "1.2.6", "2.0.2", "2.1.0", "2.2.2", "2.3.2", "2.3.3", "2.3.4"]
```
