async function scrape(url) {
    console.log(`Fetching ${url}...`);
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            },
            redirect: 'follow'
        });
        const html = await res.text();
        const imageUrlMatch = html.match(/og:image"\s+content="([^"]+)"/i) || html.match(/image_src"\s+href="([^"]+)"/i);
        const nameMatch = html.match(/og:title"\s+content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
        
        console.log("Image URL:", imageUrlMatch ? imageUrlMatch[1] : 'Not found');
        console.log("Name:", nameMatch ? nameMatch[1] : 'Not found');
    } catch (e) {
        console.error("Error fetching", e);
    }
}

scrape('https://spf.shopee.com.my/1VvDCNx3Xb');
