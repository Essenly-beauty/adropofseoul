# -*- coding: utf-8 -*-
"""
올리브영 크롤링 결과를 CSV 마스터에 병합하는 스크립트 (CSV 입출력 버전).

폴더 안에 아래 CSV들이 있다고 가정 (같은 폴더에서 실행):
  products.csv, product_sources.csv, skin_types.csv, concerns.csv, brands.csv
  (age_groups/awards/textures/rankings.csv는 화해 전용 — 건드리지 않음)

핵심 원칙(어기지 말 것):
  1. products.csv의 product_id(P00001~)는 고정. 재정렬/재부여 금지. 신규는 다음 번호.
  2. 자동 병합은 '정확 매칭 키 일치'만. 애매하면 review_queue.csv로.
  3. 기존 제품이면 products.csv는 수정하지 말고 product_sources.csv에 소스 행만 추가.
  4. 덮어쓰기 전 각 파일을 *.bak.csv로 백업. 검증 실패 시 저장 중단.
  5. keyf()는 화해 때 쓴 것과 완전히 동일해야 함.
"""
import re, shutil
from pathlib import Path
import pandas as pd

DIR = Path(__file__).resolve().parent / "csv"   # 마스터 CSV 폴더
ENC = "utf-8-sig"

def rd(name, cols):
    p = DIR / name
    if p.exists():
        return pd.read_csv(p, dtype=str).fillna("")
    return pd.DataFrame(columns=cols)

# ── 매칭 키: 화해 때와 동일 ──────────────────────────────────────
def keyf(brand: str, name: str) -> str:
    s = f"{brand} {name}"
    s = re.sub(r'\[?\s*SPF[^\]]*\]?', '', s, flags=re.I)   # SPF/PA 제거
    s = re.sub(r'\(리뉴얼\)?', '', s)                       # (리뉴얼) 제거
    s = re.sub(r'\s+', '', s).lower().replace("[", "").replace("]", "")
    return s

# ── 크롤러가 채우는 레코드 (수집 필드 체크리스트) ──────────────────
#   필수 : brand, product_name, oy_id(올리브영 상품코드), url
#   선택 : brand_en, category, subcategory, skin_types(list), concerns(list)
def load_crawled() -> list[dict]:
    # TODO: 크롤러 결과(JSON/CSV)를 읽어 dict 리스트로 반환
    #   예) return json.load(open("oliveyoung_crawl.json", encoding="utf-8"))
    raise NotImplementedError

def is_ambiguous(key, brand, key_to_id, brands_seen):
    # 정확 키는 없지만 같은 브랜드가 이미 있으면 → 사람이 확인
    return (key not in key_to_id) and (brand in brands_seen)

SRC = "올리브영"   # 이 스크립트가 넣는 소스명(국문 올리브영)

def register_raw(map_name, source, values):
    """새 (source, 원본값)만 매핑표에 추가. std_value는 비워둠(나중에 사람이 채움)."""
    cols = ["source","raw_value","std_value"]
    m = rd(map_name, cols)
    seen = set(zip(m["source"], m["raw_value"]))
    add = [[source, v, ""] for v in dict.fromkeys(values) if v and (source, v) not in seen]
    if add:
        m = pd.concat([m, pd.DataFrame(add, columns=cols)], ignore_index=True)
    return m

def main():
    products = rd("products.csv", ["product_id","brand","product_name","category",
                  "subcategory","is_rising","rising_rank","category_rank","brand_rank"])
    sources  = rd("product_sources.csv", ["product_id","source","source_product_id","url"])
    skin     = rd("skin_types.csv", ["product_id","source","skin_type_raw","rank"])
    concern  = rd("concerns.csv", ["product_id","source","concern_raw"])
    brands   = rd("brands.csv", ["brand","brand_en","status"])

    key_to_id   = {keyf(b,n): p for p,b,n in
                   zip(products.product_id, products.brand, products.product_name)}
    brands_seen = set(products.brand)
    existing_src = set(zip(sources.source, sources.source_product_id))
    brand_en    = {b: e for b, e in zip(brands.brand, brands.brand_en)}
    next_num    = max([int(p[1:]) for p in products.product_id], default=0) + 1

    new_products, new_sources, new_skin, new_concern, review, filled = [], [], [], [], [], []

    def new_pid():
        nonlocal next_num
        pid = f"P{next_num:05d}"; next_num += 1; return pid

    for r in load_crawled():
        key = keyf(r["brand"], r["product_name"])
        if key in key_to_id:                                   # 분기1: 기존 제품
            pid = key_to_id[key]
        elif is_ambiguous(key, r["brand"], key_to_id, brands_seen):  # 분기3: 리뷰
            review.append(r); continue
        else:                                                  # 분기2: 신규 제품
            pid = new_pid(); key_to_id[key] = pid; brands_seen.add(r["brand"])
            new_products.append({"product_id":pid,"brand":r["brand"],
                "product_name":r["product_name"],"category":r.get("category",""),
                "subcategory":r.get("subcategory",""),"is_rising":"","rising_rank":"",
                "category_rank":"","brand_rank":""})

        en = (r.get("brand_en") or "").strip()                 # 브랜드 영문명(비었을 때만)
        if en and not brand_en.get(r["brand"]):
            brand_en[r["brand"]] = en; filled.append(r["brand"])

        if ("올리브영", r["oy_id"]) not in existing_src:        # 소스/신호 추가
            new_sources.append([pid,"올리브영",r["oy_id"],r["url"]])
            existing_src.add(("올리브영", r["oy_id"]))
        for s in r.get("skin_types", []): new_skin.append([pid, SRC, s, ""])
        for c in r.get("concerns", []):   new_concern.append([pid, SRC, c])

    # ── 병합 ──
    products = pd.concat([products, pd.DataFrame(new_products)], ignore_index=True)
    sources  = pd.concat([sources,  pd.DataFrame(new_sources, columns=sources.columns)], ignore_index=True)
    skin     = pd.concat([skin,     pd.DataFrame(new_skin, columns=skin.columns)]).drop_duplicates()
    concern  = pd.concat([concern,  pd.DataFrame(new_concern, columns=concern.columns)]).drop_duplicates()
    brands   = pd.DataFrame([[b, brand_en.get(b,""), "확인" if brand_en.get(b) else "확인필요"]
                             for b in sorted(set(products.brand))],
                            columns=["brand","brand_en","status"])

    # ── 검증(실패 시 저장 중단) ──
    assert products.product_id.is_unique, "product_id 중복!"
    keys = [keyf(b,n) for b,n in zip(products.brand, products.product_name)]
    assert len(keys) == len(set(keys)), "매칭 키 중복 → 로직 점검"
    assert set(sources.product_id) <= set(products.product_id), "고아 소스 행"

    # ── 원본값을 매핑표에 등록(신규 source/raw만, std_value는 공란) ──
    sk_map = register_raw("skin_type_map.csv", SRC, [x[2] for x in new_skin])
    co_map = register_raw("concern_map.csv",   SRC, [x[2] for x in new_concern])

    # ── 백업 후 저장 ──
    out = {"products.csv":products, "product_sources.csv":sources,
           "skin_types.csv":skin, "concerns.csv":concern, "brands.csv":brands,
           "skin_type_map.csv":sk_map, "concern_map.csv":co_map}
    for name, df in out.items():
        if (DIR/name).exists():
            shutil.copy(DIR/name, DIR/name.replace(".csv", ".bak.csv"))
        df.to_csv(DIR/name, index=False, encoding=ENC)
    pd.DataFrame(review).to_csv(DIR/"review_queue.csv", index=False, encoding=ENC)

    print(f"신규 제품 {len(new_products)} · 소스 추가 {len(new_sources)} · 리뷰대기 {len(review)}")
    print(f"브랜드 영문명 신규 확보 {len(set(filled))}개")
    print(f"총 제품 {len(products)}")

if __name__ == "__main__":
    main()
