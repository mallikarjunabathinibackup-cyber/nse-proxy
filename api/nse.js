// /api/nse.js
import fetch from "node-fetch";
import zlib from "zlib";

export const config = {
  runtime: "nodejs20",
  maxDuration: 60 // allow up to 60 s
};

export default async function handler(req, res) {
  const { from, to, symbol = "NIFTY", optionType = "CE" } = req.query;
  const base = "https://www.nseindia.com";
  const apiUrl = `${base}/api/historicalOR/foCPV?from=${from}&to=${to}&instrumentType=OPTIDX&symbol=${symbol}&optionType=${optionType}`;

  try {
    // get fresh cookies
    const home = await fetch(base, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36"
      }
    });
    const cookies = home.headers.get("set-cookie");

    // main request (disable automatic compression)
    const resp = await fetch(apiUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
        referer: base,
        cookie: cookies,
        accept: "application/json",
        "accept-encoding": "gzip,deflate,br"
      },
      compress: false // let us manually handle gzip
    });

    const buffer = await resp.arrayBuffer();
    let text;
    const enc = resp.headers.get("content-encoding");
    if (enc === "gzip" || enc === "br") {
      const buf = Buffer.from(buffer);
      text =
        enc === "gzip"
          ? zlib.gunzipSync(buf).toString("utf-8")
          : zlib.brotliDecompressSync(buf).toString("utf-8");
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
