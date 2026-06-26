---
title: ""
date: '2008-10-02'
---

\# mass rename \*.html.erb files to \*.html.haml and remove the old \*.html.erb file  
for f in \*.erb; do html2haml -r $f ${f/.erb/}.haml; rm $f; done
