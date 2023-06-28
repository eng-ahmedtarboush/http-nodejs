const app = require('express')();
import { post } from 'axios';

import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { get } from 'https';
require('dotenv').config();


function randomStr(length) {
  const bytes = randomBytes(Math.ceil(length / 2));
  return bytes.slice(0, Math.ceil(length / 2)).toString('hex').slice(0, length);
}

function encryptText(text) {
  const key = randomBytes(32);
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encryptedText = cipher.update(text, 'utf8', 'base64');
  encryptedText += cipher.final('base64');
  const keyHex = key.toString('hex');
  const ivHex = iv.toString('hex');
  encryptedText = randomStr(103) + keyHex + encryptedText + ivHex + randomStr(50);
  return encryptedText;
}

function decryptText(encryptedText) {
  const keyHex = encryptedText.substring(103, 103 + 64);
  const ivHex = encryptedText.substring(encryptedText.length - 32 - 50, encryptedText.length - 50);
  encryptedText = encryptedText.substring(103 + 64, encryptedText.length - 32 - 50);
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

encryptUrl = url => {
  return encodeURIComponent(encryptText(randomStr(100) + encryptText(randomStr(500) + encryptText(encodeURIComponent(url)) + randomStr(130)) + randomStr(50)));
}

decryptUrl = url => {
  url = decodeURIComponent(url);

  url = decryptText(url);
  url = url.substring(100, url.length - 50);

  url = decryptText(url);
  url = url.substring(500, url.length - 130);

  url = decryptText(url);
  return decodeURIComponent(url);
}

requestFromVideoTag = () => {
  return (
    typeof req.headers.referer !== 'undefined' &&
    typeof req.headers.range !== 'undefined' &&
    (req.headers['sec-fetch-dest'] === 'video')
  );
}

requestFromIframeTag = () => {
  return (
    typeof req.headers.referer !== 'undefined' &&
    (req.headers['sec-fetch-dest'] === 'iframe' || req.headers['sec-fetch-dest'] === 'frame' || req.headers['sec-fetch-dest'] === 'embed')
  );
}

streamReader = async (fileUrl, mime = 'text/event-stream') => {
  get(fileUrl, { headers: req.headers }, (response) => {
    response.headers['content-type'] = mime;
    res.writeHead(206, response.headers);
    response.pipe(res);
  });
}

function getVideoInfo(videoId) {
  const data = {
    context: {
      client: {
        hl: 'en',
        clientName: 'WEB',
        clientVersion: '2.20210721.00.00',
        clientFormFactor: 'UNKNOWN_FORM_FACTOR',
        clientScreen: 'WATCH',
        mainAppWebInfo: {
          graftUrl: `/watch?v=${videoId}`,
        },
      },
      user: {
        lockedSafetyMode: false,
      },
      request: {
        useSsl: true,
        internalExperimentFlags: [],
        consistencyTokenJars: [],
      },
    },
    videoId: videoId,
    playbackContext: {
      contentPlaybackContext: {
        vis: 0,
        splay: false,
        autoCaptionsDefaultOn: false,
        autonavState: 'STATE_NONE',
        html5Preference: 'HTML5_PREF_WANTS',
        lactMilliseconds: '-1',
      },
    },
    racyCheckOk: false,
    contentCheckOk: false,
  };

  return post('https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8', data, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => response.data)
    .catch(error => {
      console.log('Error:', error.message);
      throw error;
    });
}
async function getYoutubeVideoUrl(videoId) {
  const videoData = { 'videos': {}, 'audio': {} };
  let formats = await getVideoInfo(videoId)
  formats = formats.streamingData ? formats.streamingData.formats : [];
  formats.forEach(format => {
    if (format.mimeType.startsWith('video/mp4') && format.url) {
      videoData['videos'][format.qualityLabel] = format.url;
    } else if (format.mimeType.startsWith('audio') && format.url) {
      videoData['audio'].push(format.url);
    }
  });
  return videoData;
}

app.use((request, response, next) => {
  req = request;
  res = response;
  next();
});

app.get('/video', async (req, res) => {
  if (typeof req.query.key === 'undefined') {
    res.status(404).send('Not Found');
    return;
  }
  const url = decryptUrl(req.query.key);
  if (requestFromVideoTag() || requestFromIframeTag()) {
    await streamReader(url, 'plain/text');
  } else {
    res.status(200)
      .send(`
                <html>
                    <head>
                        <title>Zircon High Security File</title>
                        <style>
                            body {
                                display: flex;
                                flex-direction: column;
                                justify-content: center;
                                align-items: center;
                                width: 100vw;
                                height: 100vh;
                                padding: 0;
                                margin: 0;
                                box-sizing: border-box;
                                text-align: center;
                                font-size: 2rem;
                            }
                        </style>
                    </head>
                    <body dir="auto">
                        <h1>عييييييييييييييييييب</h1>
                        <h2>
                            عيب يا بابا اللي انت بتعمله دة
                            <br>
                            عيب ياحبيبي
                            <br>
                            باباك ومامتك مقالولكش إن دي سرقة؟
                        </h2>

                    </body>
                </html>
            `);
  }
});

app.get('/:url?', async (req, res) => {
  url = '';
  try {
    if (!req.query.url) {
      req.params.url = req.params.url || "S56n0p1_OOU";
      videosUrls = await getYoutubeVideoUrl(req.params.url);
      videosUrls = videosUrls['videos']
      url = videosUrls[Object.keys(videosUrls)[0]] || req.params.url || req.query.url;
    } else {
      url = req.query.url;
      videosUrls = await getYoutubeVideoUrl(url);
      videosUrls = videosUrls['videos']
      url = videosUrls[Object.keys(videosUrls)[0]] || req.query.url;
    }
  } catch (error) {
    url = req.query.url || req.params.url;
  }
  res.send(`
        <html>
            <head>
                <title>Test Open Video With Security</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        max-width: 100vw;
                        padding: 0;
                        margin: 0;
                        box-sizing: border-box;
                        text-align: center;
                        font-size: 2rem;
                    }
                    a {
                        text-decoration: none;
                        color: #fff;
                        background-color: #000;
                        padding: 1rem;
                        border-radius: 1rem;
                        margin: 1rem;
                        font-size: x-large;
                    }
                    video{
                        max-width: 100vw;
                        height: auto;
                    }
                </style>
            </head>
            <body dir="auto">
                <h3>Test Open Video With Security</h3>
                <a target="_blank" href="/video?key=${encryptUrl(url)}">Open Video</a>
                <video controls="">
                    <source src="/video?key=${encryptUrl(url)}" type="video/mp4">
                </video>
            </body>
        </html>
    `);
});

app.listen({ port: process.env.PORT || 3000, Host: "0.0.0.0" }, () => {
  console.log('Listening on port http://127.0.0.1:' + process.env.PORT);
});