---
layout: post
title: Forking `textile_editor_helper`
date: '2008-11-29T08:48:00-08:00'
tags: []
---
I forked the textile\_editor\_helper plugin so that it will work with Rails
2.2.2

I was getting this error:

    ActionView::TemplateError (wrong number of arguments (5 for 4))

It was an easy fix really.

Also, tests were bugging out due to the JavascriptHelper module being renamed
to JavaScriptHelper. Kind of a pain to track down!

It’s all sweet now. Here’s the forked repo:
[http://github.com/wesrog/textile-editor-helper/tree/master](http://github.com/wesrog/textile-editor-helper/tree/master)

