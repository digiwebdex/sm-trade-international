const express = require('express');
const pool = require('../db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { autoFillTranslations, autoFillSettingsValue } = require('../services/translator');

const router = express.Router();

// Tables where we should auto-translate _en → _bn/_zh on save
const AUTO_TRANSLATE_TABLES = new Set([
  'categories', 'products', 'product_variants', 'gallery', 'about_page', 'seo_meta',
]);

// ── Helper: generic CRUD factory ────────────────────────────
function createCrudRoutes(tableName, options = {}) {
  const r = express.Router();
  const { publicRead = true, orderBy = 'sort_order', defaultOrder = 'ASC' } = options;

  // GET — list all (public or auth)
  r.get('/', publicRead ? optionalAuth : authMiddleware, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM ${tableName} ORDER BY ${orderBy} ${defaultOrder}`
      );
      res.json(rows);
    } catch (err) {
      console.error(`GET /${tableName} error:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // GET by id
  r.get('/:id', publicRead ? optionalAuth : authMiddleware, async (req, res) => {
    try {
      const { rows } = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST — create (auth required)
  r.post('/', authMiddleware, async (req, res) => {
    try {
      let body = req.body || {};
      if (AUTO_TRANSLATE_TABLES.has(tableName)) {
        body = await autoFillTranslations(body, { onlyIfEmpty: true });
      }
      const keys = Object.keys(body);
      const values = Object.values(body);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const { rows } = await pool.query(
        `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error(`POST /${tableName} error:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // PATCH — update (auth required)
  r.patch('/:id', authMiddleware, async (req, res) => {
    try {
      let body = req.body || {};
      if (AUTO_TRANSLATE_TABLES.has(tableName)) {
        body = await autoFillTranslations(body, { onlyIfEmpty: true });
      }
      const keys = Object.keys(body);
      const values = Object.values(body);
      const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
      const { rows } = await pool.query(
        `UPDATE ${tableName} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
        [...values, req.params.id]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(rows[0]);
    } catch (err) {
      console.error(`PATCH /${tableName} error:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE (auth required)
  r.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const { rowCount } = await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [req.params.id]);
      if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      console.error(`DELETE /${tableName} error:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  return r;
}

// ── Mount CRUD routes for each table ────────────────────────
router.use('/categories', createCrudRoutes('categories'));
router.use('/products', createCrudRoutes('products'));
router.use('/product-variants', createCrudRoutes('product_variants'));
router.use('/product-images', createCrudRoutes('product_images'));
router.use('/product-variant-images', createCrudRoutes('product_variant_images'));

// ── Delete variants/images by product_id ────────────────────
router.delete('/product-variants/by-product/:productId', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM product_variants WHERE product_id = $1', [req.params.productId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.delete('/product-images/by-product/:productId', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM product_images WHERE product_id = $1', [req.params.productId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.use('/hero-slides', createCrudRoutes('hero_slides'));
router.use('/gallery', createCrudRoutes('gallery'));
router.use('/client-logos', createCrudRoutes('client_logos'));
router.use('/about-page', createCrudRoutes('about_page', { orderBy: 'field_key' }));
router.use('/seo-meta', createCrudRoutes('seo_meta', { orderBy: 'page_slug' }));
router.use('/contact-messages', createCrudRoutes('contact_messages', { publicRead: false, orderBy: 'created_at', defaultOrder: 'DESC' }));
router.use('/quote-requests', createCrudRoutes('quote_requests', { publicRead: false, orderBy: 'created_at', defaultOrder: 'DESC' }));

// ── Site Settings (special: upsert by setting_key) ──────────
router.get('/site-settings', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM site_settings ORDER BY setting_key');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/site-settings', authMiddleware, async (req, res) => {
  try {
    const { setting_key, setting_value } = req.body;
    // Auto-fill missing bn/zh translations in JSONB structure
    const filled = await autoFillSettingsValue(setting_value || {}, { onlyIfEmpty: true });
    const { rows } = await pool.query(
      `INSERT INTO site_settings (setting_key, setting_value)
       VALUES ($1, $2)
       ON CONFLICT (setting_key)
       DO UPDATE SET setting_value = $2, updated_at = now()
       RETURNING *`,
      [setting_key, JSON.stringify(filled)]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Contact Messages — public insert ────────────────────────
router.post('/contact-messages/public', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'name, email, message are required' });
    }
    const { rows } = await pool.query(
      `INSERT INTO contact_messages (name, email, phone, message) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, email, phone || null, message]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Quote Requests — public insert ──────────────────────────
router.post('/quote-requests/public', async (req, res) => {
  try {
    const { company_name, contact_person, email, phone, product_interest, quantity, message, logo_url } = req.body;
    if (!company_name || !contact_person || !email || !message) {
      return res.status(400).json({ error: 'company_name, contact_person, email, message are required' });
    }
    const { rows } = await pool.query(
      `INSERT INTO quote_requests (company_name, contact_person, email, phone, product_interest, quantity, message, logo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [company_name, contact_person, email, phone || null, product_interest || null, quantity || null, message, logo_url || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Products with relations ─────────────────────────────────
router.get('/products-full', optionalAuth, async (_req, res) => {
  try {
    const { rows: products } = await pool.query(
      'SELECT p.*, c.name_en as category_name_en, c.name_bn as category_name_bn FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.sort_order'
    );
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Dashboard stats ─────────────────────────────────────────
router.get('/dashboard/stats', authMiddleware, async (_req, res) => {
  try {
    const [products, categories, messages, quotes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM products'),
      pool.query('SELECT COUNT(*) FROM categories'),
      pool.query('SELECT COUNT(*) FROM contact_messages WHERE is_read = false'),
      pool.query("SELECT COUNT(*) FROM quote_requests WHERE status = 'pending'"),
    ]);
    res.json({
      totalProducts: parseInt(products.rows[0].count),
      totalCategories: parseInt(categories.rows[0].count),
      unreadMessages: parseInt(messages.rows[0].count),
      pendingQuotes: parseInt(quotes.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
