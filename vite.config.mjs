import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        play: path.resolve(__dirname, "play.html"),
        storyAdoguru: path.resolve(__dirname, "story/adoguru.html"),
        storyCthulhu: path.resolve(__dirname, "story/cthulhu-mythos.html"),
        storyDarkGateway: path.resolve(__dirname, "story/dark-gateway.html"),
        storyDarkForum: path.resolve(__dirname, "story/dark-forum.html"),
        storyDarkThreadLeakroom: path.resolve(__dirname, "story/dark-thread-leakroom.html"),
        storyDarkThreadOccult: path.resolve(__dirname, "story/dark-thread-occulttalk.html"),
        storyDarkThreadOccultZatsudan: path.resolve(__dirname, "story/dark-thread-occult-zatsudan.html"),
        storyDarkThreadDummy: path.resolve(__dirname, "story/dark-thread-dummy.html"),
        storyDarkPrivateIndex: path.resolve(__dirname, "story/dark-private-index.html"),
        storyDarkPrivateStarWisdom: path.resolve(__dirname, "story/dark-private-starwisdom.html"),
        storyNewsIncident: path.resolve(__dirname, "story/news-incident.html"),
        storyInfoPollutionCases: path.resolve(__dirname, "story/news-infopollution-cases.html"),
        storyNewsAbandonedBuilding: path.resolve(__dirname, "story/news-abandoned-building-symbol.html"),
        storyOccultCornerShadow: path.resolve(__dirname, "story/occult-corner-shadow.html"),
        storyLeakPhaseLink: path.resolve(__dirname, "story/leak-phase-link.html"),
        storyCasePurpleRain: path.resolve(__dirname, "story/case-purple-rain-room.html"),
        storyCaseWaterTankGlow: path.resolve(__dirname, "story/case-water-tank-glow.html"),
        storyShiraminamiBullying: path.resolve(__dirname, "story/news-shiraminami-bullying.html"),
        storyShiraminamiMatome: path.resolve(__dirname, "story/news-shiraminami-matome.html"),
        storyFlameOpinion: path.resolve(__dirname, "story/opinion-flame-economy.html"),
        storyY: path.resolve(__dirname, "story/y.html"),
        storyYShiraminami1: path.resolve(__dirname, "story/y-shiraminami-1.html"),
        storyYShiraminami2: path.resolve(__dirname, "story/y-shiraminami-2.html"),
        storyYShiraminami3: path.resolve(__dirname, "story/y-shiraminami-3.html"),
        storyYUserYekR0rrim: path.resolve(__dirname, "story/y-user-yek-r0rrim.html"),
        storyYUserKiriStreams: path.resolve(__dirname, "story/y-user-kiri_streams.html"),
        storyYUserLifehackMasa: path.resolve(__dirname, "story/y-user-lifehack_masa.html"),
        storyYUserTraceWatcher: path.resolve(__dirname, "story/y-user-trace_watcher.html"),
        storyYUserLateNightCat: path.resolve(__dirname, "story/y-user-late_night_cat.html"),
        storyYUserFlashBeta: path.resolve(__dirname, "story/y-user-flash_beta.html"),
        storyYUserRumorPick: path.resolve(__dirname, "story/y-user-rumor_pick.html"),
        storyYUserAnonCaseNote: path.resolve(__dirname, "story/y-user-anon_case_note.html"),
        storyYUserTmpReader: path.resolve(__dirname, "story/y-user-tmp_reader.html"),
        storyYUserCacheTrace: path.resolve(__dirname, "story/y-user-cache_trace.html"),
        storyYShiraminamiMatome: path.resolve(__dirname, "story/y-shiraminami-matome.html"),
      },
    },
  },
});
