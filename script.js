(()=>{
const $=id=>document.getElementById(id);
const anime=[
{ id:1,title:"Crimson Horizon",genre:"Action",tags:["Action","Adventure"],year:"2026",episodes:"12 Episodes",rating:"9.2",desc:"A young wanderer discovers a hidden power beneath a city that never sleeps. A journey of courage, friendship and impossible choices begins.",colors:"linear-gradient(145deg,#401b42,#e25c82 52%,#17122b)",word:"CRIMSON"},
{ id:2,title:"Whispering Realms",genre:"Fantasy",tags:["Fantasy","Adventure"],year:"2025",episodes:"24 Episodes",rating:"9.5",desc:"Beyond the edge of the known map lies a realm where forgotten legends breathe and every star holds a secret.",colors:"linear-gradient(145deg,#183c50,#6d91bd 52%,#17122b)",word:"REALMS"},
{ id:3,title:"Midnight Protocol",genre:"Mystery",tags:["Mystery","Sci-Fi"],year:"2026",episodes:"10 Episodes",rating:"8.9",desc:"When strange signals interrupt the city network, a quiet student uncovers a mystery that changes everything.",colors:"linear-gradient(145deg,#172747,#6c5cc3 52%,#17122b)",word:"PROTOCOL"},
{ id:4,title:"Petals in Spring",genre:"Romance",tags:["Romance","Drama"],year:"2025",episodes:"13 Episodes",rating:"8.8",desc:"Two people cross paths at the start of a new season and slowly learn that the smallest moments can become the biggest memories.",colors:"linear-gradient(145deg,#71304f,#f5a7ad 52%,#302047)",word:"PETALS"},
{ id:5,title:"Skyforge Legends",genre:"Adventure",tags:["Adventure","Fantasy"],year:"2024",episodes:"26 Episodes",rating:"9.1",desc:"A daring crew sets out across floating islands to find the lost forge said to shape the fate of worlds.",colors:"linear-gradient(145deg,#254b64,#e3a65f 52%,#211934)",word:"SKYFORGE"},
{ id:6,title:"Neon Ronin",genre:"Action",tags:["Action","Sci-Fi"],year:"2026",episodes:"8 Episodes",rating:"9.0",desc:"In a rain-soaked future, a lone guardian navigates a city of secrets, strange technology and shifting loyalties.",colors:"linear-gradient(145deg,#172e46,#d34e8d 52%,#17122b)",word:"RONIN"},
{ id:7,title:"The Glass Garden",genre:"Fantasy",tags:["Fantasy","Mystery"],year:"2025",episodes:"16 Episodes",rating:"8.7",desc:"A mysterious greenhouse appears only at dusk. Each door opens into a different memory waiting to be understood.",colors:"linear-gradient(145deg,#17473e,#8ab58b 52%,#17122b)",word:"GARDEN"},
{ id:8,title:"Summer Afterglow",genre:"Romance",tags:["Romance","Slice of Life"],year:"2024",episodes:"12 Episodes",rating:"8.6",desc:"A gentle story about friendship, growing up and the unforgettable summer that brings a group of classmates together.",colors:"linear-gradient(145deg,#5a3769,#e9a66d 52%,#17122b)",word:"SUMMER"},
{ id:9,title:"Echoes of Eternity",genre:"Adventure",tags:["Adventure","Action"],year:"2026",episodes:"12 Episodes",rating:"9.3",desc:"An ancient map leads three unlikely companions toward a discovery that could rewrite their world's history.",colors:"linear-gradient(145deg,#3d2c68,#d28b65 52%,#17122b)",word:"ECHOES"},
{ id:10,title:"Blue Hour Detective",genre:"Mystery",tags:["Mystery","Drama"],year:"2025",episodes:"11 Episodes",rating:"8.9",desc:"A thoughtful young detective solves unusual cases hidden in the quiet corners of a coastal town.",colors:"linear-gradient(145deg,#183b5a,#5f94ae 52%,#17122b)",word:"BLUE HOUR"}
];
let filter="All",page="home",watchlist=new Set(),authMode="signin",selected=null,toastTimer;
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2800)}
function render(){
 const q=$("searchInput").value.trim().toLowerCase();
 const list=anime.filter(a=>(filter==="All"||a.tags.includes(filter))&&(!q||(a.title+" "+a.tags.join(" ")).toLowerCase().includes(q))&&(page!=="watchlist"||watchlist.has(a.id)));
 $("animeGrid").innerHTML=list.map((a,i)=>'<article class="anime-card" data-id="'+a.id+'"><div class="poster" style="--poster:'+a.colors+'"><span class="poster-index">AW / '+String(i+1).padStart(2,"0")+'</span><span class="poster-shape"></span><span class="poster-word">'+a.word+'</span><button class="save-card '+(watchlist.has(a.id)?"saved":"")+'" data-save="'+a.id+'" aria-label="Save '+a.title+'">'+(watchlist.has(a.id)?"♥":"♡")+'</button></div><div class="card-info"><h3 class="card-title">'+a.title+'</h3><div class="card-sub"><span>'+a.genre+' · '+a.year+'</span><span>★ '+a.rating+'</span></div></div></article>').join("");
 $("noResults").hidden=list.length>0;$("animeGrid").hidden=!list.length;
 $("watchCount").textContent=watchlist.size;
 document.querySelectorAll(".filter-chip").forEach(b=>b.classList.toggle("active",b.dataset.filter===filter));
 $("sectionTitle").innerHTML=page==="watchlist"?"Your <em>watchlist</em>":page==="schedule"?"Release <em>schedule</em>":page==="explore"?"Explore <em>anime</em>":"Trending <em>this week</em>";
 $("crumbName").textContent=page==="home"?"Home":page==="watchlist"?"Watchlist":page==="schedule"?"Release Schedule":"Explore";
}
function setPage(p){page=p;if(p==="explore"||p==="schedule")filter="All";document.querySelectorAll("[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===p));render();$("catalogSection").scrollIntoView({behavior:"smooth",block:"start"});$("mobileMenu").setAttribute("aria-label","Open menu");$("sidebar").classList.remove("open")}
function openDetail(id){selected=anime.find(a=>a.id===id);if(!selected)return;$("detailTitle").textContent=selected.title;$("detailGenre").textContent=selected.tags.join(" · ").toUpperCase();$("detailDescription").textContent=selected.desc;$("detailMeta").innerHTML=["★ "+selected.rating,selected.year,selected.episodes,selected.genre].map(x=>"<span>"+x+"</span>").join("");$("detailVisual").style.background="radial-gradient(circle at 72% 30%,#d79dff99,transparent 23%),"+selected.colors;$("detailSave").textContent=watchlist.has(id)?"♥ Saved to watchlist":"♡ Add to watchlist";$("detailModal").hidden=false}
$("animeGrid").addEventListener("click",e=>{const save=e.target.closest("[data-save]");if(save){const id=Number(save.dataset.save);watchlist.has(id)?watchlist.delete(id):watchlist.add(id);render();if(selected&&selected.id===id)$("detailSave").textContent=watchlist.has(id)?"♥ Saved to watchlist":"♡ Add to watchlist";return}const card=e.target.closest("[data-id]");if(card)openDetail(Number(card.dataset.id))});
$("filters").addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(!b)return;filter=b.dataset.filter;page="explore";render()});
$("searchInput").addEventListener("input",()=>{page="explore";render()});
document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>setPage(b.dataset.page)));
document.querySelectorAll("[data-genre]").forEach(b=>b.addEventListener("click",()=>{filter=b.dataset.genre;setPage("explore")}));
["heroExplore","spotExplore","viewAll","sideExplore"].forEach(id=>$(id).addEventListener("click",()=>setPage("explore")));
$("heroFeatured").addEventListener("click",()=>openDetail(1));
$("mobileMenu").addEventListener("click",()=> $("sidebar").classList.toggle("open"));
$("openAuth").addEventListener("click",()=>{$("authModal").hidden=false});
$("mobileAccount").addEventListener("click",()=>{$("authModal").hidden=false});
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>$(b.dataset.close).hidden=true));
document.querySelectorAll(".modal-backdrop").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.hidden=true}));
document.addEventListener("keydown",e=>{if(e.key==="Escape")document.querySelectorAll(".modal-backdrop").forEach(m=>m.hidden=true)});
document.querySelectorAll("[data-auth-tab]").forEach(b=>b.addEventListener("click",()=>{authMode=b.dataset.authTab;document.querySelectorAll("[data-auth-tab]").forEach(x=>x.classList.toggle("active",x===b));$("authTitle").innerHTML=authMode==="signin"?'Sign in to <em>Anime World</em>':'Join <em>Anime World</em>'; $("authSubmit").innerHTML=(authMode==="signin"?"Sign in":"Create account")+' <span>→</span>';$("passwordField").autocomplete=authMode==="signin"?"current-password":"new-password"}));
$("authForm").addEventListener("submit",e=>{e.preventDefault();toast("This is a visual demo. Email authentication is not connected.");$("authModal").hidden=true;$("authForm").reset()});
$("detailSave").addEventListener("click",()=>{if(!selected)return;watchlist.has(selected.id)?watchlist.delete(selected.id):watchlist.add(selected.id);render();$("detailSave").textContent=watchlist.has(selected.id)?"♥ Saved to watchlist":"♡ Add to watchlist"});
$("detailWatch").addEventListener("click",()=>toast("Video streaming is not connected yet. Add licensed video sources in a future step."));
$("notificationBtn")?.addEventListener("click",()=>toast("You're all caught up."));
$("mobileMenu").setAttribute("aria-label","Open navigation");
render();
})();