// Start out by getting any prices saved in local storage.
chrome.storage.local.get(['btc_prices'], function(result) {
    if (!result.hasOwnProperty('btc_prices'))
        result.btc_prices = {};

    // The cache object with any saved bitcoin prices.
    var btcPrices = result.btc_prices;

    var now = new Date();

    // The API needs a the date formatted as DD-MM-YYYY, also using this format when saving price in local storage.
    var dateStringToday = getDateString(now);

    // Always get today's price so we can use it to calculate percent change (and possibly display it).
    getBitcoinPriceCurrent().then(priceToday => {
        // Listen for changes to the DOM. Twitter uses a lot of ajax content loading.
        window.addEventListener("DOMNodeInserted", (event) => {
            // Find the date span. The query selector narrows down the avaiable elements.
            let span = event.relatedNode.querySelector("[data-testid='primaryColumn'] [data-testid='tweet'] a[href*='/status/'] span");

            if (span) {
                // Found a possible date span.
                let spanText = span.innerText;
                let stamp = Date.parse(spanText.replace(String.fromCharCode(183), ''));

                // If the span text is a date... [note: this works with US English dates such as 'Nov 12, 2013', but other languages may not work]
                if (isNaN(stamp) === false) {
                    let dateTime = new Date(stamp);
                    let dateString = getDateString(dateTime); // API friendly date string

                    if (dateString === dateStringToday) {
                        // Tweet date is same as today so we can use today's price already retrieved, no additional API call needed.
                        console.log("Using bitcoin price from today. [" + priceToday + "]");
                        // Display the price.
                        updateSpan(span, priceToday, priceToday);
                    } else if (btcPrices[dateString]) {
                        // The price was already retrieved at some point and saved in local storage, no additional API call needed.
                        console.log("Using bitcoin price from local storage. [" + btcPrices[dateString] + "]");
                        // Display the price.
                        updateSpan(span, btcPrices[dateString], priceToday);
                    } else {
                        // This is the first time this price has been seen, retrieve from API.
                        getBitcoinPrice(dateString).then(price => {
                            // Update the cache object before saving.
                            btcPrices[dateString] = price;

                            // Store price data in local storage.
                            chrome.storage.local.set({'btc_prices': btcPrices}, function() {
                                console.log("Using bitcoin price from coingecko. [" + price + "]");
                                // Display the price.
                                updateSpan(span, price, priceToday);
                            });
                        }).catch(console.log);
                        
                    }
                }
            }
        });
    }).catch(console.log);
});

// Inserts the bitcoin price and percentage change in the datetime span.
function updateSpan(span, price, priceToday) {
    if (span.getAttribute("data-btcprice") === null){
        let origText = span.innerText;

        // Get a nicely formatted currency string (sorry, only US is supported at this time).
        let usdFormatted = price.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

        // Get the percent change.
        let percentChange = (priceToday - price) / price * 100;

        let percentChangeClass = "";
        let percentChangeFormatted = "";

        // Determine the css class and formatted text.
        if (percentChange == 0) {
            percentChangeClass = "percent-change-nochange";
            percentChangeFormatted = "0%";
        } else if (percentChange > 0) {
            percentChangeClass = "percent-change-increase";
            percentChangeFormatted = percentChange.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%';
        } else {
            percentChangeClass = "percent-change-decrease";
            percentChangeFormatted = percentChange.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%';
        }

        // Create a span for percentage change.
        let percentChangeSpan = '<span class="' + percentChangeClass + '">' + percentChangeFormatted + '</span>';

        // Set the span html.
        span.innerHTML = origText + '&nbsp;(<span class="bitcoin-price">1&#8383;=' + usdFormatted + '</span>&nbsp;' + percentChangeSpan + ')';

        span.setAttribute("data-btcprice", price);
    }
}

// Formats a date as DD-MM-YYYY, which is required for the coingecko API.
function getDateString(dateTime) {
    return ('' + (dateTime.getDate() + 100)).substr(1)
        + '-' + ('' + (dateTime.getMonth() + 101)).substr(1)
        + '-' + dateTime.getFullYear();
}

// Executes a http request to the coingecko API to get the bitcoin price.
function getBitcoinPrice(dateString) {
    return new Promise((resolve, reject) => {
        let url = 'https://api.coingecko.com/api/v3/coins/bitcoin/history?date=' + dateString + '&localization=en';

        fetch(url).then(r => r.text()).then(res => {
            let data = JSON.parse(res);
            let price = data.market_data.current_price.usd;
            resolve(price);
        }).catch(reject);
    });
}

function getBitcoinPriceCurrent() {
    return new Promise((resolve, reject) => {
        let url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=true'

        fetch(url).then(r => r.text()).then(res => {
            let data = JSON.parse(res);
            let price = data.bitcoin.usd;
            let lastUpdatedAt = new Date(data.bitcoin.last_updated_at * 1000);
            console.log('Current bitcoin price: ' + price + ', as of ' + lastUpdatedAt);
            resolve(price);
        }).catch(reject);
    });
}
