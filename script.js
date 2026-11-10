(() => {
  const $ = id => document.getElementById(id);
  const audio = $("audioPlayer"), input = $("audioInput");
  const tracks = [], recent = [];
  let currentIndex = -1, activeView = "home", toastTimer;
  const DB_NAME = "solo-music-library", STORE = "tracks";
  const formatTime = n => Number.isFinite(n) ? Math.floor(n/60)+":"+Math.floor(n%60).toString().padStart(2,"0") : "0:00";
  function toast(message) {
    const el=$("toast"); el.textContent=message; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove("show"),3000);
  }
  function openDB() {
    return new Promise((resolve,reject)=>{
      if (!("indexedDB" in window)) return reject(new Error("Storage is unavailable in this browser."));
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{ if(!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE,{keyPath:"id",autoIncrement:true}); };
      req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
    });
  }
  async function saveTrack(track) {
    const db=await openDB();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,"readwrite"), req=tx.objectStore(STORE).add({name:track.name,artist:track.artist,liked:track.liked,file:track.file,addedAt:Date.now()});
      req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error); tx.oncomplete=()=>db.close(); tx.onerror=()=>{db.close();reject(tx.error);};
    });
  }
  async function loadSavedTracks() {
    const db=await openDB();
    const saved=await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,"readonly"), req=tx.objectStore(STORE).getAll();
      req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error); tx.oncomplete=()=>db.close();
    });
    saved.sort((a,b)=>a.addedAt-b.addedAt).forEach(item=>tracks.push({...item,url:URL.createObjectURL(item.file)}));
    renderTracks(); updateStats();
    if(tracks.length) toast(tracks.length+" saved track(s) restored from this device.");
  }
  async function updateSavedTrack(track) {
    if(track.id==null) return;
    const db=await openDB();
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,"readwrite"); tx.objectStore(STORE).put({id:track.id,name:track.name,artist:track.artist,liked:track.liked,file:track.file,addedAt:track.addedAt});
      tx.oncomplete=()=>{db.close();resolve();}; tx.onerror=()=>{db.close();reject(tx.error);};
    });
  }
  async function deleteSavedTrack(track) {
    if(track.id==null) return;
    const db=await openDB();
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,"readwrite"); tx.objectStore(STORE).delete(track.id);
      tx.oncomplete=()=>{db.close();resolve();}; tx.onerror=()=>{db.close();reject(tx.error);};
    });
  }
  function updateStats() {
    $("statTracks").textContent=tracks.length;
    const liked=tracks.filter(t=>t.liked).length;
    $("statLiked").textContent=liked+" Songs"; $("statLikedCount").textContent=liked;
    $("libraryProgress").style.width=Math.min(100,tracks.length*10)+"%";
  }
  function setNavActive(view) {
    document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  }
  function currentList() {
    if(activeView==="favorites") return tracks.filter(t=>t.liked);
    if(activeView==="recent") return recent.map(t=>tracks.find(x=>x.id===t)).filter(Boolean);
    if(activeView==="search") { const q=$("searchInput").value.trim().toLowerCase(); return tracks.filter(t=>(t.name+" "+t.artist).toLowerCase().includes(q)); }
    return tracks;
  }
  function renderEmpty(empty) {
    const content={
      favorites:['♥','LIKED SONGS','Your favourites live here.','Tap the heart beside any song to add it to this collection.'],
      recent:['◷','YOUR LISTENING JOURNEY','Nothing played yet.','Tracks you listen to will appear here.'],
      playlists:['▤','PLAYLISTS','Playlist tools are not ready yet.','You can add audio files and save liked songs for now.'],
      search:['⌕','SEARCH YOUR LIBRARY','No matching tracks.','Try another title or add audio files from your device.'],
      home:['♫','YOUR PERSONAL MUSIC LIBRARY','Your music starts here.','Choose audio files from your phone. They stay in this browser on this device.']
    };
    const c=content[activeView]||content.home;
    empty.innerHTML='<div class="empty-art">'+c[0]+'</div><p class="empty-kicker">'+c[1]+'</p><h3>'+c[2]+'</h3><p>'+c[3]+'</p>'+(activeView==="home"?'<button class="green-btn" id="emptyUpload">Choose audio files</button><span class="tiny-note">MP3, M4A, AAC, WAV, OGG and other browser-supported audio</span>':'');
    const btn=$("emptyUpload"); if(btn) btn.addEventListener("click",()=>input.click());
  }
  function renderTracks(list=currentList()) {
    const box=$("trackList"), empty=$("emptyState"); box.replaceChildren();
    if(!list.length){box.hidden=true;empty.hidden=false;renderEmpty(empty);updateStats();return;}
    empty.hidden=true;box.hidden=false;
    list.forEach(track=>{
      const index=tracks.indexOf(track), row=document.createElement("div");
      row.className="track-row"+(index===currentIndex?" is-playing":"");
      const cover=document.createElement("div"); cover.className="track-cover"; cover.textContent="♫";
      const info=document.createElement("div"); info.className="track-info";
      const title=document.createElement("b"); title.textContent=track.name;
      const artist=document.createElement("span"); artist.textContent=track.artist;
      info.append(title,artist);
      const play=document.createElement("button"); play.className="row-play"; play.type="button"; play.textContent=index===currentIndex&&!audio.paused?"Ⅱ":"▶"; play.setAttribute("aria-label","Play "+track.name);
      play.addEventListener("click",()=>index===currentIndex?togglePlayback():playTrack(index));
      const like=document.createElement("button"); like.className="row-like"+(track.liked?" liked":""); like.type="button"; like.textContent=track.liked?"♥":"♡"; like.setAttribute("aria-label",track.liked?"Unlike":"Like");
      like.addEventListener("click",async()=>{track.liked=!track.liked;try{await updateSavedTrack(track);}catch(e){toast("Could not save this change.");}renderTracks();setCurrentUI(false);});
      const remove=document.createElement("button"); remove.className="row-remove"; remove.type="button"; remove.textContent="×"; remove.title="Remove from library"; remove.setAttribute("aria-label","Remove "+track.name);
      remove.addEventListener("click",()=>removeTrack(index));
      row.append(cover,info,play,like,remove); box.append(row);
    });
    updateStats();
  }
  function setCurrentUI(render=true) {
    const t=tracks[currentIndex];
    $("nowTitle").textContent=t?t.name:"Nothing playing";
    $("nowArtist").textContent=t?t.artist:"Choose a track to begin";
    $("playerLike").textContent=t&&t.liked?"♥":"♡"; $("playerLike").classList.toggle("liked",!!(t&&t.liked));
    $("playBtn").textContent=t&&!audio.paused?"Ⅱ":"▶"; $("playBtn").setAttribute("aria-label",t&&!audio.paused?"Pause":"Play");
    updateStats(); if(render) renderTracks();
  }
  async function playTrack(index) {
    if(index<0||index>=tracks.length)return;
    currentIndex=index; const t=tracks[index]; recent.unshift(t.id); if(recent.length>40)recent.pop();
    audio.src=t.url; setCurrentUI();
    try{await audio.play();setCurrentUI();}catch(e){toast("This file could not be played. Try another audio format.");}
  }
  function togglePlayback() {
    if(currentIndex<0){if(tracks.length)playTrack(0);else input.click();return;}
    if(audio.paused)audio.play().then(()=>setCurrentUI()).catch(()=>toast("Could not play this audio file."));
    else audio.pause();
  }
  async function addFiles(fileList) {
    const files=Array.from(fileList||[]), valid=files.filter(f=>f.type.startsWith("audio/")||/\.(mp3|m4a|aac|wav|ogg|flac|opus|weba)$/i.test(f.name));
    if(!valid.length){toast("No supported audio files selected. Choose an audio file.");return;}
    let added=0, failed=0;
    for(const file of valid){
      const track={name:file.name.replace(/\.[^/.]+$/,""),artist:"On this device",file,liked:false,addedAt:Date.now()};
      try{track.id=await saveTrack(track);track.url=URL.createObjectURL(file);tracks.push(track);added++;}
      catch(e){failed++;if(track.url)URL.revokeObjectURL(track.url);}
    }
    activeView="home";setNavActive("home");$("trackHeading").textContent="Your music ("+tracks.length+")";renderTracks(tracks);
    if(added){toast(added+" track(s) added and saved on this device.");if(currentIndex<0)playTrack(0);}
    if(failed)toast(added+" saved; "+failed+" could not be saved. Check browser storage space/settings.");
  }
  async function removeTrack(index) {
    const t=tracks[index]; if(!t)return;
    if(index===currentIndex){audio.pause();audio.removeAttribute("src");audio.load();currentIndex=-1;}
    try{await deleteSavedTrack(t);}catch(e){toast("Could not remove this track from device storage.");return;}
    URL.revokeObjectURL(t.url); tracks.splice(index,1);
    if(currentIndex>index)currentIndex--;
    renderTracks();setCurrentUI(false);toast("Track removed from your library.");
  }
  function showView(view) {
    activeView=view;
    setNavActive(view);
    const labels={home:"Your music",library:"Your library",favorites:"Liked songs",recent:"Recently played",playlists:"Your playlists",search:"Search your tracks",discover:"Discover"};
    $("trackHeading").textContent=labels[view]||"Your music";
    document.querySelectorAll("[data-section]").forEach(section=>{
      const allowed=(section.dataset.section||"").split(/\s+/);
      section.hidden=!allowed.includes(view);
    });
    if(view==="search") $("searchInput").focus({preventScroll:true});
    const scroll=document.querySelector(".content-scroll");
    if(scroll) scroll.scrollTo({top:0,behavior:"smooth"});
    renderTracks();
  }
  document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();showView(b.dataset.view);}));
  document.querySelectorAll("[data-mood]").forEach(b=>b.addEventListener("click",()=>{showView("discover");toast(b.dataset.mood+" mood selected.");}));
  ["heroUpload","emptyUpload","addTracks"].forEach(id=>{const b=$(id);if(b)b.addEventListener("click",()=>input.click());});
  input.addEventListener("change",e=>{addFiles(e.target.files);input.value="";});
  $("searchInput").addEventListener("input",()=>{const first=activeView!=="search";activeView="search";setNavActive("search");$("trackHeading").textContent="Search your tracks";document.querySelectorAll("[data-section]").forEach(section=>{section.hidden=!(section.dataset.section||"").split(/\s+/).includes("search");});if(first)document.querySelector(".content-scroll").scrollTo({top:0,behavior:"smooth"});renderTracks();});
  $("searchInput").addEventListener("keydown",e=>{if(e.key==="Enter")showView("search");});
  $("heroUpload").querySelector("span").textContent="Add music";
  $("playBtn").addEventListener("click",togglePlayback);
  $("prevBtn").addEventListener("click",()=>tracks.length?playTrack((currentIndex-1+tracks.length)%tracks.length):toast("Add music first."));
  $("nextBtn").addEventListener("click",()=>tracks.length?playTrack((currentIndex+1)%tracks.length):toast("Add music first."));
  $("playerLike").addEventListener("click",async()=>{const t=tracks[currentIndex];if(!t)return toast("Play a track first.");t.liked=!t.liked;try{await updateSavedTrack(t);}catch(e){}setCurrentUI();});
  $("volumeBar").addEventListener("input",e=>audio.volume=Number(e.target.value)); audio.volume=.8;
  $("seekBar").addEventListener("input",e=>{if(Number.isFinite(audio.duration))audio.currentTime=Number(e.target.value)/100*audio.duration;});
  audio.addEventListener("timeupdate",()=>{$("currentTime").textContent=formatTime(audio.currentTime);$("duration").textContent=formatTime(audio.duration);$("seekBar").value=Number.isFinite(audio.duration)&&audio.duration?audio.currentTime/audio.duration*100:0;});
  audio.addEventListener("play",()=>setCurrentUI()); audio.addEventListener("pause",()=>setCurrentUI());
  audio.addEventListener("ended",()=>tracks.length>1?playTrack((currentIndex+1)%tracks.length):setCurrentUI());
  audio.addEventListener("error",()=>{if(audio.currentSrc)toast("This audio format is not supported by your browser.");});
  $("queueBtn").addEventListener("click",()=>toast(tracks.length?tracks.length+" track(s) in your library.":"Your library is empty."));
  $("backBtn").addEventListener("click",()=>showView("home")); $("forwardBtn").addEventListener("click",()=>showView("discover"));
  $("createPlaylist").addEventListener("click",()=>toast("Playlist creation is not available yet."));
  $("premiumInfo").addEventListener("click",()=>toast("Premium is not available in this version."));
  $("notificationBtn").addEventListener("click",()=>toast("You're all caught up."));
  $("shuffleBtn").addEventListener("click",()=>toast("Shuffle is coming in a future update."));
  $("repeatBtn").addEventListener("click",()=>toast("Repeat is coming in a future update."));
  $("expandBtn").addEventListener("click",()=>toast("Expanded player is coming in a future update."));
  ["trendPlayOne","trendPlayTwo","trendPlayThree","trendPlayFour","trendPlayFive"].forEach(id=>$(id).addEventListener("click",()=>toast("These are visual examples. Add your own audio files to play music.")));
  showView("home");setCurrentUI(false);
  loadSavedTracks().catch(()=>toast("Device library storage is blocked. You can still choose files for this session."));
})();