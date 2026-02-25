export default async function handler(req, res) {
    const { marketplace, query } = req.query;
    
    if (!marketplace || !query) {
        return res.status(400).json({ error: 'Missing marketplace or query' });
    }
    
    try {
        let results = [];
        
        if (marketplace === 'carousell') {
            results = await scrapeCarousell(query);
        } else if (marketplace === 'shopee') {
            results = await scrapeShopee(query);
        } else if (marketplace === 'mudah') {
            results = await scrapeMudah(query);
        }
        
        res.status(200).json({ results, marketplace, query });
    } catch (error) {
        res.status(500).json({ error: 'Failed to scrape: ' + error.message });
    }
}

async function scrapeCarousell(query) {
    try {
        const url = `https://www.carousell.com/api/3.0/search/filter/?country=SG&currency=SGD&query=${encodeURIComponent(query)}&size=20`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
        });
        const data = await response.json();
        const results = [];
        if (data.data && data.data.results) {
            data.data.results.forEach(item => {
                results.push({
                    title: item.listingTitle || item.title || 'No title',
                    price: item.price ? 'RM' + item.price.amount : 'N/A',
                    link: 'https://www.carousell.com/p/' + (item.listingId || item.id),
                    marketplace: 'carousell'
                });
            });
        }
        return results.length > 0 ? results : getDemoData(query, 'carousell');
    } catch (e) {
        return getDemoData(query, 'carousell');
    }
}

async function scrapeShopee(query) {
    try {
        const url = `https://shopee.sg/api/v4/search/search_items?by=relevancy&keyword=${encodeURIComponent(query)}&limit=20`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://shopee.sg/' }
        });
        const data = await response.json();
        const results = [];
        if (data.items) {
            data.items.forEach(item => {
                const price = item.price ? (item.price / 100000).toFixed(2) : 'N/A';
                results.push({
                    title: item.title || 'No title',
                    price: 'RM' + price,
                    link: 'https://shopee.sg/search?keyword=' + encodeURIComponent(query),
                    marketplace: 'shopee'
                });
            });
        }
        return results.length > 0 ? results : getDemoData(query, 'shopee');
    } catch (e) {
        return getDemoData(query, 'shopee');
    }
}

async function scrapeMudah(query) {
    try {
        const url = `https://www.mudah.my/api/v1/search?query=${encodeURIComponent(query)}&limit=20`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
        });
        const data = await response.json();
        const results = [];
        const items = data.ads || data.results || [];
        items.forEach(item => {
            results.push({
                title: item.title || item.name || 'No title',
                price: item.price ? 'RM' + item.price : 'N/A',
                link: 'https://www.mudah.my' + (item.url_path || ''),
                marketplace: 'mudah'
            });
        });
        return results.length > 0 ? results : getDemoData(query, 'mudah');
    } catch (e) {
        return getDemoData(query, 'mudah');
    }
}

function getDemoData(query, marketplace) {
    const basePrice = Math.floor(Math.random() * 500) + 200;
    return [
        { title: `${query} - Good Condition`, price: 'RM' + basePrice, link: '#', marketplace: marketplace + ' (demo)' },
        { title: `${query} - Like New`, price: 'RM' + (basePrice + 150), link: '#', marketplace: marketplace + ' (demo)' },
        { title: `${query} - Bargain Price`, price: 'RM' + (basePrice - 50), link: '#', marketplace: marketplace + ' (demo)' }
    ];
}
