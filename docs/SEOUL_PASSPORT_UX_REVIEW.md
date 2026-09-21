# Seoul Passport — UX review and homepage direction

2026-09-21 · Product recommendation; Passport is not implemented

## Recommendation

Keep Seoul Passport as the personal collection within the publication and its companion, not a separate destination that readers have to learn before they can read. The name is memorable, but the explanation must welcome people who love Korean culture without planning a trip.

Suggested promise: **Keep the stories, places and beauty finds you love**

Use **Save** on an article/place, **Save this drop** at the account prompt, and **My Passport** for the saved collection. A playful passport/stamp motif can follow a useful action; points, levels, and a standalone Passport marketing homepage are unnecessary for the first version.

## Entry and return journey

1. Homepage: Hero → Latest Drops → first-story recommendations. Returning readers see fresh content first; the **Find your first story** hero button jumps directly to three actual editorial starting points. On mobile, these recommendations use compact thumbnail-and-text rows.
2. Read anonymously and use the existing Beauty Profile without a new account requirement.
3. Future: Save a story/place → explain the benefit of an account in context.
4. After authentication, complete the original save and return to the same reading position. Preserve pending item and cancel without pretending the item was saved.
5. Offer optional interests later, after a successful save.
6. Open **My Passport** to revisit saved items. Offer My Seoul Drop when the reader wants to explore or plan a visit.

**Onboarding** describes a process, not a reader benefit. Do not use it as the homepage CTA. Discovery comes first; account onboarding belongs after a save intent.

A reader who never travels still gets saved reading and beauty guidance. A traveler can progress from a saved place to planning. These are parallel valid journeys, not steps everybody must complete.

## Beauty navigation in this local preview

The imagined reader is curious about Korean beauty and wants understandable care guidance. Age and geography are context, not evidence of a particular skin type, spending level, or concern. These choices require later feedback from real readers.

| Reader need                      | Visual group       | Existing destinations               |
| -------------------------------- | ------------------ | ----------------------------------- |
| Understand the stories and ideas | Read & discover    | The Edit                            |
| Learn how to care for myself     | Build your routine | Skincare, Hair & Scalp, Ingredients |
| Choose what applies to me        | Find your fit      | Picks, Beauty Profile               |

Desktop: three columns with short explanations. Mobile: the same groups stacked under Beauty. All six routes remain available. Beauty Profile explicitly keeps its current no-signup access.

## My Seoul Drop

The header pill now toggles a preview with a short explanation above the outbound action. It does not imply that an ADoS account or saved collection is already connected.

Copy: **Find Seoul places and beauty experiences to suit your interests**

Action: **Explore My Seoul Drop ↗**

## Review before a Passport build

- Decide how to present My Passport and My Seoul Drop without duplicate saved-item screens.
- Confirm ownership and deletion rules for saved items and preference data.
- Verify actual authentication and item-ID structures in both repositories before promising one account or automatic sync.
- Plan for a saved article/place becoming unavailable; do not lose a reader’s collection silently.
- Keep reading and profile creation useful without an account. Saving profile results across devices can become an account benefit.
- Treat Local Notes as a later experience-sharing feature and explain that visitors can contribute too. Add moderation and reporting as part of that feature.
- Evaluate completed saves, second saves, and return visits, rather than signup count alone.

This review uses the supplied concept document as product context. It is not the cross-domain SSO/database architecture proposal contained in that document. No authentication, database, save action, sync, comments, or Passport registration was added in this UI iteration.
