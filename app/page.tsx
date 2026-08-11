"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Menu = {
  name: string;
  category: string;
  price: string;
  distance: string;
  rating: string;
  time: string;
  emoji: string;
  tone: string;
  tags: string[];
};

const menus: Menu[] = [
  { name: "소담한 제육볶음", category: "한식", price: "₩10,000", distance: "3분", rating: "4.8", time: "12분", emoji: "🥘", tone: "rose", tags: ["든든한", "밥도둑"] },
  { name: "오니기리와 이모", category: "일식", price: "₩8,500", distance: "5분", rating: "4.7", time: "8분", emoji: "🍙", tone: "sky", tags: ["가벼운", "혼밥추천"] },
  { name: "그린테이블 샐러드", category: "샐러드", price: "₩11,900", distance: "6분", rating: "4.6", time: "10분", emoji: "🥗", tone: "mint", tags: ["산뜻한", "건강식"] },
  { name: "마라공방", category: "중식", price: "₩12,000", distance: "4분", rating: "4.5", time: "15분", emoji: "🍜", tone: "orange", tags: ["얼큰한", "스트레스 해소"] },
  { name: "오후의 파스타", category: "양식", price: "₩13,500", distance: "7분", rating: "4.8", time: "18분", emoji: "🍝", tone: "lemon", tags: ["기분전환", "분위기"] },
  { name: "서울김밥", category: "분식", price: "₩6,500", distance: "2분", rating: "4.4", time: "5분", emoji: "🍱", tone: "purple", tags: ["빠른", "가성비"] },
];

const moods = ["든든하게", "가볍게", "얼큰하게", "새로운 거"];

export default function Home() {
  const [mood, setMood] = useState("든든하게");
  const [category, setCategory] = useState("전체");
  const [budget, setBudget] = useState("전체");
  const [spin, setSpin] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let active = true;
    const loadFavorites = async () => {
      if (!supabase) {
        setToast("Supabase 환경변수가 설정되지 않았어요");
        setTimeout(() => setToast(""), 3000);
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      let session = sessionData.session;
      if (!session) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          setToast("Supabase 익명 로그인을 켜주세요");
          setTimeout(() => setToast(""), 3000);
          return;
        }
        session = data.session;
      }
      if (!session || !active) return;
      const { data, error } = await supabase
        .from("lunch_favorites")
        .select("menu_name")
        .eq("user_id", session.user.id);
      if (!error && active) setSaved((data ?? []).map((row) => row.menu_name));
    };
    void loadFavorites();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    let list = menus.filter((item) => category === "전체" || item.category === category);
    if (budget === "1만원 이하") list = list.filter((item) => Number(item.price.replace(/[^0-9]/g, "")) <= 10000);
    if (budget === "1.2만원 이하") list = list.filter((item) => Number(item.price.replace(/[^0-9]/g, "")) <= 12000);
    if (!list.length) return menus;
    const offset = spin % list.length;
    return [...list.slice(offset), ...list.slice(0, offset)];
  }, [category, budget, spin]);

  const choose = () => {
    setSpin((value) => value + 1);
    setToast("새로운 메뉴를 골라봤어요!");
    setTimeout(() => setToast(""), 2200);
  };

  const toggleSave = async (name: string) => {
    const wasSaved = saved.includes(name);
    if (!supabase) {
      setToast("Supabase 환경변수가 설정되지 않았어요");
      setTimeout(() => setToast(""), 3000);
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setToast("익명 로그인이 꺼져 있어요");
      setTimeout(() => setToast(""), 3000);
      return;
    }
    setSaved((items) => wasSaved ? items.filter((item) => item !== name) : [...items, name]);
    const result = wasSaved
      ? await supabase.from("lunch_favorites").delete().eq("user_id", data.session.user.id).eq("menu_name", name)
      : await supabase.from("lunch_favorites").insert({ user_id: data.session.user.id, menu_name: name });
    if (result.error) {
      setSaved((items) => wasSaved ? [...items, name] : items.filter((item) => item !== name));
      setToast("저장하지 못했어요. 잠시 후 다시 눌러주세요.");
      setTimeout(() => setToast(""), 2500);
    }
  };

  return (
    <main className="app-shell">
      <nav className="topbar">
        <a className="brand" href="#top"><span className="brand-mark">오늘</span><span>오늘의 메뉴</span></a>
        <div className="nav-links"><a className="active" href="#recommend">메뉴 추천</a><a href="#nearby">내 주변 맛집</a><a href="#saved">찜한 메뉴 <span className="count">{saved.length}</span></a></div>
        <button className="profile-button" aria-label="프로필 열기"><span>김</span><i>⌄</i></button>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy"><p className="eyebrow"><span className="sun">☀</span> 화요일, 점심시간이 다가와요</p><h1>오늘 점심,<br /><em>뭐 먹지?</em></h1><p className="hero-sub">고민은 짧게, 맛있는 점심은 확실하게.<br />지금 내 기분에 딱 맞는 메뉴를 찾아드릴게요.</p></div>
        <div className="hero-art" aria-label="다채로운 점심 도시락과 샐러드 이미지"><img src="/images/lunch-hero.png" alt="다채로운 점심 도시락과 샐러드" /><div className="art-note note-one">오늘은<br /><b>알록달록한 거!</b></div><div className="art-note note-two">점심시간<br /><b>12:00 - 13:00</b></div><span className="spark spark-a">✦</span><span className="spark spark-b">✧</span></div>
      </section>

      <section className="controls" id="recommend">
        <div className="section-heading"><div><p className="kicker">01 / TODAY&apos;S PICK</p><h2>지금 어떤 기분이에요?</h2></div><span className="hint">취향을 선택하면 추천이 바뀌어요</span></div>
        <div className="mood-row">{moods.map((item, index) => <button key={item} onClick={() => setMood(item)} className={`mood-pill ${mood === item ? "selected" : ""}`}><span>{["🍚", "🥗", "🌶️", "✨"][index]}</span>{item}{mood === item && <b>✓</b>}</button>)}</div>
        <div className="filters"><label>음식 종류 <select value={category} onChange={(e) => setCategory(e.target.value)}><option>전체</option><option>한식</option><option>일식</option><option>샐러드</option><option>중식</option><option>양식</option><option>분식</option></select></label><label>예산 <select value={budget} onChange={(e) => setBudget(e.target.value)}><option>전체</option><option>1만원 이하</option><option>1.2만원 이하</option></select></label><button className="reset" onClick={() => { setCategory("전체"); setBudget("전체"); }}>초기화 <span>↻</span></button></div>
      </section>

      <section className="results" id="nearby">
        <div className="result-head"><div><p className="kicker">02 / RECOMMENDED FOR YOU</p><h2>오늘의 추천 메뉴 <span>{filtered.length}</span></h2></div><button className="shuffle" onClick={choose}><span>⤨</span> 다시 뽑기</button></div>
        <p className="result-caption"><strong>{mood}</strong> 기분에 어울리는 메뉴예요 · <span>회사 주변 1km</span></p>
        <div className="menu-grid">{filtered.map((item, index) => <article className={`menu-card ${index === 0 ? "featured" : ""}`} key={item.name}><div className={`food-visual ${item.tone}`}><span className="food-emoji">{item.emoji}</span><button className={`heart ${saved.includes(item.name) ? "is-saved" : ""}`} onClick={() => toggleSave(item.name)} aria-label={`${item.name} 찜하기`}>{saved.includes(item.name) ? "♥" : "♡"}</button>{index === 0 && <span className="best-badge">오늘의 1픽</span>}</div><div className="card-body"><div className="card-top"><span className="category-label">{item.category}</span><span className="rating">★ {item.rating}</span></div><h3>{item.name}</h3><div className="tags">{item.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div><div className="card-meta"><span>⌖ {item.distance}</span><span>◷ {item.time}</span><b>{item.price}</b></div><button className="detail-button" onClick={() => { setToast(`${item.name}을(를) 선택했어요`); setTimeout(() => setToast(""), 2200); }}>메뉴 자세히 보기 <span>→</span></button></div></article>)}</div>
      </section>

      <section className="saved-strip" id="saved"><div><p className="kicker">03 / YOUR SHORTLIST</p><h2>찜해둔 메뉴 <span>{saved.length}</span></h2></div><p>{saved.length ? "오늘 먹고 싶은 메뉴를 저장해두었어요." : "마음에 드는 메뉴의 하트를 눌러 저장해보세요."}</p></section>
      <footer><span>© 2026 오늘의 메뉴</span><span>점심 고민을 덜어드려요 <i>●</i></span></footer>
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
