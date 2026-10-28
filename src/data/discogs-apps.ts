// Directory data for /discogs-apps. Add an entry to APPS to list a new app.
// platforms: iOS, Android, Mac, Windows, Linux, Web, Extension, Self-hosted, Mobile

export type Section = { id: string; title: string; note: string };
export type App = { s: string; name: string; url: string; p: string[]; price: string; d: string };

export const SECTIONS: Section[] = [
  { id: "clients", title: "Collection clients", note: "Full replacements for the official app: browse, search, and edit your collection and wantlist." },
  { id: "value", title: "Value & market tracking", note: "Treat the collection like a portfolio." },
  { id: "listening", title: "Listening, spins & random pickers", note: "For deciding what to put on next, and logging what you played." },
  { id: "scan", title: "Digging & scanning", note: "Built for the record store: scan a barcode, check the price, avoid duplicates." },
  { id: "dj", title: "DJ tools", note: "" },
  { id: "web", title: "Web tools & browser extensions", note: "" },
  { id: "selfhosted", title: "Self-hosted & open source", note: "Run it yourself. Handy if you want to own your data or hack on it." },
  { id: "sellers", title: "Seller & shop tools", note: "Inventory sync and storefront plugins for people selling on the Discogs marketplace." },
  { id: "history", title: "Where it all started", note: "Third-party apps that became (or preceded) the official ones." },
];

export const APPS: App[] = [
  // Collection clients
  { s: "clients", name: "Discographic for Discogs", url: "https://apps.apple.com/us/app/discographic-for-discogs/id979196369", p: ["iOS"], price: "Free + IAP",
    d: "Long-running, very complete client. Folders, custom fields, full offline cache, spreadsheet export, quick marketplace listing, plus Apple Music/Spotify playback and Last.fm scrobbling." },
  { s: "clients", name: "Wax & Spindle", url: "https://hunted.space/product/wax-spindle", p: ["iOS"], price: "Free",
    d: "Artwork-first client that stores your collection on the device for fast, offline browsing. Wantlist shows lowest current asks. No ads, subscriptions or tracking." },
  { s: "clients", name: "SnapVinyl for Discogs", url: "https://apps.apple.com/app/id6741057688", p: ["iOS"], price: "Free",
    d: "Clean client with barcode and OCR text recognition for adding records, automatic translation of release notes, and a random pick button." },
  { s: "clients", name: "My Vinyl+", url: "https://apps.apple.com/app/id1547173908", p: ["iOS", "Mac"], price: "Free + subscription",
    d: "Renders each record as a virtual disc matching its real vinyl color. Collection value trends, Record Store Day browser, home-screen widgets, and listing to the marketplace. Has its own subreddit, r/MyVinyl." },
  { s: "clients", name: "NeedleDrop", url: "https://apps.apple.com/app/id6760035957", p: ["iOS"], price: "Free + IAP",
    d: "Collection viewer tuned for iPad, with landscape layouts and high-res cover art." },
  { s: "clients", name: "Digs for Discogs", url: "https://apps.apple.com/app/digs-for-discogs/id6760368825", p: ["iOS"], price: "Free",
    d: "Sync once, browse offline forever. Folder browsing and a random album picker." },
  { s: "clients", name: "On Rotation", url: "https://apps.apple.com/app/id6756587007", p: ["iOS"], price: "Free",
    d: "Minimal, fast collection browser. No ads or subscriptions." },
  { s: "clients", name: "FreshCogs", url: "https://apps.apple.com/app/id6446179457", p: ["iOS"], price: "Free",
    d: "Lightweight client for viewing your Discogs collection." },
  { s: "clients", name: "Vinyl Crate", url: "https://apps.apple.com/app/vinylcrate/id6754758604", p: ["iOS", "Mac"], price: "Free",
    d: "Collection stats beyond value: rarity scores from community data, breakdowns by artist/year/genre. Data stays on device; Discogs sync is optional." },
  { s: "clients", name: "Vinyl Record App", url: "https://apps.apple.com/app/id1114331735", p: ["iOS"], price: "Free + $3.99/mo",
    d: "Collection and wantlist with a social feed of what friends are adding. Two-way Discogs sync and a random record widget." },
  { s: "clients", name: "Groovv", url: "https://alternativeto.net/software/groovv/", p: ["iOS", "Android"], price: "",
    d: "Cross-platform collection app that pairs with Discogs: barcode scanning, condition tracking, and visual browsing. One of the few current options on Android." },
  { s: "clients", name: "Disko for Discogs", url: "https://apps.microsoft.com/detail/9nblggh4wdr2", p: ["Windows"], price: "",
    d: "Windows client for searching Discogs and managing wantlist, collection and lists, with Spotify lookup." },
  { s: "clients", name: "Spinner for Discogs", url: "https://snapupdates.popey.com/snap/spinner-for-discogs", p: ["Linux"], price: "Free · MIT",
    d: "Linux desktop client (snap). Browse collection and wantlist, spin a wheel for a random album, and control Spotify or YouTube Music." },

  // Value
  { s: "value", name: "WaxTracker", url: "https://waxtracker.app/", p: ["Web"], price: "",
    d: "Reads your collection like a stock portfolio: daily market prices, P&L against what you paid, weekly movers, sales history, and a buy score for wantlist items." },
  { s: "value", name: "Wax", url: "https://apps.apple.com/app/id6760012383", p: ["iOS"], price: "Free + Pro",
    d: "Catalog with condition grading and listen logging; the Pro tier adds live value estimates from marketplace data plus CSV/PDF export." },
  { s: "value", name: "Deadwax (pressing guide)", url: "https://apps.apple.com/app/id6762251685", p: ["iOS"], price: "",
    d: "Focuses on which pressing you own and whether it's a keeper, with badges for notable pressings. Not to be confused with the DeadWax spin tracker below." },

  // Listening
  { s: "listening", name: "DeadWax (spin tracker)", url: "https://apps.apple.com/app/id6760111602", p: ["iOS"], price: "Free + IAP",
    d: "Imports your collection and logs each play to build a listening history." },
  { s: "listening", name: "SpinRoom for Discogs", url: "https://mlpsoftware.itch.io/spinroom-for-discogs", p: ["Mobile"], price: "",
    d: "Browse by album, artist or song; a random picker that can favor records you haven't played lately; Genius bios and lyrics while it spins." },
  { s: "listening", name: "Too Many Records!", url: "https://apps.apple.com/us/app/-/id6449257927", p: ["iOS"], price: "Free",
    d: "Does one thing: picks a random record from your collection, with format filters." },
  { s: "listening", name: "DiscoJanice", url: "https://apps.apple.com/app/id6740820977", p: ["iOS", "Mac"], price: "Free",
    d: "Random album picker with Siri Shortcuts. Collects no data." },
  { s: "listening", name: "Record Selektah", url: "https://palmaradio.substack.com/p/the-record-selektah", p: ["Self-hosted"], price: "Free",
    d: "Local Python app that picks your next record semi-randomly, weighting favorites and rotating decades and genres, with listening stats on the side." },

  // Scanning
  { s: "scan", name: "Vinyl – Scan and see the info", url: "https://apps.apple.com/app/id1433818198", p: ["iOS"], price: "Free + IAP",
    d: "Simple digging companion: scan, see the pressing, compare prices. Built without trackers or ads." },
  { s: "scan", name: "Scan My Records", url: "https://apps.apple.com/app/id6476490241", p: ["iOS"], price: "Free",
    d: "Barcode-first adding to collection and wantlist, pitched at both collectors and record shops." },
  { s: "scan", name: "VinylBox", url: "https://apps.apple.com/app/id1212071750", p: ["iOS"], price: "Free + IAP",
    d: "Collection tracking plus selling: list to the marketplace with price suggestions and manage listings. Price-tracking widget." },

  // DJ
  { s: "dj", name: "kallax", url: "https://apps.apple.com/app/kallax/id6758233437", p: ["iOS"], price: "Free + IAP",
    d: "For vinyl DJs: tags your collection with BPM and builds sets sorted by tempo, genre or mood." },

  // Web
  { s: "web", name: "Discogs Enhancer", url: "https://addons.mozilla.org/addon/discogs-enhancer/", p: ["Extension"], price: "Free + Pro",
    d: "The power-user browser extension: dark mode, price comparisons and currency conversion, multi-column collection sorting, charts and stats. Chrome and Firefox." },
  { s: "web", name: "Waxlog", url: "https://www.crunchbase.com/organization/waxlog", p: ["Web"], price: "Free + premium",
    d: "Crate-digging style collection explorer with stackable filters and grouping, plus shareable curated lists." },
  { s: "web", name: "Discogs collection visualizer", url: "https://cables.gl/p/sOc9Zr", p: ["Web"], price: "Free",
    d: "Quick experiment that tiles a user's whole collection as thumbnails." },

  // Self-hosted
  { s: "selfhosted", name: "Home Assistant Discogs integration", url: "https://www.home-assistant.io/integrations/discogs/", p: ["Self-hosted"], price: "Free",
    d: "Sensors for collection and wantlist counts, plus a random record suggestion you can surface on a dashboard." },
  { s: "selfhosted", name: "discogs-mcp", url: "https://github.com/rianvdm/discogs-mcp", p: ["Self-hosted"], price: "Open source",
    d: "MCP server so AI assistants can query your collection. Deploys to the Cloudflare Workers free tier." },
  { s: "selfhosted", name: "Discogs Copilot", url: "https://github.com/WOIII-me/Discogs-MCP", p: ["Self-hosted", "Extension"], price: "Open source",
    d: "Another MCP server, with a companion Chrome extension and a hosted instance." },
  { s: "selfhosted", name: "vinyly", url: "https://github.com/mttwhlly/vinyly", p: ["Self-hosted"], price: "Open source",
    d: "SvelteKit app that plays your Discogs collection through Spotify (Premium needed)." },
  { s: "selfhosted", name: "DVinyl", url: "https://github.com/Kyonew/Dvinyl", p: ["Self-hosted"], price: "MIT",
    d: "Dockerized collection manager for records and CDs, plus books, movies and games." },
  { s: "selfhosted", name: "discogs-record-collection", url: "https://github.com/mgrsskls/discogs-record-collection", p: ["Self-hosted"], price: "Open source",
    d: "Grant access and get a simple overview of everything you own." },
  { s: "selfhosted", name: "TheCollection", url: "https://github.com/NunoCPNP/thecollection", p: ["Self-hosted"], price: "Open source",
    d: "Svelte web app for browsing a collection via the Discogs API." },
  { s: "selfhosted", name: "oh-my-collection", url: "https://github.com/thiago-scherrer/oh-my-collection", p: ["Self-hosted"], price: "Open source",
    d: "GitHub Action that backs up your collection automatically." },

  // Sellers
  { s: "sellers", name: "Disconnect (ConstaCloud)", url: "https://apps.shopify.com/disconnect-by-constacloud-1", p: ["Web"], price: "Paid",
    d: "Syncs listings, orders, pricing and inventory between Discogs and Shopify, WooCommerce or Wix." },
  { s: "sellers", name: "Blocks for Discogs Sellers", url: "https://wordpress.org/plugins/?p=279240", p: ["Web"], price: "Free",
    d: "WordPress blocks that embed your seller badge, profile stats, inventory grid, or single listings on your own site." },

  // History
  { s: "history", name: "MilkCrate", url: "https://www.thevinylfactory.com/features/the-official-new-discogs-app", p: ["iOS"], price: "Defunct",
    d: "Popular indie iOS client whose success shaped the official iOS app in 2016." },
  { s: "history", name: "Discographer", url: "https://www.androidpolice.com/2016/07/13/official-discogs-app-spins-play-store/", p: ["Android"], price: "Defunct",
    d: "Andreas Dahl's Android client. Discogs partnered with him and it became the official Android app." },
  { s: "history", name: "Discollector", url: "https://factmag.com/2015/04/21/discollector-app-android-discogs", p: ["Android"], price: "Defunct",
    d: "MilkCrate's Android sibling, one of the first serious Discogs apps on the platform." },
];

export const PLATFORMS = ["All", "iOS", "Android", "Mac", "Windows", "Linux", "Web", "Extension", "Self-hosted"];
