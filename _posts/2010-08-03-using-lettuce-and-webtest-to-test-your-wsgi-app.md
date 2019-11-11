---
layout: post
title: Using Lettuce and WebTest to Test Your WSGI App
date: '2010-08-03T11:45:08-07:00'
tags:
- testing
- python
---
Maybe I’m weird, but I don’t use Django. At my office, we’re using a home brew
framework. One thing that is missing from our framework is good testing. I came
from a Rails background and one thing I missed was Cucumber. Thankfully, someone
was nice enough to make a clone in Python. <!--more-->It’s called Lettuce and
you can find out more [here](http://lettuce.it/).

What I noticed about the Lettuce documentation, being as extensive as it is,
there really is no info on how to use it with any other web framework than
Django. I was a little discouraged at first, especially when I tried to use the
Django’s test client standalone. That wasn’t pretty and I thought all was lost.
Persistence led me to Ian Bicking’s WebTest. It’s a fairly simple library to do
web testing. For instance: go to this URL, click on this button, and I should
see “X”.

With Lettuce and WebTest in hand, I knew it would be feasible to use the two
together. I just had to figure out how.

Writing the features is easy. The hard part was getting steps.py to use WebTest
so I can interact with my WSGI app just like a browser would:

    from lettuce import * from webtest import TestApp
    
    @before.all def set_browser(): world.browser = TestApp(myapp)
    
    @step(u'Given I am a visitor') def given_i_am_a_visitor(step): pass
    
    @step(u'When I access the url "(.*)"') def access_url(step, url):
    world.response = world.browser.get(url)
    
    @step(u'Then I should see "(.*)"') def i_should_see(step, text): text in
    world.response

It’s simple, really. The only trickery was to use the @before.all decorator to
set the world browser as WebTest’s TestApp. From that point on, I can use
WebTest like normal.

Hope this helps someone out there!

