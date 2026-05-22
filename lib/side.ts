// Brand-side vs Vendor-side classifier.
//
// "Brand-side"  = the marketer at a company that BUYS marketing services
//                  (Coca-Cola, P&G, Nike, Microsoft, Telstra). These folks
//                  hire agencies; they're the buyers Cannes Lions courts.
// "Vendor-side" = the people SELLING to those brands: ad agencies, holdcos,
//                  production shops, ad tech, mar tech, trade press,
//                  consultancies, and Cannes Lions itself.
//
// We derive this at render time from `company` + `role` text — no new field
// on the data model. The lists below cover the top ~98% of common companies
// in the dataset; unknown entries default to "vendor" because the festival
// audience is industry-skewed.

import type { PersonSignal } from "@/types";

export type Side = "brand" | "vendor";

// ── Hardcoded brand companies (in-house marketing teams) ───────────────────
// Matched as case-insensitive substrings on PersonSignal.company.
const BRAND_COMPANIES: string[] = [
  // CPG / consumer packaged goods
  "Procter", "P&G", "Unilever", "Nestle", "Nestlé", "Mondelez", "Mondelēz",
  "Mars Wrigley", "Mars Inc", "Mars, Inc", "Kraft Heinz", "Kraft", "Heinz",
  "Kellogg", "General Mills", "Conagra", "Tyson", "Smucker",
  "Reckitt", "Colgate", "Clorox", "Church & Dwight",
  "L'Oreal", "L'Oréal", "Estee Lauder", "Estée Lauder", "Coty",
  "Beiersdorf", "Henkel", "Edgewell",

  // Alcoholic + non-alcoholic beverages
  "Diageo", "Pernod Ricard", "Anheuser-Busch", "AB InBev", "Anheuser Busch",
  "Heineken", "Molson Coors", "Carlsberg", "Asahi", "Kirin",
  "Constellation Brands", "Brown-Forman", "Bacardi", "Beam Suntory", "Suntory",
  "Campari", "Rémy Cointreau", "Remy Cointreau", "Moet Hennessy", "Moët Hennessy",
  "Coca-Cola", "Coca Cola", "PepsiCo", "Pepsi", "Keurig Dr Pepper", "Dr Pepper",
  "Red Bull", "Monster Beverage", "Celsius Holdings",

  // Tech / platforms
  "Apple", "Google", "Alphabet", "Meta", "Meta Platforms", "Facebook",
  "Microsoft", "Amazon", "AWS", "Netflix", "Spotify", "Snap Inc", "Snap, Inc",
  "Snapchat", "Pinterest", "Reddit", "TikTok", "ByteDance", "X Corp",
  "LinkedIn", "Adobe", "Salesforce", "Atlassian", "Slack", "Zoom",
  "Shopify", "Etsy", "eBay", "Yelp", "Airbnb", "Indeed", "Glassdoor",
  "OpenAI", "Anthropic", "Roblox", "Discord", "Twitch",

  // Auto
  "Ford Motor", "Ford ", "General Motors", "Chevrolet", "Cadillac", "Buick",
  "Toyota", "Lexus", "Honda", "Nissan", "Mazda", "Subaru", "Mitsubishi Motors",
  "BMW", "Mercedes", "Daimler", "Volkswagen", "Audi", "Porsche", "Lamborghini",
  "Stellantis", "Jeep", "Dodge", "Ram Trucks", "Chrysler", "Fiat",
  "Tesla", "Rivian", "Lucid Motors", "Polestar", "Hyundai", "Kia", "Genesis Motors",
  "Volvo Cars", "Jaguar Land Rover", "JLR", "Bentley", "Rolls-Royce Motor",
  "Renault", "Peugeot", "Citroën", "Citroen", "Vauxhall", "Opel",

  // Financial services
  "Visa", "Mastercard", "American Express", "AmEx",
  "JPMorgan", "Chase", "Wells Fargo", "Bank of America", "BofA",
  "Goldman Sachs", "Morgan Stanley", "Citigroup", "Citibank",
  "Capital One", "Discover Financial", "Synchrony",
  "PayPal", "Stripe", "Square", "Block,", "Block Inc",
  "BlackRock", "Vanguard", "Fidelity", "Charles Schwab",
  "HSBC", "Barclays", "Lloyds", "NatWest", "BNP Paribas", "Santander",
  "Klarna", "Affirm", "Robinhood", "Coinbase",

  // Media / entertainment (brand-side because they hire agencies)
  "Disney", "Walt Disney", "Warner Bros", "Warner Music", "Universal Music",
  "Paramount", "NBCUniversal", "NBC Universal", "NBC ", "ESPN",
  "Fox Corporation", "Fox News", "Fox Sports",
  "Sony Pictures", "Sony Music", "Sony Group", "Sony Interactive",
  "HBO", "Max ", "Peacock", "Hulu", "Roku",
  "New York Times", "Washington Post", "Wall Street Journal", "Bloomberg LP",
  "Vogue", "Vanity Fair", "Condé Nast", "Conde Nast",

  // Retail
  "Walmart", "Target Corporation", "Target ", "Best Buy", "Costco",
  "Macy", "Nordstrom", "Saks", "Sephora", "Ulta Beauty",
  "Home Depot", "Lowe's", "IKEA", "Wayfair",
  "Kroger", "Albertsons", "Whole Foods", "Trader Joe",
  "Tesco", "Sainsbury", "Marks & Spencer", "Carrefour", "Lidl", "Aldi",

  // Hospitality / travel / mobility
  "Marriott", "Hilton", "Hyatt", "IHG", "InterContinental Hotels",
  "Accor", "Four Seasons",
  "Airbnb", "Booking", "Booking.com", "Expedia", "Hotels.com", "TripAdvisor",
  "Uber", "Lyft", "Doordash", "DoorDash", "Instacart", "Grubhub",
  "Delta Air", "American Airlines", "United Airlines", "Southwest Airlines",
  "British Airways", "Lufthansa", "Air France", "Emirates", "Qantas",
  "Carnival Cruise", "Royal Caribbean", "Norwegian Cruise",

  // Apparel / luxury / lifestyle
  "Nike", "Adidas", "Puma", "Under Armour", "Lululemon", "Reebok", "New Balance",
  "Gap Inc", "Old Navy ", "Banana Republic", "H&M", "Zara", "Inditex", "Uniqlo", "Fast Retailing",
  "LVMH", "Kering", "Richemont",
  "Louis Vuitton", "Dior", "Gucci", "Chanel", "Hermès", "Hermes", "Prada",
  "Stella McCartney", "Burberry", "Ralph Lauren", "Calvin Klein", "Tommy Hilfiger",
  "Tiffany", "Cartier", "Bulgari", "Bvlgari",
  "Levi Strauss", "Levi's", "Lee Jeans", "Wrangler",

  // QSR / food brands
  "McDonald", "Burger King", "Wendy's", "Starbucks", "Dunkin",
  "Domino's", "Pizza Hut", "Papa John", "Chipotle", "Subway",
  "Yum! Brands", "Yum Brands", "KFC", "Taco Bell",
  "Restaurant Brands International", "Tim Hortons",
  "Chick-fil-A", "Shake Shack", "Five Guys", "Sweetgreen",

  // Telco / ISP
  "Verizon", "AT&T", "T-Mobile", "Sprint", "Comcast", "Xfinity", "Charter",
  "Vodafone", "Telstra", "Optus", "Orange ", "Deutsche Telekom",
  "Telefonica", "Telefónica", "BT Group", "Sky Group", "Sky UK",

  // Pharma / health / personal care
  "Pfizer", "Moderna", "Johnson & Johnson", "J&J ", "Bayer",
  "AstraZeneca", "Merck", "Roche", "GSK", "GlaxoSmithKline", "Novartis", "Sanofi",
  "Eli Lilly", "Lilly USA",
  "CVS Health", "CVS Pharmacy", "Walgreens", "Boots ",
  "UnitedHealth", "Cigna", "Anthem", "Humana", "Kaiser",
  "Procter & Gamble", "Procter and Gamble",

  // Sports leagues / event brands
  "NFL ", "National Football League", "NBA ", "National Basketball Association",
  "MLB ", "Major League Baseball", "NHL ", "FIFA", "UEFA",
  "Premier League", "La Liga", "Bundesliga", "Serie A",
  "Formula One", "Formula 1", "F1 ", "MotoGP", "MLS ",
  "International Olympic Committee", "Olympic Committee", "Team USA",
  "World Surf League",

  // Toys / gaming / tabletop
  "LEGO", "Mattel", "Hasbro", "Funko",
  "Sony Interactive", "PlayStation", "Microsoft Gaming", "Xbox", "Nintendo",
  "Electronic Arts", "EA Sports", "Activision", "Take-Two", "Rockstar Games", "Ubisoft", "Epic Games",

  // DTC / digital natives (brand-side)
  "Patagonia", "Allbirds", "Warby Parker", "Casper", "Glossier",
  "Bombas", "Chubbies", "Away ", "Harry's", "Quip",
  "Peloton", "Whoop", "Oura",
  "Liquid Death", "Olipop", "Poppi",

  // Other notable brand corporations
  "Dyson", "Bose", "Sonos", "GoPro", "Garmin",
  "John Deere", "Caterpillar", "Honeywell",
  "GE Appliances", "General Electric",
  "Booking Holdings", "Trivago",
  "GoFundMe", "Kickstarter",

  // Catches added after running the classifier on real data
  "Gap ", "Gap,", "Gap.", "Old Navy", "Athleta",
  "Schneider Electric", "Siemens", "ABB ", "Honeywell",
  "Samsung", "LG Electronics", "LG Display", "Sony Corporation",
  "Philips", "Panasonic", "Whirlpool",
  "IBM Corporation", "IBM Watson", "Cisco", "Oracle", "SAP ", "SAP,",
  "Salesforce", "ServiceNow", "Workday", "Atlassian",
  "Yahoo", "AOL ", "Verizon Media",
  "Tennis Australia", "USTA", "United States Tennis", "Australian Open",
  "Cricket Australia", "AFL ", "Australian Football League",
  "BBC ", "BBC News", "BBC Sport", "ITV ", "Channel 4",
  "Reuters", "Associated Press",
  "Wema Bank", "Standard Bank", "Standard Chartered", "Nubank",
  "MTN Group", "MTN ", "Safaricom",
  "Etsy", "Pinterest", "Discord",
  "Bumble", "Tinder", "Match Group", "Hinge",
  "Headspace", "Calm ", "Strava",
  "Patagonia", "REI ", "Recreational Equipment",
  "Whataburger", "In-N-Out", "Popeyes", "Panera",
  "Beyond Meat", "Impossible Foods", "Oatly",
  "Carlsberg Group", "Diageo Plc", "Heineken N.V.",
  "Ralph Lauren Corporation",
  "American Eagle", "Aerie", "Aritzia",
  "Lifebuoy", "Dove ", "Axe ",
  "BlackRock", "Bridgewater Associates", "KKR",
  "Sky Sports", "DAZN",
  "Spotify Studios", "Wondery",
  "Carlsberg", "Asahi Group", "Kirin Holdings",
  "Microsoft Advertising", "Google Ads", "Meta Ads",
];

// ── Hardcoded vendor companies (industry-side: agencies, ad tech, trade) ──
const VENDOR_COMPANIES: string[] = [
  // Big six holding companies
  "WPP", "Publicis Groupe", "Publicis Group", "Publicis ",
  "Omnicom Group", "Omnicom ", "IPG ", "Interpublic", "Dentsu", "Dentsu Group",
  "Havas Group", "Havas ", "Stagwell", "MDC Partners",
  "S4 Capital", "S4Capital", "Monks ", "Media.Monks", "Media Monks",
  "Vivendi", "Bolloré Communications",

  // WPP family
  "Ogilvy", "Wunderman", "VMLY&R", "VMLYR", "VML", "VML Y&R", "Y&R", "Young & Rubicam",
  "Grey ", "Grey Group", "Grey London", "Grey New York",
  "Mindshare", "MediaCom", "EssenceMediacom", "Essence ", "Wavemaker", "GroupM",
  "Hogarth", "AKQA", "Geometry Global", "Geometry ", "Landor", "BAV Group",
  "Superunion", "Design Bridge", "Finsbury Glover Hering",

  // Publicis family
  "Saatchi & Saatchi", "Saatchi", "M&C Saatchi", "Leo Burnett",
  "MSL Group", "MSLGROUP", "MSL ", "Razorfish", "Sapient", "SapientRazorfish",
  "Marcel ", "Bartle Bogle Hegarty", "BBH ", "Spark Foundry",
  "Starcom ", "Zenith ", "Zenithmedia", "Digitas", "Performics", "Epsilon",
  "Publicis Sapient", "PublicisGroupe",

  // Omnicom family
  "BBDO", "DDB ", "DDB Worldwide", "TBWA", "TBWA Chiat Day",
  "Goodby Silverstein", "Goodby, Silverstein", "GSD&M", "GS&P ",
  "Adam&eve", "Adam & eve", "Adam&EveDDB",
  "Hearts & Science", "PHD ", "PHD Worldwide", "OMD ", "OMD Worldwide",
  "Resolution Media", "Annalect", "Critical Mass",
  "FleishmanHillard", "Ketchum", "Porter Novelli", "Cone Communications",

  // IPG family
  "McCann", "McCann Erickson", "MullenLowe", "Mullen Lowe", "MullenLowe Group",
  "Carmichael Lynch", "Hill Holliday", "FCB ", "Foote Cone",
  "Deutsch ", "Deutsch NY", "Deutsch LA",
  "R/GA", "Huge ", "Huge Inc", "MRM ", "MRM Worldwide",
  "Initiative ", "UM Worldwide", "Universal McCann", "Magna ", "MAGNA Global",
  "Weber Shandwick", "Golin", "Octagon ", "Jack Morton",

  // Dentsu family
  "Carat ", "Carat Global", "iProspect", "Merkle", "Isobar", "360i",
  "Posterscope", "Vizeum", "Dentsu Creative", "Dentsu X", "DentsuMB",

  // Havas family
  "Havas Creative", "Havas Media", "Havas Worldwide", "Havas Edge",
  "Arnold Worldwide", "Arnold KLP", "Annex88",

  // Stagwell + independents
  "Anomaly ", "Code+Theory", "Code and Theory", "Code & Theory",
  "72andSunny", "72 and Sunny", "Crispin Porter", "CPB ",
  "GALE ", "Doner ", "Allison Worldwide", "Allison+Partners",
  "Mother ", "Mother London", "Mother NY", "Mother New York",
  "Droga5", "Wieden+Kennedy", "Wieden ", "Wieden & Kennedy",
  "Pereira O'Dell", "Pereira ODell",
  "Pentagram", "Sid Lee", "Cossette", "BBH Sport",
  "Edelman", "BCW Global", "Burson Cohn", "Burson ", "Hill+Knowlton", "Hill Knowlton",

  // Independent shops + GUT family
  "Gut Buenos", "GUT Argentina", "GUT Miami", "GUT São Paulo", "Gut Sao Paulo",
  "Wongdoody", "AnalogFolk", "Karmarama", "Iris Worldwide", "Iris ",
  "Adam&EveDDB", "Adam & Eve", "BMB ", "BMF ", "Lippincott",
  "Fitzco", "Barkley ", "VSA Partners", "Pereira O'Dell",
  "Forsman & Bodenfors", "Forsman and Bodenfors", "Akestam Holst", "Åkestam Holst",
  "Ueno ", "Whalar", "Movement Strategy", "Activate Worldwide",

  // Production / post / VFX
  "RSA Films", "Smuggler ", "Smuggler.", "MJZ ", "Anonymous Content",
  "Stink Films", "Stink Studios", "Park Pictures", "Hungry Man",
  "The Mill", "Framestore", "MPC ", "MPC Film", "Pixomondo", "DNEG",
  "Industrial Light", "Method Studios", "Significant Productions",
  "Imaginary Forces", "Buck ", "Psyop", "Brand New School",
  "Tool of North America", "Hecho Studios",

  // Trade press / industry orgs / awards
  "Adweek", "Ad Age", "Adage", "Campaign US", "Campaign UK", "Campaign Asia",
  "Digiday", "Marketing Week", "Marketing Magazine", "Marketing Brew",
  "The Drum", "Little Black Book", "LBBOnline",
  "Contagious ", "Shots ", "Creative Bloq", "Creativity ", "Muse by Clio",
  "WARC", "Effie ", "D&AD", "The One Club", "The One Show",
  "ANA ", "Association of National Advertisers", "4A's",

  // Cannes Lions itself + organizer
  "Cannes Lions", "LIONS Network", "Ascential", "Informa ",
  "South by Southwest", "SXSW",

  // Ad tech / mar tech / DSPs/SSPs/CDPs
  "The Trade Desk", "Magnite", "PubMatic", "Criteo", "Taboola", "Outbrain",
  "MediaMath", "Xandr", "Amobee", "Beeswax", "Sprinklr", "Khoros",
  "Iterable", "Braze", "Klaviyo", "Mailchimp", "MoEngage",
  "LiveRamp", "Neustar", "Acxiom", "Comscore", "Nielsen", "Kantar",
  "BSE Global", "TVision", "Samba TV", "Innovid", "InMobi",

  // Consultancies (industry-side service providers)
  "Accenture Song", "Accenture Interactive", "IBM iX", "Deloitte Digital",
  "Capgemini Invent", "BCG ", "Boston Consulting", "McKinsey",
  "Bain & Company", "PwC ", "EY ", "KPMG ",

  // Influencer agencies / talent
  "Whalar", "Viral Nation", "Influential ", "Open Influence",
  "WMG ", "CAA ", "Creative Artists Agency", "WME ", "UTA ", "United Talent",
  "Endeavor", "IMG ",

  // PR / experiential
  "Jack Morton Worldwide", "George P. Johnson", "George P Johnson",
  "Momentum Worldwide", "GMR Marketing", "Octagon",
  "MKTG ", "DDB Mudra", "VaynerMedia", "Vayner ", "VaynerX",

  // Holdcos / networks
  "Project Worldwide", "MDC ", "Stagwell Global",
  "TBWA Worldwide", "DDB Worldwide", "BBDO Worldwide",

  // Designer / creative tech firms
  "Frog Design", "frog ", "IDEO", "Sapient Nitro", "Razorfish ",
  "DesignStudio", "Collins ", "Sub Rosa", "&Walsh",
  "Pentagram Design", "RGA Lab",
];

// Agency-naming patterns. If a company name ends in / contains these tokens
// AND it didn't hit any whitelist above, lean toward vendor.
const AGENCY_NAME_HINTS: RegExp[] = [
  /\bagency\b/i,
  /\badvertising\b/i,
  /\bcommunications?$/i,
  /\bcreative\b/i,
  /\bcollective\b/i,
  /\bproductions?$/i,
  /\bstudios?$/i,
  /\bnetwork$/i,
  /\bbureau\b/i,
  /\batelier\b/i,
  /\blab$/i,
  /\bholdings?$/i,
  /\bcompany$/i,
  /\bworldwide$/i,
  /\bpartners$/i,
];

// Agency-side role keywords (almost never seen brand-side)
const AGENCY_ROLE_HINTS: RegExp[] = [
  /creative director/i,
  /executive creative director/i,
  /chief creative officer/i,
  /global creative/i,
  /art director/i,
  /copywriter/i,
  /account director/i,
  /account executive/i,
  /account manager/i,
  /account supervisor/i,
  /planning director/i,
  /strategy director/i,
  /head of strategy/i,
  /head of planning/i,
  /managing partner/i,
];

// Brand-side role keywords (in-house marketing leadership)
const BRAND_ROLE_HINTS: RegExp[] = [
  /\bcmo\b/i,
  /chief marketing officer/i,
  /chief brand officer/i,
  /chief growth officer/i,
  /head of brand/i,
  /head of marketing/i,
  /vp.*brand/i,
  /vp.*marketing/i,
  /global brand/i,
  /brand director/i,
];

function lowerContains(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

/**
 * Decide which side this person is on. Priority order:
 *   1. Company appears in BRAND_COMPANIES   → brand
 *   2. Company appears in VENDOR_COMPANIES  → vendor
 *   3. Company name has agency-pattern hint → vendor
 *   4. Role has agency-side keyword         → vendor
 *   5. Role has brand-side keyword          → brand
 *   6. Default                              → vendor (dataset is industry-skewed)
 */
export function classifySide(person: { company?: string; role?: string }): Side {
  const company = (person.company || "").trim();
  const role = (person.role || "").trim();

  if (company) {
    for (const name of BRAND_COMPANIES) {
      if (lowerContains(company, name)) return "brand";
    }
    for (const name of VENDOR_COMPANIES) {
      if (lowerContains(company, name)) return "vendor";
    }
    for (const re of AGENCY_NAME_HINTS) {
      if (re.test(company)) return "vendor";
    }
  }

  if (role) {
    for (const re of AGENCY_ROLE_HINTS) {
      if (re.test(role)) return "vendor";
    }
    for (const re of BRAND_ROLE_HINTS) {
      if (re.test(role)) return "brand";
    }
  }

  return "vendor";
}

/** Convenience wrapper if you have the full PersonSignal. */
export function sideOf(p: PersonSignal): Side {
  return classifySide(p);
}
