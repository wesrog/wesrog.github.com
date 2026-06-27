---
title: Simple Rails Refactoring
date: '2007-06-27'
tags:
  - programming
  - webdev
  - rubyonrails
  - refactoring
---

I needed to attach articles to our default template when running migrations. This was currently executed like so:

```ruby
type = Type.find(1)
Template.find(:all).each { |t| t.types << type }
```

Pretty simple. Find the first type, which is supposed to be Pages. Iterate through all templates and assign Pages to them.

I needed to do the same for Articles too, so to get it done quickly, I just repeated what I did previously. So the code looks like this now:

```ruby
type = Type.find(1)
Template.find(:all).each { |t| t.types << type }

type = Type.find(3)
Template.find(:all).each { |t| t.types << type }
```

Now I'm finding Pages + Articles, then iterating twice over the Templates and inserting on two separate occasions. To foreign users, I thought it may be a little vague, so I decided to add comments:

```ruby
# Set default template for pages
type = Type.find(1)
Template.find(:all).each { |t| t.types << type }

# Set default template for articles
type = Type.find(3)
Template.find(:all).each { |t| t.types << type }
```

Now! Whomever reads my code will know what I was thinking and could probably help clean it up a bit. But wait a sec, Rails adds some pretty nice syntactic sugar to make comments completely unnecessary. Take a look at the same code without comments:

```ruby
type = Type.find_by_name('Page')
Template.find(:all).each { |t| t.types << type }

type = Type.find_by_name('Article')
Template.find(:all).each { |t| t.types << type }
```

I think the code is self-explanatory without comments now. But is there a way that I can reduce that still to one line? Sure. The `type` variables are not needed anyways. So let's get closer to one line:

```ruby
Template.find(:all).each { |t| t.types << Type.find_by_name('Page') }
Template.find(:all).each { |t| t.types << Type.find_by_name('Article') }
```

This looks swell. I removed the variables and just put the finder methods add what's being inserted into the Template association.

This can be refactored one more time. I can append multiple calls to an array insertion, therefore reducing my code to one line.

```ruby
Template.find(:all).each { |t| t.types << Type.find_by_name('Page') << Type.find_by_name('Article') }
```

Now it's lean.

I make it a point to do things like this as many times as possible in one day. Something that Dave Thomas at RailsConf stuck with me. It's not an accurate quote, but it goes something like this:

> Always check in code that is better than before. Even if it's a small improvement.
