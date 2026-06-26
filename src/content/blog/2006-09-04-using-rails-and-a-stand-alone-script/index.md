---
title: Using Rails and a stand-alone script
date: '2006-09-04'
tags:
  - programming
  - rubyonrails
  - webdev
---

A challenge was presented to me with my most recent project. Setup a script to run nightly (by a cronjob) to retrieve records for a past days orders. With these orders, generate an Excel spreadsheet followed by an email with this spreadsheet attached. I accomplished this with a lot of trial and error and I’m going to present the code for which you can do the same when/if you need to. Info was scarce on the web on how to do exactly what I nedeed to do, so hopefully this will enlighten some lucky folks out there. Ha! As always, this probably can be improved quite a bit, I’m just glad to have it done and working! (Client happy..)

Keep in mind that you need the spreadsheet-excel gem. Install it via:

```
gem install spreadsheet-excel
```

Here goes:

Hopefully this will get you started.
