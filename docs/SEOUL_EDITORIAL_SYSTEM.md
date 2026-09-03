# A Local's Seoul — editorial system

## The short answer

Every story has one permanent editorial home:

`A Local's Seoul → Guides → /articles/[slug]`

Neighborhoods are hubs, not exclusive folders. A neighborhood page combines
verified place records with stories whose primary `region:` tag matches that
hub. Theme, mood, season, audience, and format are many-to-many filters.

This means a Han River picnic story does not have to choose between “Mangwon,”
“Food,” “Outdoors,” and “First trip.” Its canonical region is Mangwon, while it
is discoverable through every relevant filter.

## The four content objects

1. **Story** — editorial narrative, route, or practical guide. Canonical URL is
   always `/articles/[slug]`; stored DB category remains `guides`.
2. **Neighborhood hub** — durable orientation plus verified places and related
   stories. URL is `/seoul/neighborhoods/[slug]`.
3. **Place** — factual directory record with address, map, booking, language,
   and last-check information. URL lives under `/seoul/places`.
4. **Collection** — a reusable filtered view such as Design, Rainy day, Free,
   or First trip. It does not own or duplicate article copy.

## Tag contract

Each Seoul story gets one primary `region:` tag and as many other facets as are
useful. `region:common` is for citywide practical guides.

- `region:` seongsu, hongdae, myeongdong, gangnam-cheongdam, hannam, jongno,
  mangwon, common
- `format:` neighborhood-guide, itinerary, how-to, comparison, seasonal,
  collection
- `interest:` food, cafes, art, design, shopping, history, beauty, outdoors,
  nightlife, transport
- `mood:` quiet, energetic, romantic, slow, rainy-day, budget
- `season:` spring, summer, autumn, winter, all-year
- `audience:` first-trip, return-trip, solo, couple, family, design-lover

Ordinary unprefixed tags remain available for search phrases, but templates and
filters must use namespaced tags.

## Reusable article template

1. A specific, personal opening — why we would send a friend here.
2. **Quick answer** — who it is for, time needed, start/end station, difficulty.
3. **The route** — 3–5 sequential stops, with realistic transit between them.
4. **What to eat / where to pause** — describe the type of place; link only to
   verified directory records.
5. **What we would skip** — the useful editorial opinion.
6. **Know before you go** — closures, booking, seasonality, accessibility.
7. **Last checked** — month and year, plus links to authoritative sources.
8. **Read next** — one adjacent neighborhood, one thematic collection, one
   practical guide.

Do not copy volatile opening hours, prices, event schedules, or cherry-blossom
dates into narrative paragraphs. Keep them in a checked information block or a
Place record so one update fixes every surface.

## The complete first collection

### Start-here hubs

| Priority | Working title                          | Role                     | Primary region | Facets                      |
| -------- | -------------------------------------- | ------------------------ | -------------- | --------------------------- |
| 1        | Seoul by Neighborhood                  | choice hub; already live | common         | comparison, first-trip      |
| 2        | Five Days in Seoul Without Rushing     | itinerary hub            | common         | itinerary, first-trip, slow |
| 3        | Where to Stay in Seoul by Neighborhood | commercial-intent hub    | common         | comparison, first-trip      |

### Neighborhood routes

| Priority | Working title                               | Primary region    | Route boundary                                                                                  |
| -------- | ------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------- |
| 1        | One Perfect Day in Old Seoul                | jongno            | Gyeongbokgung → Seochon/Tongin → Insadong/Ikseon; Bukchon only during permitted visitor hours   |
| 1        | Yeonnam by Day, Hongdae by Night            | hongdae           | Gyeongui Line Forest Park → Yeonnam → Hongdae                                                   |
| 1        | Seoul Forest and Seongsu, Stop by Stop      | seongsu           | Seoul Forest → western Seongsu → Seongsu Station; DDP excluded                                  |
| 1        | How to Have a Han River Picnic Like a Local | mangwon           | Mangwon Market → Mangwon Hangang Park; Yeouido and Banpo are alternatives, not extra stops      |
| 2        | Myeongdong to Namsan at Sunset              | myeongdong        | Cathedral/shopping → cable-car approach → Namsan; schedule-dependent details checked separately |
| 2        | Art and an Unhurried Afternoon in Hannam    | hannam            | already live; keep separate from Itaewon nightlife                                              |
| 2        | COEX, Bongeunsa and Apgujeong               | gangnam-cheongdam | COEX/Bongeunsa first; subway/taxi transfer to Apgujeong disclosed                               |

### Practical guides

| Working title                              | Primary region | Main job                                         |
| ------------------------------------------ | -------------- | ------------------------------------------------ |
| How to Use Naver Map                       | common         | already live; navigation                         |
| How to Use Seoul Public Transport          | common         | T-money, transfers, airport, last trains         |
| Seoul Etiquette Visitors Actually Need     | common         | residential areas, transit, restaurants, waste   |
| When to Visit Seoul                        | common         | climate and trade-offs, not false date precision |
| What to Eat on a First Trip to Seoul       | common         | eating situations, not a generic dish list       |
| Korean Convenience Stores for First-Timers | common         | ordering, heating, payment, river picnics        |

### Editorial collections

| Working title                       | Primary region | Reuses                                                |
| ----------------------------------- | -------------- | ----------------------------------------------------- |
| Seoul for Design Lovers             | common         | Seongsu, Leeum, DDP, COEX/Starfield                   |
| The Quiet Side of Seoul             | common         | Hannam, Bongeunsa, Seoul Forest, early Old Seoul      |
| The Best Free Things to Do in Seoul | common         | parks, river, temples, galleries, public architecture |
| Seoul on a Rainy Day                | common         | museums, malls, cafés; indoor transfer reality        |
| Five Seoul Sunset Plans             | common         | Namsan and four distinct river choices                |
| Seoul for Coffee and Architecture   | common         | Seongsu, Ikseon, Hannam; verified venues only         |

## Cannibalization rules

- The neighborhood hub answers **“Which neighborhood?”**; a route article
  answers **“What exact day should I follow?”**
- The five-day itinerary gives short summaries and links out. It does not repeat
  every stop description.
- A collection compares options by one interest or situation. It does not
  pretend geographically distant stops form one walk.
- One article owns each search intent. Update that article instead of publishing
  a near-duplicate with a new year in the title.
- Individual venue claims live in Place records whenever possible. Stories
  supply judgment, sequence, and voice.

## Publishing order

Publish in clusters so every new story has useful internal links:

1. Old Seoul route, Seongsu route, Hongdae/Yeonnam route, Han River picnic.
2. Five-day itinerary and public-transport guide.
3. Myeongdong/Namsan and Gangnam route; connect the existing Hannam story.
4. Etiquette, seasons, food, and convenience-store guides.
5. The six editorial collections after their source routes are live.

Do not publish all pieces on one day. Draft the collection together, verify in
clusters, then release one or two per week. This creates a coherent archive
without making the publication look machine-filled.
