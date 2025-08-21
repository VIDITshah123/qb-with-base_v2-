const express = require('express');
const router = express.Router();
const { authenticateToken, checkPermission } = require('../../middleware/auth');
const { dbMethods } = require('../../modules/database/backend');

/**
 * @route   POST /api/payment/transactions
 * @desc    Create a new payment transaction record
 * @access  Private (requires authentication)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      transaction_ref,
      user_id,
      payment_amount,
      payment_currency,
      payment_source,
      transaction_status,
      payment_external_reference
    } = req.body;

    if (!transaction_ref || !user_id) {
      return res.status(400).json({
        error: 'Required fields missing: transaction_ref, user_id'
      });
    }

    const db = req.app.locals.db;

    // Check if user exists
    const user = await dbMethods.get(db, 'SELECT * FROM base_master_users WHERE user_id = ?', [user_id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create transaction in database
    const sql = `
      INSERT INTO base_payment_transactions
      (transaction_ref, user_id, payment_amount, payment_currency, payment_source, transaction_status, payment_external_reference, verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    const result = await dbMethods.run(db, sql, [
      transaction_ref,
      user_id,
      payment_amount,
      payment_currency,
      payment_source,
      transaction_status,
      payment_external_reference
    ]);

    const transactionId = result.lastID;

    const newTransaction = await dbMethods.get(db, 'SELECT * FROM base_payment_transactions WHERE payment_transaction_id = ?', [transactionId]);

    return res.status(201).json(newTransaction);

  } catch (error) {
    console.error('Server error:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Transaction reference already exists.' });
    }
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   GET /api/payment/transactions
 * @desc    Get all payment transactions (with pagination and filtering)
 * @access  Private (requires authentication and payment_view permission)
 */
router.get('/', [authenticateToken, checkPermission('payment_view')], async (req, res) => {
  try {
    const { search = '', page = 0, limit = 10, status = '' } = req.query;
    const offset = parseInt(page, 10) * parseInt(limit, 10);
    const db = req.app.locals.db;

    let params = [];
    let countParams = [];

    // Base query for count
    let countSql = `SELECT COUNT(*) as total FROM base_payment_transactions pt`;
    // Base query for data
    let dataSql = `
      SELECT
        pt.*,
        u.first_name,
        u.last_name,
        u.user_email
      FROM base_payment_transactions pt
      LEFT JOIN base_master_users u ON pt.user_id = u.user_id
    `;

    let whereClauses = [];

    if (search) {
      whereClauses.push(`(
        pt.transaction_ref LIKE ? OR
        pt.payment_external_reference LIKE ? OR
        u.first_name LIKE ? OR
        u.last_name LIKE ? OR
        u.user_email LIKE ?
      )`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
      countParams.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    if (status) {
        whereClauses.push('pt.transaction_status = ?');
        params.push(status);
        countParams.push(status);
    }

    if (whereClauses.length > 0) {
        const whereString = ` WHERE ${whereClauses.join(' AND ')}`;
        countSql += whereString;
        dataSql += whereString;
    }


    // Add ordering and pagination to data query
    dataSql += ` ORDER BY pt.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), offset);

    // Execute queries
    const totalCountResult = await dbMethods.get(db, countSql, countParams);
    const totalCount = totalCountResult ? totalCountResult.total : 0;
    const transactions = await dbMethods.all(db, dataSql, params);

    return res.json({
      transactions: transactions.map(t => ({...t, verified: Boolean(t.verified)})),
      totalCount,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   GET /api/payment/transactions/:id
 * @desc    Get a specific transaction by ID
 * @access  Private (requires authentication and payment_view permission)
 */
router.get('/:id', [authenticateToken, checkPermission('payment_view')], async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.locals.db;

    const sql = `
      SELECT
        pt.*,
        u.first_name,
        u.last_name,
        u.user_email
      FROM base_payment_transactions pt
      LEFT JOIN base_master_users u ON pt.user_id = u.user_id
      WHERE pt.payment_transaction_id = ?
    `;

    const transaction = await dbMethods.get(db, sql, [id]);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    return res.json({...transaction, verified: Boolean(transaction.verified)});
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});


/**
 * @route   PUT /api/payment/transactions/:id/verify
 * @desc    Verify a transaction
 * @access  Private (requires authentication and payment_edit permission)
 */
router.put('/:id/verify', [authenticateToken, checkPermission('payment_edit')], async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.locals.db;

    const existingTransaction = await dbMethods.get(db, 'SELECT * FROM base_payment_transactions WHERE payment_transaction_id = ?', [id]);
    if (!existingTransaction) {
        return res.status(404).json({ error: 'Transaction not found' });
    }

    const sql = `
      UPDATE base_payment_transactions
      SET verified = 1, updated_at = CURRENT_TIMESTAMP
      WHERE payment_transaction_id = ?
    `;

    const result = await dbMethods.run(db, sql, [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found or already verified' });
    }

    const updatedTransaction = await dbMethods.get(db, 'SELECT * FROM base_payment_transactions WHERE payment_transaction_id = ?', [id]);

    return res.json(updatedTransaction);
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;