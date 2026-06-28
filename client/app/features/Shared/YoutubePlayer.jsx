import { useEffect, useRef } from "react";

export default function YoutubePlayer({ videoId, onProgress, onFinished, isFrozen, playbackRate = 1 }) {
  const playerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const containerId = "youtube-iframe-player";

  // Use refs to keep callbacks stable so they never trigger the player recreation effect
  const onProgressRef = useRef(onProgress);
  const onFinishedRef = useRef(onFinished);
  const playbackRateRef = useRef(playbackRate);

  useEffect(() => {
    onProgressRef.current = onProgress;
    onFinishedRef.current = onFinished;
    playbackRateRef.current = playbackRate;
  });

  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === "function") {
      try {
        playerRef.current.setPlaybackRate(playbackRate);
      } catch (e) {
        console.warn("[YT Player] Could not set playback rate:", e);
      }
    }
  }, [playbackRate]);

  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.pauseVideo === "function" && typeof playerRef.current.playVideo === "function") {
      try {
        if (isFrozen) {
          playerRef.current.pauseVideo();
        } else {
          playerRef.current.playVideo();
        }
      } catch (e) {
        console.error("Error toggling playback during freeze:", e);
      }
    }
  }, [isFrozen]);

  useEffect(() => {
    let player = null;
    let isDestroyed = false;

    // Helper to poll player time
    const startProgressTracking = (ytPlayer) => {
      stopProgressTracking();
      progressIntervalRef.current = setInterval(() => {
        if (isDestroyed) return;
        if (ytPlayer && typeof ytPlayer.getCurrentTime === "function" && typeof ytPlayer.getDuration === "function") {
          try {
            const currentTime = ytPlayer.getCurrentTime();
            const duration = ytPlayer.getDuration();
            if (duration > 0) {
              const percentage = Math.min(100, (currentTime / duration) * 100);
              // Trigger the latest callback ref
              if (onProgressRef.current) {
                onProgressRef.current(Math.round(percentage), currentTime);
              }
            }
          } catch (e) {
            console.error("Error reading player times:", e);
          }
        }
      }, 500);
    };

    const stopProgressTracking = () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };

    // Function to initialize the player
    const initPlayer = () => {
      if (isDestroyed) return;
      
      try {
        player = new window.YT.Player(containerId, {
          height: "100%",
          width: "100%",
          videoId: videoId,
          playerVars: {
            autoplay: 1,      // Autoplay the video
            controls: 1,      // Show controls
            rel: 0,           // Disable related videos at the end
            modestbranding: 1,// Clean player look
            mute: 0           // Do not mute the video sound
          },
          events: {
            onReady: (event) => {
              if (isDestroyed) return;
              console.log("[YT Player] Ready and playing:", videoId);
              
              try {
                if (isFrozen) {
                  event.target.pauseVideo();
                } else {
                  event.target.playVideo();
                }
                // Apply initial playback rate
                if (playbackRateRef.current && playbackRateRef.current !== 1) {
                  event.target.setPlaybackRate(playbackRateRef.current);
                }
              } catch (err) {
                console.warn("[YT Player] Autoplay failed or blocked:", err);
              }
              startProgressTracking(event.target);
            },
            onStateChange: (event) => {
              if (isDestroyed) return;

              // YT.PlayerState.PLAYING = 1
              if (event.data === window.YT.PlayerState.PLAYING) {
                // If frozen, force pause
                if (isFrozen) {
                  event.target.pauseVideo();
                } else {
                  event.target.playVideo();
                  // Re-apply playback rate just in case YouTube reset it
                  if (playbackRateRef.current) {
                    try {
                      event.target.setPlaybackRate(playbackRateRef.current);
                    } catch (e) {
                      console.warn("[YT Player] setPlaybackRate failed on PLAYING:", e);
                    }
                  }
                  startProgressTracking(event.target);
                }
              } else {
                stopProgressTracking();
              }

              // YT.PlayerState.ENDED = 0
              if (event.data === window.YT.PlayerState.ENDED) {
                stopProgressTracking();
                if (onFinishedRef.current) {
                  onFinishedRef.current();
                }
              }
            }
          }
        });
        playerRef.current = player;
      } catch (err) {
        console.error("Failed to initialize YT.Player:", err);
      }
    };

    // Load YouTube API script if not present
    if (typeof window !== "undefined" && !window.YT) {
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(script);
      }
    }

    // Since script is preloaded or dynamically injected, we check if YT is ready
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // Fallback in case the script hasn't completed loading yet
      const checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          initPlayer();
        }
      }, 100);

      // Also support the standard callback
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previousCallback) previousCallback();
        clearInterval(checkInterval);
        initPlayer();
      };

      return () => {
        clearInterval(checkInterval);
      };
    }

    // Cleanup on unmount or videoId change
    return () => {
      isDestroyed = true;
      stopProgressTracking();
      
      if (playerRef.current) {
        try {
          if (typeof playerRef.current.destroy === "function") {
            playerRef.current.destroy();
          }
        } catch (e) {
          console.warn("[YT Player] Error during destruction:", e);
        }
        playerRef.current = null;
      }
    };
  }, [videoId]); // ONLY recreate when videoId changes!

  return (
    <div className="video-player-wrapper">
      <div id={containerId} className="video-player-iframe"></div>
    </div>
  );
}
