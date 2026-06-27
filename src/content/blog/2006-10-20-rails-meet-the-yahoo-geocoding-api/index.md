---
title: "Rails, meet the Yahoo! Geocoding API"
date: '2006-10-20'
tags:
  - rubyonrails
  - programming
  - webdev
---

One thing’s for sure: consuming web services in Rails is not very well documented. There are a few ways of going about it, but the easiest way uses REST.

**Problem:** provide a way to look up a zip code to find a city. With the returned city, search the local database for a match. Then output accordingly.

**Solution:** Ruby on Rails with the REXML library.

Forget SOAP and XML-RPC, get REST’ed! I will show you how I went about pulling a city by zip code, then using the returned city in a query on my local database.

-   Get a [Yahoo! Developer Application ID](http://api.search.yahoo.com/webservices/register_application).
-   Open up the [Yahoo! Geocoding API docs](http://developer.yahoo.com/maps/rest/V1/geocode.html) for reference.
-   Use the following code in your
    
    controller.rb
    
    file.

```ruby
# welcome_controller.rb
def city
  appid = "myYahooDeveloperAppID"
  url = "http://api.local.yahoo.com/MapsService/V1/geocode?appid=#{appid}&location=90210"
  @results = REXML::Document.new(Net::HTTP.get(URI(url)))
end
```

```ruby
# views/welcome/city.rhtml
@results.root.each_element { |city| "#{city[3].text}" }
```

There you go. Can you believe it’s that easy?
