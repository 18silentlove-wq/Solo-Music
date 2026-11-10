(() => {
  const $ = id => document.getElementById(id);
  const audio = $("audioPlayer");
  const input = $("audioInput");
  const tracks = [];
  const recent = [];
  let currentIndex = -1;
  let activeView = "home";
  let toastTimer;
  const formatTime = seconds => {
    if (!Number.isFinite(seconds)) return "0:00";
    return Math.floor(seconds / 60) + ":" + Math.floor(seconds % 60).toString().padStart(2, "0");
  };
  function toast(message) {
    const el = $("toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }
  function updateStats() {
    $("statTracks").textContent = tracks.length;
    $("statLiked").textContent = tracks.filter(track => track.liked).length;
    $("libraryProgress").style.width = Math.min(100, tracks.length * 10) + "%";
  }
  function currentList() {
    if (activeView === "favorites") return tracks.filter(track => track.liked);
    if (activeView === "recent") return recent.map(i => tracks[i]).filter(Boolean);
    if (activeView === "search") return tracks.filter(track => track.name.toLowerCase().includes($("searchInput").value.trim().toLowerCase()));
    return tracks;
  }
  function renderTracks(list = currentList()) {
    const container = $("trackList");
    const empty = $("emptyState");
    container.innerHTML = "";
    if (!list.length) {
      container.hidden = true;
      empty.hidden = false;
      if (activeView === "favorites") {
        $("trackHeading").textContent = "Liked songs";
        empty.innerHTML = '<div class="empty-art"><span>♡</span><i>✦</i></div><p class="empty-kicker">YOUR PERSONAL COLLECTION</p><h3>No favourites yet.</h3><p>Tap the heart beside any track to keep it close. Your liked songs will appear here.</p>';
      } else if (activeView === "recent") {
        empty.innerHTML = '<div class="empty-art"><span>◷</span><i>✦</i></div><p class="empty-kicker">YOUR LISTENING JOURNEY</p><h3>Your story starts with a song.</h3><p>Tracks you play will show up here, ready for another listen.</p>';
      } else if (activeView === "playlists") {
        empty.innerHTML = '<div class="empty-art"><span>▤</span><i>✦</i></div><p class="empty-kicker">COMING IN A FUTURE UPDATE</p><h3>Your playlists are on the way.</h3><p>Playlist creation is not available in this first version. For now, add tracks and save your favourites.</p>';
      } else if (activeView === "search") {
        empty.innerHTML = '<div class="empty-art"><span>⌕</span><i>✦</i></div><p class="empty-kicker">SEARCH YOUR COLLECTION</p><h3>No matching tracks.</h3><p>Try another title, or add audio files to your collection.</p>';
      } else {
        empty.innerHTML = '<div class="empty-art"><span>♫</span><i>✦</i></div><p class="empty-kicker">THE FIRST NOTE IS YOURS</p><h3>Your music starts here.</h3><p>Add audio files from your device and build a listening space that feels like you. Nothing gets uploaded.</p><button class="primary-btn" id="emptyUpload">Choose audio files <span>↗</span></button><span class="tiny-note">MP3 · WAV · OGG · browser-supported audio</span>';
        $("emptyUpload").addEventListener("click", () => input.click());
      }
      updateStats();
      return;
    }
    empty.hidden = true;
    container.hidden = false;
    list.forEach(track => {
      const index = tracks.indexOf(track);
      const row = document.createElement("div");
      row.className = "track-row" + (index === currentIndex ? " is-playing" : "");
      const cover = document.createElement("div");
      cover.className = "track-cover";
      cover.textContent = "♫";
      const info = document.createElement("div");
      info.className = "track-info";
      const title = document.createElement("b");
      title.textContent = track.name;
      const artist = document.createElement("span");
      artist.textContent = track.artist;
      info.append(title, artist);
      const play = document.createElement("button");
      play.className = "row-play";
      play.type = "button";
      play.setAttribute("aria-label", "Play " + track.name);
      play.textContent = index === currentIndex && !audio.paused ? "Ⅱ" : "▶";
      play.addEventListener("click", () => index === currentIndex ? togglePlayback() : playTrack(index));
      const like = document.createElement("button");
      like.className = "row-like" + (track.liked ? " liked" : "");
      like.type = "button";
      like.setAttribute("aria-label", track.liked ? "Remove from liked songs" : "Like song");
      like.textContent = track.liked ? "♥" : "♡";
      like.addEventListener("click", () => {
        track.liked = !track.liked;
        updateStats();
        renderTracks();
      });
      row.append(cover, info, play, like);
      container.appendChild(row);
    });
    updateStats();
  }
  function setCurrentUI() {
    const track = tracks[currentIndex];
    if (!track) {
      $("nowTitle").textContent = "Nothing playing";
      $("nowArtist").textContent = "Add a track to begin";
      $("miniCover").textContent = "♫";
      $("playerLike").textContent = "♡";
      $("playerLike").classList.remove("liked");
      $("playBtn").textContent = "▶";
      $("playBtn").setAttribute("aria-label", "Play");
      return;
    }
    $("nowTitle").textContent = track.name;
    $("nowArtist").textContent = track.artist;
    $("miniCover").textContent = "♫";
    $("playerLike").textContent = track.liked ? "♥" : "♡";
    $("playerLike").classList.toggle("liked", track.liked);
    $("playBtn").textContent = audio.paused ? "▶" : "Ⅱ";
    $("playBtn").setAttribute("aria-label", audio.paused ? "Play" : "Pause");
    updateStats();
    if (activeView !== "search") renderTracks();
  }
  async function playTrack(index) {
    if (index < 0 || index >= tracks.length) return;
    currentIndex = index;
    recent.unshift(index);
    while (recent.length > 30) recent.pop();
    audio.src = tracks[index].url;
    setCurrentUI();
    try {
      await audio.play();
      setCurrentUI();
    } catch (error) {
      toast("Tap play to start listening.");
    }
  }
  function togglePlayback() {
    if (currentIndex < 0) {
      if (tracks.length) playTrack(0);
      else toast("Add audio files from your device to begin.");
      return;
    }
    if (audio.paused) audio.play().then(setCurrentUI).catch(() => toast("Could not play this audio file."));
    else audio.pause();
    setCurrentUI();
  }
  function addFiles(files) {
    const audioFiles = Array.from(files || []).filter(file => file.type.startsWith("audio/"));
    if (!audioFiles.length) {
      toast("Please choose audio files.");
      return;
    }
    audioFiles.forEach(file => tracks.push({
      name: file.name.replace(/\.[^/.]+$/, ""),
      artist: "From your device",
      url: URL.createObjectURL(file),
      liked: false
    }));
    $("trackHeading").textContent = "Your tracks (" + tracks.length + ")";
    activeView = "home";
    setNavActive("home");
    renderTracks(tracks);
    toast(audioFiles.length + (audioFiles.length === 1 ? " track added" : " tracks added"));
    if (currentIndex === -1) playTrack(0);
  }
  function setNavActive(view) {
    document.querySelectorAll("[data-view]").forEach(btn => btn.classList.toggle("active", btn.dataset.view === view));
  }
  function showView(view) {
    activeView = view;
    setNavActive(view);
    const heading = $("trackHeading");
    if (view === "favorites") heading.textContent = "Liked songs";
    else if (view === "recent") heading.textContent = "Recently played";
    else if (view === "playlists") heading.textContent = "Your playlists";
    else if (view === "search") heading.textContent = "Search your tracks";
    else heading.textContent = view === "discover" ? "Discover your sounds" : "Your tracks";
    if (view === "discover") toast("Choose a mood or add your own tracks to start exploring.");
    if (view === "playlists") toast("Playlist creation is planned for a future update.");
    if (view === "home") $("homeSection").scrollIntoView({ behavior: "smooth", block: "nearest" });
    else document.querySelector(".tracks-section").scrollIntoView({ behavior: "smooth", block: "start" });
    renderTracks();
  }
  document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => showView(button.dataset.view)));
  document.querySelectorAll("[data-mood]").forEach(button => button.addEventListener("click", () => {
    const mood = button.dataset.mood;
    activeView = "home";
    $("trackHeading").textContent = mood + " mood · Your tracks";
    renderTracks(tracks);
    document.querySelector(".tracks-section").scrollIntoView({ behavior: "smooth", block: "start" });
    toast("Mood selected: " + mood + ". Mood-based playlists are coming later.");
  }));
  ["uploadSide", "uploadMain", "emptyUpload", "addTracks", "heroUpload"].forEach(id => {
    const button = $(id);
    if (button) button.addEventListener("click", () => input.click());
  });
  input.addEventListener("change", event => {
    addFiles(event.target.files);
    input.value = "";
  });
  $("searchInput").addEventListener("input", () => {
    activeView = "search";
    setNavActive("search");
    $("trackHeading").textContent = "Search your tracks";
    renderTracks();
  });
  $("searchInput").addEventListener("keydown", event => {
    if (event.key === "Enter") showView("search");
  });
  document.addEventListener("keydown", event => {
    if (event.key === "/" && !["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) {
      event.preventDefault();
      $("searchInput").focus();
    }
  });
  $("playBtn").addEventListener("click", togglePlayback);
  $("prevBtn").addEventListener("click", () => {
    if (!tracks.length) return toast("Add some tracks first.");
    playTrack((currentIndex - 1 + tracks.length) % tracks.length);
  });
  $("nextBtn").addEventListener("click", () => {
    if (!tracks.length) return toast("Add some tracks first.");
    playTrack((currentIndex + 1) % tracks.length);
  });
  $("playerLike").addEventListener("click", () => {
    if (currentIndex < 0) return toast("Play a track first.");
    tracks[currentIndex].liked = !tracks[currentIndex].liked;
    setCurrentUI();
    toast(tracks[currentIndex].liked ? "Added to your liked songs." : "Removed from liked songs.");
  });
  $("volumeBar").addEventListener("input", event => audio.volume = Number(event.target.value));
  audio.volume = 0.8;
  $("seekBar").addEventListener("input", event => {
    if (Number.isFinite(audio.duration)) audio.currentTime = Number(event.target.value) / 100 * audio.duration;
  });
  audio.addEventListener("timeupdate", () => {
    $("currentTime").textContent = formatTime(audio.currentTime);
    $("duration").textContent = formatTime(audio.duration);
    $("seekBar").value = Number.isFinite(audio.duration) && audio.duration ? audio.currentTime / audio.duration * 100 : 0;
  });
  audio.addEventListener("play", setCurrentUI);
  audio.addEventListener("pause", setCurrentUI);
  audio.addEventListener("ended", () => {
    if (tracks.length > 1) playTrack((currentIndex + 1) % tracks.length);
    else setCurrentUI();
  });
  audio.addEventListener("error", () => toast("This audio format could not be played by your browser."));
  $("queueBtn").addEventListener("click", () => toast(tracks.length ? tracks.length + " track(s) in your local queue." : "Your queue is empty. Add audio files to begin."));
  $("backBtn").addEventListener("click", () => showView("home"));
  $("forwardBtn").addEventListener("click", () => showView("discover"));
  renderTracks(tracks);
  setCurrentUI();
})();