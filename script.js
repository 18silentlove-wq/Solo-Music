(() => {
  const $ = (id) => document.getElementById(id);
  const audio = $("audioPlayer");
  const input = $("audioInput");
  const tracks = [];
  let currentIndex = -1;
  let activeView = "home";
  let toastTimer;

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
    return mins + ":" + secs;
  };

  function toast(message) {
    const el = $("toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  function renderTracks(list = tracks) {
    const container = $("trackList");
    const empty = $("emptyState");
    container.innerHTML = "";
    if (!list.length) {
      container.hidden = true;
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    container.hidden = false;
    list.forEach((track) => {
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
      artist.textContent = track.artist || "Your device";
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
        renderTracks(activeView === "favorites" ? tracks.filter(t => t.liked) : tracks);
      });
      row.append(cover, info, play, like);
      container.appendChild(row);
    });
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
    $("nowArtist").textContent = track.artist || "Your device";
    $("miniCover").textContent = "♫";
    $("playerLike").textContent = track.liked ? "♥" : "♡";
    $("playerLike").classList.toggle("liked", track.liked);
    $("playBtn").textContent = audio.paused ? "▶" : "Ⅱ";
    $("playBtn").setAttribute("aria-label", audio.paused ? "Play" : "Pause");
    renderTracks(activeView === "favorites" ? tracks.filter(t => t.liked) : tracks);
  }

  async function playTrack(index) {
    if (index < 0 || index >= tracks.length) return;
    currentIndex = index;
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
      else toast("First add some audio files from your device.");
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
    audioFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      tracks.push({ name: file.name.replace(/\.[^/.]+$/, ""), artist: "Your device", url, liked: false });
    });
    renderTracks();
    $("trackHeading").textContent = "Your tracks (" + tracks.length + ")";
    toast(audioFiles.length + (audioFiles.length === 1 ? " track added" : " tracks added"));
    if (currentIndex === -1) playTrack(0);
  }

  function showView(view) {
    activeView = view;
    document.querySelectorAll(".nav-link").forEach(btn => btn.classList.toggle("active", btn.dataset.view === view));
    const heading = $("trackHeading");
    if (view === "favorites") {
      heading.textContent = "Liked songs";
      renderTracks(tracks.filter(t => t.liked));
      if (!tracks.some(t => t.liked)) toast("Like a track and it will appear here.");
    } else if (view === "recent") {
      heading.textContent = "Recently played";
      renderTracks(currentIndex >= 0 ? [tracks[currentIndex]] : []);
      if (currentIndex < 0) toast("Your listening history will appear here.");
    } else if (view === "playlists") {
      heading.textContent = "Your playlists";
      renderTracks([]);
      toast("Playlist creation is coming in a future update.");
    } else if (view === "search") {
      heading.textContent = "Search your tracks";
      renderTracks();
      const query = prompt("Search your added tracks:");
      if (query !== null) {
        const matches = tracks.filter(t => t.name.toLowerCase().includes(query.toLowerCase()));
        renderTracks(matches);
        heading.textContent = "Search results";
        if (!matches.length) toast("No matching tracks found.");
      }
    } else {
      heading.textContent = view === "discover" ? "Discover your sounds" : "Your tracks";
      renderTracks();
      if (view === "discover") toast("Add your own audio to start exploring.");
    }
    if (view === "home") $("homeSection").scrollIntoView({ behavior: "smooth", block: "nearest" });
    else document.querySelector(".tracks-section").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => showView(button.dataset.view)));
  document.querySelectorAll("[data-mood]").forEach(button => button.addEventListener("click", () => {
    const mood = button.dataset.mood;
    toast("Your " + mood.toLowerCase() + " mood selected. Add tracks to build this collection.");
    $("trackHeading").textContent = mood + " mood";
    document.querySelector(".tracks-section").scrollIntoView({ behavior: "smooth", block: "start" });
  }));

  ["uploadSide", "uploadMain", "emptyUpload", "addTracks"].forEach(id => $(id).addEventListener("click", () => input.click()));
  input.addEventListener("change", event => {
    addFiles(event.target.files);
    input.value = "";
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
  });
  $("volumeBar").addEventListener("input", event => audio.volume = Number(event.target.value));
  audio.volume = 0.8;
  $("seekBar").addEventListener("input", event => {
    if (Number.isFinite(audio.duration)) audio.currentTime = (Number(event.target.value) / 100) * audio.duration;
  });
  audio.addEventListener("timeupdate", () => {
    $("currentTime").textContent = formatTime(audio.currentTime);
    $("duration").textContent = formatTime(audio.duration);
    $("seekBar").value = Number.isFinite(audio.duration) && audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  });
  audio.addEventListener("play", setCurrentUI);
  audio.addEventListener("pause", setCurrentUI);
  audio.addEventListener("ended", () => {
    if (tracks.length > 1) playTrack((currentIndex + 1) % tracks.length);
    else setCurrentUI();
  });
  audio.addEventListener("error", () => toast("This audio format could not be played by your browser."));
  $("queueBtn").addEventListener("click", () => {
    if (!tracks.length) return toast("Your queue is empty. Add audio files to begin.");
    toast(tracks.length + " track(s) in your listening queue.");
  });
  $("backBtn").addEventListener("click", () => showView("home"));
  $("forwardBtn").addEventListener("click", () => showView("discover"));

  renderTracks();
  setCurrentUI();
})();