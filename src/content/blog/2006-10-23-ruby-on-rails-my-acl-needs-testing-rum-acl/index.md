---
title: "Ruby on Rails: My ACL Needs Testing! (RUM ACL)"
date: '2006-10-23'
tags:
  - programming
  - webdev
  - rubyonrails
---

Hello. I have built an ACL (user-management) system with Rails and I need **you** to test it. Please download the zip, extract it, create your database and set it up, then run `rake db:migrate`.

Some pluses of this system

-   Uses some AJAX features to handle trivial tasks such as adding, removing to speed up those boring tasks.
-   It’s stripped down to allow for you to style it as you see fit.
-   It’s very basic and easy to understand what’s going on.

Some minuses

-   Uses HABTM without :through. Don’t need a full model for my relationships?
-   No tests…

Could/should it be developed as a plugin? Engine?

I’d really appreciate some feedback! Send me an email: ![email feedback](http://blog.633k.net/images/gmail.png "email feedback")

Download the RUM ACL: [rum-1.0.zip](http://blog.633k.net/rum-1.0.zip)
