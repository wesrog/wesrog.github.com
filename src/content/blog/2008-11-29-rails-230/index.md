---
title: Rails 2.3.0 and RouteSet#add_configuration_file
date: '2008-11-29'
tags:
  - rails
  - programming
---

I’ve moved one of our projects over to edge rails after hearing about the new
support for multiple routes files. I’ve been wanting this for a long
time. It’s pretty easy to setup too:

First, make your custom routes file in config/

#### config/routes\_custom.rb

Next, add an initializer to load that routes file on boot:

#### config/initializers/load\_custom\_routes.rb

If you clone from a master repo for custom projects, this is ideal as it won’t
muck up the core routes file annoying you with conflicts and such.
