"use client";

import { useEffect, useState } from "react";

export default function Home(){

  const [data,setData] = useState([]);
  const [keyword,setKeyword] = useState("");

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

  const national = data.filter(
    i => (i.dminsttNm || "").includes("국립중앙도서관")
  );

  const assembly = data.filter(
    i => (i.dminsttNm || "").includes("국회도서관")
  );

  const todayCount = data.filter(i=>{
    if(!i.bidNtceDt) return false;
    const date = i.bidNtceDt.split(" ")[0];
    return date === today;
  }).length;

  const filtered = data.filter(i=>{
    if(!keyword) return true;
    return (i.bidNtceNm || "").includes(keyword);
  });

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

        {/* CARD AREA */}

        <div style={{
          display:"flex",
          gap:"20px"
        }}>

          <Card title="전체 공고" value={data.length} />
          <Card title="국립중앙도서관" value={national.length} />
          <Card title="국회도서관" value={assembly.length} />
          <Card title="오늘 등록" value={todayCount} />

        </div>


        {/* SEARCH BAR */}

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
              width:"300px",
              padding:"10px",
              borderRadius:"8px",
              border:"1px solid #ccc"
            }}
          />

          <select
            style={{
              padding:"10px",
              borderRadius:"8px",
              border:"1px solid #ccc"
            }}
          >
            <option>최신순</option>
          </select>

        </div>


        {/* LIST */}

        <div style={{marginTop:"30px"}}>

          {filtered.map((item,i)=>(
            <div
              key={i}
              style={{
                background:"white",
                padding:"15px",
                marginBottom:"10px",
                borderRadius:"8px",
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

              <div style={{marginTop:"5px",color:"#777"}}>
                {item.dminsttNm}
              </div>

            </div>
          ))}

        </div>

      </div>

    </main>

  );

}


function Card({title,value}){

  return(

    <div style={{
      background:"white",
      padding:"20px",
      borderRadius:"12px",
      width:"200px",
      boxShadow:"0 3px 8px rgba(0,0,0,0.06)"
    }}>

      <div style={{color:"#777",fontSize:"14px"}}>
        {title}
      </div>

      <div style={{
        fontSize:"28px",
        fontWeight:"bold",
        marginTop:"8px"
      }}>
        {value}
      </div>

    </div>

  )

}
