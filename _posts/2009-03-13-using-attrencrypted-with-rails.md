---
layout: post
title: Using attr_encrypted with Rails
date: '2009-03-13T09:51:00-07:00'
tags: [webdev]
---
[attr\_encrypted](http://github.com/shuber/attr_encrypted/tree/master) is a
dead-simple way to two-way encrypt information in your database. In our latest
project, we are storing social security numbers, so obviously we needed an
encryption solution.<!--more-->

I started off with [EzCrypto](http://ezcrypto.rubyforge.org/) because I had used
it in the past. It worked fine, but I came across attr\_encrypted and it seemed
more elegant.

I had some problems getting it working, namely getting it included (or required)
correctly. Before your class definition, simply put:

    require 'attr\_encrypted'

 and you should be good to go, considering you installed the gem.

Another, more elegant way of making sure the gem is required properly, set it as
an environment option:`config.gem 'shuber-attr_encrypted', :version => '~>
1.0.8', :lib => 'attr_encrypted', :source => 'http://gems.github.com'`

In our case, we have a Customer model. This Customer models needs to store
encrypted social security numbers. When I first created the Customer migration,
I assumed this column would be called ‘ssn’. I had troubles working with
attr\_encrypted because it has some conventions that I must have overlooked in
the documentation.

In order to use it correctly, the column in the database needs to be named
'encrypted\_ssn’. When you specify which column is to be encrypted with the
attr\_\* method, you are essentially creating a virtual attribute that is used
to encrypt/decrypt the actual data.

Hope this helps someone who is having similar problems.
