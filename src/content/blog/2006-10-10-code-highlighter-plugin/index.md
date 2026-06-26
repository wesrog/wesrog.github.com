---
title: "Code Highlighter Plugin!"
date: '2006-10-10'
tags:
  - programming
---

Finally! Oh, how I’ve longed for your sweet caress…

Thanks to [this how-to](http://radiantcms.org/blog/2006/09/28/how-to-anatomy-of-the-code-highlighter-plugin/), I was able to get syntax highlighting working. It’s super-easy to setup, however I had to do some light digging to get the proper CSS. The one I found was similar to the [RubyBlue TextMate theme](http://johnwlong.com/downloads/RubyBlue.tmTheme) that I adore.

Here’s a small excerpt (for testing) of the **lib/codehighlighter plugin.rb** file:

```
require 'behavior'
require 'syntax/convertors/html'
```

Behavior::Base.define_tags do
tag 'code' do |tag|
 lang = tag.attr['lang'] || "ruby"
 convertor = Syntax::Convertors::HTML.for_syntax(lang)
 code = convertor.convert(tag.expand.to_s.strip, false)
 %{#{lang}-code"&gt;`#{code}`}
end
end  And of course, the CSS:  pre.ruby-code {
background-color: #0D151E;
color: #fff;
padding: 10px 10px 10px 10px;
margin: 4px 0px;
font-size: 1.1em;
overflow: auto;
}

/* Syntax highlighting */
pre.ruby-code .normal {}
pre.ruby-code .comment { color: #428BDD; font-style: italic; }
pre.ruby-code .keyword { color: #F8BB00; }
pre.ruby-code .method { color: #077; }
pre.ruby-code .class { color: #fff; }
pre.ruby-code .module { color: #050; }
pre.ruby-code .punct { color: #FFF; }
pre.ruby-code .symbol { color: #B53B3C; }
pre.ruby-code .string { color: #1DC116; }
pre.ruby-code .char { color: #F07; }
pre.ruby-code .ident { color: #fff; }
pre.ruby-code .constant { color: #8AA6C1; }
pre.ruby-code .regex { color: #CA4344; }
pre.ruby-code .number { color: #EDDD3D; }
pre.ruby-code .attribute { color: #5bb; }
pre.ruby-code .global { color: #7FB; }
pre.ruby-code .expr { color: #227; }
pre.ruby-code .escape { color: #1C6A21; }
