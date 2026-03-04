"use client";

import { useEffect, useState } from "react";

export default function Home(){

  const [data,setData] = useState([]);
  const [keyword,setKeyword] = useState("");
  const [sort,setSort] = useState("latest");
  const [filter,setFilter] = useState("all");

  useEffect(()=>{

    const load = async ()=>{
      const res = await fetch("/api/bids");
      const json = await res.json();
      setData(json);
    };

    load();

    const timer = setInterval(load,300000);

    return ()=>clearInterval(timer);

  },[]);

  const today = new Date().toISOString().slice(0,10);

  const isNational = (i)=>{
    const name =
      (i.dminsttNm || "") +
      (i.ntceInsttNm || "");
    return name.includes("국립중앙도서관");
  };

  const isAssembly = (i)=>{
    const name =
      (i.dminsttNm || "") +
      (i.ntceInsttNm || "");
    return name.includes("국회도서관");
  };

  const national = data.filter(isNational);
  const assembly = data.filter(isAssembly);

  const todayList = data.filter(i=>{
    if(!i.bidNtceDt) return false;
    const date = i.bidNtceDt.split(" ")[0];
    return date === today;
  });

  let filtered = data;

  if(filter === "national") filtered = national;
  if(filter === "assembly") filtered = assembly;
  if(filter === "today") filtered = todayList;

  filtered = filtered.filter(i=>{
    if(!keyword) return true;
    return (i.bidNtceNm || "").includes(keyword);
  });

  filtered = filtered.sort((a,b)=>{

    const A = new Date(a.bidNtceDt);
    const B = new Date(b.bidNtceDt);

    return sort === "latest" ? B - A : A - B;

  });

  const getAgencyStyle = (item)=>{

    const name =
      (item.dminsttNm || "") +
      (item.ntceInsttNm || "");

    if(name.includes("국립중앙도서관")){
      return {color:"#2d6cdf",icon:"📘"};
    }

    if(name.includes("국회도서관")){
      return {color:"#8e44ad",icon:"🏛️"};
    }

    return {color:"#999",icon:"📄"};

  };

  return(

    <main style={{background:"#e9eff6",minHeight:"100vh"}}>

      {/* HEADER */}

      <div style={{
        background:"#2d6cdf",
        color:"white",
        padding:"20px 40px",
        fontSize:"22px",
        fontWeight:"bold"
      }}>
        📚 국립중앙도서관 · 국회도서관 공고 정보
      </div>

      <div style={{padding:"40px"}}>

        {/* 카드 */}

        <div style={{display:"flex",gap:"20px"}}>

          <Card title="전체 공고" value={data.length} color="#555"
            onClick={()=>setFilter("all")}
          />

          <Card title="국립중앙도서관" value={national.length} color="#2d6cdf"
            onClick={()=>setFilter("national")}
          />

          <Card title="국회도서관" value={assembly.length} color="#8e44ad"
            onClick={()=>setFilter("assembly")}
          />

          <Card title="오늘 등록" value={todayList.length} color="#27ae60"
            onClick={()=>setFilter("today")}
          />

        </div>

        {/* 검색 */}

        <div style={{
          marginTop:"30px",
          display:"flex",
          justifyContent:"space-between"
        }}>

          <input
            placeholder="🔍 현재 결과 내 검색"
            value={keyword}
            onChange={(e)=>setKeyword(e.target.value)}
            style={{
              width:"320px",
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
              borderRadius:"8px",
              border:"1px solid #ccc"
            }}
          >
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
          </select>

        </div>

        {/* 공고 목록 */}

        <div style={{marginTop:"30px"}}>

          {filtered.map((item,i)=>{

            const agency = getAgencyStyle(item);

            return(

              <div
                key={i}
                style={{
                  background:"white",
                  padding:"15px",
                  marginBottom:"10px",
                  borderRadius:"8px",
                  borderLeft:`5px solid ${agency.color}`,
                  boxShadow:"0 2px 6px rgba(0,0,0,0.05)"
                }}
              >

                <a
                  href={item.bidNtceDtlUrl || item.bidNtceUrl}
                  target="_blank"
                  style={{
                    fontWeight:"bold",
                    color:"#333",
                    textDecoration:"none"
                  }}
                >
                  {item.bidNtceNm}
                </a>

                <div style={{
                  marginTop:"5px",
                  color:agency.color,
                  fontWeight:"bold"
                }}>
                  {agency.icon} {item.dminsttNm || item.ntceInsttNm}
                </div>

              </div>

            )

          })}

        </div>

      </div>

    </main>

  );

}


function Card({title,value,color,onClick}){

  return(

    <div
      onClick={onClick}
      style={{
        background:"white",
        padding:"20px",
        borderRadius:"12px",
        width:"200px",
        borderTop:`5px solid ${color}`,
        boxShadow:"0 3px 8px rgba(0,0,0,0.06)",
        cursor:"pointer"
      }}
    >

      <div style={{color:"#777",fontSize:"14px"}}>
        {title}
      </div>

      <div style={{
        fontSize:"28px",
        fontWeight:"bold",
        marginTop:"8px",
        color:color
      }}>
        {value}
      </div>

    </div>

  )

}
