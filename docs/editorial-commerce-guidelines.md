# Editorial Commerce Guidelines

Date: 2026-07-12

A Drop of Seoul is an English-language magazine for helping readers understand
Korean beauty products, ingredients, rituals, stores, and Seoul beauty culture.
Commerce links support the work, but they should never become the voice of the
site.

## Positioning

- Lead with culture, clarity, and usefulness.
- Treat products as examples inside a larger beauty story, not as the reason the
  story exists.
- Prefer calm editorial judgment over hype, urgency, or conversion language.
- Recommend fewer products with clearer reasons.
- Be explicit about who a product may not suit.

## Affiliate Links

- Amazon Associates and Olive Young Global affiliate links may be used once the
  accounts are approved.
- Affiliate links should be added to product cards, buying guides, and clearly
  commerce-oriented sections.
- Ingredient glossary pages should stay primarily educational; product examples
  can appear only when they genuinely help the reader understand how an
  ingredient shows up in real K-beauty products.
- Never let commission rate decide product ranking.
- Store affiliate IDs, tags, and campaign codes in environment/config values,
  not hard-coded prose.

## Disclosure

- Add an affiliate disclosure page before publishing affiliate links.
- Include a short, visible disclosure near buying links or buying-guide content.
- Amazon-required language should be included when Amazon links are present:
  "As an Amazon Associate I earn from qualifying purchases."
- Keep disclosure plain and human; readers should understand that links may earn
  commission at no extra cost to them.

## Writing Style

- Use language like "worth considering," "best for," "may suit," and "skip if."
- Avoid language like "must-buy," "run don't walk," "holy grail for everyone,"
  "guaranteed," or pressure-based sale copy.
- Mention texture, finish, skin type, climate, routine step, and availability
  because those details help readers shop thoughtfully.
- For products with changing price or stock, use current source links and avoid
  permanent claims like "cheapest" unless verified at publication time.

## FAQ / AI Search Q&A Rules

Use visible FAQ sections as reader service and AI/search extraction support, not
as a schema trick. Google removed broad FAQ rich-result visibility, so the
priority is clear, helpful, crawlable answers inside the article body.

- Add an FAQ section to evergreen explainers, routines, ingredient guides,
  treatment explainers, and buying guides when readers are likely to compare,
  troubleshoot, or ask "can I use this?" questions.
- Write questions in natural search language, as if a reader typed them into
  Google, TikTok search, Reddit, or an AI assistant.
- Prefer specific questions over vague ones: "Does sunscreen go before or after
  moisturizer?" is stronger than "How do I use sunscreen?"
- Use 4-5 questions for most articles. Use fewer only when the topic is narrow,
  and more only for pillar guides.
- Answer directly in the first sentence. The reader should get the short answer
  before any nuance.
- Add 1-3 follow-up sentences with practical context: skin type, routine step,
  frequency, season, texture, irritation risk, or when to ask a professional.
- Keep answers human and editorial. Avoid keyword stuffing, repetitive phrasing,
  or robotic "yes/no" blocks.
- Link naturally to related A Drop of Seoul articles and ingredient pages when
  the answer gives the reader a useful next step.
- Do not add `FAQPage` JSON-LD unless there is a strong current reason to do so.
  Visible, high-quality Q&A is the default.
- For medical-aesthetic, clinic, procedure, acne, pregnancy, or post-treatment
  questions, include cautious language and defer to a clinician or provider when
  appropriate.
- Avoid promises: do not say a product will cure acne, erase wrinkles, repair a
  barrier overnight, or replace a procedure.

Good FAQ pattern:

```md
## FAQ

**Does sunscreen go before or after moisturizer?**  
Sunscreen usually goes after moisturizer as the last skincare step in the
morning. If your sunscreen is very moisturizing and your skin is oily, you can
keep the moisturizer lighter.

**Can I use retinol and exfoliating acids in the same night routine?**  
Most beginners should not use retinol and exfoliating acids in the same night.
Choose one active theme per night and keep the rest of the routine calming.
```

## Source Discipline

- Use official brand pages, Olive Young Global, Amazon product pages, and the
  staged source archive as research inputs.
- Re-check product pages before publishing because formulas, packaging, prices,
  and availability change.
- When a source archive row conflicts with a current official page, the current
  official page wins.
- For clinical, medical-aesthetic, or treatment content, use stricter review and
  avoid product-style affiliate framing.
