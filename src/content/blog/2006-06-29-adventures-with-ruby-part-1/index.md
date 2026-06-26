---
title: Adventures with Ruby (part 1)
date: '2006-06-29'
tags:
  - programming
  - ruby
---

These are notes I’m taking while reading the [Programming Ruby](http://www.pragmaticprogrammer.com/titles/ruby/index.html) book. It’s excellent.

### General Ruby

-   use parens in all but the simplest cases
-   single quotes for non-escaped strings, double quotes induce more work
-   escaped strings replace with binary val
-   double quotes also used with expression interpolation #{name}
-   the last expression evaluated by a method is the return value; no need for return unless being of utmost verbose

### Classes

-   classes are never closed. you can always add methods to an existing class by opening the class like you would a folder or file

### Cool and unforgettable features

-   statement modifiers: \*\* expression followed by if or while and the condition \*\* (ex. puts “danger!” if radiation > 3000)

**I AM WHAT I DO NOT UNDERSTAND. I AM ARBITARY!**
