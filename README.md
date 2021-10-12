# chrome-tweet-bitcoin-price

Inspired by this @bitstein tweet: https://twitter.com/bitstein/status/1446487090615754754

This Chrome extension shows the USD price of Bitcoin, and the percentage change from the current price, when a tweet was sent. For now you have to load it in developer mode because I haven't published it on the Chrome Web Store yet.

### Known Issues

* The only language supported is English. The code relies on being able to parse the date string found in the tweet with the JavaScript function Date.parse(). This works well for the English date format used by Twitter, but may not work for other languages.
