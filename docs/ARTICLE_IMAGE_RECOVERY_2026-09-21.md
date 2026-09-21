# Existing serum article image recovery

During release packaging, five inline product images in `/articles/five-k-beauty-serums` were confirmed to return 404 on the existing production site. These are separate from the 81 article thumbnails, all of which passed the preservation audit.

The five existing paths are restored using the exact product pages already linked by the article. Article text and thumbnail remain unchanged. The brand CDN supplied JPEG/PNG responses matching the existing URL extensions; the downloaded originals are preserved.

| Restored filename                                 | Official source                                                                                                      | SHA-256                                                                            |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `torriden-dive-in-serum.jpg`                      | [DIVE IN Serum - Torriden](https://torriden.us/products/dive-in-serum)                                               | `3fc066a37197a181ef8d296497886fdc6190b3792a40e325798d23140b70e1f8`                 |
| `anua-pdrn-hyaluronic-acid-serum.jpg`             | [PDRN Hyaluronic Acid Capsule 100 Serum                                                                              | Anua US](https://anua.com/products/pdrn-hyaluronic-acid-capsule-100-serum)         | `23d6ebe1681d0607744267da976f0da8dafedd74a3fae2a387e0146876706033` |
| `mediheal-madecassoside-blemish-repair-serum.png` | [Madecassoside Blemish Repair Serum                                                                                  | Mediheal US](https://mediheal.com/products/madecassoside-blemish-repair-serum)     | `ae11612ebb5df7b3e02c448b99a6654576f963ac1cf95ff1a0af69fa93b1592c` |
| `cosrx-6-peptide-skin-booster-serum.jpg`          | [The 6 Peptide Skin Booster Serum – COSRX Official](https://www.cosrx.com/products/the-6-peptide-skin-booster-serum) | `d87938e1b9e3479dc2626f532bee7c1c83fbd4d72bbf88a0d2ddc0a79c7aff8b`                 |
| `innisfree-retinol-cica-serum.jpg`                | [Facial Serum: Retinol Cica Moisture Recovery Serum                                                                  | innisfree](https://us.innisfree.com/products/retinol-cica-moisture-recovery-serum) | `0b056e5e0713cbd00c6c204308fa2bb8bf2cb116ba5b855078b168f3465ae65b` |
