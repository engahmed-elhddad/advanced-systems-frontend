const API = "https://api.advancedsystems-int.com"

export default async function sitemap() {

  let parts:string[] = []

  try {

    const res = await fetch(`${API}/discover/6ES7315-2AH14-0AB0`)

    const data = await res.json()

    parts = data.parts || []

  } catch (e) {

    parts = []

  }

  // =========================
  // PRODUCT PAGES
  // =========================
  const productUrls = parts.map((p:string)=>({
    url:`https://advancedsystems-int.com/product/${p}`,
    lastModified:new Date()
  }))

  // =========================
  // CROSS REFERENCE PAGES
  // =========================
  const crossUrls = parts.map((p:string)=>({
    url:`https://advancedsystems-int.com/cross/${p}`,
    lastModified:new Date()
  }))

  // =========================
  // BRAND PAGES
  // =========================
  const brands = [
    "siemens",
    "abb",
    "schneider-electric",
    "allen-bradley",
    "mitsubishi",
    "omron",
    "pilz",
    "endress-hauser",
    "pepperl-fuchs",
    "turck",
    "banner",
    "ifm",
    "sick",
    "yokogawa",
    "phoenix-contact",
    "lenze",
    "beckhoff",
    "bosch-rexroth",
    "festo",
    "smc"
  ]

  const brandUrls = brands.map((b)=>({
    url:`https://advancedsystems-int.com/brand/${b}`,
    lastModified:new Date()
  }))

  // =========================
  // CATEGORY PAGES
  // =========================
  const categories = [
    "plc",
    "vfd",
    "servo-drive",
    "hmi",
    "industrial-pc",
    "contactor",
    "overload-relay",
    "power-supply",
    "safety-relay",
    "relay",
    "proximity-sensor",
    "photoelectric-sensor",
    "pressure-transmitter",
    "temperature-sensor",
    "flow-meter",
    "level-sensor",
    "encoder",
    "load-cell",
    "motor-starter",
    "circuit-breaker",
    "terminal-block",
    "industrial-switch",
    "gateway",
    "io-module"
  ]

  const categoryUrls = categories.map((c)=>({
    url:`https://advancedsystems-int.com/category/${c}`,
    lastModified:new Date()
  }))

  // =========================
  // SERIES PAGES
  // =========================
  const series = [
    "s7-300",
    "s7-1200",
    "s7-1500",
    "logo",
    "acs550",
    "acs880",
    "bmx",
    "modicon",
    "pnoz",
    "e2e",
    "e3z",
    "3rt",
    "3ru",
    "af-contactor"
  ]

  const seriesUrls = series.map((s)=>({
    url:`https://advancedsystems-int.com/series/${s}`,
    lastModified:new Date()
  }))

  // =========================
  // MAIN PAGES
  // =========================
  const mainPages = [
    {
      url:"https://advancedsystems-int.com",
      lastModified:new Date()
    }
  ]

  return [
    ...mainPages,
    ...productUrls,
    ...crossUrls,
    ...brandUrls,
    ...categoryUrls,
    ...seriesUrls
  ]

}