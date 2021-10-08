window.addEventListener("DOMNodeInserted", (event) => {
    let links = event.relatedNode.querySelectorAll("div[dir='auto'] > a[role='link']");

    for (let lnk of links) {
        let href = lnk.getAttribute("href");
        if (href.match(/(.+)\/status\/(.+)/g)) {
            let span = lnk.querySelector("span");

            if (span.getAttribute("data-btcprice") === null) {
                let origText = span.innerText;
                let stamp = Date.parse(origText.replace('·', ''));

                if (isNaN(stamp) === false) {
                    span.setAttribute("data-origtext", origText);

                    // get the date string
                    let dateTime = new Date(stamp);
                    let dateString = ('' + (dateTime.getDate() + 100)).substr(1) + '-' + ('' + (dateTime.getMonth() + 101)).substr(1) + '-' + dateTime.getFullYear();
                    span.setAttribute("data-btcdate", dateString);

                    getBitcoinPrice(dateString, function(price) {
                        span.setAttribute("data-btcprice", price);
                        let usdFormatted = price.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
                        span.innerHTML = origText + '&nbsp;(1&#8383;=' + usdFormatted + ')';
                    });
                }
            }
        }
    }
});

function getBitcoinPrice(dateString, cb) {
    chrome.storage.local.get(['btc_prices'], function(result) {
        if (!result.hasOwnProperty('btc_prices'))
            result.btc_prices = {};

        var btcPrices = result.btc_prices;

        if (btcPrices[dateString]) {
            cb(btcPrices[dateString]);
        } else {
            let url = 'https://api.coingecko.com/api/v3/coins/bitcoin/history?date=' + dateString + '&localization=en';

            fetch(url).then(r => r.text()).then(res => {
                let data = JSON.parse(res);
                let price = data.market_data.current_price.usd;
                btcPrices[dateString] = price;
                chrome.storage.local.set({'btc_prices': btcPrices}, function() {
                    cb(price);
                });
            });
        }
    });
}
