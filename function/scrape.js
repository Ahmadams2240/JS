const fetch = require('node-fetch')
const axios = require("axios");
//const got = require("got");
const cheerio = require("cheerio");
const { sizeFormatter } = require('human-readable')
const proxyHost = "111.225.152.37";
const proxyPort = "8089";
const axiosInstance = axios.create({
	proxy: {
		host: proxyHost,
		port: proxyPort,
	},
});
const baseURL = "https://fdownloader.net/id";
const apiURL = "https://v3.fdownloader.net/api/ajaxSearch?lang=en";

const formatSize = sizeFormatter({
    std: 'JEDEC',
    decimalPlaces: 2,
    keepTrailingZeroes: false,
    render: (literal, symbol) => `${literal} ${symbol}B`
})

async function twiterdl(id) {
    try {
        const url = 'https://ssstwitter.com';
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const form = $('form.pure-form.pure-g.hide-after-request');
        const includeVals = form.attr('include-vals');
        const ttMatch = includeVals.match(/tt:'([^']+)'/);
        const tsMatch = includeVals.match(/ts:(\d+)/);

        if (!ttMatch || !tsMatch) throw new Error('Cannot find tt or ts values.');

        const tt = ttMatch[1];
        const ts = tsMatch[1];

        const postData = new URLSearchParams({
            tt: tt,
            ts: ts,
            source: 'form',
            id: id,
            locale: 'en'
        });

        const postResponse = await axios.post(url, postData.toString(), {
            headers: {
                'HX-Request': 'true',
                'HX-Target': 'target',
                'HX-Current-URL': 'https://ssstwitter.com/en',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
                'Referer': 'https://ssstwitter.com/result_normal'
            }
        });

        const $result = cheerio.load(postResponse.data);
        const downloads = [];
        $result('.result_overlay a.download_link').each((i, element) => {
            const text = $(element).text().trim();
            const url = $(element).attr('href');
            if (url) {
                downloads.push({ text, url });
            }
        });

        const data = {
            title: $result('.result_overlay h2').text().trim(),
            downloads: downloads
        };

        return {status: true, data};
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

async function mediafireDl(url) {
    try {
        const res = await fetch(url);
        const $ = cheerio.load(await res.text());
        const link = $('a#downloadButton').attr('href');
        const [nama, mime, size] = [
            link.split('/').pop().trim(),
            link.split('.').pop().trim(),
            $('a#downloadButton').text().replace(/Download|\(|\)|\n|\s+/g, '').trim()
        ];
        return [{
            nama,
            mime,
            size,
            link
        }];
    } catch (error) {
        console.error(error);
        throw new Error("Error Gan");
    }
}

async function stickerSearch(querry) {
    const link = await axios.get(`https://getstickerpack.com/stickers?query=${querry}`);
    const $ = cheerio.load(link.data)
    let sticker1 = {
        sticker: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(1) > a > div > img').attr('src'),
        nama: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(1) > a > div > span.title').text().trim(),
        creator: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(1) > a > div > span.username').text().trim()
    }
    let sticker2 = {
        sticker: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(2) > a > div > img').attr('src'),
        nama: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(2) > a > div > span.title').text().trim(),
        creator: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(2) > a > div > span.username').text().trim()
    }
    let sticker3 = {
        sticker: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(3) > a > div > img').attr('src'),
        nama: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(3) > a > div > span.title').text().trim(),
        creator: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(3) > a > div > span.username').text().trim()
    }
    let sticker4 = {
        sticker: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(4) > a > div > img').attr('src'),
        nama: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(4) > a > div > span.title').text().trim(),
        creator: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(4) > a > div > span.username').text().trim()
    }
    let sticker5 = {
        sticker: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(5) > a > div > img').attr('src'),
        nama: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(5) > a > div > span.title').text().trim(),
        creator: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(5) > a > div > span.username').text().trim()
    }
    let sticker6 = {
        sticker: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(6) > a > div > img').attr('src'),
        nama: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(6) > a > div > span.title').text().trim(),
        creator: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(6) > a > div > span.username').text().trim()
    }
    let sticker7 = {
        sticker: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(7) > a > div > img').attr('src'),
        nama: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(7) > a > div > span.title').text().trim(),
        creator: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(7) > a > div > span.username').text().trim()
    }
    let sticker8 = {
        sticker: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(8) > a > div > img').attr('src'),
        nama: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(8) > a > div > span.title').text().trim(),
        creator: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(8) > a > div > span.username').text().trim()
    }
    let sticker9 = {
        sticker: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(9) > a > div > img').attr('src'),
        nama: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(9) > a > div > span.title').text().trim(),
        creator: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(9) > a > div > span.username').text().trim()
    }
    let sticker10 = {
        sticker: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(10) > a > div > img').attr('src'),
        nama: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(10) > a > div > span.title').text().trim(),
        creator: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(10) > a > div > span.username').text().trim()
    }
    let sticker11 = {
        sticker: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(11) > a > div > img').attr('src'),
        nama: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(11) > a > div > span.title').text().trim(),
        creator: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(11) > a > div > span.username').text().trim()
    }
    let sticker12 = {
        sticker: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(12) > a > div > img').attr('src'),
        nama: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(12) > a > div > span.title').text().trim(),
        creator: $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(12) > a > div > span.username').text().trim()
    }
    let stickerlop = [
        $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(1) > a > div > img').attr('src'),
        $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(2) > a > div > img').attr('src'),
        $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(3) > a > div > img').attr('src'),
        $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(4) > a > div > img').attr('src'),
        $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(5) > a > div > img').attr('src'),
        $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(6) > a > div > img').attr('src'),
        $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(7) > a > div > img').attr('src'),
        $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(8) > a > div > img').attr('src'),
        $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(9) > a > div > img').attr('src'),
        $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(10) > a > div > img').attr('src'),
        $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(11) > a > div > img').attr('src'),
        $('#stickerPacks').find('div > div:nth-child(3) > div:nth-child(12) > a > div > img').attr('src')
    ]
    let data = {
        sticker: stickerlop,
        sticker1,
        sticker2,
        sticker3,
        sticker4,
        sticker5,
        sticker6,
        sticker7,
        sticker8,
        sticker9,
        sticker10,
        sticker11,
        sticker12
    }
    return data
}

async function snapsave(vid_url) {
    try {
        const data = {
            url: vid_url
        };
        const searchParams = new URLSearchParams();
        searchParams.append('url', data.url);
        const response = await fetch('https://facebook-video-downloader.fly.dev/app/main.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: searchParams.toString(),
        });
        const responseData = await response.json();
        return responseData;
    } catch (e) {
        return null;
    }
}

async function text2img(prompt) {
    const nganuApi = "https://ai-api.magicstudio.com/api/ai-art-generator";

    const body = `prompt=${encodeURIComponent(prompt)}`;

    try {
        const nganu = await fetch(nganuApi, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body
        });

        if (nganu.ok) {
            const imageBuffer = await nganu.buffer();
            return imageBuffer;
        } else {
            const nganuError = await nganu.text();
            throw new Error(`Gagal mengambil gambar. Kode status: ${nganu.status}, Error: ${nganuError}`);
        }
    } catch (error) {
        throw error;
    }
}

async function snapsavev2(url) {
	try {
        const {
            data
        } = await axios(baseURL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0",
            },
            data: new URLSearchParams(
                Object.entries({
                    recaptchaToken: "",
                    q: url,
                    t: "media",
                    lang: "en",
                })
            ),
        });
        const $ = cheerio.load(data);
        const script = $("body").find("script").text().trim();
        const k_token = script.split("k_token = ")[1].split(";")[0];
        const k_exp = script.split("k_exp = ")[1].split(";")[0];
        const {
            data: apiData
        } = await axios(apiURL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0",
            },
            data: new URLSearchParams(
                Object.entries({
                    k_exp,
                    k_token,
                    q: url,
                    lang: "en",
                    web: "fdownloader.net",
                    v: "v2",
                    w: "",
                })
            ),
        });
        const $api = cheerio.load(apiData.data);
        const result = [];
        const duration = $api('div.clearfix > p').text().trim();
        $api('div.tab__content')
            .find('tbody > tr')
            .each((index, element) => {
                const quality = $api(element).find('td.video-quality').text();
                const videoUrl = $api(element).find('td > a').attr('href');
                if (quality && videoUrl) {
                    result.push({
                        quality,
                        url: videoUrl,
                    });
                }
            });
        return {
            duration,
            result,
        };
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function youtubedlv2(url) {
  const response = await fetch('https://yt5s.com/en32', {
    method: 'GET',
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      cookie: '__cflb=04dToSoFRg9oqH9pYF2En9gKJK4fe8D9TcYtUD6tYu; _ga=GA1.2.1350132744.1641709803; _gid=GA1.2.1492233267.1641709803; _gat_gtag_UA_122831834_4=1',
    }
  });
  const html = await response.text();
  const urlAjax = (/k_url_search="(.*?)"/.exec(html) || ['', ''])[1];
  const urlConvert = (/k_url_convert="(.*?)"/.exec(html) || ['', ''])[1];
  const params = {
    q: url,
    vt: 'home'
  };
  const ajaxResponse = await fetch(urlAjax, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'origin': 'https://yt5s.com',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      'cookie': '__cflb=04dToSoFRg9oqH9pYF2En9gKJK4fe8D9TcYtUD6tYu; _ga=GA1.2.1350132744.1641709803; _gid=GA1.2.1492233267.1641709803; _gat_gtag_UA_122831834_4=1',
    },
    body: new URLSearchParams(Object.entries(params))
  });
  const json = await ajaxResponse.json();
  if (!json.links) return {
    status: false,
    statusText: json.mess,
  }
  const video = {}; // slice -5 to limit quality max 720p
  ((Object.values(json.links.mp4)).slice(-5)).forEach(({ k, size }) => {
    video[k] = {
      quality: k,
      fileSizeH: size,
      fileSize: parseFloat(size) * (/MB$/.test(size) ? 1000 : 1),
      download: convertv2.bind(null, urlConvert, json.vid, 'mp4', k, json.token, parseInt(json.timeExpires), json.fn)
    };
  });
  const audio = {};
  Object.values(json.links.mp3).forEach(({ key, size }) => {
    audio[key] = {
      quality: key,
      fileSizeH: size,
      fileSize: parseFloat(size) * (/MB$/.test(size) ? 1000 : 1),
      download: convertv2.bind(null, urlConvert, json.vid, 'mp3', key.replace(/kbps/i, ''), json.token, parseInt(json.timeExpires), json.fn)
    };
  });
  const res = {
    status: true,
    statusText: json.mess,
    id: json.vid,
    title: json.title,
    thumbnail: `https://i.ytimg.com/vi/${json.vid}/0.jpg`,
    video,
    audio
  };
  return res;
}

async function convertv2(url, v_id, ftype, fquality, token, timeExpire, fname) {
  try {
    const params = {
      v_id,
      ftype,
      fquality,
      token,
      timeExpire,
      client: 'yt5s.com'
    };

    const resServer = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        origin: 'https://yt5s.com',
        referer: 'https://yt5s.com/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        'X-Requested-Key': 'de0cfuirtgf67a'
      },
      body: new URLSearchParams(params)
    });

    const resServerJson = await resServer.json();
    const server = resServerJson.c_server;

    if (!server && ftype === 'mp3') {
      return server || resServerJson.d_url || '';
    }

    const payload = {
      v_id,
      ftype,
      fquality,
      fname,
      token,
      timeExpire
    };

    const results = await fetch(`${server}/api/json/convert`, {
      method: 'POST',
      body: new URLSearchParams(payload)
    });

    const resultsJson = await results.json();
    if (resultsJson.statusCode === 200) {
      return resultsJson.result;
    } else {
      console.log(resultsJson);
    }
  } catch (error) {
    console.error(error);
  }
}

async function jadwalSholat(kode_daerah) {
try {
const response = await axios.get('https://jadwalsholat.org/jadwal-sholat/daily.php?id='+ kode_daerah);
const html = response.data; 
const $ = cheerio.load(html);
let daerah = $('h1').text().trim();
let bulan = $('h2').text().trim(); 
const row = $('tr.table_light, tr.table_dark').find('td'); 
const tanggal = $(row[0]).text().trim();
const imsyak = $(row[1]).text().trim();
const shubuh = $(row[2]).text().trim();
const terbit = $(row[3]).text().trim();
const dhuha = $(row[4]).text().trim();
const dzuhur = $(row[5]).text().trim();
const ashr = $(row[6]).text().trim();
const maghrib = $(row[7]).text().trim();
const isya = $(row[8]).text().trim();
return {
bulan,
tanggal, 
imsyak, 
shubuh,
terbit, 
dhuha, 
dzuhur, 
ashr, 
maghrib, 
isya
};
} catch (error) {
console.error('Error scraping:', error);
return {
status: 'error',
error: error.message
};
}
}

async function findKodeDaerah(nama_daerah) {
try {
const response = await axios.get('https://jadwalsholat.org/jadwal-sholat/monthly.php');
const html = response.data;
const $ = cheerio.load(html);
const options = $('select[name="kota"] option');
const kodeDaerah = {};
options.each((index, element) => {
const kode = $(element).attr('value');
const nama = $(element).text().trim();
kodeDaerah[nama.toLowerCase()] = kode;
});
const lowercaseRegion = nama_daerah.toLowerCase();
if (kodeDaerah.hasOwnProperty(lowercaseRegion)) {
return {
status: 'ok',
creator: 'SatganzDevs',
kode_daerah: kodeDaerah[lowercaseRegion]
};
} else {
return {
status: 'error',
message: 'Region not found'
};
}
} catch (error) {
console.error('Error scraping:', error);
return {
status: 'error',
error: error.message
};
}
}

async function downloadCapcut(Url) {
    try {
        const token = Url.match(/\d+/)[0];
        const response = await fetch(`https://ssscapcut.com/api/download/${token}`, {
            method: "GET",
            headers: {
                "Accept": "/",
                "User-Agent": "Mozilla/5.0 (Linux; Android 13; CPH2217 Build/TP1A.220905.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/110.0.5481.153 Mobile Safari/537.36",
                "X-Requested-With": "acr.browser.barebones",
                "Sec-Fetch-Site": "same-origin",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Dest": "empty",
                "Referer": "https://ssscapcut.com/",
                "Accept-Encoding": "gzip, deflate",
                "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
                "Cookie": "sign=2cbe441f7f5f4bdb8e99907172f65a42; device-time=1685437999515"
            }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function searchTemplates(s) {
    try {
        const response = await got("https://capcut-templates.com/?s=" + s);
        const html = response.body;
        const $ = cheerio.load(html);
        const elements = $("main#main div.ct-container section div.entries article");

        const detailPromises = elements.map(async (index, element) => {
            const link = $(element).find("a.ct-image-container").attr("href");
            const detail = await detailTemplates(link);
            const imageSrc = $(element).find("img").attr("src");
            const title = $(element).find("h2.entry-title a").text().trim();

            return {
                id: $(element).attr("id"),
                link,
                detail,
                imageSrc,
                title
            };
        }).get();

        return Promise.all(detailPromises);
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function detailTemplates(link) {
    try {
        const response = await got(link);
        const html = response.body;
        const $ = cheerio.load(html);
        const elements = $("main#main div.ct-container-full article");

        return elements.map((index, element) => ({
            id: $(element).attr("id"),
            time: $("main#main").find("time.ct-meta-element-date").text().trim(),
            template: $(element).find(".wp-block-buttons .wp-block-button a").attr("data-template-id"),
            link: $(element).find("a.wp-block-button__link").attr("href"),
            imageSrc: $(element).find("video").attr("poster"),
            title: $(element).find("h2").text().trim(),
            videoSrc: $(element).find("video source").attr("src"),
            description: $(element).find(".entry-content p").text().trim()
        })).get();
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function GoogleImage(query) {
    const response = await fetch(`https://www.google.com/search?q=${query}&tbm=isch`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
        },
    });

    const data = await response.text();

    const $ = cheerio.load(data);
    const pattern =
        /\[1,\[0,"(?<id>[\d\w\-_]+)",\["https?:\/\/(?:[^"]+)",\d+,\d+\]\s?,\["(?<url>https?:\/\/(?:[^"]+))",\d+,\d+\]/gm;
    const matches = $.html().matchAll(pattern);
    const decodeUrl = (url) => decodeURIComponent(JSON.parse(`"${url}"`));
    return [...matches]
        .map(({
            groups
        }) => decodeUrl(groups?.url))
        .filter((v) => /.*\.jpe?g|png$/gi.test(v));
}

async function GDriveDl(url) {
    let id, res = {
        "error": true
    }
    if (!(url && url.match(/drive\.google/i))) return res
    try {
        id = (url.match(/\/?id=(.+)/i) || url.match(/\/d\/(.*?)\//))[1]
        if (!id) throw 'ID Not Found'
        res = await axios(`https://drive.google.com/uc?id=${id}&authuser=0&export=download`, {
            method: 'post',
            headers: {
                'accept-encoding': 'gzip, deflate, br',
                'content-length': 0,
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'origin': 'https://drive.google.com',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
                'x-client-data': 'CKG1yQEIkbbJAQiitskBCMS2yQEIqZ3KAQioo8oBGLeYygE=',
                'x-drive-first-party': 'DriveWebUi',
                'x-json-requested': 'true'
            }
        })
        let {
            fileName,
            sizeBytes,
            downloadUrl
        } = JSON.parse((await res.data).slice(4))
        if (!downloadUrl) throw 'Link Download Limit!'
        let data = await fetch(downloadUrl)
        if (data.status !== 200) return data.statusText
        return {
            downloadUrl,
            fileName,
            fileSize: formatSize(sizeBytes),
            mimetype: data.headers.get('content-type')
        }
    } catch (e) {
        console.log(e)
        return res
    }
}

async function capcutdl(url) {
    return new Promise(async (resolve, reject) => {
      axios
        .get("https://ssscap.net/api/download/get-url?url=" + url, {
          headers: {
            cookie:
              "sign=94b3b2331a3515b3a031f161e6ce27a7; device-time=1693144685653",
          },
        })
        .then((res) => {
          let tes = res.data.url;
          const parsedUrl = new URL(tes);
          let id = parsedUrl.searchParams.get("template_id");

          axios("https://ssscap.net/api/download/" + id, {
            headers: {
              cookie:
                "sign=4b0366645cd40cbe10af9aa18331a488; device-time=1693145535913",
            },
          }).then((yanz) => {
            resolve(yanz.data);
          });
        });
    });
  };

async function scsearch(query) {
  let base = `https://m.soundcloud.com`;
  let res = await axios.get(`${base}/search?q=${encodeURIComponent(query)}`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; evc-batch/2.0)" },
  });
  let $ = cheerio.load(res.data);
  let result = [];
  $("div > ul > li > div").each(function (a, b) {
    let title = $(b).find("a").attr("aria-label").trim();
    let link = base + $(b).find("a").attr("href").trim();
    let thumb = $(b)
      .find("a > div > div > div > picture > img")
      .attr("src")
      .trim();
    let artist = $(b).find("a > div > div > div").eq(1).text();
    let views = $(b).find("a > div > div > div > div > div").eq(0).text();
    let timestamp = $(b).find("a > div > div > div > div > div").eq(1).text();
    let release = $(b).find("a > div > div > div > div > div").eq(2).text();
    result.push({ title, url: link, thumb, artist, views, release, timestamp });
  });
  return { status: res.status, creator: "Caliph", result };
}

async function igdown(q) {
    try {
        const response = await axios.post("https://saveig.app/api/ajaxSearch", new URLSearchParams({
            q,
            t: "media",
            lang: "id"
        }));
        const html = response.data.data;
        const $ = cheerio.load(html);
        const data = $('ul.download-box li').map((index, element) => {
            const $thumb = $(element).find('.download-items__thumb img');
            const $btn = $(element).find('.download-items__btn a');
            const $options = $(element).find('.photo-option select option');
            const type = $btn.attr('onclick')?.includes('click_download_video') ? 'video' : 'image';
            return {
                type,
                thumb: $thumb.attr('src') || '',
                url: $btn.attr('href')?.replace('&dl=1', '') || '',
                quality: $options.filter(':selected').text() || '',
                options: $options.map((i, opt) => ({
                    type,
                    url: $(opt).val() || '',
                    quality: $(opt).text() || ''
                })).get()
            };
        }).get();
        const result = {
            data: data
        };
        return result;
    } catch (error) {
        console.error("Error fetching Instagram media:", error);
        return {
            error: "Failed to fetch media"
        };
    }
}

async function convertAngka(number) {
 return number.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    notation: 'compact',
    compactDisplay: 'short'
  });
}

module.exports = { convertAngka, text2img, scsearch, capcutdl, igdown, twiterdl, snapsave, GDriveDl, snapsavev2, youtubedlv2, convertv2, jadwalSholat, findKodeDaerah, downloadCapcut, searchTemplates, detailTemplates, GoogleImage, mediafireDl, stickerSearch }