import fetch from "node-fetch";
import zlib from "zlib";

export const config = {
  runtime: "nodejs20",
  maxDuration: 60
};

export default async function handler(req, res) {
  const { from, to, symbol = "NIFTY", optionType = "CE" } = req.query;
  const base = "https://www.nseindia.com";
  const apiUrl = `${base}/api/historicalOR/foCPV?from=${from}&to=${to}&instrumentType=OPTIDX&symbol=${symbol}&optionType=${optionType}`;

  try {
    // Get cookies
    const homeRes = await fetch(base, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36"
      }
    });
    const cookies = homeRes.headers.get("set-cookie");

    // Fetch with manual decompression
    const resp = await fetch(apiUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
        referer: base,
        cookie: cookies,
        accept: "application/json",
        "accept-encoding": "gzip,deflate,br"
      },
      compress: false
    });

    const buffer = await resp.arrayBuffer();
    const enc = resp.headers.get("content-encoding");
    let text;

    if (enc === "gzip") {
      text = zlib.gunzipSync(Buffer.from(buffer)).toString("utf-8");
    } else if (enc === "br") {
      text = zlib.brotliDecompressSync(Buffer.from(buffer)).toString("utf-8");
    } else {
      text = Buffer.from(buffer).toString("utf-8");
    }

    const json = JSON.parse(text);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(json);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
