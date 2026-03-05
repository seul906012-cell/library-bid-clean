import { NextResponse } from "next/server";
import xml2js from "xml2js";

export const dynamic = "force-dynamic";

export async function GET(){

const SERVICE_KEY = process.env.SERVICE_KEY;

const base =
"https://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoServc";

const parser = new xml2js.Parser({ explicitArray:false });

async function fetchData(url){

const res = await fetch(url);
const xml = await res.text();

const json = await parser.parseStringPromise(xml);

let items = json?.response?.body?.items?.item || [];

if(!Array.isArray(items)) items=[items];

return items;

}

const query =
`serviceKey=${SERVICE_KEY}&numOfRows=200&pageNo=1`;


/* 국립중앙도서관 */

const national = await fetchData(
`${base}?${query}&dminsttCd=1371029`
);


/* 국회도서관 */

const assembly = await fetchData(
`${base}?${query}&dminsttCd=9720000`
);


/* 키워드 */

const keywords=[
"도서관",
"기록물",
"DB",
"DB구축",
"디지털",
"디지털화"
];

let keywordData=[];

for(const k of keywords){

const data = await fetchData(
`${base}?${query}&bidNtceNm=${encodeURIComponent(k)}`
);

keywordData = keywordData.concat(data);

}


/* 합치기 */

const all=[
...national,
...assembly,
...keywordData
];


/* 중복 제거 */

const map=new Map();
const unique=[];

for(const item of all){

if(!map.has(item.bidNtceNo)){
map.set(item.bidNtceNo,true);
unique.push(item);
}

}


return NextResponse.json({

national,
assembly,
keyword:keywordData,
all:unique

});

}
