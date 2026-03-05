"use client";

import { useEffect, useState } from "react";

export default function Home() {

  const [data,setData] = useState([]);
  const [mode,setMode] = useState("all");
  const [search,setSearch] = useState("");
  const [sort,setSort] = useState("latest");
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("데이터 로딩 중...");

  useEffect(()=>{

    const load = ()=>{
      setLoading(true);
      setLoadingMessage("데이터 로딩 중...");
      
      const startTime = Date.now();
      
      fetch("/api/bids")
      .then(res=>res.json())
      .then(res=>{
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        setLoadingMessage(`로딩 완료! (${elapsed}초 소요)`);
        
        if(res.all){
          setData(res.all);
        }else{
          setData(res);
        }
        
        setLoading(false);
        
        // 2초 후 메시지 숨김
        setTimeout(() => {
          setLoadingMessage("");
        }, 2000);
      })
      .catch(err => {
        console.error("Loading error:", err);
        setLoadingMessage("데이터 로딩 실패");
        setLoading(false);
      });
    };

    load();

    const timer = setInterval(load,300000);

    return ()=>clearInterval(timer);

  },[]);



  const keywords = [
    "도서관",
    "기록물",
    "DB",
    "DB구축",
    "디지털",
    "디지털화"
  ];



  const isNational = (i)=>{
    const name=(i.dminsttNm||"")+(i.ntceInsttNm||"");
    return name.includes("국립중앙도서관");
  };

  const isAssembly = (i)=>{
    const name=(i.dminsttNm||"")+(i.ntceInsttNm||"");
    return name.includes("국회도서관");
  };

  const isKeyword = (i)=>{
    const title=i.bidNtceNm||"";
    return keywords.some(k=>title.includes(k));
  };



  let filtered = [];

  if(mode==="all"){
    filtered = data.filter(i=>isNational(i)||isAssembly(i)||isKeyword(i));
  }

  if(mode==="national"){
    filtered = data.filter(i=>isNational(i));
  }

  if(mode==="assembly"){
    filtered = data.filter(i=>isAssembly(i));
  }

  if(mode==="keyword"){
    filtered = data.filter(i=>isKeyword(i));
  }



  if(search){
    filtered = filtered.filter(i=>
      (i.bidNtceNm||"").toLowerCase().includes(search.toLowerCase())
    );
  }



  filtered.sort((a,b)=>{

    const da = new Date(a.bidNtceDt||0);
    const db = new Date(b.bidNtceDt||0);

    if(sort==="latest") return db-da;

    return da-db;

  });



  const totalCount = data.filter(i =>
    isNational(i)||isAssembly(i)||isKeyword(i)
  ).length;

  const nationalCount = data.filter(i=>isNational(i)).length;

  const assemblyCount = data.filter(i=>isAssembly(i)).length;

  const keywordCount = data.filter(i=>isKeyword(i)).length;



  return (

    <main style={{
      padding:"40px",
      fontFamily:"sans-serif",
      background:"#f2f5f9",
      minHeight:"100vh"
    }}>

      <h1 style={{marginBottom:"20px"}}>
        📚 국립중앙도서관 · 국회도서관 공고 정보
      </h1>

      {/* 로딩 상태 표시 */}
      {(loading || loadingMessage) && (
        <div style={{
          background: loading ? "#fff3cd" : "#d4edda",
          border: `1px solid ${loading ? "#ffc107" : "#28a745"}`,
          borderRadius: "8px",
          padding: "15px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}>
          {loading && (
            <div style={{
              width: "20px",
              height: "20px",
              border: "3px solid #ffc107",
              borderTop: "3px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}></div>
          )}
          <span style={{
            fontWeight: "500",
            color: loading ? "#856404" : "#155724"
          }}>
            {loadingMessage}
          </span>
        </div>
      )}

      {/* 스피너 애니메이션 CSS */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>



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
          }}
        >
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
          }}
        >
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
          }}
        >
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
          }}
        >
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


          return (

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

          );

        })}

      </div>

    </main>

  );

}
