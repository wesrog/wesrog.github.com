---
title: "Rails and exception_notification with McAfee's ScanAlert Subnet Masks"
date: '2009-04-26'
---

`    consider_local "64.14.3.193/26", "64.41.168.241/28", "216.35.7.96/27", "64.41.140.96/27", "216.49.80.10/32", "165.193.42.64/26", "165.193.42.128/26", "203.82.140.96/28", "210.59.224.251/32", "210.61.79.253/32", "203.66.219.16/32", "85.92.223.0/26", "217.169.58.64/26"    `

Plop that below the inclusion of the ExceptionNotifiable module and you’ll never get pesky emails from McAfee’s ScanAlert barrage.
