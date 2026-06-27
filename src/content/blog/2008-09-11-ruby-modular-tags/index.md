---
title: "Ruby: Modular Tags"
date: '2008-09-11'
---

It’s hard to tell, but I’ve really grown a lot in terms of Ruby. I’ve spent most of tonight refactoring our radius tag system to be more modular. I’ve always wanted to be able to split up the tags into different files based on the tags. The CMS I have built utilizes polymorphism for resources. So, before, the tags file was huge… encompassing not only basic resource tags, but also articles, galleries, etc. Now, I can factor those out into their own files and it’s much more beautiful.

I will admit, I stole a little bit of code from RadiantCMS. Thank goodness for open-source. We would be using RadiantCMS, but our requirements would not fit around that system.

Most of my time tonight has been in modules. I’ve been learning a lot about them and will probably use them more in the future. They are great for sectioning out code and mixing in where you wish. Plus, there are a bunch of hook methods to utilize… but I haven’t found that need just yet.
