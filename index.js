const baseUrl = "https://www.marinetraffic.com/en/";
const headers = {
  "Vessel-Image": "00be19cb54b3d523161214b2a2e1d68cf011",
}

addEventListener('scheduled', event => {
  event.waitUntil(handleRequest())
})

addEventListener('fetch', event => {
  return event.respondWith(httpRequest(event.request))
})

async function httpRequest(request) {
  return new Response(await cargo_van.get("lastShipMessages"))
}

async function handleRequest() {
  console.log("begin")
  const response = await fetch(baseUrl + "reports?asset_type=arrivals_departures&columns=shipname,move_type,ata_atd,imo,ship_type&port_in=682&ship_type_in=7,8", {
    headers
  }).then((res) => res.json());

  const ships = response.data;
  const lastShipIds = new Set(JSON.parse(await cargo_van.get("lastShipIds"))); // populate from last run

  const countryResponses = ships.map(async (ship) => {
    if (!lastShipIds.has(ship.IMO)) {
      const response = await fetch(baseUrl + "search/searchAsset?what=vessel&term=" + ship.IMO, { headers }).then((res) => res.json());
      if (response.length < 1) {
        console.error("search results failed");
        return;
      }
      const countryCode = response[0].desc.replace(ship.SHIPNAME, "").substring(2, 4);

      if (ship.TYPE_SUMMARY === "Tanker") {
        const shipSummary = `Tanker ${ship.SHIPNAME}, hailing from ${flags[countryCode]}`;
        if (ship.MOVE_TYPE_NAME === "ARRIVAL") {
          return `${shipSummary}, has entered the port. Good opportunity for some praxis!`;
        } else {
          return `${shipSummary}, has left the port. Good riddance! Don't kill the ecosystem on your way out!`;
        }
      } else {
        const shipSummary = `cargo freighter ${ship.SHIPNAME}, hailing from ${flags[countryCode]}`;
        if (ship.MOVE_TYPE_NAME === "ARRIVAL") {
          return `Welcome, ${shipSummary}.`;
        } else {
          return `Farewell, ${shipSummary}.`;
        }
      }
    }
  });

  const messages = (await Promise.all(countryResponses)).filter((a) => a);

  try {
    for (const message of messages) {
      let tweelay_promise = fetch("https://tweelay.nyble.dev/yvrships/", {
        method: "POST",
        headers: {
          "x-api-key": TWEELAY_API_KEY,
        },
        body: message
      });

      let feeling_promise = fetch("https://feeling.nyble.dev/amble.quest/cargovan/", {
        method: "POST",
        headers: {
          "x-api-key": TWEELAY_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          'status': message,
          'visibility': 'unlisted'
        })
      });

      await Promise.allSettled([tweelay_promise, feeling_promise]);
      console.log("i sent a request! it said " + message);
    }

  } catch (e) {
    console.error(e)
  }
  const lastShips = JSON.parse(await cargo_van.get("lastShipMessages")) ?? [];
  lastShips.push(...messages);

  await cargo_van.put("lastShipIds", JSON.stringify(ships.map((ship) => ship.IMO)));
  await cargo_van.put("lastShipMessages", JSON.stringify(lastShips.slice(-50)))

  return new Response(messages, {
    headers: { 'content-type': 'text/json' },
  });
}

const flags = {
  AC: "🇦🇨", AD: "🇦🇩", AE: "🇦🇪", AF: "🇦🇫", AG: "🇦🇬", AI: "🇦🇮", AL: "🇦🇱", AM: "🇦🇲", AO: "🇦🇴", AQ: "🇦🇶", AR: "🇦🇷", AS: "🇦🇸", AT: "🇦🇹", AU: "🇦🇺", AW: "🇦🇼", AX: "🇦🇽",
  AZ: "🇦🇿", BA: "🇧🇦", BB: "🇧🇧", BD: "🇧🇩", BE: "🇧🇪", BF: "🇧🇫", BG: "🇧🇬", BH: "🇧🇭", BI: "🇧🇮", BJ: "🇧🇯", BL: "🇧🇱", BM: "🇧🇲", BN: "🇧🇳", BO: "🇧🇴", BQ: "🇧🇶", BR: "🇧🇷",
  BS: "🇧🇸", BT: "🇧🇹", BV: "🇧🇻", BW: "🇧🇼", BY: "🇧🇾", BZ: "🇧🇿", CA: "🇨🇦", CC: "🇨🇨", CD: "🇨🇩", CF: "🇨🇫", CG: "🇨🇬", CH: "🇨🇭", CI: "🇨🇮", CK: "🇨🇰", CL: "🇨🇱", CM: "🇨🇲",
  CN: "🇨🇳", CO: "🇨🇴", CP: "🇨🇵", CR: "🇨🇷", CU: "🇨🇺", CV: "🇨🇻", CW: "🇨🇼", CX: "🇨🇽", CY: "🇨🇾", CZ: "🇨🇿", DE: "🇩🇪", DG: "🇩🇬", DJ: "🇩🇯", DK: "🇩🇰", DM: "🇩🇲", DO: "🇩🇴",
  DZ: "🇩🇿", EA: "🇪🇦", EC: "🇪🇨", EE: "🇪🇪", EG: "🇪🇬", EH: "🇪🇭", ER: "🇪🇷", ES: "🇪🇸", ET: "🇪🇹", EU: "🇪🇺", FI: "🇫🇮", FJ: "🇫🇯", FK: "🇫🇰", FM: "🇫🇲", FO: "🇫🇴", FR: "🇫🇷",
  GA: "🇬🇦", GB: "🇬🇧", GD: "🇬🇩", GE: "🇬🇪", GF: "🇬🇫", GG: "🇬🇬", GH: "🇬🇭", GI: "🇬🇮", GL: "🇬🇱", GM: "🇬🇲", GN: "🇬🇳", GP: "🇬🇵", GQ: "🇬🇶", GR: "🇬🇷", GS: "🇬🇸", GT: "🇬🇹",
  GU: "🇬🇺", GW: "🇬🇼", GY: "🇬🇾", HK: "🇭🇰", HM: "🇭🇲", HN: "🇭🇳", HR: "🇭🇷", HT: "🇭🇹", HU: "🇭🇺", IC: "🇮🇨", ID: "🇮🇩", IE: "🇮🇪", IL: "🇮🇱", IM: "🇮🇲", IN: "🇮🇳", IO: "🇮🇴",
  IQ: "🇮🇶", IR: "🇮🇷", IS: "🇮🇸", IT: "🇮🇹", JE: "🇯🇪", JM: "🇯🇲", JO: "🇯🇴", JP: "🇯🇵", KE: "🇰🇪", KG: "🇰🇬", KH: "🇰🇭", KI: "🇰🇮", KM: "🇰🇲", KN: "🇰🇳", KP: "🇰🇵", KR: "🇰🇷",
  KW: "🇰🇼", KY: "🇰🇾", KZ: "🇰🇿", LA: "🇱🇦", LB: "🇱🇧", LC: "🇱🇨", LI: "🇱🇮", LK: "🇱🇰", LR: "🇱🇷", LS: "🇱🇸", LT: "🇱🇹", LU: "🇱🇺", LV: "🇱🇻", LY: "🇱🇾", MA: "🇲🇦", MC: "🇲🇨",
  MD: "🇲🇩", ME: "🇲🇪", MF: "🇲🇫", MG: "🇲🇬", MH: "🇲🇭", MK: "🇲🇰", ML: "🇲🇱", MM: "🇲🇲", MN: "🇲🇳", MO: "🇲🇴", MP: "🇲🇵", MQ: "🇲🇶", MR: "🇲🇷", MS: "🇲🇸", MT: "🇲🇹", MU: "🇲🇺",
  MV: "🇲🇻", MW: "🇲🇼", MX: "🇲🇽", MY: "🇲🇾", MZ: "🇲🇿", NA: "🇳🇦", NC: "🇳🇨", NE: "🇳🇪", NF: "🇳🇫", NG: "🇳🇬", NI: "🇳🇮", NL: "🇳🇱", NO: "🇳🇴", NP: "🇳🇵", NR: "🇳🇷", NU: "🇳🇺",
  NZ: "🇳🇿", OM: "🇴🇲", PA: "🇵🇦", PE: "🇵🇪", PF: "🇵🇫", PG: "🇵🇬", PH: "🇵🇭", PK: "🇵🇰", PL: "🇵🇱", PM: "🇵🇲", PN: "🇵🇳", PR: "🇵🇷", PS: "🇵🇸", PT: "🇵🇹", PW: "🇵🇼", PY: "🇵🇾",
  QA: "🇶🇦", RE: "🇷🇪", RO: "🇷🇴", RS: "🇷🇸", RU: "🇷🇺", RW: "🇷🇼", SA: "🇸🇦", SB: "🇸🇧", SC: "🇸🇨", SD: "🇸🇩", SE: "🇸🇪", SG: "🇸🇬", SH: "🇸🇭", SI: "🇸🇮", SJ: "🇸🇯",
  SK: "🇸🇰", SL: "🇸🇱", SM: "🇸🇲", SN: "🇸🇳", SO: "🇸🇴", SR: "🇸🇷", SS: "🇸🇸", ST: "🇸🇹", SV: "🇸🇻", SX: "🇸🇽", SY: "🇸🇾", SZ: "🇸🇿", TA: "🇹🇦", TC: "🇹🇨", TD: "🇹🇩", TF: "🇹🇫",
  TG: "🇹🇬", TH: "🇹🇭", TJ: "🇹🇯", TK: "🇹🇰", TL: "🇹🇱", TM: "🇹🇲", TN: "🇹🇳", TO: "🇹🇴", TR: "🇹🇷", TT: "🇹🇹", TV: "🇹🇻", TW: "🇹🇼", TZ: "🇹🇿", UA: "🇺🇦", UG: "🇺🇬", UM: "🇺🇲",
  UN: "🇺🇳", US: "🇺🇸", UY: "🇺🇾", UZ: "🇺🇿", VA: "🇻🇦", VC: "🇻🇨", VE: "🇻🇪", VG: "🇻🇬", VI: "🇻🇮", VN: "🇻🇳", VU: "🇻🇺", WF: "🇼🇫", WS: "🇼🇸", XK: "🇽🇰", YE: "🇾🇪",
  YT: "🇾🇹", ZA: "🇿🇦", ZM: "🇿🇲", ZW: "🇿🇼"
}
