const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Prefix a site path with the configured base. */
export const u = (path: string) => `${base}/${path.replace(/^\//, '')}`;

/** An image under public/img. */
export const img = (path: string) => u(`img/${path}`);
