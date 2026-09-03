-- Shopping is a permanent Stories category. Editorial franchises such as
-- The Daiso Edit remain article metadata rather than enum values.
alter type post_category add value if not exists 'shopping';

