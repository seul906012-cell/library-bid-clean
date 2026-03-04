import { NextResponse } from "next/server";
import xml2js from "xml2js";

export const dynamic = "force-dynamic";

export async function GET(){

const SERVICE_KEY = process.env.SERVICE_KEY;

const base =
"https://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoServcPPSSrch";

const parser = new xml2js.Parser({ explicitArray:false });

const today = new Date();
const end = today.toISOString().slice(0,10).replaceAll("-","");
const start = "20240101";


async function fetchData(url){

try{

const res = await fetch(url);
const xml = await res.text();

const json = await parser.parseStringPromise(xml);

let items = json?.response?.body?.items?.item || [];

if(!Array.isArray(items)) items=[items];

return items;

}catch(err){

console.log("API ERROR",err);
return [];

}

}


/* 기관 조회 */

const nationalPromise = fetchData(
`${base}?serviceKey=${SERVICE_KEY}&numOfRows=200&pageNo=1&inqryBgnDt=${start}&inqryEndDt=${end}&dminsttNm=${encodeURIComponent("국립중앙도서관")}`
);

const assemblyPromise = fetchData(
`${base}?serviceKey=${SERVICE_KEY}&numOfRows=200&pageNo=1&inqryBgnDt=${start}&inqryEndDt=${end}&dminsttNm=${encodeURIComponent("국회도서관")}`
);


/* 키워드 조회 */

const keywords = [
"도서관",
"기록물",
"DB",
"DB구축",
"데이터베이스",
"디지털",
"디지털화",
"아카이브",
"자료정리"
];

const keywordRequests = keywords.map(k =>
fetchData(
`${base}?serviceKey=${SERVICE_KEY}&numOfRows=200&pageNo=1&inqryBgnDt=${start}&inqryEndDt=${end}&bidNtceNm=${encodeURIComponent(k)}`
)
);


/* 병렬 실행 */

const [nationalRaw, assemblyRaw, ...keywordResults] =
await Promise.all([
nationalPromise,
assemblyPromise,
...keywordRequests
]);

const keywordRaw = keywordResults.flat();


/* 전체 합치기 */

const allRaw = [
...nationalRaw,
...assemblyRaw,
...keywordRaw
];


/* 중복 제거 */

const map = new Map();
const unique = [];

for(const item of allRaw){

if(!map.has(item.bidNtceNo)){
map.set(item.bidNtceNo,true);
unique.push(item);
}

}


/* 용역 관련 필터 */

const filterService = (arr)=>arr.filter(item=>{

const title = item.bidNtceNm || "";

return (
title.includes("용역") ||
title.includes("구축") ||
title.includes("DB") ||
title.includes("디지털") ||
title.includes("기록")
);

});


const national = filterService(nationalRaw);
const assembly = filterService(assemblyRaw);
const keyword = filterService(keywordRaw);
const all = filterService(unique);


/* 마감일 정렬 */

all.sort((a,b)=>
(a.bidClseDt || "").localeCompare(b.bidClseDt || "")
);


return NextResponse.json({

all,
national,
assembly,
keyword

});

}
