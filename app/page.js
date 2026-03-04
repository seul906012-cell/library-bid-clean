"use client";

import { useEffect, useState } from "react";

export default function Home(){

const [data,setData] = useState([]);
const [mode,setMode] = useState("all");
const [search,setSearch] = useState("");
const [sort,setSort] = useState("latest");

useEffect(()=>{

  const load = ()=>{
    fetch("/api/bids")
    .then(res=>res.json())
    .then(setData);
  };

  load();

  const timer = setInterval(load,300000);

  return ()=>clearInterval(timer);

},[]);


const keywords=[
"도서관",
"기록물",
"DB",
"DB구축",
"디지털",
"디지털화"
];


const isNational=(i)=>{
const name=(i.dminsttNm||"")+(i.ntceInsttNm||"");
return name.includes("국립중앙도서관");
}

const isAssembly=(i)=>{
const name=(i.dminsttNm||"")+(i.ntceInsttNm||"");
return name.includes("국회도서관");
}

const isKeyword=(i)=>{
const title=i.bidNtceNm||"";
return keywords.some(k=>title.includes(k));
}



let filtered=[];

if(mode==="all"){
filtered=data.filter(i=>isNational(i)||isAssembly(i)||isKeyword(i));
}

if(mode==="national"){
filtered=data.filter(i=>isNational(i));
}

if(mode==="assembly"){
filtered=data.filter(i=>isAssembly(i));
}

if(mode==="keyword"){
filtered=data.filter(i=>isKeyword(i));
}



if(search){
filtered=filtered.filter(i=>
(i.bidNtceNm||"").toLowerCase().includes(search.toLowerCase())
);
}



filtered.sort((a,b)=>{

const da=new Date(a.bidNtceDt||0);
const db=new Date(b.bidNtceDt||0);

if(sort==="latest") return db-da;

return da-db;

});



const totalCount=data.filter(i=>
isNational(i)||isAssembly(i)||isKeyword(i)
).length;

const nationalCount=data.filter(i=>isNational(i)).length;

const assemblyCount=data.filter(i=>isAssembly(i)).length;

const keywordCount=data.filter(i=>isKeyword(i)).length;



return(

<main style={{
padding:"40px",
fontFamily:"sans-serif",
background:"#f2f5f9",
minHeight:"100vh"
}}>

<h1 style={{marginBottom:"20px"}}>
📚 국립중앙도서관 · 국회도서관 공고 정보
</h1>



<div style={{
display:"flex",
gap:"20px",
marginBottom:"30px"
}}>


<div
onClick={()=>setMode("all")}
style={{
flex:1,
background:"#fff",
padding:"20px",
borderRadius:"12px",
cursor:"pointer",
borderTop:"5px solid #333"
}}>
전체 공고
<h2>{totalCount}</h2>
</div>


<div
onClick={()=>setMode("national")}
style={{
flex:1,
background:"#fff",
padding:"20px",
borderRadius:"12px",
cursor:"pointer",
borderTop:"5px solid #3b82f6"
}}>
국립중앙도서관
<h2>{nationalCount}</h2>
</div>


<div
onClick={()=>setMode("assembly")}
style={{
flex:1,
background:"#fff",
padding:"20px",
borderRadius:"12px",
cursor:"pointer",
borderTop:"5px solid #8b5cf6"
}}>
국회도서관
<h2>{assemblyCount}</h2>
</div>


<div
onClick={()=>setMode("keyword")}
style={{
flex:1,
background:"#fff",
padding:"20px",
borderRadius:"12px",
cursor:"pointer",
borderTop:"5px solid #10b981"
}}>
키워드
<h2>{keywordCount}</h2>
</div>

</div>




<div style={{
display:"flex",
gap:"10px",
marginBottom:"30px"
}}>

<input
placeholder="현재 결과 내 검색"
value={search}
onChange={(e)=>setSearch(e.target.value)}
style={{
flex:1,
padding:"10px",
borderRadius:"8px",
border:"1px solid #ccc"
}}
/>

<select
value={sort}
onChange={(e)=>setSort(e.target.value)}
style={{
padding:"10px",
borderRadius:"8px"
}}
>
<option value="latest">최신순</option>
<option value="old">오래된순</option>
</select>

</div>




<div>

{filtered.map((item,i)=>{

let color="#999";

if(isNational(item)) color="#3b82f6";
else if(isAssembly(item)) color="#8b5cf6";
else if(isKeyword(item)) color="#10b981";


return(

<div
key={i}
style={{
background:"#fff",
padding:"20px",
borderRadius:"10px",
marginBottom:"12px",
borderLeft:`6px solid ${color}`
}}
>

<a
href={item.bidNtceUrl}
target="_blank"
style={{
fontWeight:"bold",
fontSize:"16px",
textDecoration:"none",
color:"#111"
}}
>
{item.bidNtceNm}
</a>

<div style={{
marginTop:"6px",
color:"#666",
fontSize:"14px"
}}>
📄 {item.dminsttNm||item.ntceInsttNm}
</div>

</div>

)

})}

</div>



</main>

);

}
